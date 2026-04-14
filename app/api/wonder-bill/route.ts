import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Wonder Bill: paste a clinical note, get a structured list of documented-but-unbilled revenue.
// Server-side proxy to the solvinghealth.com/api/chat `surgeonvalue` channel, which is
// already wired to a Claude-backed orthopedic billing expert.

const SYSTEM_FRAMING = `You are Wonder Bill, an orthopedic billing expert using 2026 Medicare rules.

Analyze the clinical note below. Identify ONLY documented-but-unbilled revenue opportunities — work the surgeon already did and documented in the note but is NOT currently billing for. Do not suggest codes the documentation cannot support.

Common categories to look for: G2211 (longitudinal visit complexity), TCM 99495/99496, CCM 99490/99491, BHI 99492/99493, RTM 98975-98977, PCM 99426/99427, prolonged services 99417, complex MDM upcodes, injection/procedure add-ons (20610, 20611, 99070 supply), modifier-25 when separately identifiable, care coordination time.

CRITICAL: If the note is a global-period post-op visit (90-day global for major joints), most E/M is NOT separately billable. Catch that and call it out.

Return ONLY valid JSON in this exact schema (no prose, no markdown fences):

{
  "note_summary": "one-sentence clinical summary",
  "global_period_flag": "none | post-op-global-active | unclear",
  "line_items": [
    {
      "cited_sentence": "exact phrase from the note that documents the work",
      "cpt_code": "code",
      "code_description": "short description",
      "rule_brief": "why this code applies based on the cited documentation",
      "medicare_allowable_dollars": 0,
      "annual_impact_estimate": 0,
      "compliance_risk": "low | medium | high",
      "risk_reason": "one sentence",
      "biller_note": "one-line instruction for the billing team"
    }
  ],
  "total_visit_dollars": 0,
  "total_annual_impact": 0,
  "biller_ready_summary": "plain-text block the surgeon can copy-paste to their biller"
}

Maximum 6 line items. Do not invent dollar values — use 2026 Medicare non-facility allowables. If the note is too short or vague to analyze meaningfully, return an empty line_items array with note_summary explaining what's missing.`;

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

  const note = (body.note || "").trim();
  if (!note) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }
  if (note.length > 8000) {
    return NextResponse.json({ error: "Note too long (8000 char max)" }, { status: 400 });
  }

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
    return NextResponse.json(
      { error: "Could not reach billing engine", detail: String(err) },
      { status: 502 }
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: `Billing engine returned ${upstream.status}` },
      { status: 502 }
    );
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

  try {
    const parsed = JSON.parse(jsonText);
    return NextResponse.json({ ok: true, result: parsed });
  } catch {
    // Return the raw answer as a fallback — UI will render as prose
    return NextResponse.json({
      ok: true,
      result: null,
      fallback_text: raw,
    });
  }
}
