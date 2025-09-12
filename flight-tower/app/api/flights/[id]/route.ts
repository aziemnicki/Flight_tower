import { NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  console.log(`[api/flights/{id}] Received GET request for id: ${id}`)

  if (!API_BASE) {
    console.error("[api/flights/{id}] Backend API URL is not configured.")
    return NextResponse.json({ message: "Backend API URL is not configured." }, { status: 500 });
  }

  const backendUrl = `${API_BASE}/flights/${encodeURIComponent(id)}`
  console.log(`[api/flights/{id}] Proxying request to: ${backendUrl}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    console.log(`[api/flights/{id}] Backend response status: ${res.status}`)
    const responseText = await res.text()
    console.log(`[api/flights/{id}] Backend raw response text:`, responseText)

    if (!res.ok) {
      console.error(`[api/flights/{id}] Backend responded with non-OK status ${res.status}. Body: ${responseText}`)
      return NextResponse.json({ message: responseText }, { status: res.status });
    }
    
    const json = JSON.parse(responseText)
    console.log("[api/flights/{id}] Successfully parsed JSON from backend, sending to client.")
    return NextResponse.json(json)

  } catch (e: any) {
    console.error(`[api/flights/{id}] Error proxying to backend for id ${id}:`, e)
    if (e.name === 'AbortError') {
      return NextResponse.json({ message: "Request to backend timed out." }, { status: 504 });
    }
    return NextResponse.json({ message: e?.message || "Backend request failed" }, { status: 500 });
  }
}
