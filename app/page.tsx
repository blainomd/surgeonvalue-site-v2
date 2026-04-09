"use client";

import { useState } from "react";

/* ─── SVG Icons ─── */

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function BrandMark({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="0,10 40,85 80,10" fill="#0D7377"/>
      <circle cx="40" cy="34" r="20" fill="white"/>
    </svg>
  );
}

/* Agent Icons */
function PriorAuthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12h6M9 9h6M9 15h4" />
    </svg>
  );
}

function BillingOptimizerIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      <path d="M18 15l2-2 2 2" />
      <path d="M20 17v-4" />
    </svg>
  );
}

function PatientAcquisitionIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </svg>
  );
}

function ReferralNetworkIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M6.5 7.5l4 8M17.5 7.5l-4 8M7 6h10" />
    </svg>
  );
}

function DocumentationIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
      <path d="M16 13l1.5 1.5" />
    </svg>
  );
}

function SchedulingIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="15" cy="16" r="3" />
      <path d="M15 15v1.5l1 .5" />
    </svg>
  );
}

function RTMCCMIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M7 8l-3 3 3 3" />
      <path d="M17 8l3 3-3 3" />
      <path d="M14 4l-4 16" />
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l3-3" />
    </svg>
  );
}

function PeerReviewIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21v-2a4 4 0 00-3-3.87" />
      <path d="M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      <path d="M9 21v-2a4 4 0 00-4-4H4" />
      <path d="M17 11l-3 3M14 11l3 3" />
    </svg>
  );
}

function MarketIntelIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 5c5 0 9 3 11 7-2 4-6 7-11 7s-9-3-11-7c2-4 6-7 11-7z" />
      <path d="M18 4l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
    </svg>
  );
}

function PracticeAnalyticsIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M21 12a9 9 0 11-9-9" />
      <path d="M21 3l-9 9" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

/* How It Works Step Icons */
function PlugConnectIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M12 2v6M8 2v6" />
      <path d="M6 8h8a2 2 0 012 2v1a4 4 0 01-4 4h-2a4 4 0 01-4-4v-1a2 2 0 012-2z" />
      <path d="M10 15v4a3 3 0 006 0" />
    </svg>
  );
}

function ScanIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <path d="M8 12h8M8 8h8M8 16h5" />
    </svg>
  );
}

function DashboardIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function CaptureIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 3" />
      <path d="M8 2l1 3M16 2l-1 3" />
    </svg>
  );
}

/* EMR / Medical Records Icon */
function MedicalRecordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 4a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H6a2 2 0 01-2-2z" />
      <path d="M14 2v6h6" />
      <path d="M12 12v4M10 14h4" />
    </svg>
  );
}

/* Problem Stat Icons */
function MoneyLostIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M15 8.5a3 3 0 00-3-1.5 3 3 0 000 6 3 3 0 010 6 3 3 0 01-3-1.5" />
      <path d="M3 12l-1-1M21 12l1-1" />
    </svg>
  );
}

function TrendUpIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M22 7l-7.5 7.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </svg>
  );
}

function CodeMissingIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
    </svg>
  );
}

/* ─── Background Orbs ─── */
function BackgroundOrbs({ variant = "hero" }: { variant?: "hero" | "agents" }) {
  if (variant === "hero") {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-navy/8 blur-[140px]" />
      </div>
    );
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-teal-500/6 blur-[100px]" />
      <div className="absolute bottom-20 right-1/4 w-[350px] h-[350px] rounded-full bg-navy/6 blur-[100px]" />
    </div>
  );
}

/* ─── Section Label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.3em] text-teal-600 font-semibold mb-4">
      {children}
    </p>
  );
}

/* ─── Agent Card ─── */
const accentColors = [
  "border-l-teal-500",
  "border-l-teal-400",
  "border-l-teal-600",
  "border-l-navy-300",
  "border-l-teal-500",
  "border-l-teal-400",
  "border-l-navy-300",
  "border-l-teal-600",
];

