import { notFound } from 'next/navigation';
import { lookupNpi } from '@/app/api/npi/route';

// ── Types ──────────────────────────────────────────────────────────────────

interface NpiApiResult {
  npi: string;
  provider: {
    firstName: string;
    lastName: string;
    credential: string;
    gender: string;
    enumerationDate: string;
    lastUpdated: string;
    status: string;
    namePrefix: string;
    nameSuffix: string;
  };
  specialty: {
    taxonomyCode: string;
    description: string;
    isPrimary: boolean;
    state: string;
    license: string;
    category: 'orthopedic_surgery' | 'general_surgery' | 'primary_care' | 'other';
    label: string;
  };
  isOrthopedicSurgeon: boolean;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  phone: string;
  fax: string;
  allTaxonomies: Array<{
    code: string;
    description: string;
    isPrimary: boolean;
    state: string;
    license: string;
  }>;
  missedRevenueEstimate: { low: number; high: number };
  likelyMissedCodes: Array<{
    code: string;
    description: string;
    estimatedValue: string;
  }>;
  report_url: string;
}

// ── Server-side data fetch ─────────────────────────────────────────────────

async function fetchNpiData(npi: string): Promise<NpiApiResult | null> {
  if (!/^\d{10}$/.test(npi)) return null;
  try {
    const data = await lookupNpi(npi);
    if (!data || (data as { error?: string }).error) return null;
    return data as unknown as NpiApiResult;
  } catch {
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// ── Page component ─────────────────────────────────────────────────────────

export default async function NpiProfilePage({
  params,
}: {
  params: Promise<{ npi: string }>;
}) {
  const { npi } = await params;

  if (!/^\d{10}$/.test(npi)) {
    notFound();
  }

  const data = await fetchNpiData(npi);

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: '#EF4444', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>NPI {npi} not found</p>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>
            This NPI was not found in the CMS NPPES registry. Verify the number and try again.
          </p>
          <a href="/" style={{ color: '#0D7377', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            ← Back to SurgeonValue
          </a>
        </div>
      </div>
    );
  }

  const { provider, specialty, address, phone, missedRevenueEstimate, likelyMissedCodes } = data;

  const fullName = [provider.namePrefix, provider.firstName, provider.lastName, provider.nameSuffix]
    .filter(Boolean)
    .join(' ');

  const displayName = fullName || `NPI ${npi}`;
  const credential = provider.credential || '';
  const initials = [provider.firstName, provider.lastName]
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || npi.slice(0, 2);

  const locationParts = [address.city, address.state].filter(Boolean);
  const locationStr = locationParts.join(', ');

  const addressLines = [
    address.line1,
    address.line2,
    locationParts.length ? `${address.city}, ${address.state} ${address.zip}`.trim() : '',
  ].filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div style={{ background: '#1B2A4A', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>
          Surgeon<span style={{ color: '#0D7377' }}>Value</span>
        </a>
        <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
          NPI {npi}
        </span>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px' }}>

        {/* ── Provider card ─────────────────────────────────────────── */}
        <div style={{ background: 'white', borderRadius: 20, padding: 32, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0D7377, #1B2A4A)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>{initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 700, color: '#1B2A4A', letterSpacing: '-0.4px' }}>
              {displayName}{credential ? `, ${credential}` : ''}
            </h1>
            <p style={{ margin: '0 0 6px', color: '#0D7377', fontWeight: 600, fontSize: 15 }}>
              {specialty.label || specialty.description}
            </p>
            {locationStr && (
              <p style={{ margin: '0 0 4px', color: '#6B7280', fontSize: 13 }}>
                {locationStr}
              </p>
            )}
            {addressLines.length > 0 && (
              <p style={{ margin: '0 0 4px', color: '#9CA3AF', fontSize: 12 }}>
                {addressLines[0]}{addressLines.length > 1 ? ` · ${addressLines[addressLines.length - 1]}` : ''}
              </p>
            )}
            {phone && (
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: 12 }}>
                {formatPhone(phone)}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
            <span style={{
              background: provider.status === 'A' ? '#f0fdf4' : '#fef2f2',
              color: provider.status === 'A' ? '#16a34a' : '#dc2626',
              border: `1px solid ${provider.status === 'A' ? '#bbf7d0' : '#fecaca'}`,
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}>
              {provider.status === 'A' ? 'Active' : 'Inactive'}
            </span>
            <span style={{ color: '#9CA3AF', fontSize: 11 }}>NPI-1 · {specialty.taxonomyCode}</span>
          </div>
        </div>

        {/* ── Revenue estimate ──────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #1B2A4A 0%, #0f2040 100%)', borderRadius: 20, padding: 32, marginBottom: 24, color: 'white' }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
            Revenue Estimate
          </p>
          <h2 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
            {formatCurrency(missedRevenueEstimate.low)} – {formatCurrency(missedRevenueEstimate.high)}
          </h2>
          <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
            Estimated missed revenue per year for a {specialty.label} practice based on average panel size and billing patterns.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {likelyMissedCodes.slice(0, 4).map((c) => (
              <div key={c.code} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0D7377', background: 'rgba(13,115,119,0.2)', padding: '2px 8px', borderRadius: 20 }}>{c.code}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>{c.estimatedValue}</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{c.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column section: Wonder Bill + NCCI ────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 24 }}>

          {/* Wonder Bill */}
          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>Wonder Bill</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Scan your panel for missed codes</p>
              </div>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Paste a clinical note or upload an encounter. Wonder Bill surfaces every billable code you may have missed — RTM, CCM, PCM, add-ons — and shows the expected reimbursement.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                'Identifies undercoded E/M levels',
                'Surfaces RPM and RTM eligibility',
                'Flags missed add-on codes (G2211, 99417)',
                'CJR-X episode revenue analysis',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="8" cy="8" r="8" fill="#dcfce7"/>
                    <polyline points="4 8 7 11 12 5" stroke="#16a34a" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
                </div>
              ))}
            </div>
            <a
              href={`/prior-auth?npi=${npi}`}
              style={{ display: 'block', background: '#1B2A4A', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
            >
              Scan my panel for missed codes
            </a>
          </div>

          {/* NCCI Validator */}
          <div style={{ background: 'white', borderRadius: 20, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <path d="M21 12c-2.4 4.9-5.5 8-9 8s-6.6-3.1-9-8c2.4-4.9 5.5-8 9-8s6.6 3.1 9 8z"/>
                </svg>
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>NCCI Validator</h2>
                <p style={{ margin: 0, fontSize: 12, color: '#6B7280' }}>Every code validated against CMS edits</p>
              </div>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Before you submit, every code pair is checked against the CMS National Correct Coding Initiative edit table. Zero unbundling surprises. Zero denials from edit failures.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {[
                'Column 1 / Column 2 edit checks',
                'Mutually exclusive code detection',
                'Modifier requirements surfaced automatically',
                'Updated quarterly with CMS release cycle',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                    <circle cx="8" cy="8" r="8" fill="#dbeafe"/>
                    <polyline points="4 8 7 11 12 5" stroke="#1d4ed8" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item}</span>
                </div>
              ))}
            </div>
            <a
              href={`/ncci?npi=${npi}`}
              style={{ display: 'block', background: '#1d4ed8', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}
            >
              Validate my codes against CMS edits
            </a>
          </div>

        </div>

        {/* ── All missed codes table ─────────────────────────────────── */}
        {likelyMissedCodes.length > 4 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 28, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#1B2A4A' }}>Likely missed billing codes</h2>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6B7280' }}>Based on {specialty.label} practice patterns. Verify with your billing team.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {likelyMissedCodes.map((c) => (
                <div key={c.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0D7377', background: '#f0fdfa', padding: '3px 10px', borderRadius: 20, border: '1px solid #99f6e4', minWidth: 60, textAlign: 'center' }}>
                      {c.code}
                    </span>
                    <span style={{ fontSize: 13, color: '#374151' }}>{c.description}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1B2A4A', flexShrink: 0, marginLeft: 16 }}>{c.estimatedValue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Get started CTA ───────────────────────────────────────── */}
        <div style={{ background: 'linear-gradient(135deg, #0D7377 0%, #065a5e 100%)', borderRadius: 20, padding: 36, textAlign: 'center', color: 'white' }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            Start in under 2 minutes
          </p>
          <h3 style={{ margin: '0 0 12px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.4px' }}>
            Get started — Core $199/mo
          </h3>
          <p style={{ margin: '0 0 28px', fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            9 AI agents. Wonder Bill. NCCI Validator. Prior Auth in 60 seconds. No EMR required to start.
            Connect Epic, Cerner, or athenahealth when you're ready.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={`/subscribe?npi=${npi}&plan=core`}
              style={{ background: 'white', color: '#0D7377', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}
            >
              Get started — Core $199/mo
            </a>
            <a
              href={`/cjr-x?npi=${npi}`}
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '14px 28px', borderRadius: 100, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block', border: '1.5px solid rgba(255,255,255,0.3)' }}
            >
              View full revenue report
            </a>
          </div>
          <p style={{ margin: '20px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            No credit card required for the free revenue scan · Cancel anytime
          </p>
        </div>

      </div>
    </div>
  );
}

// ── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ npi: string }> }) {
  const { npi } = await params;
  return {
    title: `NPI ${npi} — SurgeonValue`,
    description: `Revenue estimate and missed billing codes for NPI ${npi}. Powered by CMS NPPES data.`,
  };
}
