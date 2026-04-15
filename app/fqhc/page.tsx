import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SurgeonValue for FQHCs and Community Health Centers",
  description:
    "4,200 FQHCs serve 28M patients with revenue cycles as broken as any specialty group — and zero AI vendors building for them. SurgeonValue is the one comprehensive AI partner for community health: nine agents, NPI-only, $299/month flat, zero Epic or athenahealth integration required.",
  openGraph: {
    title: "SurgeonValue for FQHCs | One AI partner for community health",
    description:
      "Nine AI agents for FQHCs and community health centers. NPI-only — no Epic project, no athenahealth marketplace, no 12-month rollout. Enter your NPI, profile live in 10 seconds.",
    url: "https://surgeonvalue.com/fqhc",
    siteName: "SurgeonValue",
    type: "website",
  },
};

const FQHC_USE_CASES = [
  {
    code: "CCM 99490",
    label: "Chronic Care Management",
    body: "Wonder Bill catches the 18 minutes of non-face-to-face care coordination your MA already documented. $62/month per qualifying patient. 96% of FQHC patients have ≥2 chronic conditions and are CCM-eligible — and 96% of you don't bill it.",
  },
  {
    code: "PCM 99424",
    label: "Principal Care Management",
    body: "Single-condition focus for hypertension, diabetes, COPD, depression. $83/first 30 min, $58/each additional 30 min. Wonder Bill identifies eligible patients from your existing problem list — no new charting, no new workflows.",
  },
  {
    code: "RTM 98980",
    label: "Remote Therapeutic Monitoring",
    body: "16-day RTM bundle for inhaler use, glucose logs, BP cuffs. $50–$110/month per patient. Pocket PWA collects the data passively. Your panel of COPD + diabetes patients becomes a recurring revenue line.",
  },
  {
    code: "G2211",
    label: "Complexity Add-On",
    body: "$16 per visit on every E/M code where you provide longitudinal complex care — which is every primary care visit at an FQHC. 95% eligible. 5% billed nationally. Wonder Bill fixes that on the next claim cycle.",
  },
  {
    code: "TCM 99495/96",
    label: "Transitional Care Management",
    body: "Post-discharge follow-up within 7 or 14 days. $209–$281 per patient. The TCM agent watches your hospital discharge feed and queues the eligible visits. You bill what you were already doing.",
  },
  {
    code: "ACP 99497/98",
    label: "Advance Care Planning",
    body: "16-minute minimum conversation. $86 + $76. Telehealth permanent. Every FQHC patient ≥65 is eligible. CareGoals integration walks the patient through the conversation; you sign and bill.",
  },
];

const SANFORD_QUOTE = `A lot of really cool solutions will come out of those who are working with the FQHCs of the world or working with non-major academic medical centers, right? Those who aren't fully and inevitably committed to whoever their EHR is.`;

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

