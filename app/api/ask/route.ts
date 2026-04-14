import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sage Ask — thin server-side proxy for the SurgeonValue billing-expert channel.
// Surgeon dictates a billing question on Pocket → routed through the same Claude
// backend Wonder Bill uses, with a surgeon-context system framing.

const CODE_REFERENCE_2026 = `AUTHORITATIVE 2026 CODE REFERENCE — use these definitions, do not paraphrase or guess:

- G2211: Visit complexity add-on for E/M services for ongoing longitudinal care of a single serious or complex condition. Add to 99202–99215 base. ~$16 Medicare allowable. NOT remote monitoring.
- 99417: Prolonged office visit add-on, each additional 15 minutes of total time beyond 99215. NOT for inpatient.
- 99490: Chronic Care Management (CCM), first 20 min/month of clinical staff time. ~$62 allowable.
- 99491: CCM, first 30 min/month of physician/QHP time. ~$83 allowable.
- 99492: Behavioral Health Integration (BHI) initial 70 min/month. ~$140-160 allowable.
- 99493: BHI subsequent 60 min/month. ~$120 allowable.
- 99495: Transitional Care Management (TCM) moderate complexity, within 14 days post-discharge. ~$185 allowable.
- 99496: TCM high complexity, within 7 days post-discharge. ~$245 allowable.
- 98975: RTM device setup and patient education. ~$19 allowable.
- 98976: RTM respiratory device supply, 30 days. ~$56 allowable.
- 98977: RTM musculoskeletal device supply, 30 days. ~$56 allowable.
- 98980: RTM treatment management services, first 20 min/month. ~$48 allowable.
- 98981: RTM treatment management additional 20 min/month. ~$39 allowable.
- 99453: Remote Patient Monitoring (RPM) device setup. ~$19 allowable.
- 99454: RPM device supply 30 days. ~$56 allowable.
- 99457: RPM treatment management first 20 min/month. ~$48 allowable.
- 99458: RPM treatment management additional 20 min. ~$39 allowable.
- 20610: Arthrocentesis/injection, major joint, WITHOUT imaging guidance. ~$66 allowable.
- 20611: Arthrocentesis/injection, major joint, WITH ultrasound guidance and permanent recording. ~$104 allowable.
- 27447: Total knee arthroplasty. 90-day global period.
- 27130: Total hip arthroplasty. 90-day global period.
- Modifier 24: Unrelated E/M by same physician during global period. Documentation must state the visit is unrelated to the surgery.
- Modifier 25: Significant, separately identifiable E/M on the same day as a procedure. Different decision-making required.
- Modifier 57: Decision for surgery — E/M that resulted in the decision to do major surgery within 24 hours.

If a question references a code not in this list, use your training knowledge but flag uncertainty explicitly.`;

const ASK_FRAMING = `You are SurgeonValue's billing and coding expert, available to orthopedic surgeons between cases. The surgeon is asking a quick question via voice on a mobile device. They need a fast, accurate, practical answer.

${CODE_REFERENCE_2026}

Rules:
- Answer in 80-150 words. Concise. Mobile-readable.
- Use the AUTHORITATIVE 2026 CODE REFERENCE above as ground truth. NEVER contradict it.
- If a billing combination has compliance risks, name them.
- If a code requires specific documentation, name it.
- If you don't know, say so. Never fabricate.
- No corporate hedging. Answer like a senior coder talking to a colleague.
- Use plain text. Short paragraphs. No markdown headers or fences.

Question:`;

interface AskRequest {
  question: string;
}

export async function POST(req: NextRequest) {
  let body: AskRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = (body.question || "").trim();
  if (!question) {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }
  if (question.length > 2000) {
    return NextResponse.json({ error: "Question too long" }, { status: 400 });
  }

  const message = `${ASK_FRAMING} ${question}`;

  let upstream: Response;
  try {
    upstream = await fetch("https://solvinghealth.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, channel: "surgeonvalue" }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach expert backend", detail: String(err) },
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
  const answer = (data.answer || data.reply || data.response || "").trim();

  if (!answer) {
    return NextResponse.json({ ok: false, error: "Empty response" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, answer });
}
