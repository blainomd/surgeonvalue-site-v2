"use client";

import { useEffect, useRef, useState } from "react";

// ─── SurgeonValue Pocket ────────────────────────────────────────────────────
// 5-tab agentic mobile app for surgeons between cases.
//
//   Code   — voice/paste a clinical note → Wonder Bill returns documented-but-
//            unbilled CPT codes with 2026 Medicare allowables. Save to queue.
//   PA     — voice/paste a clinical note → SurgeonValue Prior Auth Agent drafts
//            a peer-to-peer ready medical-necessity letter. Copy to send.
//   Ask    — voice/type a billing question → SurgeonValue billing expert
//            answers in 5 seconds. No login.
//   Lookup — type any NPI or name → live NPPES profile (specialty, location).
//   Queue  — review captured encounters, email biller in one tap.
//
// All powered by the same Claude-backed surgeonvalue channel on solvinghealth.com.
// Designed to be installed as a PWA on iOS/Android home screens. No login,
// everything persists locally in the browser. ────────────────────────────────

// ─── Types ──────────────────────────────────────────────────────────────────

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

type GuidelineCitation = {
  organization?: string;
  title?: string;
  year?: string;
  recommendation?: string;
  strength?: string;
};
type Rebuttal = { likely_denial?: string; rebuttal?: string };
type PAResult = {
  summary?: string;
  detected_cpt?: string;
  detected_icd10?: string;
  key_clinical_findings?: string[];
  failed_conservative_treatments?: string[];
  guideline_citations?: GuidelineCitation[];
  preemptive_rebuttals?: Rebuttal[];
  letter_body?: string;
};

