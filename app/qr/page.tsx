'use client';
import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

const CONDITIONS = [
  { label: 'Hip Pain', site: 'hippain.help', slug: 'hip-pain' },
  { label: 'Shoulder Pain', site: 'shoulderpain.help', slug: 'shoulder-pain' },
  { label: 'Back Pain', site: 'doesyourbackhurt.com', slug: 'back-pain' },
  { label: 'Arthritis', site: 'arthritisrisk.com', slug: 'arthritis-risk' },
  { label: 'Heart Health', site: 'hearthealth.help', slug: 'heart-health' },
  { label: 'Fall Prevention', site: 'fallprevention.help', slug: 'fall-prevention' },
  { label: 'Memory / Cognition', site: 'memoryloss.help', slug: 'memory-loss' },
  { label: 'Blood Pressure', site: 'bloodpressure.help', slug: 'blood-pressure' },
  { label: 'Breathing', site: 'breathing.help', slug: 'breathing' },
  { label: 'Pregnancy Care', site: 'pregnancycare.help', slug: 'pregnancy-care' },
];

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"
      style={
        copied
          ? { borderColor: '#0D7377', color: '#0D7377', background: '#0D737710' }
          : { borderColor: '#D1D5DB', color: '#6B7280', background: 'white' }
      }
    >
      {copied ? 'Copied' : (label ?? 'Copy')}
    </button>
  );
}

interface LinkRowProps {
  url: string;
  mono?: boolean;
}

function LinkRow({ url, mono }: LinkRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex-1 truncate text-xs rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[#1B2A4A] ${mono ? 'font-mono' : ''}`}
      >
        {url}
      </span>
      <CopyButton value={url} />
    </div>
  );
}

export default function QRPage() {
  const [surgeonId, setSurgeonId] = useState('');
  const [conditionIdx, setConditionIdx] = useState(0);
  const condition = CONDITIONS[conditionIdx];

  useEffect(() => {
    const saved = localStorage.getItem('sv_surgeon_id');
    if (saved) setSurgeonId(saved);
  }, []);

  const handleSurgeonId = (val: string) => {
    setSurgeonId(val);
    localStorage.setItem('sv_surgeon_id', val);
  };

  const ref = encodeURIComponent(surgeonId || 'demo');
  const base = `https://${condition.site}/?ref=${ref}`;
  const qrUrl = `${base}&install=1`;
  const plainUrl = base;
  const igUrl = `${base}&utm_source=instagram&utm_medium=social`;
  const googleUrl = `${base}&utm_source=google&utm_medium=cpc`;
  const emailUrl = `${base}&utm_source=email&utm_medium=newsletter`;
  const embedSnippet = `<a href="${plainUrl}">Learn about ${condition.label.toLowerCase()} →</a>`;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
          body { background: white !important; }
        }
      `}</style>

      <div className="min-h-screen bg-[#F8F6F2]">
        {/* Header */}
        <header className="no-print bg-[#1B2A4A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#0D7377" />
              <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="text-lg font-semibold tracking-tight">SurgeonValue</span>
          </div>
          <span className="text-sm text-white/70">Patient Links</span>
        </header>

        {/* Main */}
        <main className="max-w-5xl mx-auto px-6 py-10">

          {/* Page heading */}
          <div className="no-print mb-6">
            <h1 className="text-2xl font-semibold text-[#1B2A4A]">Patient Links</h1>
            <p className="text-sm text-gray-500 mt-1">One tag. Every channel. Automatic PROM collection.</p>
          </div>

          {/* Controls */}
          <div className="no-print bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Surgeon NPI / ID
                </label>
                <input
                  type="text"
                  value={surgeonId}
                  onChange={(e) => handleSurgeonId(e.target.value)}
                  placeholder="e.g. 1234567890"
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-[#1B2A4A] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">
                  Condition
                </label>
                <select
                  value={conditionIdx}
                  onChange={(e) => setConditionIdx(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm text-[#1B2A4A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D7377] focus:border-transparent"
                >
                  {CONDITIONS.map((c, i) => (
                    <option key={c.slug} value={i}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Two-column layout: QR left, links right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left: QR Code */}
            <div className="print-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center gap-5">

              {/* Print-only heading */}
              <div className="hidden print:block text-center mb-2">
                <p className="text-sm text-gray-400 uppercase tracking-widest font-medium mb-1">SurgeonValue Patient Check-in</p>
                <p className="text-xs text-gray-400">{surgeonId ? `Surgeon: ${surgeonId}` : ''}</p>
              </div>

              <div className="no-print text-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">QR Code</p>
                <p className="text-lg font-semibold text-[#1B2A4A]">{condition.label}</p>
              </div>

              <QRCodeSVG
                value={qrUrl}
                size={220}
                bgColor="#ffffff"
                fgColor="#1B2A4A"
                level="M"
                includeMargin={true}
              />

              <p className="text-xs text-gray-400 text-center max-w-xs leading-relaxed">
                Print for checkout desk, exam room, or discharge packet
              </p>

              <p className="text-xs font-mono text-gray-300 break-all text-center max-w-xs">{qrUrl}</p>

              <div className="no-print w-full flex flex-col gap-2">
                <button
                  onClick={() => window.print()}
                  className="w-full bg-[#1B2A4A] text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-[#243660] transition-colors"
                >
                  Print QR Code
                </button>
              </div>
            </div>

            {/* Right: Link formats */}
            <div className="no-print flex flex-col gap-4">

              {/* 1. Plain link */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#1B2A4A]">Link</p>
                  <p className="text-xs text-gray-400 mt-0.5">Share in texts, emails, or patient portal messages</p>
                </div>
                <LinkRow url={plainUrl} />
              </div>

              {/* 2. Social / Ad links */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#1B2A4A]">Social / Ad Links</p>
                  <p className="text-xs text-gray-400 mt-0.5">Track which channel drives the most PROM enrollments</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Instagram</p>
                    <LinkRow url={igUrl} mono />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Google Ads</p>
                    <LinkRow url={googleUrl} mono />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Email Newsletter</p>
                    <LinkRow url={emailUrl} mono />
                  </div>
                </div>
              </div>

              {/* 3. Website embed */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[#1B2A4A]">Website Embed</p>
                  <p className="text-xs text-gray-400 mt-0.5">Add to your practice website</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 truncate text-xs font-mono rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[#1B2A4A]">
                    {embedSnippet}
                  </span>
                  <CopyButton value={embedSnippet} />
                </div>
              </div>

              {/* View PROM link */}
              <Link
                href="/prom"
                className="text-center bg-white border border-[#0D7377] text-[#0D7377] rounded-lg px-5 py-3 text-sm font-medium hover:bg-[#0D7377]/5 transition-colors"
              >
                View PROM Responses
              </Link>

            </div>
          </div>

          {surgeonId && (
            <p className="no-print mt-4 text-xs text-center text-gray-400">
              Surgeon ID <span className="font-mono font-medium text-[#1B2A4A]">{surgeonId}</span> saved to this browser.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