function AgentCard({
  name,
  description,
  index,
  featured = false,
  icon,
}: {
  name: string;
  description: string;
  index: number;
  featured?: boolean;
  icon?: React.ReactNode;
}) {
  if (featured) {
    return (
      <div className="sm:col-span-2 lg:col-span-3 rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-teal-100 ring-2 ring-teal-500 shadow-[0_0_40px_-10px_rgba(13,115,119,0.3)] transition-all duration-300">
        <div className="flex items-center gap-3 mb-4 justify-center">
          {icon ? (
            <span className="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center">
              {icon}
            </span>
          ) : (
            <span className="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center text-sm font-bold">
              {index}
            </span>
          )}
          <h3 className="font-bold text-navy text-xl">{name}</h3>
          <span className="ml-2 text-[10px] uppercase tracking-widest font-bold text-teal bg-teal-50 px-2 py-0.5 rounded-full">
            Featured
          </span>
        </div>
        <p className="text-navy/70 leading-relaxed text-base text-center max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-teal-100/50 shadow-xl shadow-teal-500/5 border-l-4 ${accentColors[(index - 2) % accentColors.length]} hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon ? (
          <span className="w-8 h-8 rounded-full bg-teal-50 text-teal flex items-center justify-center">
            {icon}
          </span>
        ) : (
          <span className="w-8 h-8 rounded-full bg-teal-50 text-teal flex items-center justify-center text-sm font-bold">
            {index}
          </span>
        )}
        <h3 className="font-bold text-navy text-lg">{name}</h3>
      </div>
      <p className="text-navy/70 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center mb-4 shadow-lg shadow-teal-500/20">
        {icon || <span className="text-xl font-bold">{step}</span>}
      </div>
      <h3 className="font-bold text-navy text-lg mb-2">{title}</h3>
      <p className="text-navy/70 text-sm max-w-xs">{description}</p>
    </div>
  );
}

