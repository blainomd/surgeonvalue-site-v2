import { NextRequest, NextResponse } from "next/server";
import { stripPhi } from "@/lib/phi-strip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Wonder Bill: paste a clinical note, get a structured list of documented-but-unbilled revenue.
// Server-side proxy to the solvinghealth.com/api/chat `surgeonvalue` channel, which is
// already wired to a Claude-backed orthopedic billing expert.

const CODE_REFERENCE_2026 = `AUTHORITATIVE 2026 CODE REFERENCE — use these definitions and allowables, do not paraphrase or guess:
- G2211: Visit complexity add-on for E/M, longitudinal care of complex condition. ~$16. NOT remote monitoring.
- 99417: Prolonged office visit add-on, each 15 min beyond 99215 total time.
- 99490: CCM first 20 min/month clinical staff time. ~$62.
- 99491: CCM first 30 min/month physician time. ~$83.
- 99492: BHI initial 70 min/month. ~$140-160.
- 99493: BHI subsequent 60 min/month. ~$120.
- 99495: TCM moderate, within 14d post-discharge. ~$185.
- 99496: TCM high, within 7d post-discharge. ~$245.
- 98975-77: RTM device setup/supply. ~$19-56.
- 98980-81: RTM treatment management 20 min. ~$48-39.
- 99453-58: RPM (remote PHYSIOLOGIC monitoring) setup, supply, treatment management.
- 20610: Major joint injection WITHOUT imaging. ~$66.
- 20611: Major joint injection WITH ultrasound + permanent recording. ~$104.
- Modifier 24: Unrelated E/M during global. Modifier 25: Distinct E/M same day as procedure. Modifier 57: Decision for surgery.`;

const SYSTEM_FRAMING = `You are Wonder Bill, an orthopedic billing expert using 2026 Medicare rules.

${CODE_REFERENCE_2026}

Analyze the clinical note below. Identify documented-but-unbilled revenue opportunities. Do NOT suggest codes the documentation cannot support. If the note is a 90-day post-op global period visit, most E/M is bundled — call that out explicitly in global_period_flag.

Categories to scan: G2211, TCM 99495/96, CCM 99490/91, BHI 99492/93, RTM 98975-77 / 98980-81, prolonged 99417, MDM complexity, procedure add-ons (20610/11), modifier-25 distinct services.

RULES — RESPOND WITH VALID JSON ONLY. NO MARKDOWN. NO PROSE. BE EXTREMELY TERSE.
- Max 4 line_items (pick the 4 highest-confidence opportunities)
- rule_brief: max 25 words
- risk_reason: max 15 words
- biller_note: max 12 words
- code_description: max 8 words
- cited_sentence: copy exact phrase from note, ≤ 20 words
- Use real 2026 Medicare non-facility allowables
- If note is a global period visit and nothing is separately billable, return empty line_items with global_period_flag set and explain in note_summary

Schema:
{
  "note_summary": "one sentence",
  "global_period_flag": "none" | "post-op-global-active" | "unclear",
  "line_items": [
    {
      "cited_sentence": "string",
      "cpt_code": "string",
      "code_description": "string",
      "rule_brief": "string",
      "medicare_allowable_dollars": number,
      "annual_impact_estimate": number,
      "compliance_risk": "low" | "medium" | "high",
      "risk_reason": "string",
      "biller_note": "string"
    }
  ],
  "total_visit_dollars": number,
  "total_annual_impact": number,
  "biller_ready_summary": "terse plaintext biller instructions, max 400 chars"
}`;

interface WonderBillRequest {
  note: string;
}

export async function POST(req: NextRequest) {
  let body: WonderBillRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawNote = (body.note || "").trim();
  if (!rawNote) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }
  if (rawNote.length > 8000) {
    return NextResponse.json({ error: "Note too long (8000 char max)" }, { status: 400 });
  }

  // Strip obvious identifiers BEFORE the note hits the upstream Claude API.
  // Defense-in-depth: the downstream prompt also instructs PHI-stripping,
  // but we want the identifiers gone before they leave our server.
  const { clean: note } = stripPhi(rawNote);

  const message = `${SYSTEM_FRAMING}\n\nCLINICAL_NOTE:\n\n${note}`;

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
    return NextResponse.json({ error: "Could not reach billing engine", detail: String(err) }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: `Billing engine returned ${upstream.status}` }, { status: 502 });
  }

  type UpstreamResponse = { answer?: string; reply?: string; response?: string };
  const data = (await upstream.json()) as UpstreamResponse;
  const raw = data.answer || data.reply || data.response || "";

  // Extract JSON — handle markdown fences if present
  let jsonText = raw.trim();
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonText = fenced[1].trim();

  // Find the first { and last } to handle any wrapping prose
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  // Try direct parse
  let parsed: unknown = null;
  let repaired = false;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    const repairedText = tryRepairTruncated(jsonText);
    if (repairedText) {
      try {
        parsed = JSON.parse(repairedText);
        repaired = true;
      } catch {
        /* fall through */
      }
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return NextResponse.json({ ok: true, result: null, fallback_text: raw });
  }

  // Normalize — compute totals from line_items and regenerate biller summary
  // if they're missing (truncation) or zero.
  const normalized = normalizeResult(parsed as Record<string, unknown>);
  return NextResponse.json({ ok: true, result: normalized, repaired });
}

