import { NextRequest, NextResponse } from "next/server";
import { normalizeAddress } from "@/lib/mprop";

const MPROP_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";
const MPROP_SQL_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search_sql";
const MPROP_RESOURCE = "0a2c7f31-cd15-4151-8222-09dd57d5f16d";

function formatRecord(record: any): {
  address: string;
  assessedValue: number;
  aldermanicDistrict: string;
  policeDistrict: string;
  fireStation: string;
} {
  return {
    address: `${record.HOUSE_NR_LO} ${record.SDIR || ""} ${record.STREET} ${record.STTYPE || ""}`.replace(/\s+/g, " ").trim(),
    assessedValue: Number(record.C_A_TOTAL) || 0,
    aldermanicDistrict: record.GEO_ALDER || "",
    policeDistrict: record.GEO_POLICE || "",
    fireStation: record.GEO_FIRE || "",
  };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const mode = req.nextUrl.searchParams.get("mode");

  if (!q) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  // Search mode: SQL-based fuzzy matching, returns multiple results
  if (mode === "search") {
    const { houseNum, direction, street } = normalizeAddress(q);

    if (!street && !houseNum) {
      return NextResponse.json({ results: [] });
    }

    // Build WHERE clauses
    const conditions: string[] = [];
    if (houseNum) {
      conditions.push(`"HOUSE_NR_LO" = '${houseNum}'`);
    }
    if (direction) {
      conditions.push(`"SDIR" = '${direction}'`);
    }
    if (street) {
      conditions.push(`"STREET" LIKE '%${street}%'`);
    }
    conditions.push(`CAST("C_A_TOTAL" AS INTEGER) > 0`);

    const sql = `SELECT DISTINCT "HOUSE_NR_LO","HOUSE_NR_HI","SDIR","STREET","STTYPE","C_A_TOTAL","GEO_ALDER","GEO_POLICE","GEO_FIRE" FROM "${MPROP_RESOURCE}" WHERE ${conditions.join(" AND ")} LIMIT 8`;

    const url = `${MPROP_SQL_BASE}?sql=${encodeURIComponent(sql)}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        return NextResponse.json({ results: [] });
      }

      const data = await res.json();
      const records = data.result?.records;
      if (!records || records.length === 0) {
        return NextResponse.json({ results: [] });
      }

      const results = records.map(formatRecord).filter((r: any) => r.assessedValue > 0);
      return NextResponse.json({ results });
    } catch {
      return NextResponse.json({ results: [] });
    }
  }

  // Default mode: single-result lookup
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

  return NextResponse.json({ result: formatRecord(records[0]) });
}
