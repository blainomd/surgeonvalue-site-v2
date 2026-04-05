"use client";

import { useState } from "react";

/* ─── SVG Icon ─── */
function ScalpelIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 45" className={className}>
      <path
        d="M8 38C15 28 22 18 34 8"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30 14L34 8L38 14"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect
        x="4"
        y="34"
        width="5"
        height="10"
        rx="2.5"
        fill="currentColor"
        transform="rotate(-8, 6, 39)"
      />
    </svg>
  );
}

/* ─── Email Form ─── */
function EmailCapture({
  source,
  cta = "See My Missed Revenue",
  placeholder = "you@practice.com",
}: {
  source: string;
  cta?: string;
  placeholder?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setStatus("done");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-teal font-semibold text-lg">
        We will be in touch. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-lg">
      <input
        type="email"
        required
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 px-4 py-3 rounded-lg border border-navy/20 bg-white text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-teal text-white font-semibold rounded-lg hover:bg-teal/90 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
      >
        {status === "loading" ? "..." : cta}
      </button>
    </form>
  );
}

/* ─── Agent Card ─── */
function AgentCard({
  name,
  description,
  index,
}: {
  name: string;
  description: string;
  index: number;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-navy/10 hover:border-teal/40 hover:shadow-lg transition-all">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-full bg-teal/10 text-teal flex items-center justify-center text-sm font-bold">
          {index}
        </span>
        <h3 className="font-bold text-navy text-lg">{name}</h3>
      </div>
      <p className="text-navy/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-teal text-white flex items-center justify-center text-xl font-bold mb-4">
        {step}
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
      className={`rounded-xl p-8 border ${
        highlighted
          ? "border-teal bg-white shadow-xl ring-2 ring-teal/20"
          : "border-navy/10 bg-white"
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

/* ─── Main Page ─── */
export default function Home() {
  const agents = [
    {
      name: "Revenue Scanner",
      description:
        "Scans your full patient panel and identifies every billable code you qualify for but aren't capturing.",
    },
    {
      name: "Documentation Agent",
      description:
        "Auto-generates the clinical documentation required for each code, ready for physician review.",
    },
    {
      name: "RTM Monitor",
      description:
        "Tracks Remote Therapeutic Monitoring eligibility and manages the 16-day device requirement automatically.",
    },
    {
      name: "CCM Coordinator",
      description:
        "Identifies Chronic Care Management-eligible patients and coordinates the 20-minute monthly touchpoint.",
    },
    {
      name: "PCM Manager",
      description:
        "Finds Principal Care Management opportunities for patients with a single high-complexity chronic condition.",
    },
    {
      name: "Prior Auth Agent",
      description:
        "Handles prior authorization workflows, tracks status, and escalates denials before they expire.",
    },
    {
      name: "Referral Tracker",
      description:
        "Monitors inbound and outbound referrals, closes the loop on follow-ups, and prevents referral leakage.",
    },
    {
      name: "PROM Collector",
      description:
        "Deploys Patient-Reported Outcome Measures at the right intervals and feeds data back to your dashboard.",
    },
    {
      name: "Patient Engagement",
      description:
        "Sends automated check-ins, appointment reminders, and post-op protocols via the patient's preferred channel.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-cream/95 backdrop-blur border-b border-navy/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 text-teal">
            <ScalpelIcon />
            <span className="font-bold text-xl text-navy">SurgeonValue</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-navy/70">
            <a href="#agents" className="hover:text-teal transition-colors">
              Agents
            </a>
            <a href="#pricing" className="hover:text-teal transition-colors">
              Pricing
            </a>
            <a href="#calculator" className="hover:text-teal transition-colors">
              Calculator
            </a>
            <a
              href="#hero"
              className="px-4 py-2 bg-teal text-white rounded-lg font-semibold hover:bg-teal/90 transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section id="hero" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Your practice is leaving{" "}
            <span className="text-teal">$240,000</span> on the table.
          </h1>
          <p className="text-xl text-navy/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            SurgeonValue finds the CPT codes you qualify for but don&apos;t bill. 9
            AI agents scan your panel, a physician attests, and you get paid.{" "}
            <span className="font-semibold text-navy">$299/month.</span>
          </p>
          <div className="flex justify-center">
            <EmailCapture source="hero" />
          </div>
        </div>
      </section>

      {/* ─── The Problem ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
            The codes exist. You just aren&apos;t billing them.
          </h2>
          <p className="text-center text-navy/60 max-w-2xl mx-auto mb-14">
            Medicare created these codes. Your patients qualify. The money is
            sitting there.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-cream rounded-xl p-8 text-center border border-navy/5">
              <p className="text-5xl font-bold text-teal mb-3">96%</p>
              <p className="text-navy/70">
                of CCM-eligible patients aren&apos;t enrolled. That&apos;s revenue walking
                out the door every month.
              </p>
            </div>
            <div className="bg-cream rounded-xl p-8 text-center border border-navy/5">
              <p className="text-5xl font-bold text-teal mb-3">373%</p>
              <p className="text-navy/70">
                RTM growth year over year. But less than 0.2% of eligible
                practices are billing it.
              </p>
            </div>
            <div className="bg-cream rounded-xl p-8 text-center border border-navy/5">
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
      <section id="agents" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
            9 agents. One mission: get you paid.
          </h2>
          <p className="text-center text-navy/60 max-w-2xl mx-auto mb-14">
            Each agent handles a specific revenue stream. They work your panel
            24/7 so your staff doesn&apos;t have to.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, i) => (
              <AgentCard
                key={agent.name}
                name={agent.name}
                description={agent.description}
                index={i + 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-14">
            Four steps to captured revenue
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <StepCard
              step={1}
              title="Connect EMR"
              description="Epic, Cerner, athena, eCW, ModMed, DrChrono. One-click integration."
            />
            <StepCard
              step={2}
              title="AI Scans Panel"
              description="9 agents analyze your full patient panel and surface every missed code."
            />
            <StepCard
              step={3}
              title="Physician Attests"
              description="ClinicalSwipe puts each code in front of a physician. Swipe right to attest, left to skip."
            />
            <StepCard
              step={4}
              title="Revenue Captured"
              description="You bill under your own NPI. We take $20 per encounter. That's it."
            />
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-4">
            Simple pricing. You only pay when you bill.
          </h2>
          <p className="text-center text-navy/60 max-w-xl mx-auto mb-14">
            Every tier includes the $20/encounter fee only when you actually
            capture revenue.
          </p>
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
              description="All 9 agents + priority"
              highlighted
              features={[
                "All 9 agents active",
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
            href="https://clinicalswipe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-10 px-6 py-3 border border-teal text-teal rounded-lg font-semibold hover:bg-teal/10 transition-colors"
          >
            Learn more about ClinicalSwipe
          </a>
        </div>
      </section>

      {/* ─── Revenue Calculator ─── */}
      <section id="calculator" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-navy text-center mb-14">
            What is your panel worth?
          </h2>
          <div className="bg-white rounded-2xl p-10 border border-navy/10 shadow-lg">
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

      {/* ─── Newsletter ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
            The Missed Code
          </h2>
          <p className="text-navy/70 text-lg mb-8">
            Get the codes surgeons don&apos;t bill. Every Tuesday.
          </p>
          <div className="flex justify-center mb-6">
            <EmailCapture
              source="newsletter"
              cta="Subscribe"
              placeholder="you@practice.com"
            />
          </div>
          <a
            href="https://themissedcode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal hover:underline text-sm font-semibold"
          >
            Visit themissedcode.com
          </a>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-14 px-6 bg-navy text-white/60">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2 text-white">
              <ScalpelIcon className="w-6 h-6" />
              <span className="font-bold text-lg">SurgeonValue</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a
                href="https://solvinghealth.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                SolvingHealth
              </a>
              <a
                href="https://clinicalswipe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                ClinicalSwipe
              </a>
              <a
                href="https://co-op.care"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                co-op.care
              </a>
              <a
                href="https://themissedcode.com"
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