type LineItemShape = {
  cited_sentence?: string;
  cpt_code?: string;
  code_description?: string;
  rule_brief?: string;
  medicare_allowable_dollars?: number;
  annual_impact_estimate?: number;
  compliance_risk?: string;
  risk_reason?: string;
  biller_note?: string;
};

function normalizeResult(input: Record<string, unknown>): Record<string, unknown> {
  const items = Array.isArray(input.line_items) ? (input.line_items as LineItemShape[]) : [];

  const totalVisit = items.reduce(
    (sum, it) => sum + (typeof it.medicare_allowable_dollars === "number" ? it.medicare_allowable_dollars : 0),
    0
  );
  const totalAnnual = items.reduce(
    (sum, it) => sum + (typeof it.annual_impact_estimate === "number" ? it.annual_impact_estimate : 0),
    0
  );

  // If upstream produced totals that match computed totals, keep them.
  // If upstream totals are 0/missing (truncation), use computed.
  const existingVisit = typeof input.total_visit_dollars === "number" ? input.total_visit_dollars : 0;
  const existingAnnual = typeof input.total_annual_impact === "number" ? input.total_annual_impact : 0;
  const useComputedVisit = existingVisit === 0 && totalVisit > 0;
  const useComputedAnnual = existingAnnual === 0 && totalAnnual > 0;

  // Regenerate biller summary if missing or placeholder
  const existingSummary = typeof input.biller_ready_summary === "string" ? input.biller_ready_summary : "";
  const summaryLooksPlaceholder =
    !existingSummary ||
    existingSummary.length < 40 ||
    existingSummary.toLowerCase().includes("paste the 4 line items") ||
    existingSummary.toLowerCase().includes("response truncated");

  let billerSummary = existingSummary;
  if (summaryLooksPlaceholder && items.length > 0) {
    const lines = items
      .map((it) => {
        const code = it.cpt_code || "";
        const dollars = typeof it.medicare_allowable_dollars === "number" ? it.medicare_allowable_dollars : 0;
        const note = it.biller_note || it.code_description || "";
        return `${code} — $${dollars.toFixed(2)}${note ? ` — ${note}` : ""}`;
      })
      .filter(Boolean);
    billerSummary = `Wonder Bill opportunities for this encounter:\n\n${lines.join("\n")}\n\nVerify documentation and MDM before submission.`;
  } else if (summaryLooksPlaceholder && items.length === 0) {
    billerSummary =
      "No separately billable opportunities found. If this is a global-period visit, the work is bundled into the surgical global fee.";
  }

  return {
    ...input,
    line_items: items,
    total_visit_dollars: useComputedVisit ? totalVisit : existingVisit || totalVisit,
    total_annual_impact: useComputedAnnual ? totalAnnual : existingAnnual || totalAnnual,
    biller_ready_summary: billerSummary,
  };
}

// Close a truncated JSON object by:
// 1. Finding the last complete `}` inside the line_items array
// 2. Truncating the string at that position + 1
// 3. Closing the array and top-level object
function tryRepairTruncated(jsonText: string): string | null {
  const lineItemsStart = jsonText.indexOf('"line_items"');
  if (lineItemsStart === -1) return null;

  const arrayStart = jsonText.indexOf("[", lineItemsStart);
  if (arrayStart === -1) return null;

  // Walk forward tracking brace depth. Record position of each completed
  // top-level object inside the array.
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastCompleteObjectEnd = -1;

  for (let i = arrayStart + 1; i < jsonText.length; i++) {
    const ch = jsonText[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) lastCompleteObjectEnd = i;
    } else if (ch === "]" && depth === 0) {
      // Array closed naturally — no repair needed here, reparse would have worked
      return null;
    }
  }

  if (lastCompleteObjectEnd === -1) {
    // No complete line_items — return empty array
    const head = jsonText.slice(0, arrayStart + 1);
    return `${head}], "total_visit_dollars": 0, "total_annual_impact": 0, "biller_ready_summary": "Response truncated. Re-run with a shorter note."}`;
  }

  const head = jsonText.slice(0, lastCompleteObjectEnd + 1);
  return `${head}], "total_visit_dollars": 0, "total_annual_impact": 0, "biller_ready_summary": "Paste the 4 line items above into your billing system."}`;
}
