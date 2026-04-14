import { NextRequest, NextResponse } from "next/server";

// Taxonomy codes for specialty classification
const ORTHO_TAXONOMY_CODES = [
  "207X00000X", // Orthopaedic Surgery
  "207XS0114X", // Adult Reconstructive Orthopaedic Surgery
  "207XX0004X", // Orthopaedic Surgery of the Spine
  "207XS0106X", // Orthopaedic Hand Surgery
  "207XS0117X", // Orthopaedic Trauma
  "207XX0801X", // Sports Medicine (Orthopaedic Surgery)
  "207XP3100X", // Pediatric Orthopaedic Surgery
  "207XX0005X", // Musculoskeletal Oncology
];

const GENERAL_SURGERY_TAXONOMY_CODES = [
  "208600000X", // Surgery
  "2086S0120X", // Pediatric Surgery
  "2086S0122X", // Plastic and Reconstructive Surgery
  "2086S0105X", // Surgery of the Hand
  "2086S0102X", // Surgical Critical Care
  "2086X0206X", // Surgical Oncology
  "2086H0002X", // Hospice and Palliative Medicine (Surgery)
  "208G00000X", // Thoracic Surgery
  "204F00000X", // Vascular Surgery
];

const PRIMARY_CARE_TAXONOMY_CODES = [
  "207Q00000X", // Family Medicine
  "207R00000X", // Internal Medicine
  "208D00000X", // General Practice
  "207QA0505X", // Adult Medicine
  "207QG0300X", // Geriatric Medicine (Family Medicine)
  "207RG0300X", // Geriatric Medicine (Internal Medicine)
];

interface SpecialtyProfile {
  category: "orthopedic_surgery" | "general_surgery" | "primary_care" | "other";
  label: string;
  missedRevenueEstimate: { low: number; high: number };
  likelyMissedCodes: { code: string; description: string; estimatedValue: string }[];
}

function classifySpecialty(taxonomies: Array<Record<string, string>>): SpecialtyProfile {
  const codes = taxonomies.map((t) => t.code || "");
  const descs = taxonomies.map((t) => (t.desc || "").toLowerCase());

  // Check orthopedic surgery first
  if (
    codes.some((c) => ORTHO_TAXONOMY_CODES.includes(c)) ||
    descs.some((d) => d.includes("orthop") || d.includes("orthopaedic"))
  ) {
    return {
      category: "orthopedic_surgery",
      label: "Orthopedic Surgery",
      missedRevenueEstimate: { low: 180000, high: 240000 },
      likelyMissedCodes: [
        { code: "99490", description: "Chronic Care Management (CCM) - initial 20 min", estimatedValue: "$42/mo" },
        { code: "99091", description: "Remote Patient Monitoring (RPM) - data collection", estimatedValue: "$56/mo" },
        { code: "99457", description: "Remote Therapeutic Monitoring (RTM) - initial 20 min", estimatedValue: "$50/mo" },
        { code: "99458", description: "RTM - each additional 20 min", estimatedValue: "$40/mo" },
        { code: "G0023", description: "Principal Care Management (PCM)", estimatedValue: "$70/mo" },
        { code: "99497", description: "Advance Care Planning - first 30 min", estimatedValue: "$86/session" },
        { code: "G2211", description: "Visit Complexity Add-on", estimatedValue: "$16/visit" },
        { code: "20610", description: "Arthrocentesis, major joint (often undercoded)", estimatedValue: "$120/proc" },
      ],
    };
  }

  // Check general surgery
  if (
    codes.some((c) => GENERAL_SURGERY_TAXONOMY_CODES.includes(c)) ||
    descs.some((d) => d.includes("surgery") || d.includes("surgical"))
  ) {
    return {
      category: "general_surgery",
      label: "General Surgery",
      missedRevenueEstimate: { low: 120000, high: 160000 },
      likelyMissedCodes: [
        { code: "99490", description: "Chronic Care Management (CCM) - initial 20 min", estimatedValue: "$42/mo" },
        { code: "99091", description: "Remote Patient Monitoring (RPM) - data collection", estimatedValue: "$56/mo" },
        { code: "99497", description: "Advance Care Planning - first 30 min", estimatedValue: "$86/session" },
        { code: "G2211", description: "Visit Complexity Add-on", estimatedValue: "$16/visit" },
        { code: "99024", description: "Post-op follow-up (tracking for bundled care)", estimatedValue: "Included" },
        { code: "G0023", description: "Principal Care Management (PCM)", estimatedValue: "$70/mo" },
      ],
    };
  }

  // Check primary care
  if (
    codes.some((c) => PRIMARY_CARE_TAXONOMY_CODES.includes(c)) ||
    descs.some((d) => d.includes("family") || d.includes("internal medicine") || d.includes("general practice"))
  ) {
    return {
      category: "primary_care",
      label: "Primary Care",
      missedRevenueEstimate: { low: 80000, high: 120000 },
      likelyMissedCodes: [
        { code: "99490", description: "Chronic Care Management (CCM) - initial 20 min", estimatedValue: "$42/mo" },
        { code: "99491", description: "CCM - complex, initial 30 min", estimatedValue: "$83/mo" },
        { code: "99091", description: "Remote Patient Monitoring (RPM) - data collection", estimatedValue: "$56/mo" },
        { code: "99497", description: "Advance Care Planning - first 30 min", estimatedValue: "$86/session" },
        { code: "G2211", description: "Visit Complexity Add-on", estimatedValue: "$16/visit" },
        { code: "99484", description: "Behavioral Health Integration", estimatedValue: "$49/mo" },
        { code: "G0136", description: "Social Determinants of Health Risk Assessment", estimatedValue: "$18/assessment" },
      ],
    };
  }

  // Other specialty
  return {
    category: "other",
    label: taxonomies[0]?.desc || "Specialist",
    missedRevenueEstimate: { low: 60000, high: 100000 },
    likelyMissedCodes: [
      { code: "99490", description: "Chronic Care Management (CCM) - initial 20 min", estimatedValue: "$42/mo" },
      { code: "99091", description: "Remote Patient Monitoring (RPM) - data collection", estimatedValue: "$56/mo" },
      { code: "G2211", description: "Visit Complexity Add-on", estimatedValue: "$16/visit" },
      { code: "99497", description: "Advance Care Planning - first 30 min", estimatedValue: "$86/session" },
    ],
  };
}

