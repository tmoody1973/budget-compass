import { NextResponse } from "next/server";

const SERVICE_URL = process.env.NOVA_ACT_SERVICE_URL ?? "";
const SECRET = process.env.FIND_BUDGET_SECRET ?? "";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!SERVICE_URL) {
    return NextResponse.json(
      { error: "Nova Act service not configured. Set NOVA_ACT_SERVICE_URL." },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();

    const res = await fetch(`${SERVICE_URL}/find-budget`, {
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
      { error: `Failed to reach budget finder service: ${message}` },
      { status: 502 }
    );
  }
}
