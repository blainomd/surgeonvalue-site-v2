import { lookupNpi } from "@/app/api/npi/route";
import { notFound } from "next/navigation";
import Script from "next/script";
import ProfileClient from "./ProfileClient";

// SurgeonValue Profile — the canonical public identity for every surgeon in the
// SurgeonValue network. Encoded as a QR. Scanned by referring providers. Each
// profile is the front door to that surgeon's Pocket referral funnel.
//
// URL: surgeonvalue.com/p/<slug>

interface ProfileEntry {
  slug: string;
  npi: string;
  practice: string; // brand override for the practice line
  about?: string;
  subspecialty_focus?: string[];
  insurances_accepted?: string[];
  next_available?: string;
}

// Registry of SurgeonValue customers. Each entry has a slug → NPI mapping.
// Add a surgeon here when they sign up for SurgeonValue.
const PROFILES: Record<string, ProfileEntry> = {
  levonti: {
    slug: "levonti",
    npi: "1104445147",
    practice: "Stanford Orthopaedic Surgery",
    subspecialty_focus: [
      "Adult reconstruction",
      "Knee OA",
      "Total knee arthroplasty",
      "Hip arthroplasty",
    ],
    next_available: "Within 2 weeks",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slugLower = slug.toLowerCase();
  const entry = PROFILES[slugLower];

  // Vanity slug path
  if (entry) {
    return {
      title: `SurgeonValue · ${entry.practice}`,
      description: `Refer a patient through SurgeonValue Pocket.`,
    };
  }

  // Raw-NPI fallback — hydrate from NPPES so the title reflects a real surgeon
  if (/^\d{10}$/.test(slug)) {
    try {
      const nppes = (await lookupNpi(slug)) as NppesData;
      const p = nppes?.provider || {};
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
      if (name) {
        const cred = p.credential || "MD";
        return {
          title: `${name}, ${cred} · SurgeonValue`,
          description: `Refer a patient through SurgeonValue Pocket.`,
        };
      }
    } catch {
      /* fall through to not found */
    }
  }

  return { title: "SurgeonValue · Profile not found" };
}

interface NppesData {
  provider?: { firstName?: string; lastName?: string; credential?: string; gender?: string };
  specialty?: { description?: string; label?: string };
  address?: { line1?: string; city?: string; state?: string; zip?: string };
  phone?: string;
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const slugLower = slug.toLowerCase();

  // Resolve to an entry: curated profile (vanity slug) OR raw NPI fallback
  let entry: ProfileEntry | null = PROFILES[slugLower] || null;
  let isOnTheFly = false;

  if (!entry && /^\d{10}$/.test(slug)) {
    // Generate an on-the-fly entry for any 10-digit NPI
    entry = {
      slug,
      npi: slug,
      practice: "",
    };
    isOnTheFly = true;
  }

  if (!entry) notFound();

  let nppes: NppesData | null = null;
  try {
    nppes = (await lookupNpi(entry.npi)) as NppesData;
  } catch {
    nppes = null;
  }

  // For on-the-fly profiles, derive the practice line from NPPES data
  if (isOnTheFly && nppes) {
    const addr = nppes.address || {};
    entry.practice = [addr.city, addr.state].filter(Boolean).join(", ") || "Practice details from CMS NPPES";
  }

  const provider = nppes?.provider || {};
  const fullName = `${provider.firstName || ""} ${provider.lastName || ""}`.trim() || "Surgeon";
  const credential = provider.credential || "MD";
  const specialty =
    nppes?.specialty?.label || nppes?.specialty?.description || "Orthopedic Surgery";
  const address = nppes?.address || {};
  const phone = nppes?.phone || "";

  return (
    <>
      <ProfileClient
        slug={entry.slug}
        npi={entry.npi}
        fullName={fullName}
        credential={credential}
        specialty={specialty}
        practice={entry.practice}
        addressLine1={address.line1 || ""}
        city={address.city || ""}
        state={address.state || ""}
        zip={address.zip || ""}
        phone={phone}
        about={entry.about || ""}
        subspecialtyFocus={entry.subspecialty_focus || []}
        insurancesAccepted={entry.insurances_accepted || []}
        nextAvailable={entry.next_available || ""}
      />
      {/* Universal Sage chat bar — canonical source is harnesshealth.ai */}
      <Script
        src="https://harnesshealth.ai/footer.js?v=8"
        data-brand="surgeonvalue"
        data-theme="dark"
        strategy="lazyOnload"
      />
    </>
  );
}
