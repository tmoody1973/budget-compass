export interface MpropProperty {
  address: string;
  assessedValue: number;
  aldermanicDistrict: string;
  policeDistrict: string;
  fireStation: string;
}

export async function lookupAddress(address: string): Promise<MpropProperty | null> {
  const res = await fetch(`/api/mprop?q=${encodeURIComponent(address.trim())}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.result || data.result.assessedValue === 0) return null;

  return data.result;
}
