import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// NOTE: setVapidDetails is called inside the handler (not at module init)
// so it only executes at request time when env vars are guaranteed present.

const SB_URL = 'https://uhizqukdctkvluluheux.supabase.co';

function getSupabaseKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoaXpxdWtkY3Rrdmx1bHVoZXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzQ1ODQsImV4cCI6MjA4OTQ1MDU4NH0._AxT5pBEi1GZ167JPJpHeg_k1E0Bbtzyj3UPKdTFEug'
  );
}

// Map condition_site slug back to the actual domain for the push URL
function conditionDomain(slug: string): string {
  const map: Record<string, string> = {
    'hip-pain': 'hippain.help',
    'shoulder-pain': 'shoulderpain.help',
    'back-pain': 'doesyourbackhurt.com',
    'arthritis-risk': 'arthritisrisk.com',
    'heart-health': 'hearthealth.help',
    'fall-prevention': 'fallprevention.help',
    'memory-loss': 'memoryloss.help',
    'blood-pressure': 'bloodpressure.help',
    'breathing': 'breathing.help',
    'pregnancy-care': 'pregnancycare.help',
  };
  return map[slug] ?? `${slug}.help`;
}

interface PushSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  condition_site?: string;
  surgeon_id?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Initialize VAPID here (request time) so env vars are available
    webpush.setVapidDetails(
      'mailto:blaine@co-op.care',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const { surgeon_id, condition_site, days_milestone } = await req.json();

    const SB_KEY = getSupabaseKey();

    const params = new URLSearchParams({ active: 'eq.true' });
    if (surgeon_id) params.set('surgeon_id', `eq.${surgeon_id}`);
    if (condition_site) params.set('condition_site', `eq.${condition_site}`);

    const r = await fetch(`${SB_URL}/rest/v1/prom_subscriptions?${params.toString()}`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
      },
    });

    if (!r.ok) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const subs: PushSubscription[] = await r.json();

    if (!Array.isArray(subs) || subs.length === 0) {
      return NextResponse.json({ sent: 0, total: 0 });
    }

    const results = await Promise.allSettled(
      subs.map((sub) => {
        const domain = conditionDomain(sub.condition_site ?? '');
        const pushUrl = `https://${domain}/?prom=1&ref=${encodeURIComponent(sub.surgeon_id ?? '')}`;

        return webpush
          .sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: days_milestone ? `Day ${days_milestone} Check-in` : 'PROM Check-in',
              body: 'How is your pain today? Tap to rate (0–10).',
              url: pushUrl,
            })
          )
          .catch(async (err: { statusCode?: number }) => {
            // 410 Gone = subscription expired, deactivate
            if (err?.statusCode === 410) {
              await fetch(
                `${SB_URL}/rest/v1/prom_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    apikey: SB_KEY,
                    Authorization: `Bearer ${SB_KEY}`,
                  },
                  body: JSON.stringify({ active: false }),
                }
              );
            }
            throw err;
          });
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return NextResponse.json({ sent, failed, total: subs.length });
  } catch (err) {
    console.error('[prom/send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
