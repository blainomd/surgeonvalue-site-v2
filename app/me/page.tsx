"use client";

import { useEffect, useState } from "react";

// ─── /me — Data disclosure + delete-all ──────────────────────────────────
// Shows every piece of data Pocket has stored locally on this device.
// One-tap wipe. No login needed because there's no server-side account —
// all Pocket state is local.
//
// If we ever add server-side user accounts, extend this page to also fetch
// and delete server records.

const LOCAL_KEYS = [
  { key: "sv_pocket_queue_v1", label: "Encounter queue", type: "json" },
  { key: "sv_pocket_biller_email_v1", label: "Biller email", type: "text" },
];

type Entry = {
  key: string;
  label: string;
  type: string;
  present: boolean;
  size: number;
  preview: string;
};

export default function MePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    const rows: Entry[] = LOCAL_KEYS.map(({ key, label, type }) => {
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      const present = raw !== null;
      const size = raw ? raw.length : 0;
      let preview = "";
      if (present && raw) {
        if (type === "json") {
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              preview = `${parsed.length} item${parsed.length !== 1 ? "s" : ""}`;
            } else {
              preview = "(object)";
            }
          } catch {
            preview = "(unparseable)";
          }
        } else {
          preview = raw.length > 40 ? raw.slice(0, 40) + "…" : raw;
        }
      }
      return { key, label, type, present, size, preview };
    });
    setEntries(rows);
  }, [refreshTick]);

  const deleteOne = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setRefreshTick((t) => t + 1);
  };

  const deleteAll = () => {
    if (!confirm("Delete all Pocket data stored on this device? This cannot be undone.")) return;
    LOCAL_KEYS.forEach(({ key }) => {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    });
    setCleared(true);
    setRefreshTick((t) => t + 1);
  };

  const anyPresent = entries.some((e) => e.present);

  const bg = "#001a1b";
  const accent = "#94d1d3";
  const textMain = "#E8EDF2";
  const textMuted = "rgba(232,237,242,0.78)";

  return (
    <main
      style={{
        minHeight: "100svh",
        background: bg,
        color: textMain,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Manrope', Roboto, sans-serif",
        padding: "max(40px, env(safe-area-inset-top)) 20px 80px",
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: 800,
            marginBottom: 10,
          }}
        >
          SurgeonValue Pocket · Your data
        </p>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-1.2px",
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Everything Pocket knows about you
        </h1>
        <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.6, marginBottom: 32 }}>
          Pocket has no server-side account. Everything is on this device. This page lists every field. Delete any of it in one tap.
        </p>

        {cleared && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.35)",
              borderRadius: 10,
              color: "#86efac",
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            All Pocket data cleared from this device.
          </div>
        )}

        {!anyPresent && !cleared && (
          <div
            style={{
              padding: "20px 22px",
              background: "rgba(148,209,211,0.05)",
              border: "1px solid rgba(148,209,211,0.15)",
              borderRadius: 12,
              color: textMuted,
              fontSize: 14,
            }}
          >
            Nothing stored. Pocket hasn&apos;t captured any data on this device.
          </div>
        )}

        {anyPresent && (
          <>
            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {entries.map((e) =>
                e.present ? (
                  <div
                    key={e.key}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 12,
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 14,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 10,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: accent,
                          fontWeight: 800,
                          marginBottom: 4,
                        }}
                      >
                        {e.label}
                      </p>
                      <p style={{ fontSize: 14, color: textMain, fontWeight: 700, marginBottom: 2 }}>
                        {e.preview}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(232,237,242,0.5)", fontFamily: "ui-monospace, monospace" }}>
                        {e.key} · {e.size} bytes
                      </p>
                    </div>
                    <button
                      onClick={() => deleteOne(e.key)}
                      style={{
                        background: "transparent",
                        border: "1px solid rgba(239,68,68,0.4)",
                        color: "#fca5a5",
                        padding: "8px 14px",
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null
              )}
            </div>
            <button
              onClick={deleteAll}
              style={{
                width: "100%",
                padding: "16px",
                background: "#ef4444",
                border: "none",
                color: "#fff",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
                letterSpacing: "-0.2px",
              }}
            >
              Delete everything
            </button>
          </>
        )}

        <div
          style={{
            marginTop: 40,
            padding: "16px 18px",
            background: "rgba(245,158,11,0.05)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: 12,
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#fbbf24",
              fontWeight: 800,
              marginBottom: 6,
            }}
          >
            What the server sees
          </p>
          <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
            When you use Pocket&apos;s Refer, Wonder Bill, Ask, or Post Draft, the text you submit is sent to SurgeonValue&apos;s servers and to Claude (via Anthropic). Obvious identifiers (dates, phone numbers, emails, SSNs, addresses, ZIP codes, names following &ldquo;Patient:&rdquo;) are automatically stripped before we forward anything. We don&apos;t log the submitted text.
          </p>
        </div>

        <p style={{ fontSize: 11, color: "rgba(232,237,242,0.45)", marginTop: 30, textAlign: "center" }}>
          <a href="/pocket" style={{ color: accent, textDecoration: "none" }}>
            ← Back to Pocket
          </a>
        </p>
      </div>
    </main>
  );
}