/* ─── Pricing Tier ─── */
function PricingCard({
  name,
  price,
  description,
  features,
  highlighted = false,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        highlighted
          ? "border-teal bg-white shadow-xl ring-2 ring-teal-500 shadow-[0_0_40px_-10px_rgba(13,115,119,0.3)]"
          : "border-navy/10 bg-white/70 backdrop-blur-xl shadow-xl shadow-teal-500/5"
      }`}
    >
      {highlighted && (
        <span className="inline-block bg-teal text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
          Most Popular
        </span>
      )}
      <h3 className="font-bold text-navy text-xl mb-1">{name}</h3>
      <p className="text-3xl font-bold text-navy mb-1">{price}</p>
      <p className="text-navy/60 text-sm mb-6">{description}</p>
      <ul className="space-y-3 text-sm">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-teal flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-navy/80">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── EMR Badge ─── */
function EMRBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-navy/10 bg-white/80 backdrop-blur-sm text-navy/70 text-sm font-medium hover:border-teal/40 hover:text-teal transition-all duration-300">
      <MedicalRecordIcon className="w-4 h-4" />
      {name}
    </span>
  );
}

/* ─── Surgeon Finder (NPI) ─── */

interface NPIResult {
  npi: string; firstName: string; lastName: string; credential: string;
  specialty: string; city: string; state: string; phone: string;
}

function SurgeonFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NPIResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const isNPI = /^\d{10}$/.test(query.trim());
      const param = isNPI ? `npi=${query.trim()}` : `name=${encodeURIComponent(query.trim())}`;
      const res = await fetch(`/api/npi?${param}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="find-surgeon" className="py-20 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <SectionLabel>Find Your Surgeon</SectionLabel>
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            Search by name or NPI
          </h2>
          <p className="text-navy/60 max-w-xl mx-auto">
            Every surgeon in the United States. Real-time from the CMS NPI Registry.
          </p>
        </div>

        <form onSubmit={search} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Surgeon name or 10-digit NPI..."
            className="flex-1 px-5 py-4 rounded-xl border border-navy/20 bg-white text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal text-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-teal text-white font-bold rounded-xl hover:bg-teal/90 transition-all disabled:opacity-50 cursor-pointer text-lg"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {searched && results.length === 0 && !loading && (
          <p className="text-center text-navy/40">No surgeons found. Try a different name or NPI.</p>
        )}

        {results.length > 0 && (
          <div className="space-y-3 max-w-2xl mx-auto">
            {results.map((r) => (
              <div key={r.npi} className="bg-cream rounded-2xl p-5 border border-navy/5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-navy text-lg">
                      {r.firstName} {r.lastName}{r.credential ? `, ${r.credential}` : ""}
                    </h3>
                    <p className="text-navy/60 text-sm">{r.specialty}</p>
                    <p className="text-navy/40 text-xs mt-1">{r.city}, {r.state} &middot; NPI: {r.npi}</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-bold shrink-0">
                    View Revenue
                  </span>
                </div>
              </div>
            ))}
            <p className="text-center text-navy/30 text-xs mt-4">Source: CMS NPPES NPI Registry. Updated in real-time.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Wonder Bill Demo ─── */

const WONDER_BILL_EXAMPLES = [
  {
    scenario: "45-min office visit, 72-year-old diabetic, bilateral knee OA, steroid injection right knee, ordered PT",
    codes: [
      { code: "99214", desc: "Office visit, moderate complexity", revenue: "$128" },
      { code: "20610", desc: "Arthrocentesis, major joint (injection)", revenue: "$108" },
      { code: "99490", desc: "CCM — chronic care mgmt (diabetes + OA)", revenue: "$64/mo" },
      { code: "98980", desc: "RTM — remote therapeutic monitoring setup", revenue: "$21" },
      { code: "98981", desc: "RTM — device supply, 16+ days", revenue: "$56/mo" },
      { code: "97110", desc: "PT eval referral coordination", revenue: "$42" },
    ],
    total: "$419 + $120/mo recurring",
    missed: "$1,440/yr from CCM + RTM alone",
  },
  {
    scenario: "Post-op follow-up, total hip replacement, 8 weeks out, doing well, cleared for full activity",
    codes: [
      { code: "99213", desc: "Office visit, low complexity (post-op)", revenue: "$92" },
      { code: "98980", desc: "RTM setup — remote monitoring post-THR", revenue: "$21" },
      { code: "98981", desc: "RTM supply — wearable tracking", revenue: "$56/mo" },
      { code: "98977", desc: "RTM treatment mgmt — PT adherence", revenue: "$51/mo" },
      { code: "71060", desc: "PROM collection (HOOS/WOMAC)", revenue: "$18" },
    ],
    total: "$131 + $107/mo recurring",
    missed: "$1,284/yr in RTM revenue per patient",
  },
  {
    scenario: "New patient, shoulder pain 3 months, MRI shows rotator cuff tear, discussing surgical vs conservative",
    codes: [
      { code: "99204", desc: "New patient, moderate complexity", revenue: "$198" },
      { code: "99497", desc: "ACP — advance care planning discussion", revenue: "$92" },
      { code: "20610", desc: "Diagnostic injection (if performed)", revenue: "$108" },
      { code: "99490", desc: "CCM — if comorbidities present", revenue: "$64/mo" },
      { code: "96127", desc: "Brief emotional screening (surgical anxiety)", revenue: "$12" },
    ],
    total: "$410 + $64/mo if CCM eligible",
    missed: "$768/yr from CCM on comorbid patients",
  },
];

function WonderBillDemo() {
  const [selectedExample, setSelectedExample] = useState<number | null>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [showResult, setShowResult] = useState(false);

  function handleTryIt(index: number) {
    setSelectedExample(index);
    setShowResult(false);
    setTimeout(() => setShowResult(true), 800);
  }

  return (
    <section id="wonder-bill" className="py-20 px-6 bg-navy text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-400 font-semibold mb-4">The Revenue Pipeline</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Wonder Bill
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-lg">
            From op note to bank account. Five stages. Zero revenue left behind.
          </p>
        </div>

        {/* 5-Stage Pipeline */}
        <div className="grid sm:grid-cols-5 gap-3 mb-12">
          {[
            { num: "1", name: "Op Note Optimizer", desc: "Paste your note. AI finds unbundled codes you didn't document." },
            { num: "2", name: "Voice-to-Bill", desc: "Talk after surgery. AI translates to CPT codes automatically." },
            { num: "3", name: "Biller Advocate", desc: "AI fights your biller when they push back. Cites your note." },
            { num: "4", name: "Discrepancy Dashboard", desc: "What AI says vs. what biller submitted. Red lines = lost money." },
            { num: "5", name: "EMR Suggester", desc: "In clinic: 'Add this phrase to bill 99214 instead of 99213.'" },
          ].map((stage) => (
            <div key={stage.num} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
              <div className="w-8 h-8 rounded-full bg-teal/20 text-teal font-bold text-sm flex items-center justify-center mx-auto mb-2">{stage.num}</div>
              <h3 className="font-bold text-sm text-white mb-1">{stage.name}</h3>
              <p className="text-white/40 text-xs leading-relaxed">{stage.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-white/30 text-xs mb-8">Try it below — click a scenario to see Stage 1 in action</p>

        {/* Example scenarios */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {WONDER_BILL_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => handleTryIt(i)}
              className={`text-left p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedExample === i
                  ? "border-teal bg-teal/10"
                  : "border-white/10 bg-white/5 hover:border-white/30"
              }`}
            >
              <p className="text-xs text-teal-400 font-semibold mb-2">Example {i + 1}</p>
              <p className="text-sm text-white/80 leading-relaxed">{ex.scenario}</p>
            </button>
          ))}
        </div>

        {/* Result */}
        {selectedExample !== null && (
          <div className="rounded-2xl border border-teal/30 overflow-hidden">
            <div className="bg-teal/10 px-6 py-4 border-b border-teal/20">
              <div className="flex items-center gap-3">
                <BillingOptimizerIcon className="w-5 h-5 text-teal-400" />
                <span className="font-bold text-teal-400">Wonder Bill</span>
                {!showResult && (
                  <div className="flex gap-1.5 ml-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
            {showResult && (
              <div className="p-6">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-4">Billable codes identified</p>
                <div className="space-y-3 mb-6">
                  {WONDER_BILL_EXAMPLES[selectedExample].codes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-teal-400 font-bold text-sm">{c.code}</span>
                        <span className="text-sm text-white/70">{c.desc}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{c.revenue}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 grid sm:grid-cols-2 gap-4">
                  <div className="bg-teal/10 rounded-xl p-4">
                    <p className="text-xs text-teal-400 font-semibold uppercase tracking-wider mb-1">This encounter</p>
                    <p className="text-xl font-bold text-white">{WONDER_BILL_EXAMPLES[selectedExample].total}</p>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-4">
                    <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">What you&apos;re missing</p>
                    <p className="text-xl font-bold text-red-400">{WONDER_BILL_EXAMPLES[selectedExample].missed}</p>
                  </div>
                </div>
                <p className="text-xs text-white/30 mt-4 text-center">This is a demo. In Claude Desktop with the SurgeonValue connector, Wonder Bill analyzes YOUR real encounters.</p>
              </div>
            )}
          </div>
        )}

        {/* Or type your own */}
        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm mb-3">Or try it live in Claude Desktop:</p>
          <div className="bg-white/5 rounded-xl p-4 max-w-lg mx-auto border border-white/10">
            <p className="font-mono text-sm text-teal-400">&quot;I just did [your scenario]. What can I bill for this?&quot;</p>
          </div>
          <p className="text-white/30 text-xs mt-3">The SurgeonValue MCP connector is already installed. Just ask Claude.</p>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const featuredAgent = {
    name: "Prior Auth Agent",
    tagline: "Peer-to-peer-ready medical necessity letters in 60 seconds",
    description:
      "Paste a clinical note. Get a complete prior auth letter with ICD-10/CPT codes, guideline citations, and preemptive denial rebuttals. Your MA stops writing letters. Your patients stop waiting.",
  };

  const agents = [
    {
      name: "Wonder Bill",
      description:
        "\"I wonder if I can bill for this?\" Paste a scenario. Get the CPT code, documentation requirements, and revenue estimate in seconds. Every surgeon's favorite question, finally answered instantly.",
      icon: <BillingOptimizerIcon className="w-5 h-5" />,
    },
    {
      name: "Revenue Scanner",
      description:
        "Scans your full patient panel and identifies every billable code you qualify for but aren't capturing.",
      icon: <BillingOptimizerIcon className="w-5 h-5" />,
    },
    {
      name: "Documentation Agent",
      description:
        "Auto-generates the clinical documentation required for each code, ready for physician review.",
      icon: <DocumentationIcon className="w-5 h-5" />,
    },
    {
      name: "RTM Monitor",
      description:
        "Tracks Remote Therapeutic Monitoring eligibility and manages the 16-day device requirement automatically.",
      icon: <RTMCCMIcon className="w-5 h-5" />,
    },
    {
      name: "CCM Coordinator",
      description:
        "Identifies Chronic Care Management-eligible patients and coordinates the 20-minute monthly touchpoint.",
      icon: <SchedulingIcon className="w-5 h-5" />,
    },
    {
      name: "PCM Manager",
      description:
        "Finds Principal Care Management opportunities for patients with a single high-complexity chronic condition.",
      icon: <PracticeAnalyticsIcon className="w-5 h-5" />,
    },
    {
      name: "Referral Tracker",
      description:
        "Monitors inbound and outbound referrals, closes the loop on follow-ups, and prevents referral leakage.",
      icon: <ReferralNetworkIcon className="w-5 h-5" />,
    },
    {
      name: "PROM Collector",
      description:
        "Deploys Patient-Reported Outcome Measures at the right intervals and feeds data back to your dashboard.",
      icon: <PeerReviewIcon className="w-5 h-5" />,
    },
    {
      name: "Patient Engagement",
      description:
        "Sends automated check-ins, appointment reminders, and post-op protocols via the patient's preferred channel.",
      icon: <PatientAcquisitionIcon className="w-5 h-5" />,
    },
    {
      name: "Claim Submission",
      description:
        "Validates claims against payer rules, formats CMS-1500/UB-04, submits to clearinghouse, and tracks until acceptance. No dirty claims leave here.",
      icon: <DocumentationIcon className="w-5 h-5" />,
    },
    {
      name: "Payment Posting",
      description:
        "Processes ERA/835 files, matches payments to claims, reconciles against contracted rates, flags underpayments. Every dollar tracked.",
      icon: <BillingOptimizerIcon className="w-5 h-5" />,
    },
    {
      name: "AR Management",
      description:
        "Monitors A/R aging, prioritizes follow-ups by dollar and deadline, escalates stale claims, forecasts collections. No valid claim goes unpaid.",
      icon: <PracticeAnalyticsIcon className="w-5 h-5" />,
    },
    {
      name: "Denials Fighter",
      description:
        "Categorizes denials by CARC/RARC code, drafts appeal letters citing your operative note and CPT guidelines, tracks through all appeal levels. Many denials are wrong.",
      icon: <PriorAuthIcon className="w-5 h-5" />,
    },
    {
      name: "Patient Billing",
      description:
        "Calculates patient responsibility, generates clear statements, offers payment plans, checks HSA/FSA eligibility via ComfortCard. Clear billing = paid bills.",
      icon: <PatientAcquisitionIcon className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur-lg border-b border-navy/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 text-teal">
            <BrandMark />
            <span className="font-bold text-xl text-navy">SurgeonValue</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-navy/70">
            <a href="#find-surgeon" className="hover:text-teal transition-colors">
              Find Surgeon
            </a>
            <a href="#wonder-bill" className="hover:text-teal transition-colors">
              Wonder Bill
            </a>
            <a href="#agents" className="hover:text-teal transition-colors">
              Agents
            </a>
            <a href="#pricing" className="hover:text-teal transition-colors">
              Pricing
            </a>
            <a
              href="#hero"
              className="px-4 py-2 bg-teal text-white rounded-xl font-semibold hover:bg-teal/90 hover:shadow-lg transition-all duration-300"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section id="hero" className="relative py-28 px-6">
        <BackgroundOrbs variant="hero" />
        <div className="relative max-w-4xl mx-auto text-center">
          <SectionLabel>AI-Powered Revenue Recovery</SectionLabel>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-br from-navy to-teal bg-clip-text text-transparent">
            Your practice is leaving{" "}
            $240,000 on the table.
          </h1>
          <p className="text-xl text-navy/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            From op note to bank account. 19 AI agents handle your entire revenue cycle — charge capture, claim submission, denials, collections.{" "}
            <span className="font-semibold text-navy">$20 per encounter. Only when you bill.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#agents" className="px-8 py-4 bg-teal text-white font-bold text-lg rounded-xl hover:bg-teal/90 hover:shadow-lg transition-all duration-300 hover:scale-105">
              See the 19 agents
            </a>
            <a href="#wonder-bill" className="px-8 py-4 bg-navy text-white font-bold text-lg rounded-xl hover:bg-navy/90 hover:shadow-lg transition-all duration-300 hover:scale-105">
              Try Wonder Bill
            </a>
          </div>
        </div>
      </section>

      {/* ─── Surgeon Finder ─── */}
      <SurgeonFinder />

      {/* ─── The Problem ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              The codes exist. You just aren&apos;t billing them.
            </h2>
            <p className="text-navy/60 max-w-2xl mx-auto mb-14">
              Medicare created these codes. Your patients qualify. The money is
              sitting there.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-cream rounded-3xl p-8 text-center border border-navy/5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-3">
                <MoneyLostIcon className="w-8 h-8 text-teal/50" />
              </div>
              <p className="text-5xl font-bold text-teal mb-3">96%</p>
              <p className="text-navy/70">
                of CCM-eligible patients aren&apos;t enrolled. That&apos;s revenue walking
                out the door every month.
              </p>
            </div>
            <div className="bg-cream rounded-3xl p-8 text-center border border-navy/5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-3">
                <TrendUpIcon className="w-8 h-8 text-teal/50" />
              </div>
              <p className="text-5xl font-bold text-teal mb-3">373%</p>
              <p className="text-navy/70">
                RTM growth year over year. But less than 0.2% of eligible
                practices are billing it.
              </p>
            </div>
            <div className="bg-cream rounded-3xl p-8 text-center border border-navy/5 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
              <div className="flex justify-center mb-3">
                <CodeMissingIcon className="w-8 h-8 text-teal/50" />
              </div>
              <p className="text-5xl font-bold text-teal mb-3">PCM</p>
              <p className="text-navy/70">
                Principal Care Management codes exist that most surgeons have
                never heard of. Higher reimbursement, lower threshold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9 Agents ─── */}
      <section id="agents" className="relative py-20 px-6">
        <BackgroundOrbs variant="agents" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center">
            <SectionLabel>The Platform</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              19 agents. One mission: get you paid.
            </h2>
            <p className="text-navy/60 max-w-2xl mx-auto mb-14">
              Each agent handles a specific revenue stream. They work your panel
              24/7 so your staff doesn&apos;t have to.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AgentCard
              name={featuredAgent.name}
              description={`${featuredAgent.tagline} — ${featuredAgent.description}`}
              index={1}
              featured
              icon={<PriorAuthIcon className="w-5 h-5" />}
            />
            {agents.map((agent, i) => (
              <AgentCard
                key={agent.name}
                name={agent.name}
                description={agent.description}
                index={i + 2}
                icon={agent.icon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Wonder Bill Demo ─── */}
      <WonderBillDemo />

      {/* ─── Full RCM Pipeline ─── */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <SectionLabel>Full Revenue Cycle</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              From surgery to bank account. Every step automated.
            </h2>
            <p className="text-navy/60 max-w-2xl mx-auto">
              Most platforms handle one piece. SurgeonValue handles the entire revenue cycle — 7 stages, 19 agents, one harness.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {[
              { step: "1", name: "Op Note", desc: "Wonder Bill optimizes documentation before it's finalized", color: "bg-teal" },
              { step: "2", name: "Charge Capture", desc: "Every code identified, modifiers checked, unbundling verified", color: "bg-teal/90" },
              { step: "3", name: "Claim Submit", desc: "Validated against payer rules, formatted, submitted clean", color: "bg-teal/80" },
              { step: "4", name: "Payment Post", desc: "ERA processed, reconciled against contracted rates", color: "bg-teal/70" },
              { step: "5", name: "AR Manage", desc: "Aging tracked, follow-ups prioritized, collections forecast", color: "bg-navy/80" },
              { step: "6", name: "Denials", desc: "Categorized, appealed with citations, patterns prevented", color: "bg-navy/70" },
              { step: "7", name: "Patient Bill", desc: "Clear statements, payment plans, HSA/FSA via ComfortCard", color: "bg-navy/60" },
            ].map((s) => (
              <div key={s.step} className={`${s.color} rounded-2xl p-5 text-white text-center`}>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2 text-sm font-bold">{s.step}</div>
                <h3 className="font-bold text-sm mb-1">{s.name}</h3>
                <p className="text-white/70 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-navy/40 text-sm">Claimocity and other RCM platforms charge per-provider SaaS fees. We charge <span className="font-bold text-navy">$20 per encounter, only when you bill.</span></p>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-14">
              Four steps to captured revenue
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <StepCard
              step={1}
              title="Connect EMR"
              description="Epic, Cerner, athena, eCW, ModMed, DrChrono. One-click integration."
              icon={<PlugConnectIcon className="w-7 h-7" />}
            />
            <StepCard
              step={2}
              title="AI Scans Panel"
              description="19 agents analyze your full patient panel and surface every missed code."
              icon={<ScanIcon className="w-7 h-7" />}
            />
            <StepCard
              step={3}
              title="Physician Attests"
              description="ClinicalSwipe puts each code in front of a physician. Swipe right to attest, left to skip."
              icon={<DashboardIcon className="w-7 h-7" />}
            />
            <StepCard
              step={4}
              title="Revenue Captured"
              description="You bill under your own NPI. We take $20 per encounter. That's it."
              icon={<CaptureIcon className="w-7 h-7" />}
            />
          </div>
        </div>
      </section>

      {/* ─── EMR Integrations ─── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <SectionLabel>Integrations</SectionLabel>
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-8">
            Connect your EMR in minutes
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <EMRBadge name="Epic" />
            <EMRBadge name="Cerner" />
            <EMRBadge name="athenahealth" />
            <EMRBadge name="eClinicalWorks" />
            <EMRBadge name="ModMed" />
            <EMRBadge name="DrChrono" />
          </div>
          <p className="text-navy/50 text-sm mt-6">
            FHIR-native. HIPAA-compliant. One-click connection.
          </p>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Simple pricing. You only pay when you bill.
            </h2>
            <p className="text-navy/60 max-w-xl mx-auto mb-14">
              Every tier includes the $20/encounter fee only when you actually
              capture revenue.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Free"
              price="$0"
              description="See what you're missing"
              features={[
                "Revenue dashboard",
                "Panel analysis report",
                "Missed code summary",
                "No agents active",
                "$20/encounter when you upgrade",
              ]}
            />
            <PricingCard
              name="Core"
              price="$199/mo"
              description="5 agents active"
              features={[
                "Choose any 5 agents",
                "EMR integration",
                "Monthly revenue reports",
                "ClinicalSwipe attestation",
                "$20/encounter fee",
                "Email support",
              ]}
            />
            <PricingCard
              name="Pro"
              price="$299/mo"
              description="All 19 agents + priority"
              highlighted
              features={[
                "All 19 agents active",
                "EMR integration",
                "Real-time revenue dashboard",
                "ClinicalSwipe attestation",
                "$20/encounter fee",
                "Priority support",
                "Quarterly revenue review",
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── ClinicalSwipe ─── */}
      <section className="py-20 px-6 bg-navy text-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300 font-semibold mb-4">
            Attestation Layer
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AI finds the code. Your physician attests. You get paid.
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto mb-14">
            ClinicalSwipe is the attestation layer that makes it all compliant.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="w-16 h-16 rounded-full bg-teal/20 text-teal flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">AI Identifies Code</h3>
              <p className="text-white/60 text-sm">
                Revenue Scanner finds a billable code your practice qualifies
                for.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-teal/20 text-teal flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Physician Reviews</h3>
              <p className="text-white/60 text-sm">
                ClinicalSwipe presents the case. Swipe right to attest, left to
                skip. 10-20 per hour.
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-teal/20 text-teal flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">You Bill, You Keep It</h3>
              <p className="text-white/60 text-sm">
                Bill under your own NPI. The revenue is yours. We take a flat
                $20 per encounter.
              </p>
            </div>
          </div>
          <a
            href="https://www.solvinghealth.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-10 px-6 py-3 border border-teal text-teal rounded-xl font-semibold hover:bg-teal/10 transition-all duration-300"
          >
            Learn more about ClinicalSwipe
          </a>
        </div>
      </section>

      {/* ─── Revenue Calculator ─── */}
      <section id="calculator" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <SectionLabel>Revenue Calculator</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-14">
              What is your panel worth?
            </h2>
          </div>
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 border border-teal-100/50 shadow-xl shadow-teal-500/5">
            <div className="grid md:grid-cols-3 gap-8 items-end mb-10">
              <div className="text-center">
                <p className="text-sm text-navy/60 mb-2">Your patient panel</p>
                <p className="text-4xl font-bold text-navy">250</p>
                <p className="text-xs text-navy/40 mt-1">
                  average surgical practice
                </p>
              </div>
              <div className="text-center text-3xl text-navy/30 font-light hidden md:block">
                x
              </div>
              <div className="text-center">
                <p className="text-sm text-navy/60 mb-2">
                  Revenue per patient/year
                </p>
                <p className="text-4xl font-bold text-navy">$962</p>
                <p className="text-xs text-navy/40 mt-1">
                  CCM + RTM + PCM codes
                </p>
              </div>
            </div>
            <div className="border-t border-navy/10 pt-8 text-center">
              <p className="text-sm text-navy/60 mb-2">
                Estimated annual missed revenue
              </p>
              <p className="text-5xl md:text-6xl font-bold text-teal">
                $240,500
              </p>
              <p className="text-navy/50 mt-4 text-lg">
                Your number is probably higher.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Get Started ─── */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal to-teal/80 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Your Free Panel Scan
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            See exactly how much revenue your practice is missing. Free tier available indefinitely. Upgrade only when the math makes sense for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => document.getElementById('find-surgeon')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="px-8 py-4 bg-white text-teal font-bold text-lg rounded-xl hover:bg-white/90 transition-all hover:scale-105 cursor-pointer">
              Find Your Practice
            </button>
            <button onClick={() => document.getElementById('connector')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="px-8 py-4 bg-white/10 border-2 border-white/30 text-white font-bold text-lg rounded-xl hover:bg-white/20 transition-all cursor-pointer">
              Install the Connector
            </button>
          </div>
        </div>
      </section>

      {/* ─── Connector ─── */}
      <section id="connector" className="py-24 px-6 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            Get the SurgeonValue connector
          </h2>
          <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
            Add the SolvingHealth connector to Claude and get instant access to billing optimization, missed code detection, and practice analytics.
          </p>
          <div className="bg-white rounded-2xl border border-navy/10 p-6 text-left max-w-lg mx-auto mb-8">
            <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">Claude Desktop MCP Config</p>
            <pre className="text-sm text-navy overflow-x-auto whitespace-pre font-mono leading-relaxed">{`"surgeonvalue": {
  "command": "npx",
  "args": ["-y", "@anthropic-ai/mcp-remote",
    "https://www.solvinghealth.com/mcp"]
}`}</pre>
          </div>
          <p className="text-muted text-sm">
            Don&apos;t have Claude? Get it free at{" "}
            <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-teal font-medium hover:underline">claude.ai</a>
            {" "}or use the chat and voice widgets on this page.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-14 px-6 bg-navy text-white/60">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-white">
              <BrandMark className="w-6 h-6" />
              <span className="font-bold text-lg">SurgeonValue</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a
                href="https://www.solvinghealth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                SolvingHealth
              </a>
              <a
                href="https://www.solvinghealth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                ClinicalSwipe
              </a>
              <a
                href="https://www.co-op.care"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                co-op.care
              </a>
              <a
                href="https://www.surgeonvalue.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                The Missed Code
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs text-white/40">
            Built entirely by AI. &copy; {new Date().getFullYear()}{" "}
            SurgeonValue. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
