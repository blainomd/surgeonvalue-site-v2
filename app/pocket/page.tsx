"use client";

import { useEffect, useRef, useState } from "react";

// SurgeonValue Pocket — voice-to-code capture for surgeons between cases.
// Designed to be installed as a PWA on iOS/Android home screens.
//
// Flow:
//   1. Tap and hold the big mic button
//   2. Dictate 15-30 seconds describing the encounter
//   3. Release — Web Speech API transcribes, posts to /api/wonder-bill
//   4. See the codes, tap "Save to queue"
//   5. End of day: open queue, tap "Email my biller"
//
// No login. No backend storage. Everything persists in localStorage.

type LineItem = {
  cited_sentence?: string;
  cpt_code?: string;
  code_description?: string;
  rule_brief?: string;
  medicare_allowable_dollars?: number;
  annual_impact_estimate?: number;
  compliance_risk?: "low" | "medium" | "high";
  risk_reason?: string;
  biller_note?: string;
};

type WonderResult = {
  note_summary?: string;
  global_period_flag?: string;
  line_items?: LineItem[];
  total_visit_dollars?: number;
  biller_ready_summary?: string;
};

type QueuedEncounter = {
  id: string;
  timestamp: string;
  transcript: string;
  result: WonderResult;
  patient_label?: string;
};

// Minimal SpeechRecognition typing (not in all TS lib files)
interface SRCtor {
  new (): SpeechRecognitionLike;
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SREventError) => void) | null;
  onend: (() => void) | null;
}
interface SREvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}
interface SREventError {
  error: string;
}

const QUEUE_KEY = "sv_pocket_queue_v1";
const BILLER_EMAIL_KEY = "sv_pocket_biller_email_v1";

