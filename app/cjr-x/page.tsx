import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CJR-X: What It Means for Your Practice | SurgeonValue",
  description:
    "CMS just proposed CJR-X — the first nationwide mandatory episode-based payment model for joint replacements. 2,500+ hospitals. 90-day episodes. Here's what orthopedic surgeons need to know.",
  openGraph: {
    title: "CJR-X Is Coming. Do You Know Your Episode Cost?",
    description:
      "2,500+ hospitals. 90-day episodes. Mandatory. SurgeonValue helps you prepare.",
    url: "https://surgeonvalue.com/cjr-x",
    siteName: "SurgeonValue",
    type: "website",
  },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.3em] text-teal-600 font-semibold mb-4">
      {children}
    </p>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function AlertIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function DollarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v12" />
      <path d="M15 8.5a3 3 0 00-3-1.5 3 3 0 000 6 3 3 0 010 6 3 3 0 01-3-1.5" />
    </svg>
  );
}

function ClockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function HospitalIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" />
      <path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
      <path d="M12 7v4M10 9h4" />
    </svg>
  );
}

function CalendarIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

const stats = [
  { value: "2,500+", label: "Hospitals affected", icon: HospitalIcon },
  { value: "90 days", label: "Episode window", icon: ClockIcon },
  { value: "$112.7M", label: "Prior CJR savings", icon: DollarIcon },
  { value: "Oct 2027", label: "Mandatory start", icon: CalendarIcon },
];

const agents = [
  {
    name: "Wonder Bill",
    desc: "Scan your panel for billable codes you qualify for but don't bill",
    cjrx: "Find revenue hiding inside your 90-day episode window",
  },
  {
    name: "Revenue Scanner",
    desc: "Panel-wide missed-code identification",
    cjrx: "Model total episode cost against CJR-X target prices",
  },
  {
    name: "Prior Auth Agent",
    desc: "Peer-to-peer-ready letters in 60 seconds",
    cjrx: "Eliminate auth delays that extend episodes and blow target prices",
  },
  {
    name: "PROM Collector",
    desc: "Automated patient-reported outcomes via voice",
    cjrx: "Collect PROMIS / HOOS / KOOS at baseline and 90 days",
  },
  {
    name: "Documentation Agent",
    desc: "Ensure encounters support codes billed",
    cjrx: "Audit-ready documentation for every episode service",
  },
  {
    name: "RTM/CCM Enrollment",
    desc: "Remote monitoring and chronic care coordination",
    cjrx: "Capture 98975-98981, 99490, 99491 within every episode",
  },
];

const timeline = [
  { date: "April 2026", event: "Proposed rule published. Comment period opens.", status: "now" },
  { date: "April 2026", event: "Prior auth reform proposed: 24-hr urgent / 72-hr standard decisions, FHIR-based electronic PA.", status: "now" },
  { date: "Late 2026", event: "FY2027 IPPS Final Rule. CJR-X finalized.", status: "upcoming" },
  { date: "Oct 1, 2027", event: "CJR-X mandatory for most hospitals. Performance begins.", status: "upcoming" },
];

