import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const npi = searchParams.get("npi") || "";
  const state = searchParams.get("state") || "";

  try {
    let url = "https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=10&enumeration_type=NPI-1";

    if (npi) {
      url += `&number=${encodeURIComponent(npi)}`;
    } else if (name) {
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

    const res = await fetch(url);
    const data = await res.json();

    const results = (data.results || []).map((r: Record<string, unknown>) => {
      const basic = r.basic as Record<string, string> || {};
      const taxonomies = r.taxonomies as Array<Record<string, string>> || [];
      const addresses = r.addresses as Array<Record<string, string>> || [];
      const practiceAddr = addresses.find((a) => a.address_purpose === "LOCATION") || addresses[0] || {};

      return {
        npi: r.number,
        firstName: basic.first_name || "",
        lastName: basic.last_name || "",
        credential: basic.credential || "",
        specialty: taxonomies[0]?.desc || "",
        taxonomyCode: taxonomies[0]?.code || "",
        city: practiceAddr.city || "",
        state: practiceAddr.state || "",
        zip: practiceAddr.postal_code?.toString().slice(0, 5) || "",
        address: practiceAddr.address_1 || "",
        phone: practiceAddr.telephone_number || "",
        gender: basic.gender || "",
      };
    });

    return NextResponse.json({ results, count: data.result_count || 0 });
  } catch (error) {
    console.error("NPI lookup error:", error);
    return NextResponse.json({ results: [], count: 0, error: "Lookup failed" });
  }
}
