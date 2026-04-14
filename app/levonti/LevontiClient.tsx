"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// SurgeonValue — Levonti's command center for big day at Stanford.
// Real NPPES profile, one-tap auto-demo, pre-drafted posts, install QR.

interface LineItem {
  cited_sentence?: string;
  cpt_code?: string;
  code_description?: string;
  rule_brief?: string;
  medicare_allowable_dollars?: number;
  compliance_risk?: "low" | "medium" | "high";
  biller_note?: string;
}

interface WonderResult {
  note_summary?: string;
  global_period_flag?: string;
  line_items?: LineItem[];
  total_visit_dollars?: number;
}

const DEMO_NOTE = `62 y/o M established patient, severe right knee OA. Worsening pain 8/10, limiting ambulation. Standing X-rays show K-L grade 4 medial compartment. Performed right knee intra-articular injection under ultrasound guidance: superolateral approach, withdrew 15cc serosanguinous effusion, injected 1cc triamcinolone 40mg + 5cc lidocaine. Patient reports significant depression related to mobility loss, PHQ-9 14, screened for SI negative. Discussed behavioral health referral. Reviewed PT progress, called PT office to coordinate. Total time 55 minutes, 18 minutes non-face-to-face care coordination. MDM high complexity — chronic illness with progression, behavioral health co-morbidity. Longitudinal relationship 3+ years.`;

const DEMO_LINES = [
  "Reading the note...",
  "Matching 2026 CPT patterns...",
  "Cross-checking NCCI edits...",
  "Computing 2026 Medicare allowables...",
  "Calculating annual impact...",
  "Compiling biller-ready summary...",
];

const PREDRAFTED_POSTS = [
  {
    label: "X / Twitter",
    char_count: 274,
    text: "Spent 5 minutes today watching an AI read a routine ortho note and find $390 in unbilled codes. G2211 visit complexity, ultrasound-guided injection upcode, CCM minutes from PT coordination. The codes existed. The documentation existed. We just weren't trained to capture them.",
  },
  {
    label: "X / Twitter (alt)",
    char_count: 261,
    text: "If you're an orthopedic surgeon and you can't articulate exactly what G2211 is, you're leaving $5K-15K/year on the table per surgeon. It's a 2-minute rule and a 30-second documentation habit. Modern ortho billing isn't taught — it's discovered.",
  },
  {
    label: "LinkedIn",
    text: `I watched something this week that made me reconsider how we train orthopedic surgeons on revenue.

A tool reads a clinical note — one I wrote, with all the messy real-world detail of a routine knee OA follow-up — and within seconds returns the codes I documented but didn't bill. G2211 for visit complexity. CCM 99491 for the 18 minutes of care coordination time. An ultrasound-guidance upcode I'd have left as a standard injection.

The dollar value on a single visit isn't life-changing. ~$390. But across a panel of 600 patients with chronic OA being managed longitudinally? It's $180,000-$240,000 per surgeon per year sitting in plain sight.

The bottleneck isn't documentation. It isn't billing software. It's training. Most of us learned ortho coding (if at all) before G2211 existed, before RTM existed, before TCM was a meaningful revenue line. We're still billing like it's 2015.

The interesting question isn't "how do I get my biller to catch this" — they don't have time and they don't have your context. The interesting question is: what does it look like when the AI is in the loop with the surgeon at the moment of documentation?

That's the question I'm spending the next year on.`,
  },
];

interface Props {
  fullName: string;
  credential: string;
  specialty: string;
  practiceCity: string;
  practiceState: string;
  practiceLine1: string;
  missedLow: number;
  missedHigh: number;
  topCodes: { code: string; description: string; estimatedValue: string }[];
  npi: string;
}

const dollarFmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const riskColor: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function LevontiClient({
  fullName,
  credential,
  specialty,
  practiceCity,
  practiceState,
  practiceLine1,
  missedLow,
  missedHigh,
  topCodes,
  npi,
}: Props) {
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStage, setDemoStage] = useState<number>(-1);
  const [demoResult, setDemoResult] = useState<WonderResult | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tomorrow as displayed on the page
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLabel = tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    return () => {
      if (stageInterval.current) clearInterval(stageInterval.current);
    };
  }, []);

  const runDemo = async () => {
    setDemoLoading(true);
    setDemoResult(null);
    setDemoStage(0);

    // Animate the stage messages
    let i = 0;
    stageInterval.current = setInterval(() => {
      i++;
      if (i >= DEMO_LINES.length) {
        if (stageInterval.current) clearInterval(stageInterval.current);
        return;
      }
      setDemoStage(i);
    }, 720);

    try {
      const res = await fetch("/api/wonder-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: DEMO_NOTE }),
      });
      const data = await res.json();
      if (stageInterval.current) clearInterval(stageInterval.current);
      setDemoStage(DEMO_LINES.length);
      if (data.ok && data.result) {
        setDemoResult(data.result as WonderResult);
      }
    } catch {
      /* ignore — show stages even if API fails */
    } finally {
      setDemoLoading(false);
    }
  };

  const copyPost = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 2400);
    } catch {
      /* ignore */
    }
  };

  // Theme
  const bg = "#001a1b";
  const accent = "#94d1d3";
  const textMain = "#E8EDF2";
  const textMuted = "rgba(232,237,242,0.78)";
  const stanford = "#8C1515";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at 50% 0%, rgba(140,21,21,0.08) 0%, ${bg} 40%, ${bg} 100%)`,
        color: textMain,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Manrope', Roboto, sans-serif",
        padding: "60px 24px 120px",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Hero */}
        <div style={{ marginBottom: 56, textAlign: "center" }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            SurgeonValue
          </p>
          <h1
            style={{
              fontSize: "clamp(36px, 6vw, 68px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            Dr. {fullName.split(" ").pop()}
          </h1>
          <p style={{ fontSize: 13, color: "rgba(232,237,242,0.7)" }}>
            {tomorrowLabel}
          </p>
        </div>

        {/* Profile card */}
        <div
          style={{
            background: "rgba(148,209,211,0.04)",
            border: "1px solid rgba(148,209,211,0.15)",
            borderRadius: 20,
            padding: "28px 32px",
            marginBottom: 32,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: textMuted,
                fontWeight: 800,
                marginBottom: 8,
              }}
            >
              Live from CMS NPPES
            </p>
            <p style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.6px", marginBottom: 4 }}>
              {fullName}, <span style={{ color: accent }}>{credential}</span>
            </p>
            <p style={{ fontSize: 14, color: textMuted, marginBottom: 4 }}>{specialty}</p>
            <p style={{ fontSize: 13, color: "rgba(232,237,242,0.7)" }}>
              {practiceLine1} · {practiceCity}, {practiceState} · NPI {npi}
            </p>
          </div>
          <div
            style={{
              borderLeft: `3px solid ${stanford}`,
              paddingLeft: 18,
            }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(232,237,242,0.78)",
                marginBottom: 6,
                fontWeight: 800,
              }}
            >
              Estimated annual missed revenue
            </p>
            <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", color: "#fbbf24" }}>
              {dollarFmt(missedLow)}–{dollarFmt(missedHigh)}
            </p>
            <p style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
              For your specialty, your panel size
            </p>
          </div>
        </div>

        {/* Top codes for your specialty */}
        {topCodes.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 800,
                marginBottom: 14,
              }}
            >
              The 5 codes you're probably under-billing
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {topCodes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: accent,
                      color: bg,
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 900,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    {c.code}
                  </span>
                  <span style={{ fontSize: 13, color: textMain }}>{c.description}</span>
                  <span style={{ fontSize: 12, color: "#86efac", fontWeight: 800 }}>
                    {c.estimatedValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The big demo button */}
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Show this to a surgeon in 60 seconds
          </p>
          <p style={{ fontSize: 14, color: textMuted, marginBottom: 18, lineHeight: 1.6 }}>
            One tap. A real ortho clinical note runs through Wonder Bill live. They watch the codes
            appear with cited 2026 Medicare allowables. Hand them your phone and let the demo do the
            talking.
          </p>
          <button
            onClick={runDemo}
            disabled={demoLoading}
            style={{
              width: "100%",
              padding: "20px 28px",
              background: demoLoading ? "rgba(148,209,211,0.3)" : accent,
              color: bg,
              border: "none",
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 900,
              cursor: demoLoading ? "wait" : "pointer",
              letterSpacing: "-0.4px",
              boxShadow: demoLoading ? "none" : "0 16px 40px rgba(148,209,211,0.18)",
              transition: "all 0.15s ease",
            }}
          >
            {demoLoading
              ? "Running demo…"
              : demoResult
                ? "Run the demo again →"
                : "Run the demo →"}
          </button>

          {/* Stage progress */}
          {demoLoading && (
            <div
              style={{
                marginTop: 18,
                padding: "16px 20px",
                background: "rgba(148,209,211,0.04)",
                border: "1px solid rgba(148,209,211,0.15)",
                borderRadius: 12,
              }}
            >
              {DEMO_LINES.map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 13,
                    color: i <= demoStage ? accent : "rgba(232,237,242,0.25)",
                    fontFamily: "ui-monospace, monospace",
                    lineHeight: 1.8,
                    transition: "color 0.3s ease",
                  }}
                >
                  {i === demoStage && demoLoading ? "▸ " : i < demoStage ? "✓ " : "  "}
                  {line}
                </p>
              ))}
            </div>
          )}

          {/* Demo result */}
          {demoResult && (
            <div style={{ marginTop: 20 }}>
              {demoResult.note_summary && (
                <p style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 12 }}>
                  {demoResult.note_summary}
                </p>
              )}
              <div
                style={{
                  background: "rgba(148,209,211,0.06)",
                  border: "1px solid rgba(148,209,211,0.2)",
                  borderRadius: 14,
                  padding: "20px 24px",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: accent,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
                  Recovered on this single visit
                </p>
                <p style={{ fontSize: 38, fontWeight: 900, color: accent, letterSpacing: "-1px" }}>
                  {dollarFmt(demoResult.total_visit_dollars || 0)}
                </p>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {(demoResult.line_items || []).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: accent,
                          color: bg,
                          padding: "3px 9px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 900,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {item.cpt_code}
                      </span>
                      <span style={{ background: "rgba(134,239,172,0.12)", color: "#86efac", padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 800 }}>
                        {dollarFmt(item.medicare_allowable_dollars || 0)}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          color: riskColor[item.compliance_risk || "low"],
                          border: `1px solid ${riskColor[item.compliance_risk || "low"]}`,
                          padding: "2px 6px",
                          borderRadius: 4,
                        }}
                      >
                        {item.compliance_risk}
                      </span>
                    </div>
                    {item.code_description && (
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                        {item.code_description}
                      </p>
                    )}
                    {item.rule_brief && (
                      <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.55 }}>
                        {item.rule_brief}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CMS ACCESS Model alert — the strategic anchor */}
        <div
          style={{
            marginBottom: 40,
            background: "linear-gradient(135deg, rgba(140,21,21,0.12), rgba(148,209,211,0.04))",
            border: "1px solid rgba(140,21,21,0.4)",
            borderRadius: 20,
            padding: "28px 32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span
              style={{
                background: stanford,
                color: "#fff",
                padding: "5px 12px",
                borderRadius: 100,
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontWeight: 800,
              }}
            >
              CMS ACCESS Model
            </span>
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "#fbbf24",
                fontWeight: 800,
              }}
            >
              Application deadline · May 15, 2026
            </span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 12, lineHeight: 1.2 }}>
            CMS ACCESS Model. Applications close <span style={{ color: "#fbbf24" }}>May 15</span>.
          </p>
          <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6, marginBottom: 16 }}>
            Rolling review. Anything after May 15 starts January 1, 2027. Ortho is in scope.
          </p>

          <div
            style={{
              padding: "14px 18px",
              background: "rgba(0,0,0,0.3)",
              borderRadius: 10,
              borderLeft: `3px solid ${accent}`,
            }}
          >
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: accent, fontWeight: 800, marginBottom: 8 }}>
              Ask script
            </p>
            <p style={{ fontSize: 13, color: textMain, lineHeight: 1.7, fontStyle: "italic" }}>
              &ldquo;CMS ACCESS Model closes May 15. Ortho is in scope. I&apos;ve been testing the operational
              tool. Worth 15 minutes?&rdquo;
            </p>
          </div>

          <a
            href="https://www.cms.gov/priorities/innovation/access-model-accepted-applicants"
            target="_blank"
            rel="noopener"
            style={{
              display: "inline-block",
              marginTop: 16,
              fontSize: 12,
              fontWeight: 700,
              color: accent,
              textDecoration: "none",
              borderBottom: `1px dashed ${accent}`,
            }}
          >
            See accepted applicants on cms.gov →
          </a>
        </div>

        {/* Refer a patient — voice-first referral via NPPES */}
        <div
          style={{
            marginBottom: 40,
            background: "rgba(148,209,211,0.04)",
            border: "1px solid rgba(148,209,211,0.15)",
            borderRadius: 20,
            padding: "28px 32px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Refer a patient from your phone
          </p>
          <p style={{ fontSize: 18, fontWeight: 800, color: textMain, marginBottom: 8, letterSpacing: "-0.3px" }}>
            One dictation. Matched provider. Drafted referral letter. All from Pocket.
          </p>
          <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6, marginBottom: 16 }}>
            Speak the patient context and the kind of provider you need — &ldquo;PT for post-op TKA, near 94305,
            within 2 weeks.&rdquo; Pocket searches the live CMS NPPES registry for matches and drafts a
            referral letter you can text or fax. No login. No EMR integration required.
          </p>
          <a
            href="/pocket?view=refer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              background: accent,
              color: bg,
              borderRadius: 10,
              textDecoration: "none",
              fontSize: 13,
              fontWeight: 900,
            }}
          >
            Try the Refer tab in Pocket →
          </a>
        </div>

        {/* Pocket install QR */}
        <div
          style={{
            marginBottom: 40,
            background: "rgba(148,209,211,0.04)",
            border: "1px solid rgba(148,209,211,0.15)",
            borderRadius: 20,
            padding: "28px 32px",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Install Pocket on every surgeon&apos;s phone
            </p>
            <p
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: textMain,
                marginBottom: 8,
                letterSpacing: "-0.3px",
              }}
            >
              Hand them your phone. They scan the code. They install it on theirs in 10 seconds.
            </p>
            <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
              No app store. No login. Voice in, codes out. Once installed, the icon lives on their
              home screen like a native app. Works offline after first load.
            </p>
            <a
              href="/pocket"
              style={{
                display: "inline-block",
                marginTop: 12,
                fontSize: 13,
                fontWeight: 800,
                color: accent,
                textDecoration: "none",
                borderBottom: `1px dashed ${accent}`,
              }}
            >
              Open Pocket on this device →
            </a>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRCodeSVG
              value="https://surgeonvalue.com/p/levonti"
              size={140}
              level="M"
              fgColor="#001a1b"
              bgColor="#ffffff"
            />
          </div>
        </div>

        {/* Pre-drafted posts */}
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            Three posts ready to ship today
          </p>
          <p style={{ fontSize: 14, color: textMuted, marginBottom: 18, lineHeight: 1.6 }}>
            Pre-drafted in your voice. Each one teaches something specific about ortho billing. Tap
            Copy, paste into X or LinkedIn, ship. None of them mention SurgeonValue by name — these
            are pure thought leadership.
          </p>
          <div style={{ display: "grid", gap: 14 }}>
            {PREDRAFTED_POSTS.map((p, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: "18px 22px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: accent,
                      fontWeight: 800,
                    }}
                  >
                    {p.label}
                    {p.char_count !== undefined && (
                      <span style={{ color: textMuted, fontWeight: 600, marginLeft: 8 }}>
                        {p.char_count}/280
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() => copyPost(i, p.text)}
                    style={{
                      background: copied === i ? "#16a34a" : "#003536",
                      color: copied === i ? "#fff" : accent,
                      border: "1px solid rgba(148,209,211,0.25)",
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: textMain,
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* The script */}
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: accent,
              fontWeight: 800,
              marginBottom: 14,
            }}
          >
            The 60-second script
          </p>
          <div
            style={{
              background: "rgba(148,209,211,0.04)",
              border: "1px solid rgba(148,209,211,0.15)",
              borderRadius: 14,
              padding: "22px 26px",
              display: "grid",
              gap: 18,
            }}
          >
            {[
              {
                step: "1",
                line: '"I\'m rolling out a referral process for our patients. Scan this."',
                hint: "Show your /p/levonti QR. Real process, not a favor.",
              },
              {
                step: "2",
                line: '"You dictate the case, it routes to the right specialist, drafts the letter."',
                hint: "Optional: tap the demo button to show it on a real ortho note in 8 seconds.",
              },
              {
                step: "3",
                line: '"You also get the codes for your visit. We share the network."',
                hint: "Move on. The PCP is now in your referral routing system for life.",
              },
            ].map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(148,209,211,0.12)",
                    border: `1px solid ${accent}`,
                    color: accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: textMain, marginBottom: 4 }}>{s.line}</p>
                  <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.55 }}>{s.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 60,
            paddingTop: 32,
            borderTop: "1px solid rgba(148,209,211,0.1)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "rgba(232,237,242,0.5)",
              fontWeight: 800,
            }}
          >
            SurgeonValue
          </p>
        </div>
      </div>
    </main>
  );
}
