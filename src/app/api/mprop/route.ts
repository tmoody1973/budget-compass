import { NextRequest, NextResponse } from "next/server";

const MPROP_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";
const MPROP_RESOURCE = "0a2c7f31-cd15-4151-8222-09dd57d5f16d";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const url = `${MPROP_BASE}?resource_id=${MPROP_RESOURCE}&q=${encodeURIComponent(q.toUpperCase().trim())}&limit=5`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: "MPROP API error" }, { status: 502 });
  }

  const data = await res.json();
  const records = data.result?.records;
  if (!records || records.length === 0) {
    return NextResponse.json({ result: null });
  }

  const record = records[0];
  return NextResponse.json({
    result: {
      address: `${record.HOUSE_NR_LO} ${record.SDIR || ""} ${record.STREET} ${record.STTYPE || ""}`.trim(),
      assessedValue: Number(record.C_A_TOTAL) || 0,
      aldermanicDistrict: record.GEO_ALDER || "",
      policeDistrict: record.GEO_POLICE || "",
      fireStation: record.GEO_FIRE || "",
    },
  });
}
