import { NextRequest, NextResponse } from "next/server";
import { lookupNpi } from "@/app/api/npi/route";
import { stripPhi } from "@/lib/phi-strip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SurgeonValue Refer — voice/text → matched providers + drafted referral letter.
// Uses CMS NPPES live search by taxonomy + state, then routes through the same
// Claude-backed surgeonvalue channel to draft a referral letter from the patient
// context. PHI-stripped by the time it reaches the model.

interface ReferRequest {
  patient_context: string; // "60yo M post-op TKA, needs PT 2x/week"
  specialty_hint?: string; // "physical therapy" — optional, otherwise inferred
  city?: string;
  state?: string; // "CA"
  zip?: string;
  preferred_npi?: string; // SurgeonValue customer to surface as top match
  preferred_label?: string; // Display label for preferred destination
}

// Lightweight specialty → taxonomy keyword mapping for NPPES filter.
// NPPES full-text matches on taxonomy_description; these keywords work well.
const SPECIALTY_KEYWORDS: Record<string, string> = {
  pt: "physical therapy",
  "physical therapy": "physical therapy",
  "physical therapist": "physical therapy",
  ot: "occupational therapy",
  "occupational therapy": "occupational therapy",
  "pain management": "pain medicine",
  "pain medicine": "pain medicine",
  rheumatology: "rheumatology",
  rheum: "rheumatology",
  "primary care": "family medicine",
  "family medicine": "family medicine",
  "internal medicine": "internal medicine",
  pcp: "family medicine",
  cardiology: "cardiovascular disease",
  cardiac: "cardiovascular disease",
  endocrinology: "endocrinology",
  endo: "endocrinology",
  "behavioral health": "psychology",
  psychology: "psychology",
  psychiatry: "psychiatry",
  ortho: "orthopaedic",
  orthopedic: "orthopaedic",
  orthopaedic: "orthopaedic",
  spine: "orthopaedic spine",
  hand: "hand surgery",
  shoulder: "orthopaedic shoulder",
  hip: "orthopaedic adult reconstruction",
  knee: "orthopaedic adult reconstruction",
  oncology: "medical oncology",
  podiatry: "podiatry",
  neurology: "neurology",
  nephrology: "nephrology",
  pulmonology: "pulmonary",
  gi: "gastroenterology",
  gastroenterology: "gastroenterology",
};

function inferSpecialtyKeyword(hint: string, context: string): string {
  const text = `${hint} ${context}`.toLowerCase();
  for (const [keyword, taxonomy] of Object.entries(SPECIALTY_KEYWORDS)) {
    if (text.includes(keyword)) return taxonomy;
  }
  // default to PT — most common ortho referral
  return "physical therapy";
}

interface NppesProvider {
  npi: string;
  name: string;
  credential: string;
  specialty: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  phone: string;
}