function isValidNpi(npi: string): boolean {
  // NPI must be exactly 10 digits
  return /^\d{10}$/.test(npi);
}

export async function lookupNpi(npi: string) {
  if (!isValidNpi(npi)) {
    return {
      error: "invalid_npi",
      message: "NPI must be exactly 10 digits.",
    };
  }

  const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${encodeURIComponent(npi)}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    return {
      error: "api_timeout",
      message: "The CMS NPI Registry is not responding. Please try again.",
    };
  }

  if (!res.ok) {
    return {
      error: "api_error",
      message: `CMS NPI Registry returned status ${res.status}.`,
    };
  }

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    return {
      error: "parse_error",
      message: "Failed to parse CMS NPI Registry response.",
    };
  }

  const results = data.results as Array<Record<string, unknown>> | undefined;
  if (!results || results.length === 0) {
    return {
      error: "not_found",
      message: `No provider found for NPI ${npi}.`,
    };
  }

  const r = results[0];
  const basic = (r.basic as Record<string, string>) || {};
  const taxonomies = (r.taxonomies as Array<Record<string, string>>) || [];
  const addresses = (r.addresses as Array<Record<string, string>>) || [];
  const practiceAddr =
    addresses.find((a) => a.address_purpose === "LOCATION") || addresses[0] || {};

  const specialty = classifySpecialty(taxonomies);
  const primaryTaxonomy = taxonomies.find((t) => t.primary === "Y") || taxonomies[0] || {};

  return {
    npi: r.number,
    provider: {
      firstName: basic.first_name || "",
      lastName: basic.last_name || "",
      credential: basic.credential || "",
      gender: basic.gender || "",
      enumerationDate: basic.enumeration_date || "",
      lastUpdated: basic.last_updated || "",
      status: basic.status || "A",
      namePrefix: basic.name_prefix || "",
      nameSuffix: basic.name_suffix || "",
    },
    specialty: {
      taxonomyCode: primaryTaxonomy.code || "",
      description: primaryTaxonomy.desc || "",
      isPrimary: primaryTaxonomy.primary === "Y",
      state: primaryTaxonomy.state || "",
      license: primaryTaxonomy.license || "",
      category: specialty.category,
      label: specialty.label,
    },
    isOrthopedicSurgeon: specialty.category === "orthopedic_surgery",
    address: {
      line1: practiceAddr.address_1 || "",
      line2: practiceAddr.address_2 || "",
      city: practiceAddr.city || "",
      state: practiceAddr.state || "",
      zip: practiceAddr.postal_code?.toString().slice(0, 5) || "",
      country: practiceAddr.country_code || "US",
    },
    phone: practiceAddr.telephone_number || "",
    fax: practiceAddr.fax_number || "",
    allTaxonomies: taxonomies.map((t) => ({
      code: t.code || "",
      description: t.desc || "",
      isPrimary: t.primary === "Y",
      state: t.state || "",
      license: t.license || "",
    })),
    missedRevenueEstimate: specialty.missedRevenueEstimate,
    likelyMissedCodes: specialty.likelyMissedCodes,
    report_url: `/cjr-x?npi=${npi}`,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const npi = searchParams.get("npi");

  // If no NPI param, fall back to the original search behavior
  if (!npi) {
    return handleSearch(req);
  }

  const result = await lookupNpi(npi);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      invalid_npi: 400,
      not_found: 404,
      api_timeout: 504,
      api_error: 502,
      parse_error: 502,
    };
    return NextResponse.json(result, {
      status: statusMap[result.error as string] ?? 500,
    });
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON with { npi: \"XXXXXXXXXX\" }." },
      { status: 400 }
    );
  }

  const npi = typeof body.npi === "string" ? body.npi.trim() : "";
  if (!npi) {
    return NextResponse.json(
      { error: "missing_npi", message: "Request body must include an npi field." },
      { status: 400 }
    );
  }

  const result = await lookupNpi(npi);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      invalid_npi: 400,
      not_found: 404,
      api_timeout: 504,
      api_error: 502,
      parse_error: 502,
    };
    return NextResponse.json(result, {
      status: statusMap[result.error as string] ?? 500,
    });
  }

  return NextResponse.json(result);
}

