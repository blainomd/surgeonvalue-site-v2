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
    about:
      "Stanford-trained orthopaedic surgeon focused on adult reconstruction, knee preservation, and joint replacement. Building the operational AI layer for ortho practice — billing intelligence, longitudinal complexity capture, and a referral network that makes both sides faster.",
    subspecialty_focus: [
      "Adult reconstruction",
      "Knee OA — conservative + surgical",
      "Total knee arthroplasty",
      "Hip arthroplasty",
      "Cartilage preservation",
    ],
    insurances_accepted: ["Medicare", "Most commercial PPO", "Stanford Health Care plans"],
    next_available: "Within 2 weeks for most referrals",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = PROFILES[slug];
  if (!entry) return { title: "SurgeonValue · Profile not found" };
  return {
    title: `SurgeonValue · Profile`,
    description: `Refer a patient through SurgeonValue Pocket.`,
  };
}

interface NppesData {
  provider?: { firstName?: string; lastName?: string; credential?: string; gender?: string };
  specialty?: { description?: string; label?: string };
  address?: { line1?: string; city?: string; state?: string; zip?: string };
  phone?: string;
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = PROFILES[slug];
  if (!entry) notFound();

  let nppes: NppesData | null = null;
  try {
    nppes = (await lookupNpi(entry.npi)) as NppesData;
  } catch {
    nppes = null;
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
      {/* Universal Sage chat bar */}
      <Script
        src="https://solvinghealth.com/footer.js"
        data-brand="surgeonvalue"
        data-theme="dark"
        strategy="lazyOnload"
      />
    </>
  );
}
