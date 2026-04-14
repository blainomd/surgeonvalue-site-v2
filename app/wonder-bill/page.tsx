"use client";

import { useState } from "react";

type LineItem = {
  cited_sentence: string;
  cpt_code: string;
  code_description: string;
  rule_brief: string;
  medicare_allowable_dollars: number;
  annual_impact_estimate: number;
  compliance_risk: "low" | "medium" | "high";
  risk_reason: string;
  biller_note: string;
};

type Result = {
  note_summary: string;
  global_period_flag: "none" | "post-op-global-active" | "unclear";
  line_items: LineItem[];
  total_visit_dollars: number;
  total_annual_impact: number;
  biller_ready_summary: string;
};

const EXAMPLE_NOTE = `68 y/o F s/p R TKA POD 14. OV today for routine follow-up. Wound clean and dry, well-approximated. ROM 0-95 degrees, AROM 5-90. No signs of infection. Patient reports poor sleep due to incisional discomfort, discussed non-pharmacologic sleep hygiene for ~12 minutes. Reviewed PT progress and coordinated with PT for increased frequency; call placed to PT office, 8 minutes. Reviewed medication reconciliation, discussed DVT prophylaxis continuation. Total time spent on this encounter including coordination: 35 minutes.

MDM: moderate complexity. Ongoing longitudinal care of established patient with chronic condition (OA) s/p surgical intervention. Multiple problems addressed including wound, pain, sleep, and care coordination.

Plan: Continue Rx, PT 3x/week, f/u 4 weeks. Patient agrees. No new concerns.`;

const dollarFmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const riskColor: Record<LineItem["compliance_risk"], string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function WonderBillPage() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    const trimmed = note.trim();
    if (!trimmed) {
      setError("Paste a clinical note first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setFallbackText(null);
    setCopied(false);

    try {
      const res = await fetch("/api/wonder-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: trimmed }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Something went wrong.");
      } else if (data.result) {
        setResult(data.result);
      } else if (data.fallback_text) {
        setFallbackText(data.fallback_text);
      } else {
        setError("Empty response.");
      }
    } catch (e) {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyBillerSummary = async () => {
    if (!result?.biller_ready_summary) return;
    try {
      await navigator.clipboard.writeText(result.biller_ready_summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* ignore */
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#001a1b",
        color: "#E8EDF2",
        fontFamily: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "80px 24px 160px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#94d1d3",
              fontWeight: 800,
              marginBottom: 12,
            }}
          >
            SurgeonValue · Wonder Bill
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            Paste a clinical note. <br />
            <span style={{ color: "#94d1d3" }}>Find the money.</span>
          </h1>
          <p style={{ color: "rgba(232,237,242,0.65)", fontSize: 16, lineHeight: 1.6, maxWidth: 640 }}>
            Wonder Bill reads the note, cites the exact sentence that documents each piece of work, and tells
            you the code you could be billing — with the 2026 Medicare allowable and a one-line instruction
            for your biller. No signup. No install.
          </p>
        </div>

        {/* Input */}
        <div
          style={{
            background: "rgba(148,209,211,0.04)",
            border: "1px solid rgba(148,209,211,0.15)",
            borderRadius: 16,
            padding: 4,
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Paste a de-identified clinical note here..."
            rows={12}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "vertical",
              color: "#E8EDF2",
              fontSize: 14,
              fontFamily: "'SF Mono', ui-monospace, Menlo, monospace",
              padding: 20,
              lineHeight: 1.6,
              minHeight: 260,
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              borderTop: "1px solid rgba(148,209,211,0.12)",
            }}
          >
            <button
              onClick={() => setNote(EXAMPLE_NOTE)}
              style={{
                background: "transparent",
                border: "1px solid rgba(148,209,211,0.25)",
                color: "#94d1d3",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Use example note
            </button>
            <button
              onClick={submit}
              disabled={loading}
              style={{
                background: loading ? "rgba(148,209,211,0.3)" : "#94d1d3",
                border: "none",
                color: "#001a1b",
                padding: "14px 28px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 900,
                cursor: loading ? "wait" : "pointer",
                letterSpacing: "-0.2px",
              }}
            >
              {loading ? "Reading the note..." : "Find the money →"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 24,
              padding: "14px 18px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Loading stub */}
        {loading && (
          <div style={{ marginTop: 32, color: "rgba(232,237,242,0.5)", fontSize: 13 }}>
            Parsing documentation · matching 2026 CPT rules · computing allowables...
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: 40 }}>
            {result.note_summary && (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(232,237,242,0.55)",
                  marginBottom: 16,
                  fontStyle: "italic",
                }}
              >
                {result.note_summary}
              </p>
            )}

            {result.global_period_flag === "post-op-global-active" && (
              <div
                style={{
                  marginBottom: 24,
                  padding: "14px 18px",
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.35)",
                  borderRadius: 10,
                  color: "#fde68a",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: "#fbbf24" }}>Global period active.</strong> Routine post-op E/M is
                bundled into the 90-day global — the codes below are separately billable ONLY if the work
                is distinct from the global package.
              </div>
            )}

            {/* Totals */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  background: "rgba(148,209,211,0.06)",
                  border: "1px solid rgba(148,209,211,0.2)",
                  borderRadius: 14,
                  padding: "22px 24px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(148,209,211,0.7)",
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  This visit
                </p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#94d1d3", letterSpacing: "-1px" }}>
                  {dollarFmt(result.total_visit_dollars || 0)}
                </p>
              </div>
              <div
                style={{
                  background: "rgba(34,197,94,0.06)",
                  border: "1px solid rgba(34,197,94,0.25)",
                  borderRadius: 14,
                  padding: "22px 24px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(134,239,172,0.8)",
                    marginBottom: 6,
                    fontWeight: 700,
                  }}
                >
                  Annualized across panel
                </p>
                <p style={{ fontSize: 36, fontWeight: 900, color: "#86efac", letterSpacing: "-1px" }}>
                  {dollarFmt(result.total_annual_impact || 0)}
                </p>
              </div>
            </div>

            {/* Line items */}
            {result.line_items && result.line_items.length > 0 ? (
              <div style={{ display: "grid", gap: 14 }}>
                {result.line_items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      padding: "22px 24px",
                    }}
                  >
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: "#94d1d3",
                          color: "#001a1b",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 900,
                          fontFamily: "ui-monospace, monospace",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {item.cpt_code}
                      </span>
                      <span
                        style={{
                          background: "rgba(134,239,172,0.12)",
                          color: "#86efac",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {dollarFmt(item.medicare_allowable_dollars || 0)} per visit
                      </span>
                      {item.annual_impact_estimate > 0 && (
                        <span
                          style={{
                            background: "rgba(148,209,211,0.08)",
                            color: "#94d1d3",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ≈ {dollarFmt(item.annual_impact_estimate)} / year
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          color: riskColor[item.compliance_risk] || "#94d1d3",
                          border: `1px solid ${riskColor[item.compliance_risk] || "#94d1d3"}`,
                          padding: "4px 8px",
                          borderRadius: 6,
                        }}
                      >
                        {item.compliance_risk} risk
                      </span>
                    </div>

                    {item.code_description && (
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#E8EDF2",
                          marginBottom: 10,
                        }}
                      >
                        {item.code_description}
                      </p>
                    )}

                    {item.cited_sentence && (
                      <div
                        style={{
                          borderLeft: "3px solid #94d1d3",
                          padding: "8px 14px",
                          background: "rgba(148,209,211,0.04)",
                          marginBottom: 12,
                          fontSize: 13,
                          fontStyle: "italic",
                          color: "rgba(232,237,242,0.85)",
                          lineHeight: 1.6,
                        }}
                      >
                        &ldquo;{item.cited_sentence}&rdquo;
                      </div>
                    )}

                    {item.rule_brief && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "rgba(232,237,242,0.7)",
                          lineHeight: 1.6,
                          marginBottom: 10,
                        }}
                      >
                        <strong style={{ color: "#94d1d3" }}>Why: </strong>
                        {item.rule_brief}
                      </p>
                    )}

                    {item.risk_reason && item.compliance_risk !== "low" && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "rgba(232,237,242,0.55)",
                          lineHeight: 1.5,
                          marginBottom: 10,
                        }}
                      >
                        <strong style={{ color: riskColor[item.compliance_risk] }}>Watch: </strong>
                        {item.risk_reason}
                      </p>
                    )}

                    {item.biller_note && (
                      <div
                        style={{
                          marginTop: 10,
                          padding: "10px 14px",
                          background: "rgba(0,0,0,0.25)",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "#94d1d3",
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        Biller: {item.biller_note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "rgba(232,237,242,0.55)", fontSize: 14 }}>
                No separately billable opportunities found in this note. That usually means (a) the work is
                bundled into a global period, (b) the visit is standard E/M without add-on complexity, or
                (c) the documentation is too thin to support additional codes.
              </p>
            )}

            {/* Biller-ready summary */}
            {result.biller_ready_summary && (
              <div style={{ marginTop: 32 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "rgba(148,209,211,0.7)",
                      fontWeight: 800,
                    }}
                  >
                    Send to your biller
                  </p>
                  <button
                    onClick={copyBillerSummary}
                    style={{
                      background: copied ? "#16a34a" : "#003536",
                      color: copied ? "#fff" : "#94d1d3",
                      border: "1px solid rgba(148,209,211,0.25)",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <pre
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(148,209,211,0.15)",
                    borderRadius: 12,
                    padding: 20,
                    fontSize: 12,
                    color: "rgba(232,237,242,0.85)",
                    fontFamily: "ui-monospace, monospace",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.6,
                    overflowX: "auto",
                  }}
                >
                  {result.biller_ready_summary}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Fallback prose rendering */}
        {fallbackText && (
          <div
            style={{
              marginTop: 40,
              padding: 24,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              fontSize: 13,
              lineHeight: 1.7,
              color: "rgba(232,237,242,0.85)",
              whiteSpace: "pre-wrap",
            }}
          >
            {fallbackText}
          </div>
        )}
      </div>
    </main>
  );
}