async function searchNppesProviders(
  taxonomy: string,
  state: string,
  city: string
): Promise<NppesProvider[]> {
  // NPPES API supports taxonomy_description search + state filter
  const params = new URLSearchParams({
    version: "2.1",
    limit: "10",
    enumeration_type: "NPI-1",
    taxonomy_description: taxonomy,
  });
  if (state) params.set("state", state.toUpperCase());
  if (city) params.set("city", city);

  const url = `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    return [];
  }
  if (!res.ok) return [];

  let data: { results?: Array<Record<string, unknown>> };
  try {
    data = await res.json();
  } catch {
    return [];
  }

  return (data.results || []).slice(0, 5).map((r) => {
    const basic = (r.basic as Record<string, string>) || {};
    const taxonomies = (r.taxonomies as Array<Record<string, string>>) || [];
    const addresses = (r.addresses as Array<Record<string, string>>) || [];
    const practiceAddr = addresses.find((a) => a.address_purpose === "LOCATION") || addresses[0] || {};

    const isOrg = basic.organization_name;
    const name = isOrg
      ? basic.organization_name
      : `${basic.first_name || ""} ${basic.last_name || ""}`.trim();

    return {
      npi: String(r.number || ""),
      name,
      credential: basic.credential || "",
      specialty: taxonomies[0]?.desc || taxonomy,
      city: practiceAddr.city || "",
      state: practiceAddr.state || "",
      zip: (practiceAddr.postal_code || "").toString().slice(0, 5),
      address: practiceAddr.address_1 || "",
      phone: practiceAddr.telephone_number || "",
    };
  });
}

const REFERRAL_FRAMING = `You are SurgeonValue's referral letter drafter. The surgeon dictated a quick patient context and the type of provider they need. Draft a one-page referral letter the surgeon can send (text/fax/email) to the receiving provider.

RULES
- Strip ALL protected health information from the input. Use placeholders: [PATIENT NAME], [DOB], [INSURANCE], [DATE OF SERVICE]. Never echo specific patient details.
- Reference the clinical context generically — "established patient with chronic OA s/p R TKA", not specific dates or identifiers.
- Be concise: 150-220 words.
- Include: greeting, reason for referral, relevant clinical context, what you've tried, what you're asking the receiving provider to do, urgency, contact info placeholder.
- Tone: collegial, peer-to-peer, professional. No corporate hedging.
- Sign-off uses [Referring physician name], [Practice], [Phone] placeholders.

Return ONLY valid JSON in this schema (no markdown fences, no prose):
{
  "letter": "the full referral letter as plain text with newlines preserved as \\n",
  "key_points": ["3-4 short bullet points summarizing the ask"],
  "urgency": "routine | urgent | stat",
  "phi_stripped": "list anything you removed or flagged"
}`;

export async function POST(req: NextRequest) {
  let body: ReferRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawContext = (body.patient_context || "").trim();
  if (rawContext.length < 15) {
    return NextResponse.json({ error: "Patient context too short" }, { status: 400 });
  }
  if (rawContext.length > 4000) {
    return NextResponse.json({ error: "Patient context too long" }, { status: 400 });
  }

  // Strip obvious identifiers before the context hits upstream / NPPES search
  const { clean: patientContext } = stripPhi(rawContext);

  const taxonomy = inferSpecialtyKeyword(body.specialty_hint || "", patientContext);
  const state = (body.state || "").trim();
  const city = (body.city || "").trim();

  // Run provider search, letter drafting, AND preferred specialist lookup in parallel
  const preferredNpi = (body.preferred_npi || "").trim();
  const preferredLabel = (body.preferred_label || "").trim();

  // Wonder Bill fan-out — captures CPT billing opportunities for the
  // referring provider's OWN visit. PCPs get value on both sides.
  const billingPromise = fetch("https://solvinghealth.com/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: `You are Wonder Bill. The clinical note below is from a primary-care or referring-provider visit (not a surgical encounter). Identify documented-but-unbilled CPT/HCPCS revenue opportunities the referring provider can capture for THIS visit. Use 2026 Medicare allowables. Return ONLY valid JSON. Max 4 line items. Schema: {"note_summary":"one sentence","line_items":[{"cpt_code":"","code_description":"≤8 words","cited_sentence":"≤20 words from note","rule_brief":"≤25 words","medicare_allowable_dollars":0,"compliance_risk":"low|medium|high","biller_note":"≤12 words"}],"total_visit_dollars":0}\n\nNOTE:\n${patientContext}`,
      channel: "surgeonvalue",
    }),
  })
    .then((r) => r.json())
    .then((d) => d as { answer?: string });

  const [providers, letterResp, preferredResp, billingResp] = await Promise.allSettled([
    searchNppesProviders(taxonomy, state, city),
    fetch("https://solvinghealth.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${REFERRAL_FRAMING}\n\nNEEDED SPECIALTY: ${taxonomy}\nLOCATION: ${city || "any"}, ${state || "any"}${preferredLabel ? `\nPREFERRED RECEIVING PROVIDER: ${preferredLabel}` : ""}\n\nPATIENT CONTEXT:\n${patientContext}`,
        channel: "surgeonvalue",
      }),
    })
      .then((r) => r.json())
      .then((d) => d as { answer?: string; reply?: string; response?: string }),
    preferredNpi && /^\d{10}$/.test(preferredNpi)
      ? lookupNpi(preferredNpi)
      : Promise.resolve(null),
    billingPromise,
  ]);

  let matched = providers.status === "fulfilled" ? providers.value : [];

  // Prepend the preferred specialist as the top match if we successfully fetched them
  if (preferredResp.status === "fulfilled" && preferredResp.value) {
    const p = preferredResp.value as Record<string, unknown>;
    if (!(p as { error?: string }).error) {
      const provider = (p as { provider?: { firstName?: string; lastName?: string; credential?: string } }).provider || {};
      const specialty = (p as { specialty?: { description?: string } }).specialty || {};
      const address = (p as { address?: { line1?: string; city?: string; state?: string; zip?: string } }).address || {};
      const preferredCard: NppesProvider = {
        npi: String((p as { npi?: string }).npi || preferredNpi),
        name: `${provider.firstName || ""} ${provider.lastName || ""}`.trim(),
        credential: provider.credential || "",
        specialty: specialty.description || "Specialist",
        city: address.city || "",
        state: address.state || "",
        zip: address.zip || "",
        address: address.line1 || "",
        phone: (p as { phone?: string }).phone || "",
      };
      // De-dupe in case NPPES search also returned them
      matched = [preferredCard, ...matched.filter((m) => m.npi !== preferredCard.npi)];
    }
  }

  let letter: Record<string, unknown> | null = null;
  if (letterResp.status === "fulfilled" && letterResp.value) {
    const raw = (letterResp.value.answer || letterResp.value.reply || letterResp.value.response || "").trim();
    let jsonText = raw;
    const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonText = fenced[1].trim();
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }
    try {
      letter = JSON.parse(jsonText);
    } catch {
      letter = { letter: raw, key_points: [], urgency: "routine", phi_stripped: "" };
    }
  }

  const preferredOk = preferredResp.status === "fulfilled" && preferredResp.value && !(preferredResp.value as { error?: string }).error;

  // Parse the Wonder Bill billing capture for the referring provider's visit
  let billing: Record<string, unknown> | null = null;
  if (billingResp.status === "fulfilled" && billingResp.value) {
    const raw = (billingResp.value.answer || "").trim();
    let jsonText = raw;
    const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) jsonText = fenced[1].trim();
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }
    try {
      billing = JSON.parse(jsonText);
    } catch {
      billing = null;
    }
  }

  return NextResponse.json({
    ok: true,
    inferred_specialty: taxonomy,
    preferred_specialist: preferredOk ? matched[0] : null,
    matched_providers: matched,
    referral_letter: letter,
    billing_capture: billing,
  });
}