export default function FQHCPage() {
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
          For FQHCs &amp; Community Health Centers
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
          One AI partner for{" "}
          <span style={{ color: THEME.teal, fontStyle: "italic" }}>
            community health
          </span>
          .
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
          4,200 FQHCs serve <strong style={{ color: THEME.text }}>28 million Americans</strong>.
          Your revenue cycles are as broken as any specialty group&apos;s. Your CCM, PCM,
          RTM, G2211, TCM, and ACP codes are sitting in your charts unbilled. And the AI
          vendors won&apos;t build for you because you&apos;re too small individually and
          too varied collectively.
          <br />
          <br />
          <strong style={{ color: THEME.text }}>
            SurgeonValue is the one AI partner that actually fits.
          </strong>{" "}
          Nine agents. $299/month flat per practice. NPI-only — no Epic project, no
          athenahealth marketplace submission, no 12-month integration. Enter your NPI,
          profile live in 10 seconds.
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
            Enter your NPI — see what we&apos;d catch on your panel →
          </a>
          <a
            href="#use-cases"
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
            See the six revenue codes ↓
          </a>
        </div>
      </section>

      {/* The Sanford quote — earned validation */}
      <section
        style={{
          padding: "100px 24px",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: THEME.teal,
            marginBottom: "20px",
          }}
        >
          From the field
        </div>
        <blockquote
          style={{
            fontFamily: '"Fraunces", Georgia, serif',
            fontSize: "clamp(24px, 3.4vw, 38px)",
            lineHeight: 1.35,
            fontWeight: 400,
            color: THEME.text,
            letterSpacing: "-0.01em",
            margin: 0,
            padding: 0,
            fontStyle: "italic",
            borderLeft: `3px solid ${THEME.teal}`,
            paddingLeft: "32px",
          }}
        >
          &ldquo;{SANFORD_QUOTE}&rdquo;
        </blockquote>
        <div style={{ marginTop: "24px", paddingLeft: "35px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: THEME.text }}>
            Dr. Joseph Sanford
          </div>
          <div style={{ fontSize: "13px", color: THEME.muted }}>
            Chief Clinical Informatics Officer, University of Arkansas for Medical Sciences ·
            Quoted in Second Opinion newsletter, April 2026
          </div>
        </div>
      </section>

      {/* Stat cards — Qventus 2026 survey */}
      <section
        style={{
          padding: "60px 24px 100px",
          maxWidth: "1100px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "40px", maxWidth: "720px" }}>
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
            Why now
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
            The market validated the gap.
          </h2>
          <p
            style={{ fontSize: "16px", lineHeight: 1.65, color: THEME.muted }}
          >
            Qventus surveyed 60+ health system CIOs in 2026. The numbers explain why the
            FQHC opening exists — and why SurgeonValue is built specifically to walk
            through it.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              big: "70%",
              label: "of health systems want ONE AI partner",
              sub: "Only 11% currently have one. SurgeonValue is the one.",
            },
            {
              big: "75%",
              label: "blocked on AI by their EHR vendor",
              sub: "FQHCs aren't locked in. NPI-only setup bypasses the bottleneck entirely.",
            },
            {
              big: "39%",
              label: "have NO clear AI ROI measurement",
              sub: "Wonder Bill's outputs are dollar-specific. Codes, charts, dollar amounts.",
            },
            {
              big: "$240K",
              label: "missed annual revenue per provider",
              sub: "From unbilled CCM, RTM, G2211, BHI, TCM. Not aggressive coding — just complete coding.",
            },
          ].map((n, i) => (
            <div
              key={i}
              style={{
                padding: "36px 28px",
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

      {/* Six revenue codes for FQHCs */}
      <section
        id="use-cases"
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
            Six codes, six revenue lines
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
            What we&apos;d find on your panel.
          </h2>
          <p
            style={{ fontSize: "16px", lineHeight: 1.65, color: THEME.muted }}
          >
            FQHCs already do all six of these things clinically. The gap is billing.
            Wonder Bill scans your existing notes, finds the events that already happened,
            and queues the codes for your billing team.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {FQHC_USE_CASES.map((u) => (
            <div
              key={u.code}
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
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    fontFamily: '"Fraunces", Georgia, serif',
                    fontSize: "20px",
                    fontWeight: 600,
                    color: THEME.teal,
                    lineHeight: 1,
                  }}
                >
                  {u.code}
                </div>
                <h3
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: THEME.text,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {u.label}
                </h3>
              </div>
              <p
                style={{
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                  color: THEME.muted,
                }}
              >
                {u.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The deal */}
      <section
        style={{
          padding: "100px 24px",
          maxWidth: "900px",
          margin: "0 auto",
          borderTop: `1px solid ${THEME.border}`,
        }}
      >
        <div style={{ marginBottom: "32px" }}>
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
            The deal
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
            $299/month. No integration. Cancel anytime.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              label: "Pricing",
              detail: "$299/month flat per practice. Up to 4 providers included. $49/extra provider. $20/encounter on Wonder Bill outputs above 200/month. No setup fee. No annual contract.",
            },
            {
              label: "Setup",
              detail: "Enter your NPI. Wonder Bill scans your last 90 days of notes. Profile live in 10 seconds. No EHR integration. No IT department. No timeline.",
            },
            {
              label: "Pilot guarantee",
              detail: "If Wonder Bill doesn't identify $10,000 of missed billable revenue in your first 90 days, full refund. No questions. No exit interview.",
            },
            {
              label: "Compliance",
              detail: "ClinicalSwipe attestation layer is built in. Every Wonder Bill output is reviewed by a licensed physician before it touches your billing pipeline. OIG audit-defensible per Advisory Opinion 25-03.",
            },
          ].map((d, i) => (
            <div
              key={i}
              style={{
                padding: "24px",
                background: THEME.bgCard,
                border: `1px solid ${THEME.border}`,
                borderRadius: "14px",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: THEME.teal,
                  marginBottom: "12px",
                }}
              >
                {d.label}
              </div>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  color: THEME.muted,
                }}
              >
                {d.detail}
              </p>
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
          Enter your NPI.
          <br />
          <span style={{ color: THEME.teal, fontStyle: "italic" }}>
            See what we&apos;d catch.
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
          No demo call. No sales cycle. No 12-month Epic integration project. Just your
          10-digit NPI and a populated profile showing exactly what SurgeonValue would
          catch on your real FQHC panel — codes, charts, dollar amounts.
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
