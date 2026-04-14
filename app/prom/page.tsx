import Link from 'next/link';

const SB_URL = 'https://uhizqukdctkvluluheux.supabase.co';
const SB_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaXpxdWtkY3Rrdmx1bHVoZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzQ1ODQsImV4cCI6MjA4OTQ1MDU4NH0._AxT5pBEi1GZ167JPJpHeg_k1E0Bbtzyj3UPKdTFEug';

interface PromResponse {
  id: string;
  created_at: string;
  condition_site?: string;
  score?: number;
  days_post_install?: number;
  method?: string;
  patient_ref?: string;
  surgeon_id?: string;
  utm_source?: string;
}

interface PromSubscription {
  id: string;
  active?: boolean;
}

function scoreColor(score: number | undefined): string {
  if (score === undefined || score === null) return 'bg-gray-100 text-gray-500';
  if (score <= 3) return 'bg-green-100 text-green-800';
  if (score <= 6) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function conditionLabel(slug: string | undefined): string {
  const map: Record<string, string> = {
    'hip-pain': 'Hip Pain',
    'shoulder-pain': 'Shoulder Pain',
    'back-pain': 'Back Pain',
    'arthritis-risk': 'Arthritis',
    'heart-health': 'Heart Health',
    'fall-prevention': 'Fall Prevention',
    'memory-loss': 'Memory / Cognition',
    'blood-pressure': 'Blood Pressure',
    'breathing': 'Breathing',
    'pregnancy-care': 'Pregnancy Care',
  };
  return slug ? (map[slug] ?? slug) : '—';
}

async function fetchResponses(): Promise<PromResponse[]> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/prom_responses?order=created_at.desc&limit=100`,
      {
        headers: {
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
        },
        next: { revalidate: 30 },
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchSubscriptionCount(): Promise<number> {
  try {
    const res = await fetch(
      `${SB_URL}/rest/v1/prom_subscriptions?active=eq.true&select=id`,
      {
        headers: {
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          Prefer: 'count=exact',
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return 0;
    const countHeader = res.headers.get('content-range');
    if (countHeader) {
      const parts = countHeader.split('/');
      const total = parseInt(parts[1] ?? '0', 10);
      return isNaN(total) ? 0 : total;
    }
    const data: PromSubscription[] = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export default async function PromPage() {
  const [responses, subscriptionCount] = await Promise.all([
    fetchResponses(),
    fetchSubscriptionCount(),
  ]);

  const totalResponses = responses.length;
  const scores = responses
    .map((r) => r.score)
    .filter((s): s is number => typeof s === 'number');
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '—';

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      {/* Header */}
      <header className="bg-[#1B2A4A] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="#0D7377" />
            <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="text-lg font-semibold tracking-tight">SurgeonValue</span>
        </div>
        <Link
          href="/qr"
          className="text-sm bg-[#0D7377] hover:bg-[#0a5c5f] text-white px-4 py-1.5 rounded-lg transition-colors"
        >
          Patient Links
        </Link>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-[#1B2A4A]">PROM Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Patient-Reported Outcome Measures — last 100 responses</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Total Responses</p>
            <p className="text-3xl font-bold text-[#1B2A4A]">{totalResponses}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Average Score</p>
            <p className="text-3xl font-bold text-[#1B2A4A]">{avgScore}</p>
            <p className="text-xs text-gray-400 mt-1">0 = no pain, 10 = worst</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold text-[#1B2A4A]">{subscriptionCount}</p>
            <p className="text-xs text-gray-400 mt-1">receiving push notifications</p>
          </div>
        </div>

        {/* Score legend */}
        <div className="flex gap-4 mb-5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
            <span className="text-gray-500">Low (0-3)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
            <span className="text-gray-500">Moderate (4-6)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
            <span className="text-gray-500">High (7-10)</span>
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {responses.length === 0 ? (
            <div className="text-center py-16">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mx-auto mb-3 text-gray-300">
                <rect width="40" height="40" rx="8" fill="#F3F4F6" />
                <path d="M12 28V20M20 28V12M28 28V22" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-gray-400 text-sm">No responses yet.</p>
              <p className="text-gray-400 text-xs mt-1">Generate a QR code and have patients scan to get started.</p>
              <Link href="/qr" className="inline-block mt-4 text-sm text-[#0D7377] font-medium hover:underline">
                Set up Patient Links
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Condition</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Days Post-Install</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {responses.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{formatDate(r.created_at)}</td>
                      <td className="px-5 py-3.5 text-[#1B2A4A] font-medium whitespace-nowrap">{conditionLabel(r.condition_site)}</td>
                      <td className="px-5 py-3.5">
                        {r.score !== undefined && r.score !== null ? (
                          <span className={`inline-flex items-center justify-center w-9 h-7 rounded-md text-xs font-semibold ${scoreColor(r.score)}`}>
                            {r.score}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {r.days_post_install != null ? `Day ${r.days_post_install}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 capitalize">{r.method ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {r.utm_source ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#0D7377]/10 text-[#0D7377]">
                            {r.utm_source}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Data refreshes every 30 seconds. Patient identifiers are anonymous UUIDs only.
        </p>
      </main>
    </div>
  );
}
