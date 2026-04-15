import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CJR-X is coming. Do you know your episode cost? | SurgeonValue",
  description:
    "CMS just proposed CJR-X — the first nationwide mandatory episode-based payment model for joint replacements. 2,500+ hospitals. 90-day episodes. No opt-out. Performance begins October 2027. SurgeonValue was built for this.",
  openGraph: {
    title: "CJR-X is coming. Do you know your episode cost?",
    description:
      "2,500+ hospitals. 90-day episodes. Mandatory nationwide. Performance begins October 2027. SurgeonValue was built for this.",
    url: "https://surgeonvalue.com/cjr-x",
    siteName: "SurgeonValue",
    type: "website",
  },
};

const STATS = [
  { big: "2,500+", label: "Hospitals affected", sub: "Mandatory, nationwide. No opt-out." },
  { big: "90 days", label: "Episode window", sub: "Procedure plus everything that happens for 90 days after discharge." },
  { big: "$112.7M", label: "Prior CJR savings", sub: "What CMS extracted from the original CJR pilot before going nationwide." },
  { big: "Oct 2027", label: "Mandatory start date", sub: "Performance year begins. The hospitals who waited are already late." },
];

const COMPARISON = [
  { metric: "Scope", cjrx: "Joints only (hip, knee, ankle)", team: "5 episode types", cjrx_emphasis: false },
  { metric: "Episode window", cjrx: "90 days", team: "30 days", cjrx_emphasis: true },
  { metric: "Mandatory?", cjrx: "Yes — nationwide", team: "Yes — 188 metros only", cjrx_emphasis: false },
  { metric: "Hospitals", cjrx: "2,500+", team: "741", cjrx_emphasis: true },
  { metric: "Performance start", cjrx: "Oct 2027", team: "Jan 2026 (active)", cjrx_emphasis: false },
];

const PREP_CHECKLIST = [
  {
    n: 1,
    title: "Know your episode cost",
    body: "What does a total knee actually cost over 90 days? Most surgeons can't answer. The winners will know before performance year starts.",
  },
  {
    n: 2,
    title: "Audit your billing",
    body: "RTM 98975–98981, CCM 99490–99491, prolonged services 99417, caregiver training 96202–96203 — every unbilled code is money left on the table that won't help you hit target.",
  },
  {
    n: 3,
    title: "Track post-acute utilization",
    body: "SNF days, home health visits, ED visits, readmissions — all count against your episode. Understand your referral patterns now or pay for them in 2027.",
  },
  {
    n: 4,
    title: "Collect patient-reported outcomes",
    body: "PROMIS, HOOS, KOOS at baseline and 90 days. Required under TEAM and almost certainly under CJR-X. Start collecting now or you'll have no data when CMS asks.",
  },
];

const AGENTS = [
  {
    name: "Wonder Bill",
    role: "Missed billable codes",
    cjrx: "Finds the revenue hiding inside your 90-day episode window.",
  },
  {
    name: "Episode Cost Tracker",
    role: "CJR-X target modeling",
    cjrx: "Models total episode cost against CMS target prices in real time.",
  },
  {
    name: "Prior Auth Agent",
    role: "60-second appeal letters",
    cjrx: "Eliminates auth delays that extend episodes and blow your target.",
  },
  {
    name: "PROM Collector",
    role: "Voice-first patient outcomes",
    cjrx: "Collects PROMIS / HOOS / KOOS at baseline and 90-day passively.",
  },
  {
    name: "Documentation Agent",
    role: "Audit-ready notes",
    cjrx: "Ensures every encounter supports the codes billed in the episode.",
  },
  {
    name: "RTM / CCM Enrollment",
    role: "Recurring revenue capture",
    cjrx: "Captures 98975–98981, 99490, 99491 within every active episode.",
  },
];