const dollarFmt = (n: number | undefined) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const riskColor: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function PocketPage() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [patientLabel, setPatientLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WonderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueuedEncounter[]>([]);
  const [view, setView] = useState<"record" | "queue">("record");
  const [billerEmail, setBillerEmail] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Load queue + email from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) setQueue(JSON.parse(raw));
      const email = localStorage.getItem(BILLER_EMAIL_KEY);
      if (email) setBillerEmail(email);
    } catch {
      /* ignore */
    }
    // Check Speech API support
    if (typeof window !== "undefined") {
      const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
      if (!w.SpeechRecognition && !w.webkitSpeechRecognition) {
        setSpeechSupported(false);
      }
    }
    // Honor ?view=queue deep link
    const params = new URLSearchParams(window.location.search);
    if (params.get("view") === "queue") setView("queue");
  }, []);

  const persistQueue = (next: QueuedEncounter[]) => {
    setQueue(next);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota */
    }
  };

  const saveBillerEmail = (value: string) => {
    setBillerEmail(value);
    try {
      localStorage.setItem(BILLER_EMAIL_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const startListening = () => {
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice not supported on this browser. Type the note below instead.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let finalText = "";
    rec.onresult = (e: SREvent) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const chunk = res[0].transcript;
        if ((res as unknown as { isFinal: boolean }).isFinal) {
          finalText += chunk;
        } else {
          interim += chunk;
        }
      }
      setTranscript((finalText + " " + interim).trim());
    };
    rec.onerror = (e: SREventError) => {
      setError(`Voice error: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => {
      setListening(false);
    };
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
    setError(null);
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    setListening(false);
  };

  const analyze = async () => {
    const text = transcript.trim();
    if (!text || text.length < 20) {
      setError("Dictate at least a sentence or two first.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/wonder-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: text }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Analysis failed.");
      } else if (data.result) {
        setResult(data.result);
      } else {
        setError("No result returned. Try a longer dictation.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveToQueue = () => {
    if (!result) return;
    const entry: QueuedEncounter = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      transcript,
      result,
      patient_label: patientLabel.trim() || undefined,
    };
    persistQueue([entry, ...queue]);
    setResult(null);
    setTranscript("");
    setPatientLabel("");
    setView("queue");
  };

  const removeFromQueue = (id: string) => {
    persistQueue(queue.filter((q) => q.id !== id));
  };

  const clearQueue = () => {
    if (!confirm("Clear all queued encounters? This cannot be undone.")) return;
    persistQueue([]);
  };

  const queueTotal = queue.reduce(
    (sum, q) => sum + (q.result?.total_visit_dollars ?? 0),
    0
  );

  const emailBiller = () => {
    if (queue.length === 0) {
      setError("Queue is empty.");
      return;
    }
    const when = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const lines: string[] = [];
    lines.push(`Hi —`);
    lines.push(``);
    lines.push(`Please review and submit the following ${queue.length} encounter(s) captured today (${when}).`);
    lines.push(``);
    queue.forEach((q, i) => {
      const label = q.patient_label || `Encounter ${i + 1}`;
      const time = new Date(q.timestamp).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      lines.push(`─────────────────────────`);
      lines.push(`${label} · ${time}`);
      lines.push(``);
      if (q.result?.note_summary) lines.push(`Summary: ${q.result.note_summary}`);
      if (q.result?.global_period_flag && q.result.global_period_flag !== "none") {
        lines.push(`Global period flag: ${q.result.global_period_flag}`);
      }
      lines.push(``);
      lines.push(`Transcript:`);
      lines.push(q.transcript);
      lines.push(``);
      lines.push(`Suggested codes:`);
      (q.result?.line_items || []).forEach((item) => {
        lines.push(
          `  • ${item.cpt_code || "?"} — ${dollarFmt(item.medicare_allowable_dollars)} — ${item.code_description || ""} [${item.compliance_risk || "?"} risk]`
        );
        if (item.biller_note) lines.push(`    Note: ${item.biller_note}`);
      });
      lines.push(``);
    });
    lines.push(`─────────────────────────`);
    lines.push(`Total visit-level allowables: ${dollarFmt(queueTotal)}`);
    lines.push(``);
    lines.push(`Generated by SurgeonValue Pocket — please verify documentation before submission.`);
    lines.push(``);
    lines.push(`Thanks,`);

    const subject = `Billing capture — ${queue.length} encounters — ${when}`;
    const body = lines.join("\n");
    const to = billerEmail.trim();
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    // window.location gives the best UX on iOS Safari standalone mode
    window.location.href = mailto;
  };

  // ─── UI ─────────────────────────────────────────────────────────────────────

  const bg = "#001a1b";
  const accent = "#94d1d3";
  const textMain = "#E8EDF2";
  const textMuted = "rgba(232,237,242,0.6)";

  return (
    <main
      style={{
        minHeight: "100svh",
        background: bg,
        color: textMain,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Manrope', Roboto, sans-serif",
        padding: "max(28px, env(safe-area-inset-top)) 20px max(28px, env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Top tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: accent,
                color: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 16,
                letterSpacing: "-0.5px",
              }}
            >
              SV
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Pocket</div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
            <button
              onClick={() => setView("record")}
              style={{
                background: view === "record" ? accent : "transparent",
                color: view === "record" ? bg : textMain,
                border: "none",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Record
            </button>
            <button
              onClick={() => setView("queue")}
              style={{
                background: view === "queue" ? accent : "transparent",
                color: view === "queue" ? bg : textMain,
                border: "none",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                position: "relative",
              }}
            >
              Queue
              {queue.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "#ef4444",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 900,
                    minWidth: 18,
                    height: 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                  }}
                >
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {view === "record" ? (
          <>
            {/* Mic button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  startListening();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopListening();
                }}
                onMouseDown={startListening}
                onMouseUp={stopListening}
                onMouseLeave={() => {
                  if (listening) stopListening();
                }}
                disabled={!speechSupported}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background: listening ? "#ef4444" : accent,
                  color: bg,
                  border: "none",
                  fontSize: 18,
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: listening
                    ? "0 0 0 12px rgba(239,68,68,0.2), 0 20px 50px rgba(239,68,68,0.3)"
                    : "0 20px 50px rgba(148,209,211,0.25)",
                  transition: "all 0.15s ease",
                  transform: listening ? "scale(1.05)" : "scale(1)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span style={{ fontSize: 13, letterSpacing: "-0.2px" }}>
                  {listening ? "Listening…" : "Hold to dictate"}
                </span>
              </button>
              <p style={{ color: textMuted, fontSize: 12, marginTop: 16, textAlign: "center", maxWidth: 300 }}>
                Describe the encounter — problems addressed, time spent, procedures performed. 15–30 seconds is plenty.
              </p>
            </div>

            {/* Transcript */}
            {(transcript || !speechSupported) && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: textMuted, marginBottom: 6, fontWeight: 800 }}>
                  Transcript
                </p>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={speechSupported ? "Your dictation will appear here — you can edit it before analyzing." : "Voice not supported here — type the note."}
                  rows={5}
                  style={{
                    width: "100%",
                    background: "rgba(148,209,211,0.04)",
                    border: "1px solid rgba(148,209,211,0.15)",
                    borderRadius: 12,
                    padding: 14,
                    color: textMain,
                    fontSize: 14,
                    fontFamily: "inherit",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Patient label */}
            {transcript && (
              <div style={{ marginBottom: 16 }}>
                <input
                  value={patientLabel}
                  onChange={(e) => setPatientLabel(e.target.value)}
                  placeholder="Patient label (optional) — e.g., Mrs. R. Case 3"
                  style={{
                    width: "100%",
                    background: "rgba(148,209,211,0.04)",
                    border: "1px solid rgba(148,209,211,0.15)",
                    borderRadius: 12,
                    padding: 12,
                    color: textMain,
                    fontSize: 14,
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Analyze */}
            {transcript && !result && (
              <button
                onClick={analyze}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: loading ? "rgba(148,209,211,0.3)" : accent,
                  color: bg,
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 900,
                  cursor: loading ? "wait" : "pointer",
                  marginBottom: 12,
                }}
              >
                {loading ? "Reading the note…" : "Find the codes →"}
              </button>
            )}

            {error && (
              <div
                style={{
                  padding: "12px 16px",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  color: "#fca5a5",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div style={{ marginTop: 8 }}>
                {result.note_summary && (
                  <p style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 12 }}>
                    {result.note_summary}
                  </p>
                )}
                {result.global_period_flag === "post-op-global-active" && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.35)",
                      borderRadius: 10,
                      color: "#fde68a",
                      fontSize: 12,
                      marginBottom: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    <strong>Global period active.</strong> Most post-op E/M is bundled into the 90-day global fee.
                  </div>
                )}
                <div
                  style={{
                    background: "rgba(148,209,211,0.06)",
                    border: "1px solid rgba(148,209,211,0.2)",
                    borderRadius: 12,
                    padding: "14px 18px",
                    marginBottom: 12,
                  }}
                >
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: accent, fontWeight: 800, marginBottom: 4 }}>
                    This visit
                  </p>
                  <p style={{ fontSize: 28, fontWeight: 900, color: accent, letterSpacing: "-0.5px" }}>
                    {dollarFmt(result.total_visit_dollars)}
                  </p>
                </div>

                {(result.line_items || []).map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
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
                      <span
                        style={{
                          background: "rgba(134,239,172,0.12)",
                          color: "#86efac",
                          padding: "3px 9px",
                          borderRadius: 5,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {dollarFmt(item.medicare_allowable_dollars)}
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
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{item.code_description}</p>
                    )}
                    {item.rule_brief && (
                      <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>{item.rule_brief}</p>
                    )}
                  </div>
                ))}

                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                  <button
                    onClick={() => {
                      setResult(null);
                      setTranscript("");
                      setPatientLabel("");
                    }}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 10,
                      color: textMain,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Discard
                  </button>
                  <button
                    onClick={saveToQueue}
                    style={{
                      flex: 2,
                      padding: "14px",
                      background: accent,
                      border: "none",
                      borderRadius: 10,
                      color: bg,
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Save to queue →
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Queue view
          <>
            <div
              style={{
                background: "rgba(148,209,211,0.06)",
                border: "1px solid rgba(148,209,211,0.2)",
                borderRadius: 14,
                padding: "18px 20px",
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: accent, fontWeight: 800, marginBottom: 6 }}>
                Today&apos;s queue
              </p>
              <p style={{ fontSize: 30, fontWeight: 900, color: accent, letterSpacing: "-0.5px" }}>
                {dollarFmt(queueTotal)}
              </p>
              <p style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
                {queue.length} encounter{queue.length !== 1 ? "s" : ""} ready to send
              </p>
            </div>

            {/* Biller email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: textMuted, fontWeight: 800, display: "block", marginBottom: 6 }}>
                Biller email
              </label>
              <input
                type="email"
                value={billerEmail}
                onChange={(e) => saveBillerEmail(e.target.value)}
                placeholder="biller@yourclinic.com"
                style={{
                  width: "100%",
                  background: "rgba(148,209,211,0.04)",
                  border: "1px solid rgba(148,209,211,0.15)",
                  borderRadius: 10,
                  padding: 12,
                  color: textMain,
                  fontSize: 14,
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={emailBiller}
              disabled={queue.length === 0}
              style={{
                width: "100%",
                padding: "16px 20px",
                background: queue.length === 0 ? "rgba(148,209,211,0.2)" : accent,
                color: queue.length === 0 ? textMuted : bg,
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 900,
                cursor: queue.length === 0 ? "not-allowed" : "pointer",
                marginBottom: 16,
              }}
            >
              Email my biller →
            </button>

            {queue.length === 0 ? (
              <p style={{ color: textMuted, fontSize: 13, textAlign: "center", marginTop: 40 }}>
                Queue is empty. Hit Record to capture your first encounter.
              </p>
            ) : (
              <>
                {queue.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 800 }}>{q.patient_label || "Encounter"}</p>
                        <p style={{ fontSize: 11, color: textMuted }}>
                          {new Date(q.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 900, color: accent }}>
                        {dollarFmt(q.result.total_visit_dollars)}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      {(q.result.line_items || []).map((it, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 10,
                            fontFamily: "ui-monospace, monospace",
                            background: "rgba(148,209,211,0.12)",
                            color: accent,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 800,
                          }}
                        >
                          {it.cpt_code}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => removeFromQueue(q.id)}
                      style={{
                        fontSize: 10,
                        color: textMuted,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={clearQueue}
                  style={{
                    width: "100%",
                    padding: 12,
                    background: "transparent",
                    border: "1px dashed rgba(239,68,68,0.4)",
                    borderRadius: 10,
                    color: "#fca5a5",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 10,
                  }}
                >
                  Clear queue
                </button>
              </>
            )}
          </>
        )}

        {/* Footer hint */}
        <p
          style={{
            fontSize: 10,
            color: "rgba(232,237,242,0.35)",
            textAlign: "center",
            marginTop: 40,
            lineHeight: 1.6,
          }}
        >
          Add to home screen: tap Share → Add to Home Screen.
          <br />
          Everything stays on your device. No signup.
        </p>
      </div>
    </main>
  );
}
