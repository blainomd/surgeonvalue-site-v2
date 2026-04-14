import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Why SurgeonValue | Nine agents where cost estimators have one",
  description:
    "Health Here's Q Code gives you cost estimates. SurgeonValue gives you nine AI agents — cost estimation, billing detection, prior auth, referral rail, and six more — plus a physician attestation layer. Same price range. Strictly more product.",
  openGraph: {
    title: "Why SurgeonValue | Nine agents where cost estimators have one",
    description:
      "Nine AI agents. Physician attestation. Patient referral rail. Strictly more product than any cost-estimate tool.",
    url: "https://surgeonvalue.com/why",
    siteName: "SurgeonValue",
    type: "website",
  },
};

const NUMBERS = [
  { big: "70%", label: "of health systems want ONE AI partner", sub: "From Qventus' 2026 survey of 60+ CIOs. Only 11% currently have one. SurgeonValue is the one." },
  { big: "9", label: "AI agents in one login", sub: "Wonder Bill, Prior Auth, Pocket, Coding Audit, Revenue Recovery, Episode Cost, PROM, RTM/CCM, Panel Intelligence." },
  { big: "0 min", label: "EHR integration timeline", sub: "75% of health systems are blocked on AI by their EHR vendor. SurgeonValue runs NPI-only — bypass the bottleneck." },
  { big: "$240K", label: "Annual missed revenue per surgeon", sub: "Wonder Bill finds the codes your EHR template skipped. Measurable ROI in dollars, not adjectives." },
];

const AGENTS = [
  { n: 1, name: "Wonder Bill", desc: "6 hard trigger rules catch CCM 99490, G2211, 20611, BHI, TCM, RTM. The codes your EHR template misses." },
  { n: 2, name: "Prior Auth", desc: "Paste a note, get a letter in 60 seconds. Medical necessity drafted, payer-specific policies pre-loaded." },
  { n: 3, name: "Pocket PWA", desc: "Tap-to-refer from the exam room. Voice intake, drafted letter, billing codes captured for your own visit." },
  { n: 4, name: "Coding Audit", desc: "Panel-level scan. Every chart, every missed opportunity, every day." },
  { n: 5, name: "Revenue Recovery", desc: "Specific dollar amounts. Specific charts. Specific codes you qualify for but don't bill." },
  { n: 6, name: "Episode Cost Tracker", desc: "CJR-X ready. Per-episode target pricing, real-time variance, CQS readiness." },
  { n: 7, name: "PROM Collector", desc: "Voice-first. Passive. Longitudinal. Feeds outcomes reporting without clinic time." },
  { n: 8, name: "RTM / CCM Enrollment", desc: "Automated eligibility detection. Built-in compliance gates. Monthly recurring revenue capture." },
  { n: 9, name: "Panel Intelligence", desc: "Your entire panel, ranked by revenue opportunity, benchmarked against specialty averages." },
];

type Row = {
  metric: string;
  theirs: string;
  ours: string;
  ours_wins: boolean;
};

const COMPARISON: Row[] = [
  { metric: "Cost estimates (Q Code / Wonder Bill equivalent)", theirs: "Yes — single feature", ours: "Yes — one of nine agents", ours_wins: true },
  { metric: "Prior auth letter generation", theirs: "—", ours: "Paste note → 60-sec letter", ours_wins: true },
  { metric: "Patient-facing referral rail (PWA)", theirs: "—", ours: "Tap-to-refer, voice-first, iMessage handoff", ours_wins: true },
  { metric: "Missed-code detection (CCM, RTM, BHI, G2211)", theirs: "—", ours: "6 hard trigger rules, deterministic", ours_wins: true },
  { metric: "Prom collection (PROMIS, HOOS, KOOS, DASH)", theirs: "—", ours: "Voice-first, passive longitudinal", ours_wins: true },
  { metric: "Physician attestation layer", theirs: "—", ours: "ClinicalSwipe — OIG audit-defensible, WORM-anchored", ours_wins: true },
  { metric: "Pre-payment collection", theirs: "91% (published)", ours: "Same math — built on the same CMS fee schedules", ours_wins: false },
  { metric: "Setup time", theirs: "Integration project (weeks)", ours: "Enter your NPI. Profile live in 10 seconds.", ours_wins: true },
  { metric: "Works without practice management integration", theirs: "No — requires athenahealth", ours: "Yes — EHR-agnostic, panel-upload or NPI-only mode", ours_wins: true },
  { metric: "Monthly price for a 4-surgeon practice", theirs: "Custom (enterprise)", ours: "$299/month flat. $20/encounter overage.", ours_wins: true },
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
};

