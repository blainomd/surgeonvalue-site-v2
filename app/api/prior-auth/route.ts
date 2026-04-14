import { NextResponse } from "next/server";
import { stripPhi } from "@/lib/phi-strip";
import {
  getPriorAuthAgentConfig,
  findDenialPatterns,
  checkDocumentationCompleteness,
  PRIOR_AUTH_SYSTEM_PROMPT,
  type PriorAuthRequest,
} from "@/lib/prior-auth-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Prior Auth Agent — paste a clinical note, get a peer-to-peer-ready medical
// necessity letter with guideline citations and preemptive denial rebuttals
// grounded in the curated payer denial database.

export async function POST(request: Request) {
  let body: PriorAuthRequest;
  try {
    body = (await request.json()) as PriorAuthRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawClinicalNote = (body.clinicalNote || "").trim();
  // PHI strip before the note is passed to NPPES search + upstream Claude
  const clinicalNote = stripPhi(rawClinicalNote).clean;
  const procedure = (body.procedure || "").trim();
  const payerName = (body.payerName || "").trim();

  if (!clinicalNote || clinicalNote.length < 50) {
    return NextResponse.json(
      { error: "Clinical note is required (minimum 50 characters)" },
      { status: 400 }
    );
  }
  if (clinicalNote.length > 10000) {
    return NextResponse.json(
      { error: "Clinical note too long (10000 char max)" },
      { status: 400 }
    );
  }

  // Load curated context from the lib
  const agentConfig = getPriorAuthAgentConfig();

  const matchedCpt = procedure
    ? agentConfig.cptDenialMap.find((m) =>
        m.procedureName.toLowerCase().includes(procedure.toLowerCase())
      )
    : null;

  const denialContext = matchedCpt
    ? findDenialPatterns(matchedCpt.cptCode, payerName || undefined)
    : { cptPatterns: null, payerPatterns: null };

  const documentationWarnings = matchedCpt
    ? checkDocumentationCompleteness(clinicalNote, matchedCpt.cptCode)
    : [];

  // Build structured context block for Claude
  const contextParts: string[] = [];
  if (matchedCpt) {
    contextParts.push(
      `KNOWN_CPT: ${matchedCpt.cptCode} — ${matchedCpt.procedureName}`,
      `REQUIRED_DOCUMENTATION: ${(matchedCpt.requiredDocumentation || []).join("; ")}`,
      `RECOGNIZED_GUIDELINE_ORGS: ${(matchedCpt.guidelineOrganizations || []).join("; ")}`
    );
  }
  if (denialContext.cptPatterns?.commonDenialReasons?.length) {
    contextParts.push(
      `COMMON_DENIAL_REASONS_FOR_THIS_CPT: ${denialContext.cptPatterns.commonDenialReasons.join(" | ")}`
    );
  }
  if (denialContext.payerPatterns) {
    const patterns = denialContext.payerPatterns.denialPatterns
      .slice(0, 5)
      .map((p) => `${p.reason}: ${p.rebuttalStrategy}`)
      .join("\n - ");
    if (patterns) {
      contextParts.push(
        `PAYER_SPECIFIC_DENIAL_PATTERNS (${denialContext.payerPatterns.payerName}):\n - ${patterns}`
      );
    }
  }
  if (documentationWarnings.length) {
    contextParts.push(`DOCUMENTATION_GAPS_TO_ADDRESS: ${documentationWarnings.join("; ")}`);
  }

  const structuredContext = contextParts.length
    ? `\n\n## STRUCTURED CONTEXT (use this curated data in your letter):\n${contextParts.join("\n\n")}\n`
    : "";

  const OUTPUT_SCHEMA_INSTRUCTION = `\n\n## OUTPUT FORMAT

Return ONLY valid JSON. No markdown fences. No prose. BE TERSE.

{
  "summary": "one sentence: procedure requested and clinical justification",
  "detected_cpt": "code or 'unknown'",
  "detected_icd10": "primary diagnosis code or 'unknown'",
  "key_clinical_findings": ["up to 4 bullet points from the note"],
  "failed_conservative_treatments": ["up to 4 documented failed conservative treatments from the note"],
  "guideline_citations": [
    {
      "organization": "AAOS / ACR / etc",
      "title": "guideline title",
      "year": "year",
      "recommendation": "what the guideline recommends, 1 sentence",
      "strength": "strong / moderate / conditional / expert"
    }
  ],
  "preemptive_rebuttals": [
    {
      "likely_denial": "likely denial reason",
      "rebuttal": "clinical rebuttal, 1-2 sentences grounded in the note or guideline"
    }
  ],
  "letter_body": "full formal letter addressed to Medical Director. Use [placeholders] for patient demographics, member ID, auth number, physician signature block. Include all sections: procedure request with CPT+ICD10, clinical history, failed conservative treatments, guideline citations, rebuttals, peer-to-peer offer, signature block. Ready to print. Plain text, newlines preserved."
}

Maximum 3 guideline_citations. Maximum 4 preemptive_rebuttals. NEVER fabricate a citation — if unsure, omit it. Use physician voice.`;

  const message = `${PRIOR_AUTH_SYSTEM_PROMPT}${structuredContext}${OUTPUT_SCHEMA_INSTRUCTION}\n\n## CLINICAL NOTE:\n\n${clinicalNote}`;

  let upstream: Response;
  try {
    upstream = await fetch("https://solvinghealth.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        channel: "surgeonvalue",
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach agent backend", detail: String(err) },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Agent backend returned ${upstream.status}` },
      { status: 502 }
    );
  }

  type UpstreamResponse = { answer?: string; reply?: string; response?: string };
  const data = (await upstream.json()) as UpstreamResponse;
  const raw = data.answer || data.reply || data.response || "";

  // Extract JSON
  let jsonText = raw.trim();
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonText = fenced[1].trim();
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // Truncation rescue — if we can at least find the letter_body, extract it
    const bodyMatch = jsonText.match(/"letter_body"\s*:\s*"([\s\S]*?)(?:"[,}]|$)/);
    if (bodyMatch) {
      return NextResponse.json({
        ok: true,
        result: {
          summary: "Letter generated (partial parse)",
          detected_cpt: matchedCpt?.cptCode || "unknown",
          letter_body: bodyMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
          key_clinical_findings: [],
          failed_conservative_treatments: [],
          guideline_citations: [],
          preemptive_rebuttals: [],
        },
        partial: true,
        context: {
          matched_cpt: matchedCpt?.cptCode || null,
          payer_profile_used: denialContext.payerPatterns?.payerName || null,
          documentation_warnings: documentationWarnings,
        },
      });
    }
    return NextResponse.json({
      ok: true,
      result: null,
      fallback_text: raw,
      context: {
        matched_cpt: matchedCpt?.cptCode || null,
        payer_profile_used: denialContext.payerPatterns?.payerName || null,
        documentation_warnings: documentationWarnings,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    result: parsed,
    context: {
      matched_cpt: matchedCpt?.cptCode || null,
      payer_profile_used: denialContext.payerPatterns?.payerName || null,
      documentation_warnings: documentationWarnings,
    },
  });
}
