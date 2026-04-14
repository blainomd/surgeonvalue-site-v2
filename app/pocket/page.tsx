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

type Mode = "code" | "pa" | "ask" | "lookup" | "refer" | "share" | "queue";

type PostDraft = {
  topic?: string;
  x_draft?: { text?: string; char_count?: number; hashtags?: string[] };
  linkedin_draft?: { text?: string; hook?: string };
  phi_check?: string;
};

type ReferralProvider = {
  npi: string;
  name: string;
  credential: string;
  specialty: string;
  city: string;
  state: string;
  zip: string;
  address: string;
  phone: string;
};

type ReferralResult = {
  inferred_specialty?: string;
  preferred_specialist?: ReferralProvider | null;
  matched_providers?: ReferralProvider[];
  referral_letter?: {
    letter?: string;
    key_points?: string[];
    urgency?: string;
    phi_stripped?: string;
  };
  billing_capture?: {
    note_summary?: string;
    line_items?: LineItem[];
    total_visit_dollars?: number;
  } | null;
};

// ─── Storage keys ───────────────────────────────────────────────────────────

const QUEUE_KEY = "sv_pocket_queue_v1";
const BILLER_EMAIL_KEY = "sv_pocket_biller_email_v1";

// Queue items auto-expire 24h after capture so PHI doesn't sit on the device
// indefinitely. The localStorage queue is meant to be ephemeral end-of-day capture.
const QUEUE_TTL_MS = 24 * 60 * 60 * 1000;
const purgeExpiredQueue = (queue: QueuedEncounter[]): QueuedEncounter[] => {
  const cutoff = Date.now() - QUEUE_TTL_MS;
  return queue.filter((q) => {
    const ts = new Date(q.timestamp).getTime();
    return Number.isFinite(ts) && ts >= cutoff;
  });
};

// ─── Utilities ──────────────────────────────────────────────────────────────

