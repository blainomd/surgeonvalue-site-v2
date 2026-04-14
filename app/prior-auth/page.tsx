"use client";

import { useState } from "react";

type GuidelineCitation = {
  organization?: string;
  title?: string;
  year?: string;
  recommendation?: string;
  strength?: string;
};

type Rebuttal = {
  likely_denial?: string;
  rebuttal?: string;
};

type Result = {
  summary?: string;
  detected_cpt?: string;
  detected_icd10?: string;
  key_clinical_findings?: string[];
  failed_conservative_treatments?: string[];
  guideline_citations?: GuidelineCitation[];
  preemptive_rebuttals?: Rebuttal[];
  letter_body?: string;
};

type Context = {
  matched_cpt?: string | null;
  payer_profile_used?: string | null;
  documentation_warnings?: string[];
};

const EXAMPLE_NOTE = `54 y/o F, established patient with severe right knee OA. Symptoms onset 4 years ago, progressive. Pain 8/10, limiting ambulation to less than 1 block. Failed conservative management including: NSAIDs (meloxicam 15mg daily x 18 months — minimal relief, GI upset), physical therapy 2x/week x 12 weeks (Aug-Nov 2025, no functional improvement), three intra-articular corticosteroid injections (last Feb 2026 — provided 2 weeks of relief), bracing with off-loader unloader brace (4 months, poor tolerance), hyaluronic acid injection series (Synvisc-One, Apr 2025 — no benefit). Imaging: Standing AP/lateral knees Mar 2026 — Kellgren-Lawrence grade 4 medial compartment with bone-on-bone, varus malalignment 8 degrees, severe joint space narrowing, marginal osteophytes, subchondral sclerosis. BMI 28. No active infection, no uncontrolled diabetes (A1c 6.4), cardiac risk stratified — cleared by PCP. Patient understands risks/benefits/alternatives, wishes to proceed with right total knee arthroplasty. Plan: schedule R TKA, pre-op clearance complete, surgery requested.`;

