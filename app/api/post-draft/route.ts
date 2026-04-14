import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SurgeonValue Pocket — Post Drafter
// Voice or text observation → polished X + LinkedIn drafts in the surgeon's voice.
// PHI-stripped by construction. Routed through the same Claude-backed surgeonvalue
// channel as Wonder Bill, with a thought-leadership framing for orthopedic KOLs.

const POST_DRAFT_FRAMING = `You are SurgeonValue's social media drafter for orthopedic surgeons who post on X and LinkedIn as thought leaders. The surgeon just dictated a quick observation from their day — a billing insight, a case learning, a system frustration, a small win. Your job: turn it into two polished, PHI-free, professionally credible drafts they can post immediately.

PRINCIPLES
- The surgeon is a real practicing orthopedic specialist, not a marketer. Their voice is direct, technical, lightly opinionated, never salesy.
- Strip ALL protected health information: ages, dates, locations, identifying details. Use "a patient", "an established follow-up", "a recent injection visit". Never invent specifics.
- Each draft must teach something specific — a billing rule, a CMS update, a missed-revenue insight, a workflow improvement. Surgeons follow other surgeons who teach.
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

  const observation = (body.observation || "").trim();
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
