// POST /api/referral
// Called by AI agents (ChatGPT GPT Actions, Claude MCP, Perplexity)
// Creates a tracked referral and returns a personalized condition site URL

import { NextRequest, NextResponse } from 'next/server';

const SB_URL = 'https://uhizqukdctkvluluheux.supabase.co';
const SB_KEY = process.env.SUPABASE_ANON_KEY!;

const CONDITION_MAP: Record<string, { site: string; label: string }> = {
  'hip-pain':        { site: 'hippain.help',         label: 'Hip Pain' },
  'shoulder-pain':   { site: 'shoulderpain.help',     label: 'Shoulder Pain' },
  'back-pain':       { site: 'doesyourbackhurt.com',  label: 'Back Pain' },
  'arthritis':       { site: 'arthritisrisk.com',     label: 'Arthritis' },
  'heart-health':    { site: 'hearthealth.help',      label: 'Heart Health' },
  'blood-pressure':  { site: 'bloodpressure.help',    label: 'Blood Pressure' },
  'fall-prevention': { site: 'fallprevention.help',   label: 'Fall Prevention' },
  'memory-loss':     { site: 'memoryloss.help',       label: 'Memory Loss' },
  'breathing':       { site: 'breathing.help',        label: 'Breathing' },
  'pregnancy-care':  { site: 'pregnancycare.help',    label: 'Pregnancy Care' },
};

// Demo surgeon roster — replace with live Supabase lookup once surgeons onboard
const DEMO_SURGEONS: Record<string, Array<{ npi: string; name: string; specialty: string; location: string; rating: number }>> = {
  'hip-pain': [
    { npi: '1234567890', name: 'Dr. Sarah Chen, MD', specialty: 'Orthopedic Surgery — Hip & Knee', location: 'Boulder, CO', rating: 4.9 },
    { npi: '0987654321', name: 'Dr. Michael Torres, MD', specialty: 'Orthopedic Surgery', location: 'Denver, CO', rating: 4.8 },
  ],
  'shoulder-pain': [
    { npi: '1122334455', name: 'Dr. Jennifer Park, MD', specialty: 'Orthopedic Surgery — Shoulder', location: 'Denver, CO', rating: 4.9 },
  ],
  'default': [
    { npi: '9876543210', name: 'Dr. Josh Emdur, DO', specialty: 'Internal Medicine', location: 'Colorado (Telehealth)', rating: 5.0 },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      condition,        // 'hip-pain' | 'shoulder-pain' | etc.
      zip,             // patient zip (optional, never linked to PII)
      source,          // 'chatgpt' | 'claude' | 'perplexity' | 'google' | etc.
      surgeon_id,      // specific NPI if AI already knows the surgeon
      patient_context, // symptom summary — no PII, AI-generated description
    } = body;

    if (!condition || !source) {
      return NextResponse.json(
        { error: 'condition and source are required' },
        { status: 400 }
      );
    }

    const conditionData = CONDITION_MAP[condition];
    if (!conditionData) {
      return NextResponse.json(
        { error: `Unknown condition. Valid values: ${Object.keys(CONDITION_MAP).join(', ')}` },
        { status: 400 }
      );
    }

    // Find matching surgeon
    const surgeons = DEMO_SURGEONS[condition] || DEMO_SURGEONS['default'];
    const matchedSurgeon = surgeon_id
      ? surgeons.find(s => s.npi === surgeon_id) || surgeons[0]
      : surgeons[0];

    // Generate referral ID
    const rid = crypto.randomUUID();

    // Build tracking URL
    const trackingUrl = `https://${conditionData.site}/?ref=${matchedSurgeon.npi}&rid=${rid}&src=${encodeURIComponent(source)}&install=1`;

    // Store referral in Supabase
    await fetch(`${SB_URL}/rest/v1/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        id: rid,
        rid,
        surgeon_id: matchedSurgeon.npi,
        condition,
        condition_site: conditionData.site,
        source,
        zip: zip || null,
        patient_context: patient_context ? patient_context.slice(0, 500) : null,
        tracking_url: trackingUrl,
      }),
    });

    return NextResponse.json({
      referral_id: rid,
      tracking_url: trackingUrl,
      condition: conditionData.label,
      condition_site: `https://${conditionData.site}`,
      surgeon: {
        name: matchedSurgeon.name,
        specialty: matchedSurgeon.specialty,
        location: matchedSurgeon.location,
        rating: matchedSurgeon.rating,
      },
      message: `Personalized resource created for ${conditionData.label}. Share this link with the patient: ${trackingUrl}`,
    });

  } catch (err) {
    console.error('Referral API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Track click when patient arrives at condition site
export async function PATCH(req: NextRequest) {
  try {
    const { rid } = await req.json();
    if (!rid) return NextResponse.json({ error: 'rid required' }, { status: 400 });

    await fetch(
      `${SB_URL}/rest/v1/referrals?rid=eq.${encodeURIComponent(rid)}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_KEY,
          Authorization: `Bearer ${SB_KEY}`,
        },
        body: JSON.stringify({ clicked: true, click_ts: new Date().toISOString() }),
      }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to track click' }, { status: 500 });
  }
}