export default function CJRXPage() {
  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-navy/8 blur-[140px]" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <AlertIcon className="w-4 h-4" />
            CMS Proposed Rule — April 10, 2026
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy tracking-tight leading-[1.1] mb-6">
            CJR-X is coming.
            <br />
            <span className="text-teal">Do you know your episode cost?</span>
          </h1>

          <p className="text-lg sm:text-xl text-navy/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            CMS just proposed the first <strong>nationwide mandatory</strong> episode-based
            payment model for hip, knee, and ankle replacements.
            2,500+ hospitals. 90-day episodes. No opt-out.
          </p>

          <a
            href="#demo"
            className="inline-flex items-center justify-center rounded-full bg-teal px-8 py-3.5 text-white font-semibold text-base hover:bg-teal-600 transition-colors"
          >
            See what you're leaving on the table
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-navy text-white py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="flex justify-center mb-2">
                <s.icon className="w-6 h-6 text-teal-300" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold">{s.value}</div>
              <div className="text-sm text-white/60 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What CJR-X Means */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <SectionLabel>What changed</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-8">
          Every post-op decision now has a dollar sign
        </h2>
        <div className="space-y-6 text-navy/80 text-lg leading-relaxed">
          <p>
            Under CJR-X, CMS sets a <strong>target price</strong> for every joint replacement
            episode. That target covers the procedure <em>plus everything for 90 days after
            discharge</em> — physical therapy, follow-up visits, imaging, DME, readmissions.
          </p>
          <p>
            Come in under the target? Your hospital shares in the savings.
            Come in over? Your hospital absorbs the difference.
          </p>
          <p>
            Which SNF. How many PT visits. When to see the patient back.
            <strong> These are now financial decisions, not just clinical ones.</strong>
          </p>
        </div>

        {/* CJR-X vs TEAM comparison */}
        <div className="mt-12 rounded-2xl bg-white/70 backdrop-blur-xl border border-teal-100 overflow-hidden">
          <div className="bg-navy/5 px-6 py-4 border-b border-teal-100">
            <h3 className="font-semibold text-navy">CJR-X vs. TEAM — Side by Side</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-teal-100">
                  <th className="text-left px-6 py-3 text-navy/50 font-medium"></th>
                  <th className="text-left px-6 py-3 text-teal font-semibold">CJR-X (Proposed)</th>
                  <th className="text-left px-6 py-3 text-navy/60 font-medium">TEAM (Active)</th>
                </tr>
              </thead>
              <tbody className="text-navy/80">
                <tr className="border-b border-teal-50">
                  <td className="px-6 py-3 font-medium text-navy">Scope</td>
                  <td className="px-6 py-3">Joints only (hip, knee, ankle)</td>
                  <td className="px-6 py-3">5 episode types</td>
                </tr>
                <tr className="border-b border-teal-50">
                  <td className="px-6 py-3 font-medium text-navy">Episode window</td>
                  <td className="px-6 py-3 font-semibold text-teal">90 days</td>
                  <td className="px-6 py-3">30 days</td>
                </tr>
                <tr className="border-b border-teal-50">
                  <td className="px-6 py-3 font-medium text-navy">Mandatory?</td>
                  <td className="px-6 py-3">Yes, nationwide</td>
                  <td className="px-6 py-3">Yes, 188 metros</td>
                </tr>
                <tr className="border-b border-teal-50">
                  <td className="px-6 py-3 font-medium text-navy">Hospitals</td>
                  <td className="px-6 py-3 font-semibold text-teal">2,500+</td>
                  <td className="px-6 py-3">741</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-medium text-navy">Performance start</td>
                  <td className="px-6 py-3">Oct 2028</td>
                  <td className="px-6 py-3">Jan 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What Surgeons Must Do */}
      <section className="bg-navy/[0.03] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <SectionLabel>Preparation checklist</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-10">
            What to do now — not in 2028
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Know your episode cost",
                desc: "What does a total knee actually cost over 90 days? Most surgeons can't answer. The winners will know before performance year starts.",
              },
              {
                title: "Audit your billing",
                desc: "RTM (98975-98981), CCM (99490-99491), prolonged services (99417), caregiver training (96202-96203) — every unbilled code is money left on the table.",
              },
              {
                title: "Track post-acute utilization",
                desc: "SNF days, home health visits, ED visits, readmissions — all count against your episode. Understand your referral patterns now.",
              },
              {
                title: "Collect patient-reported outcomes",
                desc: "PRO collection is required under TEAM and likely under CJR-X. PROMIS, HOOS/KOOS at baseline and 90 days. Start now.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/70 backdrop-blur-xl border border-teal-100 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center">
                    <CheckIcon className="w-4 h-4" />
                  </span>
                  <h3 className="font-semibold text-navy">{item.title}</h3>
                </div>
                <p className="text-navy/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How SurgeonValue Helps */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <SectionLabel>Built for this</SectionLabel>
        <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
          SurgeonValue was designed for episode-based payment
        </h2>
        <p className="text-navy/70 text-lg mb-10 max-w-2xl">
          AI agents that scan your panel, find missed revenue, and prepare your practice for
          CJR-X — with physician attestation on every recommendation.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {agents.map((a) => (
            <div
              key={a.name}
              className="rounded-2xl bg-white/70 backdrop-blur-xl border border-teal-100 p-6 hover:ring-1 hover:ring-teal-300 transition-all"
            >
              <h3 className="font-semibold text-navy mb-2">{a.name}</h3>
              <p className="text-sm text-navy/60 mb-3">{a.desc}</p>
              <p className="text-sm text-teal font-medium">{a.cjrx}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-navy text-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <SectionLabel>Timeline</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold mb-10">
            CJR-X roadmap
          </h2>
          <div className="space-y-0">
            {timeline.map((t, i) => (
              <div key={t.date} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full mt-1.5 ${
                      t.status === "now" ? "bg-teal-300 ring-4 ring-teal-300/30" : "bg-white/30"
                    }`}
                  />
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-white/20 my-1" />
                  )}
                </div>
                <div className="pb-8">
                  <div
                    className={`text-sm font-semibold ${
                      t.status === "now" ? "text-teal-300" : "text-white/50"
                    }`}
                  >
                    {t.date}
                    {t.status === "now" && (
                      <span className="ml-2 text-xs bg-teal-300/20 px-2 py-0.5 rounded-full">
                        NOW
                      </span>
                    )}
                  </div>
                  <div className="text-white/80 mt-1">{t.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prior Auth Reform */}
      <section className="bg-navy/[0.03] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <SectionLabel>Also proposed April 10, 2026</SectionLabel>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-6">
            CMS is killing the fax machine for prior auth
          </h2>
          <p className="text-navy/70 text-lg mb-8 max-w-3xl leading-relaxed">
            The same day CJR-X dropped, CMS proposed mandatory electronic prior authorization
            across Medicare Advantage, Medicaid, CHIP, and exchange plans — with{" "}
            <strong>24-hour deadlines for urgent requests</strong> and{" "}
            <strong>72-hour deadlines for standard requests</strong>. FHIR-based. Public reporting
            of denial rates. Compliance starting 2027.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-teal-100 p-6 text-center">
              <div className="text-3xl font-bold text-teal mb-1">24 hrs</div>
              <div className="text-sm text-navy/60">Urgent PA decisions</div>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-teal-100 p-6 text-center">
              <div className="text-3xl font-bold text-teal mb-1">72 hrs</div>
              <div className="text-sm text-navy/60">Standard PA decisions</div>
            </div>
            <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-teal-100 p-6 text-center">
              <div className="text-3xl font-bold text-teal mb-1">FHIR</div>
              <div className="text-sm text-navy/60">Replaces X12N 278</div>
            </div>
          </div>
          <p className="text-navy/70 mt-8 text-base leading-relaxed">
            SurgeonValue&apos;s <strong>Prior Auth Agent</strong> generates peer-to-peer-ready
            authorization letters from operative notes in 60 seconds — built for exactly this
            new electronic standard.
          </p>
        </div>
      </section>

      {/* CTA / Demo */}
      <section id="demo" className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
          One question to start
        </h2>
        <p className="text-xl text-navy/70 mb-10">
          How much revenue is your practice leaving on the table today?
          <br />
          <strong>We can answer that in 60 seconds.</strong>
        </p>

        <form
          action="https://formspree.io/f/your-form-id"
          method="POST"
          className="max-w-md mx-auto space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Your name"
            required
            className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            name="npi"
            placeholder="NPI (optional)"
            className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select
            name="ehr"
            className="w-full rounded-xl border border-teal-200 bg-white px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">EHR System</option>
            <option value="epic">Epic</option>
            <option value="athena">athenahealth</option>
            <option value="cerner">Oracle Cerner</option>
            <option value="ecw">eClinicalWorks</option>
            <option value="modmed">ModMed</option>
            <option value="other">Other</option>
          </select>
          <button
            type="submit"
            className="w-full rounded-full bg-teal px-8 py-3.5 text-white font-semibold text-base hover:bg-teal-600 transition-colors"
          >
            Show me my missed revenue
          </button>
        </form>

        <p className="text-sm text-navy/40 mt-6">
          No integration required. We can start with your NPI alone.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-navy/10 py-8 text-center text-sm text-navy/40">
        <p>
          SurgeonValue by SolvingHealth LLC | Physician-governed AI
        </p>
        <p className="mt-2">
          CJR-X is a proposed rule in the FY2027 IPPS. Comment period open via the Federal Register.
        </p>
      </footer>
    </main>
  );
}
