import { lookupNpi } from "@/app/api/npi/route";
import LevontiClient from "./LevontiClient";

// SurgeonValue / Levonti — personalized command center for big day at Stanford.
// Real NPPES data, one-tap demo runner, pre-drafted posts, Pocket install QR.
// URL: surgeonvalue.com/levonti

const LEVONTI_NPI = "1104445147";

export const metadata = {
  title: "SurgeonValue · Levon Ohanisian, MD — Stanford Orthopaedic Surgery",
  description:
    "Personalized command center for Dr. Levon Ohanisian. Show SurgeonValue to a surgeon in 60 seconds.",
};

interface NpiData {
  npi?: string;
  provider?: {
    firstName?: string;
    lastName?: string;
    credential?: string;
  };
  specialty?: {
    description?: string;
    state?: string;
    label?: string;
  };
  address?: {
    line1?: string;
    city?: string;
    state?: string;
  };
  missedRevenueEstimate?: { low: number; high: number };
  likelyMissedCodes?: { code: string; description: string; estimatedValue: string }[];
}

export default async function LevontiPage() {
  let data: NpiData | null = null;
  try {
    data = (await lookupNpi(LEVONTI_NPI)) as NpiData;
  } catch {
    data = null;
  }

  const provider = data?.provider || { firstName: "Levon", lastName: "Ohanisian", credential: "MD" };
  const specialty = data?.specialty || { label: "Orthopedic Surgery" };
  const address = data?.address || { line1: "300 Pasteur Dr", city: "Stanford", state: "CA" };
  const estimate = data?.missedRevenueEstimate || { low: 180000, high: 240000 };
  const codes = data?.likelyMissedCodes || [];

  const fullName = `${provider.firstName || "Levon"} ${provider.lastName || "Ohanisian"}`;

  return (
    <LevontiClient
      fullName={fullName}
      credential={provider.credential || "MD"}
      specialty={specialty.label || specialty.description || "Orthopedic Surgery"}
      practiceCity={address.city || "Stanford"}
      practiceState={address.state || "CA"}
      practiceLine1={address.line1 || "300 Pasteur Dr"}
      missedLow={estimate.low}
      missedHigh={estimate.high}
      topCodes={codes.slice(0, 5)}
      npi={LEVONTI_NPI}
    />
  );
}
