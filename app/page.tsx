"use client";

import { useState } from "react";

const TEAL = "#94d1d3";
const TEAL_DIM = "rgba(148,209,211,0.15)";
const TEAL_BG = "rgba(148,209,211,0.04)";
const TEAL_MID = "rgba(148,209,211,0.08)";
const GOLD = "#f4c940";
const BG = "#001a1b";
const TEXT = "#E8EDF2";
const MUTED = "rgba(232,237,242,0.65)";
const FONT = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const MONO = "'SF Mono', ui-monospace, Menlo, monospace";

export default function HomePage() {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: BG,
        color: TEXT,
        fontFamily: FONT,
      }}
    >
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(0,26,27,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${TEAL_DIM}`,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 60,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              letterSpacing: "-0.3px",
              color: TEXT,
            }}
          >
            Surgeon<span style={{ color: TEAL }}>Value</span>
          </span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <a
              href="/wonder-bill"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: MUTED,
                textDecoration: "none",
                padding: "6px 12px",
              }}
            >
              Wonder Bill
            </a>
            <a
              href="/prior-auth"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: MUTED,
                textDecoration: "none",
                padding: "6px 12px",
              }}
            >
              Prior Auth
            </a>
            <a
              href="/pocket"
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: MUTED,
                textDecoration: "none",
                padding: "6px 12px",
              }}
            >
              Pocket
            </a>
            <a
              href="/wonder-bill"
              style={{
                background: TEAL,
                color: BG,
                fontSize: 13,
                fontWeight: 900,
                textDecoration: "none",
                padding: "8px 16px",
                borderRadius: 8,
                letterSpacing: "-0.2px",
              }}
            >
              Try free →
            </a>
          </div>
        </div>
      </nav>

      {/* ── CJR-X Urgency Strip ─────────────────────────────── */}
      <div
        style={{
          background: GOLD,
          color: BG,
          padding: "10px 24px",
          textAlign: "center",
          fontFamily: MONO,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        <span>⚡ CMS PROPOSED: CJR-X mandatory joint replacement across 2,500 hospitals · 90-day episodes · </span>
        <a
          href="/cjr-x"
          style={{ color: BG, textDecoration: "underline", fontWeight: 900 }}
        >
          What this means for your revenue →
        </a>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "100px 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 700,
            height: 400,
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(148,209,211,0.1) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: TEAL,
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          SurgeonValue · AI Practice OS
        </p>

        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 72px)",
            fontWeight: 900,
            letterSpacing: "-2px",
            lineHeight: 1.02,
            marginBottom: 24,
            maxWidth: 820,
          }}
        >
          Your documentation is losing you{" "}
          <span style={{ color: GOLD }}>$147,000</span> a year.
          <br />
          <span style={{ color: TEAL }}>We found it in 47 seconds.</span>
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.65,
            color: MUTED,
            maxWidth: 620,
            marginBottom: 40,
          }}
        >
          SurgeonValue is an AI practice OS for orthopedic surgeons. Paste a
          clinical note. Wonder Bill identifies documented-but-unbilled revenue
          opportunities — instantly.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            href="/wonder-bill"
            style={{
              background: TEAL,
              color: BG,
              fontSize: 15,
              fontWeight: 900,
              textDecoration: "none",
              padding: "16px 32px",
              borderRadius: 12,
              letterSpacing: "-0.3px",
              boxShadow: "0 4px 24px rgba(148,209,211,0.25)",
            }}
          >
            Try Wonder Bill free →
          </a>
          <a
            href="/wonder-bill-demo"
            style={{
              background: "transparent",
              border: `1px solid ${TEAL_DIM}`,
              color: TEAL,
              fontSize: 15,
              fontWeight: 700,
              textDecoration: "none",
              padding: "16px 32px",
              borderRadius: 12,
              letterSpacing: "-0.2px",
            }}
          >
            See the demo
          </a>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            color: "rgba(232,237,242,0.35)",
            letterSpacing: "0.01em",
          }}
        >
          No signup. No install. Paste a note — results in under a minute.
        </p>
      </section>

      {/* ── Demo Proof ───────────────────────────────────────── */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            border: `1px solid ${TEAL_DIM}`,
            borderRadius: 20,
            overflow: "hidden",
            background: TEAL_BG,
          }}
        >
          {/* Step header bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              borderBottom: `1px solid ${TEAL_DIM}`,
            }}
          >
            {["Step 1", "Step 2", "Step 3"].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "14px 20px",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: TEAL,
                  borderRight: i < 2 ? `1px solid ${TEAL_DIM}` : "none",
                  background:
                    i === 0
                      ? "rgba(148,209,211,0.07)"
                      : i === 1
                      ? "rgba(148,209,211,0.04)"
                      : "rgba(148,209,211,0.02)",
                }}
              >
                {s}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
            }}
          >
            {/* Step 1 */}
            <div
              style={{
                padding: "28px 24px",
                borderRight: `1px solid ${TEAL_DIM}`,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: TEXT,
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                She pasted a post-op TKA note
              </p>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: `1px solid rgba(148,209,211,0.1)`,
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontFamily: MONO,
                  fontSize: 11,
                  color: "rgba(232,237,242,0.7)",
                  lineHeight: 1.7,
                }}
              >
                68 y/o F s/p R TKA POD 14.
                <br />
                Wound C/D/I. ROM 0-95°.
                <br />
                Discussed sleep hygiene ~12 min.
                <br />
                Coordinated PT: call placed, 8 min.
                <br />
                Total time: 35 min. MDM: moderate.
              </div>
              <p
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  color: "rgba(232,237,242,0.35)",
                  fontStyle: "italic",
                }}
              >
                De-identified example note
              </p>
            </div>

            {/* Step 2 */}
            <div
              style={{
                padding: "28px 24px",
                borderRight: `1px solid ${TEAL_DIM}`,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: TEXT,
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                Wonder Bill found 3 missed codes in 47 seconds
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Code 1 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: TEAL_MID,
                    border: `1px solid ${TEAL_DIM}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 900,
                        color: TEAL,
                      }}
                    >
                      99213
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: MUTED,
                        marginLeft: 8,
                      }}
                    >
                      Office visit — moderate
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 12, fontWeight: 800, color: "#86efac" }}
                  >
                    $84
                  </span>
                </div>

                {/* Code 2 — G0023 with NEW badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: TEAL_MID,
                    border: `1px solid rgba(244,201,64,0.3)`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 900,
                        color: TEAL,
                      }}
                    >
                      G0023
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: MUTED,
                      }}
                    >
                      Visit complexity add-on
                    </span>
                    {/* NEW badge with tooltip */}
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          background: GOLD,
                          color: "#001a1b",
                          fontSize: 9,
                          fontWeight: 900,
                          padding: "2px 6px",
                          borderRadius: 4,
                          letterSpacing: "0.08em",
                          cursor: "default",
                        }}
                        onMouseEnter={() => setTooltipVisible(true)}
                        onMouseLeave={() => setTooltipVisible(false)}
                      >
                        NEW
                      </span>
                      {tooltipVisible && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 8px)",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "#0f2b2d",
                            border: `1px solid ${TEAL_DIM}`,
                            borderRadius: 8,
                            padding: "10px 14px",
                            width: 220,
                            fontSize: 11,
                            lineHeight: 1.6,
                            color: TEXT,
                            zIndex: 10,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                            whiteSpace: "normal",
                          }}
                        >
                          <strong style={{ color: TEAL }}>G0023</strong> — Visit
                          complexity add-on. New 2026 code. Most billers miss it.
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    style={{ fontSize: 12, fontWeight: 800, color: "#86efac" }}
                  >
                    $16
                  </span>
                </div>

                {/* Code 3 */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: TEAL_MID,
                    border: `1px solid ${TEAL_DIM}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 12,
                        fontWeight: 900,
                        color: TEAL,
                      }}
                    >
                      97110
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: MUTED,
                        marginLeft: 8,
                      }}
                    >
                      Therapeutic exercises, 15 min
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 12, fontWeight: 800, color: "#86efac" }}
                  >
                    $212
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ padding: "28px 24px" }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: TEXT,
                  marginBottom: 14,
                  lineHeight: 1.4,
                }}
              >
                $312 documented. $147,000 annually at this rate.
              </p>

              <div
                style={{
                  background: "rgba(244,201,64,0.06)",
                  border: `1px solid rgba(244,201,64,0.25)`,
                  borderRadius: 12,
                  padding: "20px",
                  marginBottom: 14,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(244,201,64,0.7)",
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  This visit
                </p>
                <p
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: GOLD,
                    letterSpacing: "-1px",
                    lineHeight: 1,
                  }}
                >
                  $312
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(244,201,64,0.6)",
                    marginTop: 4,
                  }}
                >
                  3 codes, documented but unbilled
                </p>
              </div>

              <div
                style={{
                  background: "rgba(134,239,172,0.06)",
                  border: `1px solid rgba(134,239,172,0.2)`,
                  borderRadius: 12,
                  padding: "20px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(134,239,172,0.7)",
                    fontWeight: 800,
                    marginBottom: 6,
                  }}
                >
                  Annualized across panel
                </p>
                <p
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: "#86efac",
                    letterSpacing: "-1px",
                    lineHeight: 1,
                  }}
                >
                  $147,000
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(134,239,172,0.55)",
                    marginTop: 4,
                  }}
                >
                  Median annual underbilling, ortho surgeons
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a
            href="/wonder-bill-demo"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: TEAL,
              textDecoration: "none",
              opacity: 0.8,
            }}
          >
            Watch the full demo →
          </a>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              big: "40×",
              suffix: "/day",
              label: "Average surgeon documents 40 encounters per day",
              color: TEAL,
            },
            {
              big: "$147K",
              suffix: "",
              label: "Median annual underbilling for orthopedic surgeons",
              color: GOLD,
            },
            {
              big: "47",
              suffix: " sec",
              label: "Average Wonder Bill analysis time per note",
              color: TEAL,
            },
            {
              big: "9",
              suffix: "",
              label: "AI agents in the full SurgeonValue practice OS",
              color: GOLD,
            },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: TEAL_BG,
                border: `1px solid ${TEAL_DIM}`,
                borderRadius: 16,
                padding: "28px 24px",
              }}
            >
              <p
                style={{
                  fontSize: 48,
                  fontWeight: 900,
                  letterSpacing: "-2px",
                  lineHeight: 1,
                  color: stat.color,
                  marginBottom: 10,
                }}
              >
                {stat.big}
                <span style={{ fontSize: 24 }}>{stat.suffix}</span>
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: MUTED,
                  lineHeight: 1.5,
                  fontWeight: 600,
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Three Agent Highlights ────────────────────────────── */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: TEAL,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          The agents
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            marginBottom: 40,
            maxWidth: 640,
          }}
        >
          Three tools that pay for themselves before lunch.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {/* Wonder Bill */}
          <div
            style={{
              background: TEAL_BG,
              border: `1px solid ${TEAL_DIM}`,
              borderRadius: 18,
              padding: "28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                background:
                  "radial-gradient(circle at 100% 0%, rgba(148,209,211,0.08) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "inline-flex",
                background: TEAL_MID,
                border: `1px solid ${TEAL_DIM}`,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: TEAL,
                marginBottom: 16,
              }}
            >
              Wonder Bill
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
                marginBottom: 14,
                color: TEXT,
              }}
            >
              Paste any note.
              <br />
              Find the money.
            </h3>
            <p
              style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}
            >
              Paste any clinical note and Wonder Bill identifies
              documented-but-unbilled CPT codes with 2026 Medicare allowables
              and annual impact estimates. Cites the exact sentence in your note
              that justifies each code.
            </p>
            <a
              href="/wonder-bill"
              style={{
                display: "inline-block",
                marginTop: 20,
                fontSize: 13,
                fontWeight: 800,
                color: TEAL,
                textDecoration: "none",
              }}
            >
              Try free — no signup →
            </a>
          </div>

          {/* Prior Auth */}
          <div
            style={{
              background: TEAL_BG,
              border: `1px solid ${TEAL_DIM}`,
              borderRadius: 18,
              padding: "28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                background:
                  "radial-gradient(circle at 100% 0%, rgba(148,209,211,0.06) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "inline-flex",
                background: TEAL_MID,
                border: `1px solid ${TEAL_DIM}`,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: TEAL,
                marginBottom: 16,
              }}
            >
              Prior Auth Agent
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
                marginBottom: 14,
                color: TEXT,
              }}
            >
              60-second peer-to-peer
              <br />
              letter. Ready to fax.
            </h3>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>
              Paste any note and get a full medical necessity letter in 60
              seconds — with real published guideline citations and preemptive
              rebuttals for the most common payer denial reasons. Drafted and
              ready for physician review.
            </p>
            <a
              href="/prior-auth"
              style={{
                display: "inline-block",
                marginTop: 20,
                fontSize: 13,
                fontWeight: 800,
                color: TEAL,
                textDecoration: "none",
              }}
            >
              Try Prior Auth →
            </a>
          </div>

          {/* Pocket */}
          <div
            style={{
              background: TEAL_BG,
              border: `1px solid ${TEAL_DIM}`,
              borderRadius: 18,
              padding: "28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 120,
                height: 120,
                background:
                  "radial-gradient(circle at 100% 0%, rgba(148,209,211,0.06) 0%, transparent 60%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "inline-flex",
                background: TEAL_MID,
                border: `1px solid ${TEAL_DIM}`,
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: TEAL,
                marginBottom: 16,
              }}
            >
              Pocket
            </div>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
                marginBottom: 14,
                color: TEXT,
              }}
            >
              5-tab mobile app.
              <br />
              For between cases.
            </h3>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>
              Install as a PWA on your home screen. Code, PA, Ask, Lookup, and
              Queue tabs — all powered by the same AI, optimized for the
              scrub-sink moment. Captures encounters locally, emails your biller
              in one tap.
            </p>
            <a
              href="/pocket"
              style={{
                display: "inline-block",
                marginTop: 20,
                fontSize: 13,
                fontWeight: 800,
                color: TEAL,
                textDecoration: "none",
              }}
            >
              Install Pocket →
            </a>
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: TEAL,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          Pricing
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            marginBottom: 40,
          }}
        >
          Start free. Pay when you find the money.
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Free */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "32px 28px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(232,237,242,0.5)",
                fontWeight: 800,
                marginBottom: 16,
              }}
            >
              Free
            </p>
            <p
              style={{
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-2px",
                lineHeight: 1,
                color: TEXT,
                marginBottom: 4,
              }}
            >
              $0
            </p>
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              No login required
            </p>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 20,
                display: "flex",
                flexDirection: "column" as const,
                gap: 12,
              }}
            >
              {[
                "Wonder Bill — unlimited",
                "No account required",
                "Try right now",
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "rgba(232,237,242,0.75)",
                  }}
                >
                  <span style={{ color: TEAL, fontSize: 14, lineHeight: 1 }}>
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>
            <a
              href="/wonder-bill"
              style={{
                display: "block",
                marginTop: 28,
                padding: "13px 0",
                textAlign: "center",
                background: "transparent",
                border: `1px solid rgba(255,255,255,0.12)`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                color: TEXT,
                textDecoration: "none",
              }}
            >
              Try Wonder Bill free →
            </a>
          </div>

          {/* Core */}
          <div
            style={{
              background: TEAL_BG,
              border: `2px solid ${TEAL_DIM}`,
              borderRadius: 20,
              padding: "32px 28px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -1,
                left: 28,
                background: TEAL,
                color: BG,
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "4px 10px",
                borderRadius: "0 0 8px 8px",
              }}
            >
              Most popular
            </div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: TEAL,
                fontWeight: 800,
                marginBottom: 16,
                marginTop: 16,
              }}
            >
              Core
            </p>
            <p
              style={{
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-2px",
                lineHeight: 1,
                color: TEXT,
                marginBottom: 4,
              }}
            >
              $199
              <span style={{ fontSize: 18, fontWeight: 600, color: MUTED }}>
                /mo
              </span>
            </p>
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              All 9 agents, one surgeon
            </p>
            <div
              style={{
                borderTop: `1px solid ${TEAL_DIM}`,
                paddingTop: 20,
                display: "flex",
                flexDirection: "column" as const,
                gap: 12,
              }}
            >
              {[
                "Wonder Bill + Prior Auth + Pocket",
                "All 9 agents",
                "Biller-ready export",
                "Pocket PWA",
                "2026 Medicare allowables",
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "rgba(232,237,242,0.85)",
                  }}
                >
                  <span style={{ color: TEAL, fontSize: 14, lineHeight: 1 }}>
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>
            <a
              href="/onboarding"
              style={{
                display: "block",
                marginTop: 28,
                padding: "14px 0",
                textAlign: "center",
                background: TEAL,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 900,
                color: BG,
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(148,209,211,0.2)",
              }}
            >
              Start Core →
            </a>
          </div>

          {/* Pro */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "32px 28px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: GOLD,
                fontWeight: 800,
                marginBottom: 16,
              }}
            >
              Pro
            </p>
            <p
              style={{
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-2px",
                lineHeight: 1,
                color: TEXT,
                marginBottom: 4,
              }}
            >
              $299
              <span style={{ fontSize: 18, fontWeight: 600, color: MUTED }}>
                /mo
              </span>
            </p>
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                marginBottom: 28,
                lineHeight: 1.5,
              }}
            >
              + $20 per tracked encounter
            </p>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.06)",
                paddingTop: 20,
                display: "flex",
                flexDirection: "column" as const,
                gap: 12,
              }}
            >
              {[
                "Everything in Core",
                "Encounter tracking",
                "Panel intelligence scan",
                "EMR connection",
                "Revenue recovery report",
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13,
                    color: "rgba(232,237,242,0.75)",
                  }}
                >
                  <span style={{ color: GOLD, fontSize: 14, lineHeight: 1 }}>
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>
            <a
              href="/onboarding"
              style={{
                display: "block",
                marginTop: 28,
                padding: "13px 0",
                textAlign: "center",
                background: "transparent",
                border: `1px solid rgba(244,201,64,0.3)`,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                color: GOLD,
                textDecoration: "none",
              }}
            >
              Start Pro →
            </a>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section
        style={{
          padding: "0 24px 80px",
          maxWidth: 1100,
          margin: "0 auto",
          borderTop: `1px solid ${TEAL_DIM}`,
          paddingTop: 80,
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: TEAL,
            fontWeight: 800,
            marginBottom: 12,
          }}
        >
          How it works
        </p>
        <h2
          style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            marginBottom: 48,
          }}
        >
          No EHR integration. No demo call.
          <br />
          <span style={{ color: TEAL }}>Paste a note. Results in 47 seconds.</span>
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 0,
            border: `1px solid ${TEAL_DIM}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {[
            {
              n: "01",
              title: "Paste your note",
              body: "Copy any de-identified clinical note from your EHR. No login, no install, no integration project.",
            },
            {
              n: "02",
              title: "AI reads the documentation",
              body: "Wonder Bill parses the note, matches 2026 CPT rules, and cites the exact sentence that supports each code.",
            },
            {
              n: "03",
              title: "Codes appear in 47 seconds",
              body: "Every documented-but-unbilled code with the Medicare allowable, compliance risk rating, and biller instruction.",
            },
            {
              n: "04",
              title: "Send to your biller",
              body: "One-click copy of the biller-ready summary. Or email it directly from Pocket between cases.",
            },
          ].map((step, i, arr) => (
            <div
              key={i}
              style={{
                padding: "28px 24px",
                borderRight: i < arr.length - 1 ? `1px solid ${TEAL_DIM}` : "none",
                background: i % 2 === 0 ? TEAL_BG : "rgba(148,209,211,0.02)",
              }}
            >
              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 28,
                  fontWeight: 900,
                  color: TEAL,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                  marginBottom: 16,
                  opacity: 0.5,
                }}
              >
                {step.n}
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: TEXT,
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {step.title}
              </p>
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────── */}
      <section
        style={{
          padding: "80px 24px 160px",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          style={{
            background: TEAL_BG,
            border: `1px solid ${TEAL_DIM}`,
            borderRadius: 24,
            padding: "64px 40px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ambient glow */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 500,
              height: 300,
              background:
                "radial-gradient(ellipse, rgba(148,209,211,0.08) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: TEAL,
              fontWeight: 800,
              marginBottom: 20,
            }}
          >
            Start now
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.05,
              marginBottom: 20,
            }}
          >
            Start finding missed revenue now.
            <br />
            <span style={{ color: TEAL }}>No signup required.</span>
          </h2>
          <p
            style={{
              fontSize: 17,
              color: MUTED,
              lineHeight: 1.65,
              maxWidth: 520,
              margin: "0 auto 36px",
            }}
          >
            Paste a clinical note into Wonder Bill. Results in 47 seconds.
            See exactly what your documentation is already supporting — that
            your biller hasn't captured.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <a
              href="/wonder-bill"
              style={{
                background: TEAL,
                color: BG,
                fontSize: 16,
                fontWeight: 900,
                textDecoration: "none",
                padding: "18px 40px",
                borderRadius: 12,
                letterSpacing: "-0.3px",
                boxShadow: "0 4px 28px rgba(148,209,211,0.3)",
              }}
            >
              Try Wonder Bill free →
            </a>
            <a
              href="/onboarding"
              style={{
                background: "transparent",
                border: `1px solid ${TEAL_DIM}`,
                color: TEAL,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: "none",
                padding: "18px 40px",
                borderRadius: 12,
                letterSpacing: "-0.2px",
              }}
            >
              Get full access
            </a>
          </div>
          <p
            style={{
              marginTop: 20,
              fontSize: 12,
              color: "rgba(232,237,242,0.3)",
            }}
          >
            Free forever for Wonder Bill. Core $199/mo. Pro $299/mo + $20/enc.
          </p>
        </div>
      </section>
    </main>
  );
}