const TIMELINE = [
  { date: "April 2026", event: "Proposed rule published. 60-day public comment period opens.", now: true },
  { date: "April 2026", event: "Prior auth reform proposed alongside: 24-hr urgent / 72-hr standard decisions, FHIR-based electronic PA.", now: true },
  { date: "Late 2026", event: "FY2027 IPPS Final Rule. CJR-X finalized with edits from comment period.", now: false },
  { date: "Oct 1, 2027", event: "CJR-X mandatory for ~2,500 hospitals nationwide. Performance year begins.", now: false },
];

const THEME = {
  bg: "#0a0e14",
  bgCard: "#0f1724",
  teal: "#0D7377",
  tealLight: "#5eead4",
  navy: "#17323c",
  cream: "#f8f6f0",
  text: "#E8EDF2",
  muted: "#9BAEC0",
  border: "#1a3040",
  gold: "#c9a552",
  alert: "#e8b88a",
};

export default function CJRXPage() {
  return (
    <main
      style={{
        background: THEME.bg,
        color: THEME.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <section
        style={{
          padding: "120px 24px 80px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderBottom: `1px solid ${THEME.border}`,
          background: `radial-gradient(ellipse at 30% 0%, rgba(13,115,119,0.12) 0%, transparent 60%)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "6px 14px",
            background: "rgba(232,184,138,0.12)",
            border: `1px solid rgba(232,184,138,0.4)`,
            borderRadius: "999px",
            color: THEME.alert,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: THEME.alert,
              boxShadow: `0 0 12px ${THEME.alert}`,
            }}
          />
          CMS Proposed Rule · April 2026
        </div>
        <h1
          style={{
            fontFamily: '"Fraunces", Georgia, "Times New Roman", serif',
            fontSize: "clamp(48px, 7vw, 88px)",
            fontWeight: 400,
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            marginBottom: "32px",
            color: THEME.text,
            maxWidth: "920px",
          }}
        >
          CJR-X is coming.
          <br />
          <span style={{ color: THEME.teal, fontStyle: "italic" }}>
            Do you know your episode cost?
          </span>
        </h1>
        <p
          style={{
            fontSize: "20px",
            lineHeight: 1.55,
            color: THEME.muted,
            maxWidth: "720px",
            marginBottom: "48px",
          }}
        >
          CMS just proposed the first <strong style={{ color: THEME.text }}>nationwide
          mandatory</strong> episode-based payment model for hip, knee, and ankle
          replacements. 2,500+ hospitals. 90-day episodes. No opt-out. Performance year
          begins <strong style={{ color: THEME.text }}>October 2027</strong>.
          <br />
          <br />
          <strong style={{ color: THEME.text }}>SurgeonValue was built for this.</strong>
          {" "}Nine AI agents that scan your panel, model your episode cost, find the
          billable codes hiding inside your 90-day window, and collect the PROMs CMS
          will demand. Enter your NPI — see what we'd catch on your real panel.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <a
            href="/#connect"
            style={{
              padding: "16px 32px",
              background: THEME.teal,
              color: THEME.bg,
              fontWeight: 700,
              fontSize: "15px",
              borderRadius: "999px",
              textDecoration: "none",
              boxShadow: `0 4px 20px rgba(13,115,119,0.35)`,
            }}
          >
            See what you're leaving on the table →
          </a>
          <a
            href="#prep"
            style={{
              padding: "16px 32px",
              background: "transparent",
              border: `1px solid ${THEME.border}`,
              color: THEME.text,
              fontWeight: 600,
              fontSize: "15px",
              borderRadius: "999px",
              textDecoration: "none",
            }}
          >
            Preparation checklist ↓
          </a>
        </div>
      </section>

      {/* Stat cards */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {STATS.map((n, i) => (
            <div
              key={i}
              style={{
                padding: "40px 28px",
                background: `linear-gradient(155deg, ${THEME.teal} 0%, ${THEME.navy} 100%)`,
                borderRadius: "20px",
                color: THEME.cream,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontSize: "56px",
                  fontWeight: 400,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                  marginBottom: "16px",
                }}
              >
                {n.big}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "8px",
                }}
              >
                {n.label}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "rgba(248,246,240,0.7)",
                  lineHeight: 1.5,
                }}
              >
                {n.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What Changed */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "48px", maxWidth: "720px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: THEME.teal,
              marginBottom: "16px",
            }}
          >
            What changed
          </div>
          <h2
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: "24px",
              color: THEME.text,
            }}
          >
            Every post-op decision now has a dollar sign.
          </h2>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: THEME.muted, marginBottom: "16px" }}>
            Under CJR-X, CMS sets a <strong style={{ color: THEME.text }}>target price</strong> for
            every joint replacement episode. That target covers the procedure <em>plus
            everything for 90 days after discharge</em> — physical therapy, follow-up
            visits, imaging, DME, readmissions.
          </p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: THEME.muted, marginBottom: "16px" }}>
            Come in under the target? Your hospital shares in the savings. Come in over?
            Your hospital absorbs the difference.
          </p>
          <p style={{ fontSize: "17px", lineHeight: 1.7, color: THEME.muted }}>
            Which SNF. How many PT visits. When to see the patient back.{" "}
            <strong style={{ color: THEME.text }}>
              These are now financial decisions, not just clinical ones.
            </strong>
          </p>
        </div>

        {/* CJR-X vs TEAM */}
        <div
          style={{
            background: THEME.bgCard,
            border: `1px solid ${THEME.border}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.3fr 1.3fr",
              background: `linear-gradient(90deg, ${THEME.teal} 0%, ${THEME.navy} 100%)`,
              color: THEME.cream,
            }}
          >
            <div style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Side by side
            </div>
            <div style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderLeft: "1px solid rgba(248,246,240,0.15)" }}>
              CJR-X (proposed)
            </div>
            <div style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderLeft: "1px solid rgba(248,246,240,0.15)" }}>
              TEAM (active)
            </div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.3fr 1.3fr",
                borderTop: i > 0 ? `1px solid ${THEME.border}` : "none",
                fontSize: "14px",
                lineHeight: 1.5,
              }}
            >
              <div style={{ padding: "18px 20px", color: THEME.text, fontWeight: 600 }}>
                {row.metric}
              </div>
              <div style={{ padding: "18px 20px", color: row.cjrx_emphasis ? THEME.tealLight : THEME.muted, borderLeft: `1px solid ${THEME.border}`, fontWeight: row.cjrx_emphasis ? 700 : 400 }}>
                {row.cjrx}
              </div>
              <div style={{ padding: "18px 20px", color: THEME.muted, borderLeft: `1px solid ${THEME.border}` }}>
                {row.team}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Prep checklist */}
      <section
        id="prep"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "48px", maxWidth: "720px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: THEME.teal,
              marginBottom: "16px",
            }}
          >
            Preparation checklist
          </div>
          <h2
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
              color: THEME.text,
            }}
          >
            What to do now — not in 2027.
          </h2>
          <p style={{ fontSize: "16px", lineHeight: 1.65, color: THEME.muted }}>
            18 months from rule to performance year. The hospitals that wait are already
            late. The work below is what wins the first measurement period.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {PREP_CHECKLIST.map((p) => (
            <div
              key={p.n}
              style={{
                padding: "28px",
                background: THEME.bgCard,
                border: `1px solid ${THEME.border}`,
                borderRadius: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontSize: "32px",
                    fontWeight: 400,
                    color: THEME.teal,
                    lineHeight: 1,
                  }}
                >
                  {String(p.n).padStart(2, "0")}
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: THEME.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.title}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  color: THEME.muted,
                }}
              >
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for this — agents */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "48px", maxWidth: "720px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: THEME.teal,
              marginBottom: "16px",
            }}
          >
            Built for this
          </div>
          <h2
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: "20px",
              color: THEME.text,
            }}
          >
            SurgeonValue was designed for episode-based payment.
          </h2>
          <p style={{ fontSize: "16px", lineHeight: 1.65, color: THEME.muted }}>
            Six of the nine agents below were built specifically for the CJR-X / TEAM
            workflow. Each one with a deterministic trigger, a physician attestation
            checkpoint, and audit-defensible output.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {AGENTS.map((a, i) => (
            <div
              key={a.name}
              style={{
                padding: "26px",
                background: THEME.bgCard,
                border: `1px solid ${THEME.border}`,
                borderRadius: "14px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontSize: "20px",
                    fontWeight: 400,
                    color: THEME.teal,
                    lineHeight: 1,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: THEME.text,
                  }}
                >
                  {a.name}
                </h3>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: THEME.muted,
                  marginBottom: "10px",
                }}
              >
                {a.role}
              </div>
              <p
                style={{
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  color: THEME.tealLight,
                  fontWeight: 500,
                }}
              >
                {a.cjrx}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "900px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: THEME.teal,
              marginBottom: "16px",
            }}
          >
            Timeline
          </div>
          <h2
            style={{
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: "clamp(32px, 4.5vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: THEME.text,
            }}
          >
            CJR-X roadmap.
          </h2>
        </div>
        <div style={{ position: "relative", paddingLeft: "32px" }}>
          {/* vertical line */}
          <div
            style={{
              position: "absolute",
              left: "11px",
              top: "8px",
              bottom: "8px",
              width: "2px",
              background: `linear-gradient(180deg, ${THEME.teal} 0%, ${THEME.border} 100%)`,
            }}
          />
          {TIMELINE.map((t, i) => (
            <div key={i} style={{ marginBottom: "32px", position: "relative" }}>
              {/* dot */}
              <div
                style={{
                  position: "absolute",
                  left: "-32px",
                  top: "6px",
                  width: "14px",
                  height: "14px",
                  borderRadius: "50%",
                  background: t.now ? THEME.teal : THEME.border,
                  boxShadow: t.now ? `0 0 0 4px rgba(13,115,119,0.25), 0 0 16px ${THEME.teal}` : "none",
                  border: `2px solid ${THEME.bg}`,
                }}
              />
              <div style={{ display: "flex", gap: "12px", alignItems: "baseline", marginBottom: "6px" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: t.now ? THEME.tealLight : THEME.muted,
                  }}
                >
                  {t.date}
                </div>
                {t.now && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: THEME.bg,
                      background: THEME.tealLight,
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    Now
                  </span>
                )}
              </div>
              <div style={{ fontSize: "15px", lineHeight: 1.55, color: THEME.text }}>
                {t.event}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section
        style={{
          padding: "80px 24px 140px",
          maxWidth: "900px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: "clamp(40px, 6vw, 72px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            marginBottom: "24px",
            color: THEME.text,
          }}
        >
          18 months to performance year.
          <br />
          <span style={{ color: THEME.teal, fontStyle: "italic" }}>
            See what we'd catch.
          </span>
        </h2>
        <p
          style={{
            fontSize: "17px",
            color: THEME.muted,
            maxWidth: "560px",
            margin: "0 auto 40px",
            lineHeight: 1.65,
          }}
        >
          Enter your NPI. SurgeonValue scans your last 90 days of joint cases, models your
          episode cost against the proposed CJR-X target prices, and shows you exactly
          which billable codes are sitting unbilled inside your existing window.
        </p>
        <a
          href="/#connect"
          style={{
            display: "inline-block",
            padding: "20px 44px",
            background: THEME.teal,
            color: THEME.bg,
            fontWeight: 700,
            fontSize: "16px",
            borderRadius: "999px",
            textDecoration: "none",
            boxShadow: `0 8px 32px rgba(13,115,119,0.4)`,
          }}
        >
          Try SurgeonValue with your NPI →
        </a>
      </section>

      {/* Fraunces font */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400&display=swap"
      />
    </main>
  );
}
