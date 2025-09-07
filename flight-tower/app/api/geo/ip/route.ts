import { NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET() {
  if (!API_BASE) {
    return NextResponse.json({ message: "Backend API URL is not configured." }, { status: 500 });
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(`${API_BASE}/geo/ip`, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const json = await res.json()
      return NextResponse.json(json)
    }
    const errorText = await res.text().catch(() => `Backend error: ${res.status}`);
    return NextResponse.json({ message: errorText }, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Backend request failed" }, { status: 500 });
  }
}