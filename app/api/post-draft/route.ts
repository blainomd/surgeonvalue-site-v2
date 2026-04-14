import { NextRequest, NextResponse } from "next/server";
import { stripPhi } from "@/lib/phi-strip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SurgeonValue Pocket — Post Drafter
// Voice or text observation → polished X + LinkedIn drafts in the surgeon's voice.
// PHI-stripped by construction. Routed through the same Claude-backed surgeonvalue
// channel as Wonder Bill, with a thought-leadership framing for orthopedic KOLs.

const CODE_REFERENCE_2026 = `AUTHORITATIVE 2026 CODE REFERENCE — use these definitions and never contradict them in any post:
- G2211: Visit complexity add-on for E/M (99202-99215). Longitudinal care of complex condition. ~$16 Medicare. NOT remote monitoring of any kind.
- 99417: Prolonged office visit add-on, each 15 min beyond 99215 total time.
- 99490/99491: Chronic Care Management (CCM), monthly care coordination time.
- 99495/99496: Transitional Care Management (TCM), post-discharge.
- 99492/99493: Behavioral Health Integration (BHI).
- 98975-77: Remote Therapeutic Monitoring (RTM) device setup/supply (musculoskeletal/respiratory).
- 98980-81: RTM treatment management 20 min/month.
- 99453-58: Remote Physiologic Monitoring (RPM) — physiologic vitals only, distinct from RTM.
- 20610: Major joint injection without imaging guidance.
- 20611: Major joint injection WITH ultrasound guidance and permanent recording.
- Modifier 24/25/57: unrelated E/M during global / distinct same-day E/M / decision for surgery.

If a draft involves a code, ground it in this reference. Do NOT claim G2211 is RTM, RPM, or care management.`;

const POST_DRAFT_FRAMING = `You are SurgeonValue's social media drafter for orthopedic surgeons who post on X and LinkedIn as thought leaders. The surgeon just dictated a quick observation from their day — a billing insight, a case learning, a system frustration, a small win. Your job: turn it into two polished, PHI-free, professionally credible, technically accurate drafts they can post immediately.

${CODE_REFERENCE_2026}

PRINCIPLES
- The surgeon is a real practicing orthopedic specialist, not a marketer. Their voice is direct, technical, lightly opinionated, never salesy.
- Strip ALL protected health information: ages, dates, locations, identifying details. Use "a patient", "an established follow-up", "a recent injection visit". Never invent specifics.
- Each draft must teach something specific — a billing rule, a CMS update, a missed-revenue insight, a workflow improvement. Surgeons follow other surgeons who teach.
- TECHNICAL ACCURACY IS NON-NEGOTIABLE. If you reference a CPT or HCPCS code, the description must match the AUTHORITATIVE 2026 CODE REFERENCE above exactly.
- If the surgeon's dictation contains a factual error about a code, fix it silently in the draft — do not call out their mistake, just write the correct version.
- No emojis. No hashtag spam. Maximum 2 hashtags on X, none on LinkedIn.
- Never mention SurgeonValue, Wonder Bill, or any product name unless the surgeon explicitly asked you to.
- 2026 voice: practical, specific, slightly counterintuitive when possible.

OUTPUT
Return ONLY valid JSON. No markdown fences. No prose. Schema:

{
  "topic": "one-line summary of what the post is about",
  "x_draft": {
    "text": "≤ 280 characters. Single tweet. Hook in first line. Teach in body.",
    "char_count": number,
    "hashtags": ["#h1", "#h2"]
  },
  "linkedin_draft": {
    "text": "120-220 words. First line is a hook. Body teaches the insight with specifics. Ends with a question or short takeaway. Plain text, line breaks preserved with \\n. No headers, no bullets unless content demands.",
    "hook": "the first line, repeated for editor preview"
  },
  "phi_check": "list anything you stripped or flagged as identifying"
}

OBSERVATION:`;

interface PostDraftRequest {
  observation: string;
}

export async function POST(req: NextRequest) {
  let body: PostDraftRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawObservation = (body.observation || "").trim();
  // PHI strip BEFORE the observation hits the model — post drafts should
  // never contain patient identifiers even in the input phase.
  const observation = stripPhi(rawObservation).clean;
  if (observation.length < 15) {
    return NextResponse.json({ error: "Observation too short" }, { status: 400 });
  }
  if (observation.length > 3000) {
    return NextResponse.json({ error: "Observation too long" }, { status: 400 });
  }

  const message = `${POST_DRAFT_FRAMING}\n\n${observation}`;

  let upstream: Response;
  try {
    upstream = await fetch("https://solvinghealth.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, channel: "surgeonvalue" }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach drafter backend", detail: String(err) },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Backend returned ${upstream.status}` },
      { status: 502 }
    );
  }

  type UpstreamResponse = { answer?: string; reply?: string; response?: string };
  const data = (await upstream.json()) as UpstreamResponse;
  const raw = (data.answer || data.reply || data.response || "").trim();

  // Extract JSON
  let jsonText = raw;
  const fenced = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) jsonText = fenced[1].trim();
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(jsonText);
    return NextResponse.json({ ok: true, result: parsed });
  } catch {
    return NextResponse.json(
      { ok: true, result: null, fallback_text: raw },
      { status: 200 }
    );
  }
}
