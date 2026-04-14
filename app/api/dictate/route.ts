import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// SurgeonValue Pocket — universal voice/text router.
// One input. AI detects intent. Routes to the right specialized backend.
// Surgeon never has to pick a tab.
//
// Intent classes:
//   code   — clinical note describing an encounter, wants billing analysis
//   refer  — needs a referral to another provider
//   ask    — quick coding/billing question
//   pa     — needs a PA letter drafted from a clinical case
//   share  — wants to draft a social post about an observation
//
// The classifier is a tiny prompt: 1 sentence in, JSON intent out.
// Then we proxy to the specialized endpoint that already exists.

interface DictateRequest {
  text: string;
  // Optional override — surgeon can pin an intent from a "force mode" menu
  force_intent?: "code" | "refer" | "ask" | "pa" | "share";
}

const CLASSIFIER_PROMPT = `You are an intent classifier for SurgeonValue Pocket — an orthopedic surgeon's voice interface. Read the surgeon's input and decide which of these the surgeon is asking for:

- "code": The surgeon dictated or pasted a clinical note describing an encounter (patient context, exam, MDM, time spent). They want billing codes back. This is the default if the input looks like clinical documentation.
- "refer": The surgeon wants to refer a patient to another provider. Look for phrases like "needs PT", "send to rheum", "refer to", "looking for a", "find me a", or any explicit ask for another specialty.
- "ask": The surgeon is asking a billing/coding/policy question. Look for question marks, "can I bill", "what's the rule", "is X covered", "does Medicare", "how do I code".
- "pa": The surgeon wants a prior authorization letter drafted. Look for "PA for", "prior auth", "medical necessity letter", "appeal", or a clinical case where the next step is requesting auth for a procedure.
- "share": The surgeon wants to draft a social media post about an observation, learning, or insight. Look for "post about", "draft a tweet", "share this", "I want to write about", or third-person reflective framing.

Return ONLY valid JSON, no markdown:
{
  "intent": "code" | "refer" | "ask" | "pa" | "share",
  "confidence": "high" | "medium" | "low",
  "reason": "one sentence explaining why"
}

INPUT:`;

async function classifyIntent(text: string): Promise<{
  intent: "code" | "refer" | "ask" | "pa" | "share";
  confidence: string;
  reason: string;
}> {
  const message = `${CLASSIFIER_PROMPT}\n${text.slice(0, 1500)}`;
  try {
    const res = await fetch("https://solvinghealth.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, channel: "surgeonvalue" }),
    });
    if (!res.ok) throw new Error("classifier upstream " + res.status);
    const data = (await res.json()) as { answer?: string; reply?: string; response?: string };
    const raw = (data.answer || data.reply || data.response || "").trim();
    let json = raw;
    const fenced = json.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) json = fenced[1].trim();
    const firstBrace = json.indexOf("{");
    const lastBrace = json.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) json = json.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(json);
    if (parsed.intent && ["code", "refer", "ask", "pa", "share"].includes(parsed.intent)) {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  // Fallback heuristic — works without the classifier
  const lower = text.toLowerCase();
  if (/\?$|can i|how do i|what's|is .* covered|does medicare|what code/i.test(text.trim())) {
    return { intent: "ask", confidence: "low", reason: "Fallback heuristic: question marker." };
  }
  if (/refer|needs pt|find me a|looking for a|consult/i.test(lower)) {
    return { intent: "refer", confidence: "low", reason: "Fallback heuristic: referral marker." };
  }
  if (/prior auth|pa for|medical necessity|appeal/i.test(lower)) {
    return { intent: "pa", confidence: "low", reason: "Fallback heuristic: PA marker." };
  }
  if (/post about|draft.*tweet|share this/i.test(lower)) {
    return { intent: "share", confidence: "low", reason: "Fallback heuristic: post marker." };
  }
  return { intent: "code", confidence: "low", reason: "Fallback default: clinical note." };
}

// Helpers — call our own API routes from inside a Next.js handler via a
// resolved base URL so dev and prod both work without a roundtrip through
// the public domain.
function getBaseUrl(req: NextRequest): string {
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

async function callRoute(base: string, path: string, body: unknown) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  let body: DictateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (text.length < 5) {
    return NextResponse.json({ error: "Input too short" }, { status: 400 });
  }
  if (text.length > 8000) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  // Determine intent (forced or classified)
  let intent: "code" | "refer" | "ask" | "pa" | "share";
  let classification:
    | { intent: string; confidence: string; reason: string }
    | null = null;

  if (body.force_intent) {
    intent = body.force_intent;
    classification = { intent, confidence: "high", reason: "Surgeon forced this intent." };
  } else {
    classification = await classifyIntent(text);
    intent = classification.intent as "code" | "refer" | "ask" | "pa" | "share";
  }

  const base = getBaseUrl(req);

  // Route to the right specialized endpoint
  let downstream: unknown = null;
  try {
    if (intent === "code") {
      downstream = await callRoute(base, "/api/wonder-bill", { note: text });
    } else if (intent === "refer") {
      downstream = await callRoute(base, "/api/refer", { patient_context: text });
    } else if (intent === "ask") {
      downstream = await callRoute(base, "/api/ask", { question: text });
    } else if (intent === "pa") {
      downstream = await callRoute(base, "/api/prior-auth", {
        clinicalNote: text.length >= 50 ? text : `${text}\n\n[Note: surgeon dictated a brief case; expand placeholders as needed.]`,
      });
    } else if (intent === "share") {
      downstream = await callRoute(base, "/api/post-draft", { observation: text });
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Downstream failed", detail: String(err), classification },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    intent,
    classification,
    result: downstream,
  });
}