export default function WhyPage() {
  return (
    <main
      style={{
        background: THEME.bg,
        color: THEME.text,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <section
        style={{
          padding: "120px 24px 100px",
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
            background: "rgba(13,115,119,0.15)",
            border: `1px solid rgba(13,115,119,0.4)`,
            borderRadius: "999px",
            color: THEME.teal,
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
              background: THEME.teal,
              boxShadow: `0 0 12px ${THEME.teal}`,
            }}
          />
          Why SurgeonValue
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
          You said you wanted<br />
          <span style={{ color: THEME.teal, fontStyle: "italic" }}>one AI partner</span>.
          <br />
          Here it is.
        </h1>
        <p
          style={{
            fontSize: "20px",
            lineHeight: 1.55,
            color: THEME.muted,
            maxWidth: "680px",
            marginBottom: "48px",
          }}
        >
          Qventus surveyed 60+ health system CIOs in 2026. The answer was unambiguous:
          <strong style={{ color: THEME.text }}> 70% want one comprehensive AI partner.
          Only 11% have one.</strong> 75% are blocked on AI adoption by their EHR vendor's
          timeline. 39% can't measure AI ROI at all.
          <br /><br />
          SurgeonValue is the one AI partner. <strong style={{ color: THEME.text }}>Nine
          agents, one login, measurable ROI in dollars, zero EHR integration required.</strong>
          {" "}Enter your NPI, profile live in 10 seconds. No athenahealth project, no
          Epic app marketplace submission, no 12-month rollout. The EHR bottleneck that
          blocks 75% of health systems? We bypass it by design.
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
            Enter your NPI — profile live in 10 sec →
          </a>
          <a
            href="#comparison"
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
            Head-to-head table ↓
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
          {NUMBERS.map((n, i) => (
            <div
              key={i}
              style={{
                padding: "40px 28px",
                background: `linear-gradient(155deg, ${THEME.teal} 0%, ${THEME.navy} 100%)`,
                borderRadius: "20px",
                color: THEME.cream,
                textAlign: "left",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div
                style={{
                  fontFamily: '"Fraunces", Georgia, serif',
                  fontSize: "64px",
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
                  fontSize: "14px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  letterSpacing: "-0.01em",
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

      {/* The nine agents */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "48px", maxWidth: "700px" }}>
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
            The nine
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
            One agent per revenue leak.
          </h2>
          <p
            style={{ fontSize: "17px", lineHeight: 1.6, color: THEME.muted }}
          >
            Each agent fires on a deterministic trigger, not a soft suggestion.
            Wonder Bill's CCM rule catches "18 minutes non-face-to-face care
            coordination" every time — because the prompt requires it, not
            because the LLM decided.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {AGENTS.map((a) => (
            <div
              key={a.n}
              style={{
                padding: "24px",
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
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontSize: "28px",
                    fontWeight: 400,
                    color: THEME.teal,
                    lineHeight: 1,
                  }}
                >
                  {String(a.n).padStart(2, "0")}
                </div>
                <h3
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    color: THEME.text,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {a.name}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.55,
                  color: THEME.muted,
                }}
              >
                {a.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Head-to-head */}
      <section
        id="comparison"
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "48px", maxWidth: "700px" }}>
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
            Head to head
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
            SurgeonValue <span style={{ color: THEME.muted }}>vs</span> Q Code
          </h2>
          <p style={{ fontSize: "15px", color: THEME.muted, lineHeight: 1.6 }}>
            Health Here's Q Code is a good single-purpose cost-estimate tool.
            The table below is the honest read on what each platform does and
            where SurgeonValue is strictly a superset. If you already use Q Code
            and like it — that's fine. SurgeonValue replaces it with nine agents
            for the same ballpark monthly spend.
          </p>
        </div>
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
              gridTemplateColumns: "1.6fr 1fr 1.4fr",
              background: `linear-gradient(90deg, ${THEME.teal} 0%, ${THEME.navy} 100%)`,
              color: THEME.cream,
            }}
          >
            <div style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Capability
            </div>
            <div style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderLeft: "1px solid rgba(248,246,240,0.15)" }}>
              Health Here Q Code
            </div>
            <div style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", borderLeft: "1px solid rgba(248,246,240,0.15)" }}>
              SurgeonValue
            </div>
          </div>
          {COMPARISON.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1.4fr",
                borderTop: i > 0 ? `1px solid ${THEME.border}` : "none",
                fontSize: "13px",
                lineHeight: 1.55,
              }}
            >
              <div style={{ padding: "18px 20px", color: THEME.text, fontWeight: 600 }}>
                {row.metric}
              </div>
              <div style={{ padding: "18px 20px", color: row.theirs === "—" ? "rgba(155,174,192,0.4)" : THEME.muted, borderLeft: `1px solid ${THEME.border}` }}>
                {row.theirs}
              </div>
              <div style={{ padding: "18px 20px", color: row.ours_wins ? THEME.tealLight : THEME.muted, borderLeft: `1px solid ${THEME.border}`, fontWeight: row.ours_wins ? 600 : 400 }}>
                {row.ours}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Before / after */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "48px", maxWidth: "700px" }}>
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
            Before & after
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
            What changes on day one.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
          <div
            style={{
              padding: "32px",
              background: THEME.bgCard,
              border: `1px solid ${THEME.border}`,
              borderRadius: "14px",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "16px" }}>
              Before SurgeonValue
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px", lineHeight: 1.65, color: THEME.muted }}>
              <li style={{ marginBottom: "12px" }}>• 4 financial counselors running manual pre-procedure estimates</li>
              <li style={{ marginBottom: "12px" }}>• Wonder Bill codes missed silently (CCM 99490, G2211, BHI)</li>
              <li style={{ marginBottom: "12px" }}>• Prior auths drafted in Word, faxed, re-drafted on rejection</li>
              <li style={{ marginBottom: "12px" }}>• Referrals lost at the front desk — no rail back to your practice</li>
              <li style={{ marginBottom: "12px" }}>• PROMs collected on clipboards, scanned, re-keyed</li>
              <li>• ~$240K/year per surgeon in missed billable revenue</li>
            </ul>
          </div>
          <div
            style={{
              padding: "32px",
              background: `linear-gradient(155deg, ${THEME.teal} 0%, ${THEME.navy} 100%)`,
              borderRadius: "14px",
              color: THEME.cream,
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: THEME.tealLight, marginBottom: "16px" }}>
              After day one
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "14px", lineHeight: 1.65, color: "rgba(248,246,240,0.92)" }}>
              <li style={{ marginBottom: "12px" }}>• Nine agents running on every encounter, deterministic triggers</li>
              <li style={{ marginBottom: "12px" }}>• Wonder Bill catches CCM, G2211, BHI, RTM, TCM — every time</li>
              <li style={{ marginBottom: "12px" }}>• Prior auth letter in 60 seconds from a pasted note</li>
              <li style={{ marginBottom: "12px" }}>• Pocket PWA: tap-to-refer with voice + drafted letter + iMessage handoff</li>
              <li style={{ marginBottom: "12px" }}>• PROMs captured by voice, passive, longitudinal</li>
              <li>• First recovered $12,600 in month one on a 4-surgeon panel</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Founder quote */}
      <section
        style={{
          padding: "100px 24px",
          maxWidth: "900px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div
          style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: "clamp(24px, 3.2vw, 36px)",
            lineHeight: 1.35,
            fontWeight: 400,
            color: THEME.text,
            letterSpacing: "-0.01em",
            marginBottom: "32px",
            fontStyle: "italic",
          }}
        >
          "Q Code is a good product. It does one thing well. But a surgeon's
          practice has ten leaks, not one. SurgeonValue fixes all ten at once,
          at a price a four-surgeon group can afford on day one, without asking
          you to swap your practice management system."
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${THEME.teal}, ${THEME.navy})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: '"Fraunces", Georgia, serif',
              fontSize: "20px",
              color: THEME.cream,
            }}
          >
            BW
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: THEME.text }}>
              Blaine Warkentine, MD, MBA
            </div>
            <div style={{ fontSize: "13px", color: THEME.muted }}>
              Founder, SurgeonValue · 20+ years in orthopedic technology
            </div>
          </div>
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
          Enter your NPI.<br />
          <span style={{ color: THEME.teal, fontStyle: "italic" }}>See it in ten seconds.</span>
        </h2>
        <p
          style={{
            fontSize: "17px",
            color: THEME.muted,
            maxWidth: "560px",
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}
        >
          No demo call. No sales cycle. No Q Code-style athenahealth integration
          project. Just your 10-digit NPI and a populated profile showing
          exactly what SurgeonValue would catch on your real panel.
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
