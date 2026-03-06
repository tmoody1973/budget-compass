export interface MpropProperty {
  address: string;
  assessedValue: number;
  aldermanicDistrict: string;
  policeDistrict: string;
  fireStation: string;
}

const ABBREVIATIONS: Record<string, string> = {
  STREET: "ST", AVENUE: "AV", DRIVE: "DR", BOULEVARD: "BL",
  LANE: "LN", PLACE: "PL", COURT: "CT", WAY: "WY",
  PARKWAY: "PKY", CIRCLE: "CIR", TERRACE: "TER",
  NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W",
  // Reverse mappings
  ST: "ST", AV: "AV", DR: "DR", BL: "BL", LN: "LN",
  PL: "PL", CT: "CT", WY: "WY", PKY: "PKY", CIR: "CIR", TER: "TER",
  N: "N", S: "S", E: "E", W: "W",
  AVE: "AV", BLVD: "BL", RD: "RD", ROAD: "RD",
};

export function normalizeAddress(input: string): {
  houseNum: string;
  direction: string;
  street: string;
} {
  const upper = input.toUpperCase().trim();
  const tokens = upper.split(/\s+/);

  let houseNum = "";
  let startIdx = 0;

  // Leading digits = house number
  if (tokens.length > 0 && /^\d+$/.test(tokens[0])) {
    houseNum = tokens[0];
    startIdx = 1;
  }

  // Optional direction
  let direction = "";
  if (startIdx < tokens.length && ["N", "S", "E", "W", "NORTH", "SOUTH", "EAST", "WEST"].includes(tokens[startIdx])) {
    direction = ABBREVIATIONS[tokens[startIdx]] || tokens[startIdx];
    startIdx++;
  }

  // Remaining tokens = street name (normalize abbreviations away for matching)
  const streetTokens = tokens.slice(startIdx).map((t) => {
    // Don't abbreviate the street name itself, only strip type suffixes
    return t;
  });

  // Remove street type suffix for LIKE matching (the DB stores it separately in STTYPE)
  const lastToken = streetTokens[streetTokens.length - 1];
  if (lastToken && ABBREVIATIONS[lastToken]) {
    streetTokens.pop();
  }

  const street = streetTokens.join(" ");
  return { houseNum, direction, street };
}

export async function lookupAddress(address: string): Promise<MpropProperty | null> {
  const res = await fetch(`/api/mprop?q=${encodeURIComponent(address.trim())}`);
  if (!res.ok) return null;

  const data = await res.json();
  if (!data.result || data.result.assessedValue === 0) return null;

  return data.result;
}

export async function searchAddresses(query: string): Promise<MpropProperty[]> {
  const res = await fetch(`/api/mprop?mode=search&q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) return [];

  const data = await res.json();
  return data.results || [];
}
