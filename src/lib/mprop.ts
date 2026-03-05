const MPROP_BASE = "https://data.milwaukee.gov/api/3/action/datastore_search";
const MPROP_RESOURCE = "0a2c7f31-cd15-4151-8222-09dd57d5f16d";

export interface MpropProperty {
  address: string;
  assessedValue: number;
  aldermanicDistrict: string;
  policeDistrict: string;
  fireStation: string;
}

export async function lookupAddress(address: string): Promise<MpropProperty | null> {
  const q = address.toUpperCase().trim();
  const url = `${MPROP_BASE}?resource_id=${MPROP_RESOURCE}&q=${encodeURIComponent(q)}&limit=5`;

  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  const records = data.result?.records;
  if (!records || records.length === 0) return null;

  const record = records[0];
  return {
    address: `${record.HOUSE_NR_LO} ${record.SDIR || ""} ${record.STREET} ${record.STTYPE || ""}`.trim(),
    assessedValue: Number(record.C_A_TOTAL) || 0,
    aldermanicDistrict: record.GEO_ALDER || "",
    policeDistrict: record.GEO_POLICE || "",
    fireStation: record.GEO_FIRE || "",
  };
}
