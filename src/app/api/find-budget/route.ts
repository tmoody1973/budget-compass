import { NextResponse } from "next/server";

const SERVICE_URL = process.env.NOVA_ACT_SERVICE_URL ?? "";
const SECRET = process.env.FIND_BUDGET_SECRET ?? "";

export const maxDuration = 60;

/** Proxy to Railway Nova Act service - handles both find and analyze */
async function proxyToRailway(endpoint: string, body: unknown) {
  if (!SERVICE_URL) {
    return NextResponse.json(
      { error: "Nova Act service not configured." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${SERVICE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SECRET ? { Authorization: `Bearer ${SECRET}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach service: ${message}` },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  // Route to the right Railway endpoint based on the action
  if (body.action === "analyze") {
    return proxyToRailway("/analyze", {
      url: body.url,
      city_hint: body.city_hint,
    });
  }

  // Default: find budget
  return proxyToRailway("/find-budget", {
    city: body.city,
    state: body.state,
  });
}
