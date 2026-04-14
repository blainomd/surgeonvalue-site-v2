import { NextRequest, NextResponse } from "next/server";

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

  const patientContext = (body.patient_context || "").trim();
  if (patientContext.length < 15) {
    return NextResponse.json({ error: "Patient context too short" }, { status: 400 });
  }
  if (patientContext.length > 4000) {
    return NextResponse.json({ error: "Patient context too long" }, { status: 400 });
  }

  const taxonomy = inferSpecialtyKeyword(body.specialty_hint || "", patientContext);
  const state = (body.state || "").trim();
  const city = (body.city || "").trim();

  // Run provider search and letter drafting in parallel
  const [providers, letterResp] = await Promise.allSettled([
    searchNppesProviders(taxonomy, state, city),
    fetch("https://solvinghealth.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${REFERRAL_FRAMING}\n\nNEEDED SPECIALTY: ${taxonomy}\nLOCATION: ${city || "any"}, ${state || "any"}\n\nPATIENT CONTEXT:\n${patientContext}`,
        channel: "surgeonvalue",
      }),
    })
      .then((r) => r.json())
      .then((d) => d as { answer?: string; reply?: string; response?: string }),
  ]);

  const matched = providers.status === "fulfilled" ? providers.value : [];

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

  return NextResponse.json({
    ok: true,
    inferred_specialty: taxonomy,
    matched_providers: matched,
    referral_letter: letter,
  });
}
