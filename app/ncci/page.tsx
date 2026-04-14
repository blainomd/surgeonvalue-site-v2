"use client";

import { useState } from "react";

// SurgeonValue NCCI Validator — paste codes you're about to submit, find conflicts before
// the claim is denied. Deterministic. No LLM in the loop. Pure CMS rules.

type NCCIError = {
  type: "PTP_VIOLATION" | "MUE_VIOLATION" | "UNBUNDLING" | "MUTUALLY_EXCLUSIVE";
  col1Code: string;
  col2Code: string;
  message: string;
  modifierAllowed: boolean;
  suggestedModifier?: string;
  editSource: string;
};

type NCCIWarning = {
  type: string;
  codes: string[];
  message: string;
};

type ValidationResult = {
  valid: boolean;
  errors: NCCIError[];
  warnings: NCCIWarning[];
  suggestions: string[];
  codesChecked: string[];
  editVersion: string;
  codeDescriptions?: Record<string, string>;
};

const EXAMPLE_CODES = "27447, 27446";

export default function NCCIPage() {
  const [input, setInput] = useState("");
  const [modifiersInput, setModifiersInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseCodes = (raw: string): string[] => {
    return raw
      .split(/[,;\s]+/)
      .map((c) => c.trim())
      .filter((c) => /^\d{5}$/.test(c));
  };

  const parseModifiers = (raw: string): Record<string, string[]> => {
    // Format: "29881:59, 99214:25" — code:modifier pairs
    const result: Record<string, string[]> = {};
    raw.split(/[,;]/).forEach((pair) => {
      const [code, mod] = pair.split(":").map((s) => s.trim());
      if (code && mod && /^\d{5}$/.test(code)) {
        if (!result[code]) result[code] = [];
        result[code].push(mod);
      }
    });
    return result;
  };

  const submit = async () => {
    const codes = parseCodes(input);
    if (codes.length < 1) {
      setError("Enter at least one valid 5-digit CPT code (comma-separated).");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ncci/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codes,
          modifiers: parseModifiers(modifiersInput),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Validation failed.");
      } else {
        setResult(data as ValidationResult);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
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
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
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
            SurgeonValue · NCCI Validator
          </p>
          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 900,
              letterSpacing: "-1.5px",
              lineHeight: 1.05,
              marginBottom: 12,
            }}
          >
            Catch denials <br />
            <span style={{ color: "#94d1d3" }}>before they happen.</span>
          </h1>
          <p style={{ color: "rgba(232,237,242,0.65)", fontSize: 16, lineHeight: 1.6, maxWidth: 600 }}>
            Paste the CPT codes you're about to bill. We check them against the live CMS NCCI
            Procedure-to-Procedure and MUE edits. Pure deterministic rules — no AI guessing — so the
            results are defensible in an audit.
          </p>
        </div>

        {/* Codes input */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(148,209,211,0.7)",
              fontWeight: 800,
              marginBottom: 6,
              display: "block",
            }}
          >
            CPT codes
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="27447, 29881, 99214"
            style={{
              width: "100%",
              background: "rgba(148,209,211,0.04)",
              border: "1px solid rgba(148,209,211,0.15)",
              borderRadius: 12,
              padding: "16px 18px",
              color: "#E8EDF2",
              fontSize: 17,
              fontFamily: "ui-monospace, monospace",
              letterSpacing: "0.05em",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Modifiers input */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "rgba(148,209,211,0.7)",
              fontWeight: 800,
              marginBottom: 6,
              display: "block",
            }}
          >
            Modifiers (optional, format: code:modifier)
          </label>
          <input
            value={modifiersInput}
            onChange={(e) => setModifiersInput(e.target.value)}
            placeholder="29881:59, 99214:25"
            style={{
              width: "100%",
              background: "rgba(148,209,211,0.04)",
              border: "1px solid rgba(148,209,211,0.15)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "#E8EDF2",
              fontSize: 14,
              fontFamily: "ui-monospace, monospace",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setInput(EXAMPLE_CODES);
              setModifiersInput("");
            }}
            style={{
              padding: "12px 20px",
              background: "transparent",
              border: "1px solid rgba(148,209,211,0.25)",
              borderRadius: 10,
              color: "#94d1d3",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Use example
          </button>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px 24px",
              background: loading ? "rgba(148,209,211,0.3)" : "#94d1d3",
              border: "none",
              color: "#001a1b",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 900,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Validating…" : "Validate codes →"}
          </button>
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

        {result && (
          <div style={{ marginTop: 32 }}>
            {/* Valid / Invalid banner */}
            <div
              style={{
                background: result.valid
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(239,68,68,0.08)",
                border: `1px solid ${result.valid ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
                borderRadius: 14,
                padding: "20px 24px",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: result.valid ? "#22c55e" : "#ef4444",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 900,
                  }}
                >
                  {result.valid ? "✓" : "!"}
                </span>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: "-0.5px",
                    color: result.valid ? "#86efac" : "#fca5a5",
                  }}
                >
                  {result.valid ? "Clean — submit as-is" : `${result.errors.length} edit violation${result.errors.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <p style={{ fontSize: 12, color: "rgba(232,237,242,0.6)", marginLeft: 48 }}>
                Checked {result.codesChecked.join(", ")} against {result.editVersion}
              </p>
            </div>

            {/* Errors */}
            {result.errors && result.errors.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#fca5a5",
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Edit violations
                </p>
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 12,
                      padding: "16px 18px",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background: "#94d1d3",
                          color: "#001a1b",
                          padding: "3px 9px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 900,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {err.col1Code}
                      </span>
                      <span style={{ color: "#fca5a5", fontSize: 14, fontWeight: 800 }}>conflicts with</span>
                      <span
                        style={{
                          background: "#94d1d3",
                          color: "#001a1b",
                          padding: "3px 9px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 900,
                          fontFamily: "ui-monospace, monospace",
                        }}
                      >
                        {err.col2Code}
                      </span>
                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: 9,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 800,
                          color: "#fca5a5",
                          border: "1px solid rgba(239,68,68,0.4)",
                          padding: "3px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {err.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(232,237,242,0.85)", lineHeight: 1.6, marginBottom: 8 }}>
                      {err.message}
                    </p>
                    {err.modifierAllowed && err.suggestedModifier && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "10px 14px",
                          background: "rgba(34,197,94,0.06)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 8,
                        }}
                      >
                        <p style={{ fontSize: 11, color: "#86efac", fontWeight: 700, marginBottom: 4 }}>
                          Modifier rescue available
                        </p>
                        <p style={{ fontSize: 12, color: "rgba(232,237,242,0.8)" }}>
                          Append <strong style={{ color: "#86efac", fontFamily: "ui-monospace, monospace" }}>modifier {err.suggestedModifier}</strong> to {err.col2Code} if the service was clinically distinct from {err.col1Code}.
                        </p>
                      </div>
                    )}
                    {!err.modifierAllowed && (
                      <p style={{ fontSize: 11, color: "rgba(252,165,165,0.8)", fontStyle: "italic" }}>
                        No modifier override available for this edit.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#fbbf24",
                    fontWeight: 800,
                    marginBottom: 12,
                  }}
                >
                  Warnings
                </p>
                {result.warnings.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(245,158,11,0.06)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: 10,
                      padding: "12px 16px",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      {w.codes.map((c, j) => (
                        <span
                          key={j}
                          style={{
                            background: "rgba(148,209,211,0.12)",
                            color: "#94d1d3",
                            padding: "2px 7px",
                            borderRadius: 4,
                            fontSize: 10,
                            fontFamily: "ui-monospace, monospace",
                            fontWeight: 800,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(253,230,138,0.9)", lineHeight: 1.5 }}>
                      {w.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div style={{ marginBottom: 20 }}>
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
                  Suggestions
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {result.suggestions.map((s, i) => (
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
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Code descriptions */}
            {result.codeDescriptions && (
              <div
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "14px 18px",
                  marginTop: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "rgba(148,209,211,0.6)",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Code reference
                </p>
                {Object.entries(result.codeDescriptions).map(([code, desc]) => (
                  <p key={code} style={{ fontSize: 12, color: "rgba(232,237,242,0.7)", lineHeight: 1.5, marginBottom: 4 }}>
                    <span style={{ fontFamily: "ui-monospace, monospace", color: "#94d1d3", fontWeight: 700 }}>{code}</span>
                    {" — "}
                    {desc}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <p
          style={{
            fontSize: 11,
            color: "rgba(232,237,242,0.4)",
            marginTop: 40,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          Powered by CMS NCCI Q1 2025 PTP and MUE edits. Deterministic rules — no AI guessing.
          Updated quarterly.
        </p>
      </div>
    </main>
  );
}