export default function PriorAuthPage() {
  const [clinicalNote, setClinicalNote] = useState("");
  const [procedure, setProcedure] = useState("");
  const [payerName, setPayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [context, setContext] = useState<Context | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async () => {
    const trimmed = clinicalNote.trim();
    if (trimmed.length < 50) {
      setError("Paste a clinical note (minimum 50 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setContext(null);
    setCopied(false);

    try {
      const res = await fetch("/api/prior-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicalNote: trimmed,
          procedure: procedure.trim(),
          payerName: payerName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Generation failed.");
      } else if (data.result) {
        setResult(data.result);
        setContext(data.context || null);
      } else {
        setError("Empty response.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLetter = async () => {
    if (!result?.letter_body) return;
    try {
      await navigator.clipboard.writeText(result.letter_body);
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
            SurgeonValue · Prior Auth Agent
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
            <span style={{ color: "#94d1d3" }}>Get a peer-to-peer letter.</span>
          </h1>
          <p style={{ color: "rgba(232,237,242,0.65)", fontSize: 16, lineHeight: 1.6, maxWidth: 640 }}>
            Generate a medical-necessity letter ready to fax. Cites real published guidelines, addresses
            the most common payer denials for the procedure, and is grounded only in what the note
            actually documents. A physician reviews and signs.
          </p>
        </div>

        {/* Optional metadata */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <input
            value={procedure}
            onChange={(e) => setProcedure(e.target.value)}
            placeholder="Procedure (optional) — e.g., total knee arthroplasty"
            style={{
              background: "rgba(148,209,211,0.04)",
              border: "1px solid rgba(148,209,211,0.15)",
              borderRadius: 12,
              padding: "12px 14px",
              color: "#E8EDF2",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <input
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            placeholder="Payer (optional) — e.g., Aetna, UHC, BCBS"
            style={{
              background: "rgba(148,209,211,0.04)",
              border: "1px solid rgba(148,209,211,0.15)",
              borderRadius: 12,
              padding: "12px 14px",
              color: "#E8EDF2",
              fontSize: 13,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {/* Note input */}
        <div
          style={{
            background: "rgba(148,209,211,0.04)",
            border: "1px solid rgba(148,209,211,0.15)",
            borderRadius: 16,
            padding: 4,
          }}
        >
          <textarea
            value={clinicalNote}
            onChange={(e) => setClinicalNote(e.target.value)}
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
              boxSizing: "border-box",
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
              onClick={() => setClinicalNote(EXAMPLE_NOTE)}
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
              {loading ? "Drafting the letter..." : "Draft the letter →"}
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

        {loading && (
          <div style={{ marginTop: 32, color: "rgba(232,237,242,0.5)", fontSize: 13 }}>
            Parsing clinical note · matching payer denial patterns · citing published guidelines · drafting letter...
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: 40 }}>
            {result.summary && (
              <p
                style={{
                  fontSize: 13,
                  color: "rgba(232,237,242,0.6)",
                  marginBottom: 16,
                  fontStyle: "italic",
                }}
              >
                {result.summary}
              </p>
            )}

            {/* Codes detected */}
            {(result.detected_cpt || result.detected_icd10) && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                {result.detected_cpt && (
                  <span
                    style={{
                      background: "#94d1d3",
                      color: "#001a1b",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 900,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    CPT {result.detected_cpt}
                  </span>
                )}
                {result.detected_icd10 && (
                  <span
                    style={{
                      background: "rgba(148,209,211,0.12)",
                      color: "#94d1d3",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      fontFamily: "ui-monospace, monospace",
                    }}
                  >
                    ICD-10 {result.detected_icd10}
                  </span>
                )}
                {context?.payer_profile_used && (
                  <span
                    style={{
                      background: "rgba(134,239,172,0.12)",
                      color: "#86efac",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {context.payer_profile_used} denial profile loaded
                  </span>
                )}
              </div>
            )}

            {/* Two-column: clinical findings + failed conservative */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 24,
              }}
            >
              {result.key_clinical_findings && result.key_clinical_findings.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "16px 18px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#94d1d3",
                      fontWeight: 800,
                      marginBottom: 10,
                    }}
                  >
                    Key clinical findings
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {result.key_clinical_findings.map((f, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "rgba(232,237,242,0.85)",
                          lineHeight: 1.6,
                          paddingLeft: 14,
                          position: "relative",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ position: "absolute", left: 0, color: "#94d1d3" }}>·</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed_conservative_treatments && result.failed_conservative_treatments.length > 0 && (
                <div
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: "16px 18px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#94d1d3",
                      fontWeight: 800,
                      marginBottom: 10,
                    }}
                  >
                    Failed conservative care
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {result.failed_conservative_treatments.map((t, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: 13,
                          color: "rgba(232,237,242,0.85)",
                          lineHeight: 1.6,
                          paddingLeft: 14,
                          position: "relative",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ position: "absolute", left: 0, color: "#94d1d3" }}>·</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Guideline citations */}
            {result.guideline_citations && result.guideline_citations.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(148,209,211,0.7)",
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Guideline citations
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {result.guideline_citations.map((g, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(148,209,211,0.04)",
                        border: "1px solid rgba(148,209,211,0.15)",
                        borderRadius: 10,
                        padding: "12px 16px",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: "#94d1d3",
                            color: "#001a1b",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        >
                          {g.organization}
                        </span>
                        {g.year && (
                          <span style={{ fontSize: 11, color: "rgba(232,237,242,0.6)" }}>{g.year}</span>
                        )}
                        {g.strength && (
                          <span
                            style={{
                              fontSize: 9,
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                              color: "#86efac",
                              border: "1px solid rgba(134,239,172,0.4)",
                              padding: "2px 6px",
                              borderRadius: 4,
                              fontWeight: 700,
                            }}
                          >
                            {g.strength}
                          </span>
                        )}
                      </div>
                      {g.title && (
                        <p style={{ fontSize: 13, color: "#E8EDF2", fontWeight: 700, marginBottom: 4 }}>
                          {g.title}
                        </p>
                      )}
                      {g.recommendation && (
                        <p style={{ fontSize: 12, color: "rgba(232,237,242,0.7)", lineHeight: 1.6 }}>
                          {g.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preemptive rebuttals */}
            {result.preemptive_rebuttals && result.preemptive_rebuttals.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(148,209,211,0.7)",
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Preemptive rebuttals
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {result.preemptive_rebuttals.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "12px 16px",
                      }}
                    >
                      {r.likely_denial && (
                        <p style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, marginBottom: 6 }}>
                          ⚠ {r.likely_denial}
                        </p>
                      )}
                      {r.rebuttal && (
                        <p style={{ fontSize: 12, color: "rgba(232,237,242,0.85)", lineHeight: 1.6 }}>
                          {r.rebuttal}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation warnings */}
            {context?.documentation_warnings && context.documentation_warnings.length > 0 && (
              <div
                style={{
                  marginBottom: 24,
                  padding: "14px 18px",
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#fbbf24",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Documentation gaps to address
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {context.documentation_warnings.map((w, i) => (
                    <li
                      key={i}
                      style={{
                        fontSize: 12,
                        color: "#fde68a",
                        lineHeight: 1.6,
                        paddingLeft: 14,
                        position: "relative",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ position: "absolute", left: 0 }}>·</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Letter body */}
            {result.letter_body && (
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
                    Medical necessity letter
                  </p>
                  <button
                    onClick={copyLetter}
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
                    {copied ? "Copied" : "Copy letter"}
                  </button>
                </div>
                <pre
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(148,209,211,0.15)",
                    borderRadius: 12,
                    padding: 24,
                    fontSize: 12,
                    color: "rgba(232,237,242,0.9)",
                    fontFamily: "'SF Mono', ui-monospace, monospace",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.65,
                    overflowX: "auto",
                  }}
                >
                  {result.letter_body}
                </pre>
                <p style={{ marginTop: 12, fontSize: 11, color: "rgba(232,237,242,0.45)", lineHeight: 1.5 }}>
                  Replace bracketed placeholders with patient information before sending. A physician must
                  review and sign before submission. SurgeonValue is a drafting tool, not a substitute for
                  clinical judgment.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