// Original search functionality preserved for backward compatibility
// Supports ?name=, ?state= params without an NPI
async function handleSearch(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const state = searchParams.get("state") || "";

  if (!name && !state) {
    return NextResponse.json(
      { error: "missing_params", message: "Provide ?npi=XXXXXXXXXX for a single lookup, or ?name= and/or ?state= for search." },
      { status: 400 }
    );
  }

  try {
    let url = "https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=10&enumeration_type=NPI-1";

    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        url += `&first_name=${encodeURIComponent(parts[0])}&last_name=${encodeURIComponent(parts.slice(1).join(" "))}`;
      } else {
        url += `&last_name=${encodeURIComponent(parts[0])}`;
      }
    }

    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }

    // Filter for surgical specialties
    url += `&taxonomy_description=surgery`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    const results = (data.results || []).map((r: Record<string, unknown>) => {
      const basic = (r.basic as Record<string, string>) || {};
      const taxonomies = (r.taxonomies as Array<Record<string, string>>) || [];
      const addresses = (r.addresses as Array<Record<string, string>>) || [];
      const practiceAddr =
        addresses.find((a) => a.address_purpose === "LOCATION") || addresses[0] || {};

      const specialty = classifySpecialty(taxonomies);

      return {
        npi: r.number,
        firstName: basic.first_name || "",
        lastName: basic.last_name || "",
        credential: basic.credential || "",
        specialty: taxonomies[0]?.desc || "",
        taxonomyCode: taxonomies[0]?.code || "",
        category: specialty.category,
        city: practiceAddr.city || "",
        state: practiceAddr.state || "",
        zip: practiceAddr.postal_code?.toString().slice(0, 5) || "",
        address: practiceAddr.address_1 || "",
        phone: practiceAddr.telephone_number || "",
        gender: basic.gender || "",
        missedRevenueEstimate: specialty.missedRevenueEstimate,
        report_url: `/cjr-x?npi=${r.number}`,
      };
    });

    return NextResponse.json({ results, count: data.result_count || 0 });
  } catch {
    return NextResponse.json(
      { results: [], count: 0, error: "Lookup failed. The CMS NPI Registry may be unavailable." },
      { status: 502 }
    );
  }
}