type NppesAddress = {
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  telephone_number?: string;
};
type NppesResult = {
  number?: string;
  basic?: {
    first_name?: string;
    last_name?: string;
    credential?: string;
    sole_proprietor?: string;
    enumeration_date?: string;
    last_updated?: string;
  };
  taxonomies?: Array<{ desc?: string; primary?: boolean; state?: string }>;
  addresses?: NppesAddress[];
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

type Mode = "code" | "pa" | "ask" | "lookup" | "share" | "queue";

type PostDraft = {
  topic?: string;
  x_draft?: { text?: string; char_count?: number; hashtags?: string[] };
  linkedin_draft?: { text?: string; hook?: string };
  phi_check?: string;
};

// ─── Storage keys ───────────────────────────────────────────────────────────

const QUEUE_KEY = "sv_pocket_queue_v1";
const BILLER_EMAIL_KEY = "sv_pocket_biller_email_v1";

// ─── Utilities ──────────────────────────────────────────────────────────────

const dollarFmt = (n: number | undefined) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const riskColor: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

// ─── Page ───────────────────────────────────────────────────────────────────

export default function PocketPage() {
  // Mode & shared state
  const [mode, setMode] = useState<Mode>("code");
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Code (Wonder Bill) state
  const [codeTranscript, setCodeTranscript] = useState("");
  const [patientLabel, setPatientLabel] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeResult, setCodeResult] = useState<WonderResult | null>(null);

  // PA state
  const [paNote, setPaNote] = useState("");
  const [paProcedure, setPaProcedure] = useState("");
  const [paPayer, setPaPayer] = useState("");
  const [paLoading, setPaLoading] = useState(false);
  const [paResult, setPaResult] = useState<PAResult | null>(null);
  const [paCopied, setPaCopied] = useState(false);

  // Ask state
  const [askQuestion, setAskQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askAnswer, setAskAnswer] = useState<string | null>(null);

  // Lookup state
  const [lookupNpi, setLookupNpi] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<NppesResult | null>(null);

  // Share (post drafter) state
  const [shareObservation, setShareObservation] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<PostDraft | null>(null);
  const [shareCopied, setShareCopied] = useState<"x" | "li" | null>(null);

  // Queue state
  const [queue, setQueue] = useState<QueuedEncounter[]>([]);
  const [billerEmail, setBillerEmail] = useState("");

  // Speech listening target — which textarea the current voice session writes to
  const [voiceTarget, setVoiceTarget] = useState<"code" | "pa" | "ask" | "share" | null>(null);

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) setQueue(JSON.parse(raw));
      const email = localStorage.getItem(BILLER_EMAIL_KEY);
      if (email) setBillerEmail(email);
    } catch {
      /* ignore */
    }
    if (typeof window !== "undefined") {
      const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
      if (!w.SpeechRecognition && !w.webkitSpeechRecognition) {
        setSpeechSupported(false);
      }
      const params = new URLSearchParams(window.location.search);
      const v = params.get("view");
      if (v === "queue") setMode("queue");
      else if (v === "pa") setMode("pa");
      else if (v === "ask") setMode("ask");
      else if (v === "lookup") setMode("lookup");
      else if (v === "share") setMode("share");
    }
  }, []);

  const persistQueue = (next: QueuedEncounter[]) => {
    setQueue(next);
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
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

  // ── Voice ───────────────────────────────────────────────────────────────
  const startListening = (target: "code" | "pa" | "ask" | "share") => {
    const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice not supported on this browser. Type below instead.");
      return;
    }
    setVoiceTarget(target);
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
      const combined = (finalText + " " + interim).trim();
      if (target === "code") setCodeTranscript(combined);
      else if (target === "pa") setPaNote(combined);
      else if (target === "ask") setAskQuestion(combined);
      else if (target === "share") setShareObservation(combined);
    };
    rec.onerror = (e: SREventError) => {
      setError(`Voice error: ${e.error}`);
      setListening(false);
      setVoiceTarget(null);
    };
    rec.onend = () => {
      setListening(false);
      setVoiceTarget(null);
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
    setVoiceTarget(null);
  };

  // ── Code (Wonder Bill) submit — fans out to social drafts in parallel ──
  // One dictation, two outputs: billing codes AND polished posts. Surgeon
  // gets both from the same 30-second voice clip without re-recording.
  const submitCode = async () => {
    const text = codeTranscript.trim();
    if (text.length < 20) {
      setError("Dictate at least a sentence or two first.");
      return;
    }
    setCodeLoading(true);
    setShareLoading(true);
    setError(null);
    setCodeResult(null);
    setShareResult(null);
    setShareCopied(null);

    // Fire both in parallel — codes return first usually, drafts a moment after
    const codePromise = fetch("/api/wonder-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: text }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          setError((prev) => prev || data.error || "Code analysis failed.");
        } else if (data.result) {
          setCodeResult(data.result);
        } else {
          setError((prev) => prev || "No codes returned. Try a longer dictation.");
        }
      })
      .catch(() => {
        setError((prev) => prev || "Network error on codes.");
      })
      .finally(() => setCodeLoading(false));

    // Build a thought-leadership observation from the same clinical note.
    // The post drafter strips PHI, so passing the clinical note directly is fine.
    const sharePromise = fetch("/api/post-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        observation: `From an encounter today: ${text}`,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.result) {
          setShareResult(data.result);
        }
        // If draft fails silently, we still show the codes — drafts are bonus, not blocking
      })
      .catch(() => {
        /* silent — codes are the priority */
      })
      .finally(() => setShareLoading(false));

    await Promise.allSettled([codePromise, sharePromise]);
  };

  const saveCodeToQueue = () => {
    if (!codeResult) return;
    const entry: QueuedEncounter = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      transcript: codeTranscript,
      result: codeResult,
      patient_label: patientLabel.trim() || undefined,
    };
    persistQueue([entry, ...queue]);
    setCodeResult(null);
    setCodeTranscript("");
    setPatientLabel("");
    setMode("queue");
  };

  // ── PA submit ───────────────────────────────────────────────────────────
  const submitPA = async () => {
    const text = paNote.trim();
    if (text.length < 50) {
      setError("PA letters need at least a paragraph of clinical context.");
      return;
    }
    setPaLoading(true);
    setError(null);
    setPaResult(null);
    setPaCopied(false);
    try {
      const res = await fetch("/api/prior-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicalNote: text,
          procedure: paProcedure.trim(),
          payerName: paPayer.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setError(data.error || "PA letter generation failed.");
      else if (data.result) setPaResult(data.result);
      else setError("No PA letter returned.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPaLoading(false);
    }
  };

  const copyPaLetter = async () => {
    if (!paResult?.letter_body) return;
    try {
      await navigator.clipboard.writeText(paResult.letter_body);
      setPaCopied(true);
      setTimeout(() => setPaCopied(false), 2400);
    } catch {
      /* ignore */
    }
  };

  // ── Ask submit ──────────────────────────────────────────────────────────
  const submitAsk = async () => {
    const text = askQuestion.trim();
    if (text.length < 5) {
      setError("Ask a real question.");
      return;
    }
    setAskLoading(true);
    setError(null);
    setAskAnswer(null);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setError(data.error || "Ask failed.");
      else if (data.answer) setAskAnswer(data.answer);
      else setError("No answer returned.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setAskLoading(false);
    }
  };

  // ── Share (post draft) submit ──────────────────────────────────────────
  const submitShare = async () => {
    const text = shareObservation.trim();
    if (text.length < 15) {
      setError("Dictate or type a real observation to draft from.");
      return;
    }
    setShareLoading(true);
    setError(null);
    setShareResult(null);
    setShareCopied(null);
    try {
      const res = await fetch("/api/post-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observation: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setError(data.error || "Drafter failed.");
      else if (data.result) setShareResult(data.result);
      else setError("No drafts returned.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setShareLoading(false);
    }
  };

  const copyDraft = async (which: "x" | "li") => {
    const text = which === "x" ? shareResult?.x_draft?.text : shareResult?.linkedin_draft?.text;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setShareCopied(which);
      setTimeout(() => setShareCopied(null), 2400);
    } catch {
      /* ignore */
    }
  };

  // ── Lookup submit ───────────────────────────────────────────────────────
  const submitLookup = async () => {
    const npi = lookupNpi.trim();
    if (!/^\d{10}$/.test(npi)) {
      setError("Enter a valid 10-digit NPI.");
      return;
    }
    setLookupLoading(true);
    setError(null);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/npi?npi=${encodeURIComponent(npi)}`);
      const data = await res.json();
      if (!res.ok || data.error) setError(data.error || data.message || "Lookup failed.");
      else if (data.npi || data.provider) {
        // /api/npi?npi= returns a flat shape; map it to NppesResult-like for the UI
        setLookupResult({
          number: data.npi,
          basic: {
            first_name: data.provider?.firstName,
            last_name: data.provider?.lastName,
            credential: data.provider?.credential,
          },
          taxonomies: [{ desc: data.specialty?.description, primary: true, state: data.specialty?.state }],
          addresses: [
            {
              address_1: data.address?.line1,
              address_2: data.address?.line2,
              city: data.address?.city,
              state: data.address?.state,
              postal_code: data.address?.zip,
              telephone_number: data.phone,
            },
          ],
        });
      } else setError("No NPPES profile found for that NPI.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  // ── Queue actions ───────────────────────────────────────────────────────
  const removeFromQueue = (id: string) => {
    persistQueue(queue.filter((q) => q.id !== id));
  };
  const clearQueue = () => {
    if (!confirm("Clear all queued encounters? This cannot be undone.")) return;
    persistQueue([]);
  };
  const queueTotal = queue.reduce((sum, q) => sum + (q.result?.total_visit_dollars ?? 0), 0);

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
      const time = new Date(q.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
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
    const mailto = `mailto:${encodeURIComponent(billerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  // ─── Theme ──────────────────────────────────────────────────────────────
  const bg = "#001a1b";
  const accent = "#94d1d3";
  const textMain = "#E8EDF2";
  const textMuted = "rgba(232,237,242,0.6)";

  // ─── Inline reusable: voice button ──────────────────────────────────────
  const VoiceButton = ({ target, size = 160 }: { target: "code" | "pa" | "ask" | "share"; size?: number }) => {
    const isActive = listening && voiceTarget === target;
    return (
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          startListening(target);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopListening();
        }}
        onMouseDown={() => startListening(target)}
        onMouseUp={stopListening}
        onMouseLeave={() => isActive && stopListening()}
        disabled={!speechSupported}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: isActive ? "#ef4444" : accent,
          color: bg,
          border: "none",
          fontSize: 14,
          fontWeight: 900,
          cursor: speechSupported ? "pointer" : "not-allowed",
          boxShadow: isActive
            ? "0 0 0 10px rgba(239,68,68,0.2), 0 16px 40px rgba(239,68,68,0.3)"
            : "0 16px 40px rgba(148,209,211,0.25)",
          transition: "all 0.15s ease",
          transform: isActive ? "scale(1.04)" : "scale(1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          WebkitTapHighlightColor: "transparent",
          opacity: speechSupported ? 1 : 0.4,
        }}
      >
        <svg width={size * 0.22} height={size * 0.22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        <span style={{ fontSize: 11, letterSpacing: "-0.2px" }}>
          {isActive ? "Listening…" : "Hold to speak"}
        </span>
      </button>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <main
      style={{
        minHeight: "100svh",
        background: bg,
        color: textMain,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Manrope', Roboto, sans-serif",
        padding: "max(28px, env(safe-area-inset-top)) 18px max(120px, env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 460, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
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
                fontSize: 15,
                letterSpacing: "-0.5px",
              }}
            >
              SV
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Pocket</div>
          </div>
          {queue.length > 0 && (
            <button
              onClick={() => setMode("queue")}
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fca5a5",
                fontSize: 11,
                fontWeight: 800,
                padding: "6px 12px",
                borderRadius: 100,
                cursor: "pointer",
              }}
            >
              {queue.length} in queue · {dollarFmt(queueTotal)}
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 10,
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* ─── CODE (Wonder Bill) ───────────────────────────────────────── */}
        {mode === "code" && (
          <>
            <ModeHeader
              title="Dictate to agentic health"
              sub="Speak between cases or paste from your EMR. One input fans out to billing codes, polished posts, and more — all PHI-stripped."
              accent={accent}
              muted={textMuted}
            />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <VoiceButton target="code" />
            </div>
            <textarea
              value={codeTranscript}
              onChange={(e) => setCodeTranscript(e.target.value)}
              placeholder="Or paste from your EMR. Until EMR integration ships, copy-paste is the bridge."
              rows={5}
              style={fieldStyle()}
            />
            {codeTranscript && (
              <input
                value={patientLabel}
                onChange={(e) => setPatientLabel(e.target.value)}
                placeholder="Patient label (optional)"
                style={{ ...fieldStyle(), marginTop: 10, fontSize: 13 }}
              />
            )}
            {codeTranscript && !codeResult && !codeLoading && (
              <button onClick={submitCode} disabled={codeLoading} style={primaryBtn(codeLoading, accent, bg)}>
                Generate everything →
              </button>
            )}
            {codeLoading && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 18px",
                  background: "rgba(148,209,211,0.06)",
                  border: "1px solid rgba(148,209,211,0.2)",
                  borderRadius: 12,
                  color: textMuted,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Reading the note · finding codes · drafting your post…
              </div>
            )}

            {codeResult && (
              <div style={{ marginTop: 16 }}>
                {codeResult.note_summary && (
                  <p style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 12 }}>
                    {codeResult.note_summary}
                  </p>
                )}
                {codeResult.global_period_flag === "post-op-global-active" && (
                  <GlobalPeriodWarning />
                )}

                <p style={sectionLabel(accent)}>Billing codes</p>
                <TotalCard label="This visit" value={dollarFmt(codeResult.total_visit_dollars)} accent={accent} />
                {(codeResult.line_items || []).map((item, i) => (
                  <CodeCard key={i} item={item} accent={accent} muted={textMuted} />
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 24 }}>
                  <button
                    onClick={() => {
                      setCodeResult(null);
                      setShareResult(null);
                      setCodeTranscript("");
                      setPatientLabel("");
                    }}
                    style={ghostBtn(textMain)}
                  >
                    Discard
                  </button>
                  <button onClick={saveCodeToQueue} style={{ ...primaryBtn(false, accent, bg), flex: 2, marginTop: 0 }}>
                    Save codes to queue →
                  </button>
                </div>

                {/* ── Fan-out: social drafts from the SAME dictation ── */}
                {(shareLoading || shareResult) && (
                  <>
                    <p style={{ ...sectionLabel(accent), marginTop: 8 }}>Posts from the same dictation</p>
                    {shareLoading && !shareResult && (
                      <div
                        style={{
                          padding: "14px 18px",
                          background: "rgba(148,209,211,0.04)",
                          border: "1px solid rgba(148,209,211,0.15)",
                          borderRadius: 12,
                          color: textMuted,
                          fontSize: 12,
                          textAlign: "center",
                          marginBottom: 12,
                        }}
                      >
                        Drafting your X and LinkedIn posts…
                      </div>
                    )}
                    {shareResult?.x_draft?.text && (
                      <div
                        style={{
                          background: "rgba(148,209,211,0.06)",
                          border: "1px solid rgba(148,209,211,0.2)",
                          borderRadius: 12,
                          padding: "16px 18px",
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <p style={sectionLabel(accent)}>For X / Twitter</p>
                          <button
                            onClick={() => copyDraft("x")}
                            style={{
                              background: shareCopied === "x" ? "#16a34a" : "#003536",
                              color: shareCopied === "x" ? "#fff" : accent,
                              border: "1px solid rgba(148,209,211,0.25)",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {shareCopied === "x" ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p style={{ fontSize: 13, color: textMain, lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 6 }}>
                          {shareResult.x_draft.text}
                        </p>
                        {shareResult.x_draft.char_count !== undefined && (
                          <p style={{ fontSize: 10, color: textMuted }}>
                            {shareResult.x_draft.char_count} / 280 characters
                          </p>
                        )}
                      </div>
                    )}
                    {shareResult?.linkedin_draft?.text && (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 12,
                          padding: "16px 18px",
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <p style={sectionLabel(accent)}>For LinkedIn</p>
                          <button
                            onClick={() => copyDraft("li")}
                            style={{
                              background: shareCopied === "li" ? "#16a34a" : "#003536",
                              color: shareCopied === "li" ? "#fff" : accent,
                              border: "1px solid rgba(148,209,211,0.25)",
                              padding: "6px 12px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            {shareCopied === "li" ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p style={{ fontSize: 13, color: textMain, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                          {shareResult.linkedin_draft.text}
                        </p>
                      </div>
                    )}
                    {shareResult?.phi_check && (
                      <div
                        style={{
                          padding: "10px 14px",
                          background: "rgba(34,197,94,0.06)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 8,
                          marginBottom: 12,
                        }}
                      >
                        <p style={{ fontSize: 10, color: "#86efac", fontWeight: 800, marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          PHI check
                        </p>
                        <p style={{ fontSize: 11, color: "rgba(232,237,242,0.7)", lineHeight: 1.5 }}>
                          {shareResult.phi_check}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── PA (Prior Auth letter) ───────────────────────────────────── */}
        {mode === "pa" && (
          <>
            <ModeHeader title="Draft a PA letter" sub="Dictate the case. Get a peer-to-peer ready medical-necessity letter with cited guidelines." accent={accent} muted={textMuted} />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <VoiceButton target="pa" />
            </div>
            <textarea
              value={paNote}
              onChange={(e) => setPaNote(e.target.value)}
              placeholder="Or type/paste the clinical note here..."
              rows={6}
              style={fieldStyle()}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <input
                value={paProcedure}
                onChange={(e) => setPaProcedure(e.target.value)}
                placeholder="Procedure"
                style={{ ...fieldStyle(), fontSize: 12 }}
              />
              <input
                value={paPayer}
                onChange={(e) => setPaPayer(e.target.value)}
                placeholder="Payer"
                style={{ ...fieldStyle(), fontSize: 12 }}
              />
            </div>
            {paNote && !paResult && (
              <button onClick={submitPA} disabled={paLoading} style={primaryBtn(paLoading, accent, bg)}>
                {paLoading ? "Drafting the letter…" : "Draft the letter →"}
              </button>
            )}

            {paResult && (
              <div style={{ marginTop: 16 }}>
                {paResult.summary && (
                  <p style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 12 }}>
                    {paResult.summary}
                  </p>
                )}
                {(paResult.detected_cpt || paResult.detected_icd10) && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {paResult.detected_cpt && (
                      <span style={pill(accent, bg)}>CPT {paResult.detected_cpt}</span>
                    )}
                    {paResult.detected_icd10 && (
                      <span style={pillSubtle(accent)}>ICD-10 {paResult.detected_icd10}</span>
                    )}
                  </div>
                )}
                {paResult.guideline_citations && paResult.guideline_citations.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={sectionLabel(accent)}>Guidelines cited</p>
                    {paResult.guideline_citations.map((g, i) => (
                      <div key={i} style={subtleCard()}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2, flexWrap: "wrap" }}>
                          {g.organization && <span style={miniPill(accent, bg)}>{g.organization}</span>}
                          {g.year && <span style={{ fontSize: 10, color: textMuted }}>{g.year}</span>}
                        </div>
                        {g.title && (
                          <p style={{ fontSize: 12, fontWeight: 700, color: textMain, marginTop: 4 }}>{g.title}</p>
                        )}
                        {g.recommendation && (
                          <p style={{ fontSize: 11, color: textMuted, lineHeight: 1.5, marginTop: 2 }}>{g.recommendation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {paResult.preemptive_rebuttals && paResult.preemptive_rebuttals.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={sectionLabel(accent)}>Likely denials & rebuttals</p>
                    {paResult.preemptive_rebuttals.map((r, i) => (
                      <div key={i} style={subtleCard()}>
                        {r.likely_denial && (
                          <p style={{ fontSize: 11, color: "#fca5a5", fontWeight: 700 }}>⚠ {r.likely_denial}</p>
                        )}
                        {r.rebuttal && (
                          <p style={{ fontSize: 11, color: textMuted, lineHeight: 1.5, marginTop: 4 }}>{r.rebuttal}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {paResult.letter_body && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={sectionLabel(accent)}>Medical necessity letter</p>
                      <button
                        onClick={copyPaLetter}
                        style={{
                          background: paCopied ? "#16a34a" : "#003536",
                          color: paCopied ? "#fff" : accent,
                          border: "1px solid rgba(148,209,211,0.25)",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {paCopied ? "Copied" : "Copy letter"}
                      </button>
                    </div>
                    <pre
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(148,209,211,0.15)",
                        borderRadius: 10,
                        padding: 14,
                        fontSize: 11,
                        color: "rgba(232,237,242,0.9)",
                        fontFamily: "ui-monospace, monospace",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                        overflowX: "auto",
                        margin: 0,
                      }}
                    >
                      {paResult.letter_body}
                    </pre>
                  </div>
                )}
                <button
                  onClick={() => {
                    setPaResult(null);
                    setPaNote("");
                    setPaProcedure("");
                    setPaPayer("");
                  }}
                  style={{ ...ghostBtn(textMain), marginTop: 12, width: "100%" }}
                >
                  Start over
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── ASK (billing question) ───────────────────────────────────── */}
        {mode === "ask" && (
          <>
            <ModeHeader title="Ask anything" sub="Quick coding or compliance question. 5-second answer from the SurgeonValue billing expert." accent={accent} muted={textMuted} />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <VoiceButton target="ask" size={140} />
            </div>
            <textarea
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="e.g., Can I bill G2211 with 99215 in a post-op global period?"
              rows={3}
              style={fieldStyle()}
            />
            {askQuestion && !askAnswer && (
              <button onClick={submitAsk} disabled={askLoading} style={primaryBtn(askLoading, accent, bg)}>
                {askLoading ? "Asking the expert…" : "Ask →"}
              </button>
            )}
            {askAnswer && (
              <div
                style={{
                  marginTop: 16,
                  padding: "16px 18px",
                  background: "rgba(148,209,211,0.06)",
                  border: "1px solid rgba(148,209,211,0.2)",
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: "rgba(232,237,242,0.92)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {askAnswer}
              </div>
            )}
            {askAnswer && (
              <button
                onClick={() => {
                  setAskAnswer(null);
                  setAskQuestion("");
                }}
                style={{ ...ghostBtn(textMain), marginTop: 12, width: "100%" }}
              >
                Ask another
              </button>
            )}
          </>
        )}

        {/* ─── LOOKUP (NPI) ─────────────────────────────────────────────── */}
        {mode === "lookup" && (
          <>
            <ModeHeader title="NPI lookup" sub="Verify a referral source or another physician. Pulls live from CMS NPPES." accent={accent} muted={textMuted} />
            <input
              value={lookupNpi}
              onChange={(e) => setLookupNpi(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit NPI"
              inputMode="numeric"
              maxLength={10}
              style={{
                ...fieldStyle(),
                fontSize: 18,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.05em",
                textAlign: "center",
              }}
            />
            {lookupNpi.length === 10 && !lookupResult && (
              <button onClick={submitLookup} disabled={lookupLoading} style={primaryBtn(lookupLoading, accent, bg)}>
                {lookupLoading ? "Looking up…" : "Look up →"}
              </button>
            )}
            {lookupResult && (
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    background: "rgba(148,209,211,0.06)",
                    border: "1px solid rgba(148,209,211,0.2)",
                    borderRadius: 12,
                    padding: "18px 20px",
                    marginBottom: 12,
                  }}
                >
                  <p style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>NPI {lookupResult.number}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 4 }}>
                    {lookupResult.basic?.first_name} {lookupResult.basic?.last_name}
                    {lookupResult.basic?.credential && (
                      <span style={{ color: accent, fontSize: 14, marginLeft: 8 }}>
                        {lookupResult.basic.credential}
                      </span>
                    )}
                  </p>
                  {lookupResult.taxonomies && lookupResult.taxonomies[0]?.desc && (
                    <p style={{ fontSize: 13, color: textMain }}>{lookupResult.taxonomies[0].desc}</p>
                  )}
                </div>
                {lookupResult.addresses && lookupResult.addresses[0] && (
                  <div style={subtleCard()}>
                    <p style={sectionLabel(accent)}>Practice address</p>
                    <p style={{ fontSize: 13, color: textMain, lineHeight: 1.5 }}>
                      {lookupResult.addresses[0].address_1}
                      {lookupResult.addresses[0].address_2 && <>, {lookupResult.addresses[0].address_2}</>}
                      <br />
                      {lookupResult.addresses[0].city}, {lookupResult.addresses[0].state} {lookupResult.addresses[0].postal_code}
                    </p>
                    {lookupResult.addresses[0].telephone_number && (
                      <a
                        href={`tel:${lookupResult.addresses[0].telephone_number}`}
                        style={{ color: accent, fontSize: 13, fontWeight: 700, marginTop: 8, display: "inline-block", textDecoration: "none" }}
                      >
                        {lookupResult.addresses[0].telephone_number} →
                      </a>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    setLookupResult(null);
                    setLookupNpi("");
                  }}
                  style={{ ...ghostBtn(textMain), marginTop: 12, width: "100%" }}
                >
                  Look up another
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── SHARE (post drafter) ─────────────────────────────────────── */}
        {mode === "share" && (
          <>
            <ModeHeader title="Draft a post" sub="Dictate something from your day. Get a polished X post and a LinkedIn post — PHI-stripped, in your voice." accent={accent} muted={textMuted} />
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <VoiceButton target="share" size={140} />
            </div>
            <textarea
              value={shareObservation}
              onChange={(e) => setShareObservation(e.target.value)}
              placeholder="e.g., Just used Wonder Bill on a knee injection visit, found three codes I'd never billed including G2211. The note was 7 sentences long."
              rows={4}
              style={fieldStyle()}
            />
            {shareObservation && !shareResult && (
              <button onClick={submitShare} disabled={shareLoading} style={primaryBtn(shareLoading, accent, bg)}>
                {shareLoading ? "Drafting…" : "Draft my posts →"}
              </button>
            )}
            {shareResult && (
              <div style={{ marginTop: 16 }}>
                {shareResult.topic && (
                  <p style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 12 }}>
                    {shareResult.topic}
                  </p>
                )}

                {shareResult.x_draft?.text && (
                  <div
                    style={{
                      background: "rgba(148,209,211,0.06)",
                      border: "1px solid rgba(148,209,211,0.2)",
                      borderRadius: 12,
                      padding: "16px 18px",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={sectionLabel(accent)}>For X / Twitter</p>
                      <button
                        onClick={() => copyDraft("x")}
                        style={{
                          background: shareCopied === "x" ? "#16a34a" : "#003536",
                          color: shareCopied === "x" ? "#fff" : accent,
                          border: "1px solid rgba(148,209,211,0.25)",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {shareCopied === "x" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p style={{ fontSize: 14, color: textMain, lineHeight: 1.55, whiteSpace: "pre-wrap", marginBottom: 8 }}>
                      {shareResult.x_draft.text}
                    </p>
                    {shareResult.x_draft.hashtags && shareResult.x_draft.hashtags.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        {shareResult.x_draft.hashtags.map((h, i) => (
                          <span key={i} style={{ fontSize: 11, color: accent, fontWeight: 700 }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                    {shareResult.x_draft.char_count !== undefined && (
                      <p style={{ fontSize: 10, color: textMuted }}>
                        {shareResult.x_draft.char_count} / 280 characters
                      </p>
                    )}
                  </div>
                )}

                {shareResult.linkedin_draft?.text && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "16px 18px",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={sectionLabel(accent)}>For LinkedIn</p>
                      <button
                        onClick={() => copyDraft("li")}
                        style={{
                          background: shareCopied === "li" ? "#16a34a" : "#003536",
                          color: shareCopied === "li" ? "#fff" : accent,
                          border: "1px solid rgba(148,209,211,0.25)",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {shareCopied === "li" ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p style={{ fontSize: 13, color: textMain, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                      {shareResult.linkedin_draft.text}
                    </p>
                  </div>
                )}

                {shareResult.phi_check && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(34,197,94,0.06)",
                      border: "1px solid rgba(34,197,94,0.25)",
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  >
                    <p style={{ fontSize: 10, color: "#86efac", fontWeight: 800, marginBottom: 4, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      PHI check
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(232,237,242,0.7)", lineHeight: 1.5 }}>
                      {shareResult.phi_check}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShareResult(null);
                    setShareObservation("");
                  }}
                  style={{ ...ghostBtn(textMain), width: "100%" }}
                >
                  Draft another
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── QUEUE ────────────────────────────────────────────────────── */}
        {mode === "queue" && (
          <>
            <ModeHeader title="Today's queue" sub="Encounters captured today, ready to send to your biller." accent={accent} muted={textMuted} />
            <div
              style={{
                background: "rgba(148,209,211,0.06)",
                border: "1px solid rgba(148,209,211,0.2)",
                borderRadius: 14,
                padding: "18px 20px",
                marginBottom: 16,
              }}
            >
              <p style={sectionLabel(accent)}>Total ready to send</p>
              <p style={{ fontSize: 30, fontWeight: 900, color: accent, letterSpacing: "-0.5px", marginTop: 4 }}>
                {dollarFmt(queueTotal)}
              </p>
              <p style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>
                {queue.length} encounter{queue.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ ...sectionLabel(textMuted), display: "block", marginBottom: 6 }}>Biller email</label>
              <input
                type="email"
                value={billerEmail}
                onChange={(e) => saveBillerEmail(e.target.value)}
                placeholder="biller@yourclinic.com"
                style={fieldStyle()}
              />
            </div>
            <button
              onClick={emailBiller}
              disabled={queue.length === 0}
              style={{ ...primaryBtn(false, accent, bg), opacity: queue.length === 0 ? 0.4 : 1 }}
            >
              Email my biller →
            </button>

            {queue.length === 0 ? (
              <p style={{ color: textMuted, fontSize: 13, textAlign: "center", marginTop: 30 }}>
                Queue is empty. Capture your first encounter from the Code tab.
              </p>
            ) : (
              <>
                <div style={{ marginTop: 18 }}>
                  {queue.map((q) => (
                    <div key={q.id} style={subtleCard()}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
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
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                        {(q.result.line_items || []).map((it, i) => (
                          <span key={i} style={miniPillSubtle(accent)}>
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
                          marginTop: 8,
                          textDecoration: "underline",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
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
                    marginTop: 12,
                  }}
                >
                  Clear queue
                </button>
              </>
            )}
          </>
        )}

        <p
          style={{
            fontSize: 10,
            color: "rgba(232,237,242,0.35)",
            textAlign: "center",
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          Add to home screen: tap Share → Add to Home Screen.
          <br />
          Everything stays on your device. No signup.
        </p>
      </div>

      {/* Bottom tab bar */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(0,26,27,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(148,209,211,0.15)",
          padding: "10px 6px max(10px, env(safe-area-inset-bottom))",
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 2,
          zIndex: 1000,
        }}
      >
        {(
          [
            { id: "code", label: "Code", icon: "$" },
            { id: "pa", label: "PA", icon: "PA" },
            { id: "ask", label: "Ask", icon: "?" },
            { id: "lookup", label: "Find", icon: "ID" },
            { id: "share", label: "Share", icon: "X" },
            { id: "queue", label: "Queue", icon: "Q", badge: queue.length },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setMode(t.id as Mode)}
            style={{
              background: "transparent",
              border: "none",
              color: mode === t.id ? accent : "rgba(232,237,242,0.55)",
              padding: "8px 4px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: mode === t.id ? accent : "rgba(148,209,211,0.08)",
                color: mode === t.id ? bg : accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: "-0.3px",
              }}
            >
              {t.icon}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "-0.1px" }}>{t.label}</span>
            {"badge" in t && t.badge && t.badge > 0 ? (
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: "calc(50% - 18px)",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 9,
                  fontWeight: 900,
                  minWidth: 14,
                  height: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                }}
              >
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    </main>
  );
}

// ─── Inline helpers ─────────────────────────────────────────────────────────

function ModeHeader({ title, sub, accent, muted }: { title: string; sub: string; accent: string; muted: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, fontWeight: 800, marginBottom: 6 }}>
        SurgeonValue Pocket
      </p>
      <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1.1, marginBottom: 6 }}>
        {title}
      </h1>
      <p style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

function GlobalPeriodWarning() {
  return (
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
  );
}

function TotalCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
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
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 900, color: accent, letterSpacing: "-0.5px" }}>{value}</p>
    </div>
  );
}

function CodeCard({ item, accent, muted }: { item: LineItem; accent: string; muted: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={pill(accent, "#001a1b")}>{item.cpt_code}</span>
        <span style={{ background: "rgba(134,239,172,0.12)", color: "#86efac", padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 800 }}>
          ${(item.medicare_allowable_dollars || 0).toFixed(0)}
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
      {item.code_description && <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{item.code_description}</p>}
      {item.rule_brief && <p style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{item.rule_brief}</p>}
    </div>
  );
}

// ─── Style helpers ──────────────────────────────────────────────────────────

const fieldStyle = (): React.CSSProperties => ({
  width: "100%",
  background: "rgba(148,209,211,0.04)",
  border: "1px solid rgba(148,209,211,0.15)",
  borderRadius: 12,
  padding: 14,
  color: "#E8EDF2",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  resize: "vertical",
  boxSizing: "border-box",
});

const primaryBtn = (loading: boolean, accent: string, bg: string): React.CSSProperties => ({
  width: "100%",
  padding: "14px 20px",
  background: loading ? "rgba(148,209,211,0.3)" : accent,
  color: bg,
  border: "none",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 900,
  cursor: loading ? "wait" : "pointer",
  marginTop: 12,
});

const ghostBtn = (textMain: string): React.CSSProperties => ({
  flex: 1,
  padding: "14px",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  color: textMain,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
});

const subtleCard = (): React.CSSProperties => ({
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "12px 14px",
  marginBottom: 8,
});

const sectionLabel = (color: string): React.CSSProperties => ({
  fontSize: 10,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color,
  fontWeight: 800,
  marginBottom: 6,
});

const pill = (bg: string, fg: string): React.CSSProperties => ({
  background: bg,
  color: fg,
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 900,
  fontFamily: "ui-monospace, monospace",
});

const pillSubtle = (color: string): React.CSSProperties => ({
  background: "rgba(148,209,211,0.12)",
  color,
  padding: "4px 10px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 800,
  fontFamily: "ui-monospace, monospace",
});

const miniPill = (bg: string, fg: string): React.CSSProperties => ({
  background: bg,
  color: fg,
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 9,
  fontWeight: 900,
});

const miniPillSubtle = (color: string): React.CSSProperties => ({
  fontSize: 10,
  fontFamily: "ui-monospace, monospace",
  background: "rgba(148,209,211,0.12)",
  color,
  padding: "2px 6px",
  borderRadius: 4,
  fontWeight: 800,
});
