"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

// SurgeonValue Profile — public face of a surgeon in the SurgeonValue network.
// Designed to be scanned via QR by a referring provider. Their first impression
// is "this is a real surgeon I know I can send patients to," not a billing tool.

interface Props {
  slug: string;
  npi: string;
  fullName: string;
  credential: string;
  specialty: string;
  practice: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  about: string;
  subspecialtyFocus: string[];
  insurancesAccepted: string[];
  nextAvailable: string;
}

export default function ProfileClient(props: Props) {
  const [copied, setCopied] = useState(false);

  const profileUrl = `https://surgeonvalue.com/p/${props.slug}`;
  const pocketUrl = `https://surgeonvalue.com/pocket?to=${props.slug}`;
  const tel = props.phone.replace(/\D/g, "");

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      /* ignore */
    }
  };

  const bg = "#001a1b";
  const accent = "#94d1d3";
  const textMain = "#E8EDF2";
  const textMuted = "rgba(232,237,242,0.6)";
  const stanford = "#8C1515";

  return (
    <main
      style={{
        minHeight: "100svh",
        background: `radial-gradient(circle at 50% 0%, rgba(140,21,21,0.08) 0%, ${bg} 40%, ${bg} 100%)`,
        color: textMain,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Inter', 'Manrope', Roboto, sans-serif",
        padding: "max(40px, env(safe-area-inset-top)) 20px max(40px, env(safe-area-inset-bottom))",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 580, margin: "0 auto" }}>
        {/* Top brand strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: accent,
                color: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: "-0.5px",
              }}
            >
              SV
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: textMuted, letterSpacing: "0.05em" }}>
              SurgeonValue Profile
            </span>
          </div>
          <button
            onClick={copyProfileUrl}
            style={{
              background: copied ? "#16a34a" : "transparent",
              color: copied ? "#fff" : textMuted,
              border: `1px solid ${copied ? "#16a34a" : "rgba(232,237,242,0.15)"}`,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        {/* Hero */}
        <h1
          style={{
            fontSize: "clamp(32px, 6vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-1.5px",
            lineHeight: 1.05,
            marginBottom: 6,
          }}
        >
          {props.fullName}
          <span style={{ color: accent, fontSize: "0.55em", marginLeft: 12 }}>{props.credential}</span>
        </h1>
        <p style={{ fontSize: 16, color: textMain, marginBottom: 4 }}>{props.specialty}</p>
        <p
          style={{
            fontSize: 13,
            color: textMuted,
            paddingLeft: 12,
            borderLeft: `3px solid ${stanford}`,
            marginBottom: 28,
          }}
        >
          {props.practice}
        </p>

        {/* About */}
        {props.about && (
          <p style={{ fontSize: 14, color: "rgba(232,237,242,0.78)", lineHeight: 1.65, marginBottom: 28 }}>
            {props.about}
          </p>
        )}

        {/* Big primary CTA — the whole point of the page */}
        <a
          href={pocketUrl}
          style={{
            display: "block",
            textAlign: "center",
            background: accent,
            color: bg,
            padding: "20px 28px",
            borderRadius: 14,
            textDecoration: "none",
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: "-0.3px",
            boxShadow: "0 16px 40px rgba(148,209,211,0.2)",
            marginBottom: 8,
          }}
        >
          Refer a patient →
        </a>
        <p style={{ fontSize: 11, color: textMuted, textAlign: "center", marginBottom: 32 }}>
          Voice or paste. No login.
        </p>

        {/* Subspecialty focus */}
        {props.subspecialtyFocus.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Subspecialty focus
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {props.subspecialtyFocus.map((s, i) => (
                <span
                  key={i}
                  style={{
                    background: "rgba(148,209,211,0.08)",
                    border: "1px solid rgba(148,209,211,0.2)",
                    color: accent,
                    padding: "6px 12px",
                    borderRadius: 100,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Insurances accepted */}
        {props.insurancesAccepted.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: textMuted,
                fontWeight: 800,
                marginBottom: 10,
              }}
            >
              Insurances accepted
            </p>
            <p style={{ fontSize: 13, color: textMain, lineHeight: 1.6 }}>
              {props.insurancesAccepted.join(" · ")}
            </p>
          </div>
        )}

        {/* Practice info */}
        <div
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: "18px 22px",
            marginBottom: 24,
          }}
        >
          <p
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: textMuted,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            Practice
          </p>
          <p style={{ fontSize: 14, color: textMain, lineHeight: 1.6 }}>
            {props.addressLine1}
            <br />
            {props.city}, {props.state} {props.zip}
          </p>
          {props.phone && (
            <a
              href={`tel:${tel}`}
              style={{
                display: "inline-block",
                marginTop: 10,
                fontSize: 13,
                color: accent,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              {props.phone} →
            </a>
          )}
          {props.nextAvailable && (
            <p style={{ fontSize: 12, color: "#86efac", marginTop: 12, fontWeight: 700 }}>
              Next available: {props.nextAvailable}
            </p>
          )}
          <p style={{ fontSize: 10, color: "rgba(232,237,242,0.35)", marginTop: 10 }}>
            NPI {props.npi} · Live from CMS NPPES
          </p>
        </div>

        {/* QR for hand-off */}
        <div
          style={{
            background: "rgba(148,209,211,0.04)",
            border: "1px solid rgba(148,209,211,0.15)",
            borderRadius: 14,
            padding: "22px 24px",
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: 20,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <QRCodeSVG
              value={profileUrl}
              size={108}
              level="M"
              fgColor="#001a1b"
              bgColor="#ffffff"
            />
          </div>
          <div>
            <p
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: accent,
                fontWeight: 800,
                marginBottom: 6,
              }}
            >
              Hand-off QR
            </p>
            <p style={{ fontSize: 10, color: textMuted, fontFamily: "ui-monospace, monospace" }}>
              {profileUrl.replace("https://", "")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: 10,
            color: "rgba(232,237,242,0.3)",
            textAlign: "center",
            marginTop: 32,
            lineHeight: 1.6,
          }}
        >
          SurgeonValue · System of care, not a clinic visit
        </p>
      </div>
    </main>
  );
}
