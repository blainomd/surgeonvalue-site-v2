// GET /api/surgeons?condition=hip-pain&zip=80302
// Returns surgeon matches for a condition + location
// Called by ChatGPT GPT Actions and other AI agents

import { NextRequest, NextResponse } from 'next/server';

const CONDITION_SURGEONS: Record<string, Array<{
  npi: string; name: string; specialty: string;
  location: string; state: string; rating: number; accepts_new_patients: boolean;
}>> = {
  'hip-pain': [
    { npi: '1234567890', name: 'Dr. Sarah Chen, MD', specialty: 'Orthopedic Surgery — Hip & Knee Replacement', location: 'Boulder, CO', state: 'CO', rating: 4.9, accepts_new_patients: true },
    { npi: '0987654321', name: 'Dr. Michael Torres, MD', specialty: 'Orthopedic Surgery', location: 'Denver, CO', state: 'CO', rating: 4.8, accepts_new_patients: true },
  ],
  'shoulder-pain': [
    { npi: '1122334455', name: 'Dr. Jennifer Park, MD', specialty: 'Orthopedic Surgery — Shoulder & Elbow', location: 'Denver, CO', state: 'CO', rating: 4.9, accepts_new_patients: true },
  ],
  'back-pain': [
    { npi: '5544332211', name: 'Dr. Robert Kim, MD', specialty: 'Spine Surgery', location: 'Boulder, CO', state: 'CO', rating: 4.7, accepts_new_patients: true },
  ],
  'default': [
    { npi: '9876543210', name: 'Dr. Josh Emdur, DO', specialty: 'Internal Medicine (Telehealth)', location: 'Colorado — All 50 States', state: 'CO', rating: 5.0, accepts_new_patients: true },
  ],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const condition = searchParams.get('condition') || '';
  const zip = searchParams.get('zip') || '';

  const surgeons = CONDITION_SURGEONS[condition] || CONDITION_SURGEONS['default'];

  return NextResponse.json({
    condition,
    zip: zip || 'not provided',
    results: surgeons.map(s => ({
      ...s,
      referral_url: `https://surgeonvalue.com/api/referral`,
      referral_instructions: `To create a personalized referral link, POST to /api/referral with condition="${condition}" and surgeon_id="${s.npi}"`,
    })),
    total: surgeons.length,
  });
}