const dollarFmt = (n: number | undefined) =>
  (n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const riskColor: Record<string, string> = {
  low: "#22c55e",
  medium: "#f59e0b",
  high: "#ef4444",
};

// ─── Page ───────────────────────────────────────────────────────────────────

// Known SurgeonValue customers — when /pocket?to=<slug> is set, we surface
// them as the preferred destination for any matched specialty.
type PreferredDestination = {
  slug: string;
  npi: string;
  display_name: string;
  practice: string;
  specialty: string;
};
const PREFERRED_DESTINATIONS: Record<string, PreferredDestination> = {
  levonti: {
    slug: "levonti",
    npi: "1104445147",
    display_name: "Dr. Levon Ohanisian, MD",
    practice: "Stanford Orthopaedic Surgery",
    specialty: "Orthopedic Surgery",
  },
  // Derek will be added when his NPI is confirmed
};

export default function PocketPage() {
  // Mode & shared state — DEFAULT is referral, not billing. Pocket's primary
  // user is a referring provider sending patients to a SurgeonValue customer.
  const [mode, setMode] = useState<Mode>("refer");
  const [error, setError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [showPowerTabs, setShowPowerTabs] = useState(false);
  const [preferredDestination, setPreferredDestination] = useState<PreferredDestination | null>(null);
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

  // Refer state
  const [referContext, setReferContext] = useState("");
  const [referSpecialty, setReferSpecialty] = useState("");
  const [referState, setReferState] = useState("");
  const [referCity, setReferCity] = useState("");
  const [referLoading, setReferLoading] = useState(false);
  const [referResult, setReferResult] = useState<ReferralResult | null>(null);
  const [referCopied, setReferCopied] = useState(false);
  const [referAdjustOpen, setReferAdjustOpen] = useState(false);

  // Share (post drafter) state
  const [shareObservation, setShareObservation] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResult, setShareResult] = useState<PostDraft | null>(null);
  const [shareCopied, setShareCopied] = useState<"x" | "li" | null>(null);

  // Queue state
  const [queue, setQueue] = useState<QueuedEncounter[]>([]);
  const [billerEmail, setBillerEmail] = useState("");

  // Speech listening target — which textarea the current voice session writes to
  const [voiceTarget, setVoiceTarget] = useState<"code" | "pa" | "ask" | "share" | "refer" | null>(null);

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as QueuedEncounter[];
        const fresh = purgeExpiredQueue(parsed);
        setQueue(fresh);
        // Persist the cleaned version back so expired items are actually gone
        if (fresh.length !== parsed.length) {
          try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(fresh));
          } catch {
            /* ignore quota */
          }
        }
      }
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

      // Preferred destination from ?to=<slug> OR ?to=<10-digit-NPI>
      // Curated slugs resolve instantly; raw NPIs hydrate from NPPES on the fly
      const toRaw = (params.get("to") || "").trim();
      const toSlug = toRaw.toLowerCase();
      if (toSlug && PREFERRED_DESTINATIONS[toSlug]) {
        setPreferredDestination(PREFERRED_DESTINATIONS[toSlug]);
      } else if (/^\d{10}$/.test(toRaw)) {
        // Hydrate any NPI on the fly via /api/npi
        fetch(`/api/npi?npi=${toRaw}`)
          .then((r) => r.json())
          .then((data) => {
            if (data && data.npi && data.provider) {
              const fullName = `${data.provider.firstName || ""} ${data.provider.lastName || ""}`.trim();
              const cred = data.provider.credential || "MD";
              const addr = data.address || {};
              const practiceLine = [addr.city, addr.state].filter(Boolean).join(", ");
              setPreferredDestination({
                slug: toRaw,
                npi: toRaw,
                display_name: `Dr. ${fullName}, ${cred}`,
                practice: practiceLine || "Practice from CMS NPPES",
                specialty: data.specialty?.label || data.specialty?.description || "Specialist",
              });
              // Auto-fill city/state defaults from the surgeon's practice address
              if (addr.city && !referCity) setReferCity(addr.city);
              if (addr.state && !referState) setReferState(addr.state);
            }
          })
          .catch(() => {
            /* silent — Pocket still works without a preferred destination */
          });
      }

      // Curated slug auto-defaults — Levonti is at Stanford
      if (PREFERRED_DESTINATIONS[toSlug]) {
        if (toSlug === "levonti") {
          setReferCity("Stanford");
          setReferState("CA");
        }
      }

      // Optional view override (deep links from /levonti etc.)
      const v = params.get("view");
      if (v === "queue") setMode("queue");
      else if (v === "pa") setMode("pa");
      else if (v === "ask") setMode("ask");
      else if (v === "lookup") setMode("lookup");
      else if (v === "share") setMode("share");
      else if (v === "refer") setMode("refer");
      else if (v === "code") setMode("code");
      // Default mode = "refer" (set in initial useState)
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
  const startListening = (target: "code" | "pa" | "ask" | "share" | "refer") => {
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
      else if (target === "refer") setReferContext(combined);
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

  // ── Refer submit ────────────────────────────────────────────────────────
  const submitRefer = async () => {
    const text = referContext.trim();
    if (text.length < 15) {
      setError("Dictate or type the patient context first.");
      return;
    }
    setReferLoading(true);
    setError(null);
    setReferResult(null);
    setReferCopied(false);
    try {
      const res = await fetch("/api/refer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_context: text,
          specialty_hint: referSpecialty.trim(),
          state: referState.trim(),
          city: referCity.trim(),
          preferred_npi: preferredDestination?.npi || "",
          preferred_label: preferredDestination
            ? `${preferredDestination.display_name} · ${preferredDestination.practice}`
            : "",
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) setError(data.error || "Refer failed.");
      else {
        setReferResult({
          inferred_specialty: data.inferred_specialty,
          preferred_specialist: data.preferred_specialist || null,
          matched_providers: data.matched_providers || [],
          referral_letter: data.referral_letter,
          billing_capture: data.billing_capture || null,
        });
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setReferLoading(false);
    }
  };

  const copyReferralLetter = async () => {
    const text = referResult?.referral_letter?.letter;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setReferCopied(true);
      setTimeout(() => setReferCopied(false), 2400);
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
  const textMuted = "rgba(232,237,242,0.78)";

  // ─── Next Best Action — what the surgeon should do RIGHT NOW ───────────
  // Computed from local state. Mobile app should always be fresh with the next
  // best thing to do, never neutral.
  type NextAction = { label: string; cta: string; mode: Mode; tone: "default" | "urgent" | "info" } | null;
  const computeNextBestAction = (): NextAction => {
    // 1. Queue with $ totals waiting → biller email is the move
    if (queue.length >= 3) {
      return {
        label: `${queue.length} encounters · ${dollarFmt(queueTotal)} ready to send your biller`,
        cta: "Email biller now",
        mode: "queue",
        tone: "urgent",
      };
    }
    // 2. CMS ACCESS deadline countdown
    const accessDeadline = new Date("2026-05-15T23:59:59-07:00").getTime();
    const now = Date.now();
    const daysToDeadline = Math.ceil((accessDeadline - now) / (1000 * 60 * 60 * 24));
    if (daysToDeadline > 0 && daysToDeadline <= 30) {
      return {
        label: `${daysToDeadline} days to CMS ACCESS Model deadline. Draft a post to flag it to your division.`,
        cta: "Draft post",
        mode: "share",
        tone: "info",
      };
    }
    // 3. Queue has some items but not many → keep capturing
    if (queue.length >= 1 && queue.length < 3) {
      return {
        label: `${queue.length} in queue · ${dollarFmt(queueTotal)} so far. Capture your next encounter.`,
        cta: "Dictate next",
        mode: "code",
        tone: "default",
      };
    }
    // 4. No biller email saved → setup nudge
    if (!billerEmail.trim()) {
      return {
        label: "Set your biller email so end-of-day export works.",
        cta: "Set email",
        mode: "queue",
        tone: "info",
      };
    }
    // 5. First-use: just nudge to capture
    return {
      label: "Capture today's first encounter — voice in, codes + post out.",
      cta: "Start dictating",
      mode: "code",
      tone: "default",
    };
  };
  const nextAction = computeNextBestAction();

  // ─── Inline reusable: voice button ──────────────────────────────────────
  const VoiceButton = ({ target, size = 160 }: { target: "code" | "pa" | "ask" | "share" | "refer"; size?: number }) => {
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                {queue.length} · {dollarFmt(queueTotal)}
              </button>
            )}
            <a
              href="/me"
              aria-label="Your data"
              title="What Pocket knows about you"
              style={{
                background: "transparent",
                border: "1px solid rgba(232,237,242,0.15)",
                color: textMuted,
                fontSize: 11,
                fontWeight: 800,
                padding: "7px 10px",
                borderRadius: 8,
                cursor: "pointer",
                textDecoration: "none",
                letterSpacing: "0.05em",
              }}
            >
              My data
            </a>
            <button
              onClick={() => setShowPowerTabs(!showPowerTabs)}
              aria-label="More tools"
              style={{
                background: "transparent",
                border: "1px solid rgba(232,237,242,0.15)",
                color: textMuted,
                fontSize: 14,
                fontWeight: 900,
                width: 32,
                height: 32,
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ···
            </button>
          </div>
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

        {/* ─── Next Best Action — always fresh ────────────────────────── */}
        {nextAction && (
          <button
            onClick={() => setMode(nextAction.mode)}
            style={{
              width: "100%",
              background:
                nextAction.tone === "urgent"
                  ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(148,209,211,0.04))"
                  : nextAction.tone === "info"
                    ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(148,209,211,0.04))"
                    : "rgba(148,209,211,0.05)",
              border: `1px solid ${
                nextAction.tone === "urgent"
                  ? "rgba(239,68,68,0.4)"
                  : nextAction.tone === "info"
                    ? "rgba(245,158,11,0.4)"
                    : "rgba(148,209,211,0.2)"
              }`,
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 18,
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: textMain,
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background:
                  nextAction.tone === "urgent"
                    ? "#ef4444"
                    : nextAction.tone === "info"
                      ? "#fbbf24"
                      : "#22c55e",
                boxShadow: `0 0 12px ${
                  nextAction.tone === "urgent"
                    ? "#ef4444"
                    : nextAction.tone === "info"
                      ? "#fbbf24"
                      : "#22c55e"
                }`,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color:
                    nextAction.tone === "urgent"
                      ? "#fca5a5"
                      : nextAction.tone === "info"
                        ? "#fbbf24"
                        : "#86efac",
                  fontWeight: 800,
                  marginBottom: 2,
                }}
              >
                Next best
              </p>
              <p style={{ fontSize: 12, color: textMain, lineHeight: 1.4, fontWeight: 600 }}>
                {nextAction.label}
              </p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: accent, whiteSpace: "nowrap" }}>
              {nextAction.cta} →
            </span>
          </button>
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

        {/* ─── REFER (voice → matched providers + drafted letter + billing) ─ */}
        {mode === "refer" && (
          <>
            <ModeHeader
              title={preferredDestination ? `Refer to ${preferredDestination.display_name.replace(/^Dr\. /, "")}` : "Refer a patient"}
              sub=""
              accent={accent}
              muted={textMuted}
            />
            {preferredDestination && (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(140,21,21,0.12), rgba(148,209,211,0.04))",
                  border: "1px solid rgba(140,21,21,0.4)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: accent,
                    boxShadow: `0 0 12px ${accent}`,
                    flexShrink: 0,
                    marginTop: 6,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: accent,
                      fontWeight: 800,
                      marginBottom: 2,
                    }}
                  >
                    Your network preference
                  </p>
                  <p style={{ fontSize: 13, color: textMain, fontWeight: 700 }}>
                    {preferredDestination.display_name}
                  </p>
                  <p style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>
                    {preferredDestination.practice} · {preferredDestination.specialty}
                  </p>
                  <p style={{ fontSize: 10, color: "rgba(232,237,242,0.55)", lineHeight: 1.5 }}>
                    You arrived here from this surgeon&apos;s network. They&apos;ll be pinned at the top of matches when surgical eval applies. Other matched providers from CMS NPPES appear below.
                  </p>
                </div>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <VoiceButton target="refer" size={140} />
            </div>
            <textarea
              value={referContext}
              onChange={(e) => setReferContext(e.target.value)}
              placeholder="Paste from your EMR, or type the case here. Or hold the mic above to dictate."
              rows={5}
              style={fieldStyle()}
            />
            {referContext && !referResult && !referLoading && (
              <button onClick={submitRefer} style={primaryBtn(false, accent, bg)}>
                Refer →
              </button>
            )}
            {referLoading && (
              <div
                style={{
                  marginTop: 12,
                  padding: "14px 18px",
                  background: "rgba(148,209,211,0.06)",
                  border: "1px solid rgba(148,209,211,0.2)",
                  borderRadius: 12,
                  color: textMuted,
                  fontSize: 13,
                  textAlign: "center",
                }}
              >
                Matching providers · drafting letter · capturing your codes…
              </div>
            )}
            {/* Adjust — hidden by default, opens to override defaults */}
            {referContext && !referResult && (
              <button
                onClick={() => setReferAdjustOpen(!referAdjustOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: textMuted,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 10,
                  padding: "6px 0",
                }}
              >
                {referAdjustOpen ? "Hide adjust" : "Adjust specialty / location"}
              </button>
            )}
            {referAdjustOpen && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                <input
                  value={referSpecialty}
                  onChange={(e) => setReferSpecialty(e.target.value)}
                  placeholder="Specialty"
                  style={{ ...fieldStyle(), fontSize: 12 }}
                />
                <input
                  value={referCity}
                  onChange={(e) => setReferCity(e.target.value)}
                  placeholder="City"
                  style={{ ...fieldStyle(), fontSize: 12 }}
                />
                <input
                  value={referState}
                  onChange={(e) => setReferState(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="State"
                  maxLength={2}
                  style={{ ...fieldStyle(), fontSize: 12, textAlign: "center" }}
                />
              </div>
            )}

            {referResult && (
              <div style={{ marginTop: 16 }}>
                {referResult.inferred_specialty && (
                  <p style={{ fontSize: 12, color: textMuted, fontStyle: "italic", marginBottom: 12 }}>
                    Searched for: {referResult.inferred_specialty}
                  </p>
                )}

                {/* Matched providers */}
                {referResult.matched_providers && referResult.matched_providers.length > 0 ? (
                  <>
                    <p style={sectionLabel(accent)}>Matched providers ({referResult.matched_providers.length})</p>
                    <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                      {referResult.matched_providers.map((p, i) => (
                        <div key={i} style={subtleCard()}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                            <p style={{ fontSize: 13, fontWeight: 800, color: textMain }}>
                              {p.name}
                              {p.credential && (
                                <span style={{ color: accent, fontSize: 11, marginLeft: 6 }}>{p.credential}</span>
                              )}
                            </p>
                            {p.phone && (
                              <a
                                href={`tel:${p.phone.replace(/\D/g, "")}`}
                                style={{ fontSize: 11, color: accent, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}
                              >
                                Call →
                              </a>
                            )}
                          </div>
                          <p style={{ fontSize: 11, color: textMuted }}>
                            {p.specialty}
                          </p>
                          <p style={{ fontSize: 11, color: "rgba(232,237,242,0.45)", marginTop: 2 }}>
                            {p.address && `${p.address} · `}
                            {p.city}, {p.state} {p.zip}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 12, color: textMuted, marginBottom: 12 }}>
                    No matching providers found in NPPES for this specialty + location. Try widening
                    the state or specialty.
                  </p>
                )}

                {/* Referral letter */}
                {referResult.referral_letter?.letter && (
                  <div style={{ marginTop: 12 }}>
                    <p style={sectionLabel(accent)}>Referral letter</p>
                    {/* Send row — one tap to text, email, or copy */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                      <a
                        href={`sms:?&body=${encodeURIComponent(referResult.referral_letter.letter || "")}`}
                        style={{
                          background: "#003536",
                          color: accent,
                          border: "1px solid rgba(148,209,211,0.25)",
                          padding: "12px 8px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          textDecoration: "none",
                          textAlign: "center",
                        }}
                      >
                        Text
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent("Referral: " + (referResult.inferred_specialty || "Specialist consult"))}&body=${encodeURIComponent(referResult.referral_letter.letter || "")}`}
                        style={{
                          background: "#003536",
                          color: accent,
                          border: "1px solid rgba(148,209,211,0.25)",
                          padding: "12px 8px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          textDecoration: "none",
                          textAlign: "center",
                        }}
                      >
                        Email
                      </a>
                      <button
                        onClick={copyReferralLetter}
                        style={{
                          background: referCopied ? "#16a34a" : "#003536",
                          color: referCopied ? "#fff" : accent,
                          border: "1px solid rgba(148,209,211,0.25)",
                          padding: "12px 8px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {referCopied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    {referResult.referral_letter.urgency && referResult.referral_letter.urgency !== "routine" && (
                      <p
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: referResult.referral_letter.urgency === "stat" ? "#fca5a5" : "#fbbf24",
                          fontWeight: 800,
                          marginBottom: 6,
                        }}
                      >
                        {referResult.referral_letter.urgency} urgency
                      </p>
                    )}
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
                      {referResult.referral_letter.letter}
                    </pre>
                    {referResult.referral_letter.phi_stripped && (
                      <p
                        style={{
                          marginTop: 8,
                          padding: "8px 12px",
                          fontSize: 10,
                          color: "#86efac",
                          background: "rgba(34,197,94,0.06)",
                          border: "1px solid rgba(34,197,94,0.25)",
                          borderRadius: 6,
                        }}
                      >
                        PHI stripped: {referResult.referral_letter.phi_stripped}
                      </p>
                    )}
                  </div>
                )}

                {/* Billing capture for the referrer's own visit — full scope */}
                {referResult.billing_capture && (referResult.billing_capture.line_items || []).length > 0 && (
                  <>
                    <p style={{ ...sectionLabel(accent), marginTop: 14 }}>Codes for your own visit</p>
                    <div
                      style={{
                        background: "rgba(134,239,172,0.06)",
                        border: "1px solid rgba(134,239,172,0.25)",
                        borderRadius: 12,
                        padding: "14px 18px",
                        marginBottom: 12,
                      }}
                    >
                      <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#86efac", fontWeight: 800, marginBottom: 4 }}>
                        Wonder Bill — your visit
                      </p>
                      <p style={{ fontSize: 26, fontWeight: 900, color: "#86efac", letterSpacing: "-0.5px" }}>
                        {dollarFmt(referResult.billing_capture.total_visit_dollars)}
                      </p>
                    </div>
                    {(referResult.billing_capture.line_items || []).map((item, i) => (
                      <CodeCard key={i} item={item} accent={accent} muted={textMuted} />
                    ))}
                  </>
                )}

                {/* ClinicalSwipe upsell — viral loop */}
                <div
                  style={{
                    marginTop: 18,
                    padding: "16px 18px",
                    background: "rgba(148,209,211,0.04)",
                    border: "1px dashed rgba(148,209,211,0.25)",
                    borderRadius: 12,
                  }}
                >
                  <p style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: accent, fontWeight: 800, marginBottom: 6 }}>
                    List your own practice
                  </p>
                  <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.55, marginBottom: 10 }}>
                    Want patients referred TO you the same way? Get a ClinicalSwipe profile in 60 seconds.
                    Other surgeons hand out your QR. You receive referrals via Pocket.
                  </p>
                  <a
                    href="https://clinicalswipe.com"
                    target="_blank"
                    rel="noopener"
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: accent,
                      textDecoration: "none",
                      borderBottom: `1px dashed ${accent}`,
                    }}
                  >
                    Get a ClinicalSwipe profile →
                  </a>
                </div>

                <button
                  onClick={() => {
                    setReferResult(null);
                    setReferContext("");
                  }}
                  style={{ ...ghostBtn(textMain), marginTop: 12, width: "100%" }}
                >
                  Refer another
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
            <ModeHeader title="Today's queue" sub="" accent={accent} muted={textMuted} />
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
                {queue.length} encounter{queue.length !== 1 ? "s" : ""} · auto-clears after 24 hours
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

      </div>

      {/* Bottom tab bar — hidden by default for adoption simplicity, shown via "..." toggle */}
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
          padding: "10px 4px max(10px, env(safe-area-inset-bottom))",
          display: showPowerTabs ? "grid" : "none",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          zIndex: 1000,
        }}
      >
        {(
          [
            { id: "code", label: "Code", icon: "$" },
            { id: "pa", label: "PA", icon: "PA" },
            { id: "ask", label: "Ask", icon: "?" },
            { id: "refer", label: "Refer", icon: "R" },
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
    <div style={{ marginBottom: 22 }}>
      <p style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: accent, fontWeight: 800, marginBottom: 8 }}>
        SurgeonValue Pocket
      </p>
      <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1.1, marginBottom: sub ? 6 : 0 }}>
        {title}
      </h1>
      {sub && <p style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{sub}</p>}
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
