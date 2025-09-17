import { NextResponse } from "next/server"

// Używaj zmiennej serwerowej dla proxy, nie publicznej
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  console.log(`[api/flights/{id}] Received GET request for id: ${id}`)

  if (!BACKEND_URL) {
    console.error("[api/flights/{id}] Backend URL is not configured.")
    return NextResponse.json({ message: "Backend URL is not configured." }, { status: 500 });
  }

  const backendUrl = `${BACKEND_URL}/api/flights/${id}`
  console.log(`[api/flights/{id}] Proxying request to: ${backendUrl}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { 
        "Content-Type": "application/json",
        // Przekazuj headers z oryginalnego requestu jeśli potrzebne
        "User-Agent": "Flight-Tower-Frontend-Proxy/1.0"
      },
      signal: controller.signal,
      cache: "no-store"
    })
    
    clearTimeout(timeout)

    console.log(`[api/flights/{id}] Backend response status: ${res.status}`)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[api/flights/{id}] Backend error ${res.status}: ${errorText}`)
      return NextResponse.json(
        { message: errorText || `Backend error: ${res.status}` }, 
        { status: res.status }
      );
    }

    const responseText = await res.text()
    console.log(`[api/flights/{id}] Backend response length:`, responseText.length)

    try {
      const json = JSON.parse(responseText)
      console.log("[api/flights/{id}] Successfully parsed JSON, sending to client")
      return NextResponse.json(json)
    } catch (parseError) {
      console.error("[api/flights/{id}] Failed to parse backend JSON:", parseError)
      return NextResponse.json(
        { message: "Invalid JSON response from backend" }, 
        { status: 502 }
      );
    }

  } catch (e: any) {
    console.error(`[api/flights/{id}] Error proxying to backend for id ${id}:`, e)
    
    if (e.name === 'AbortError') {
      return NextResponse.json({ message: "Request to backend timed out." }, { status: 504 });
    }
    
    if (e.code === 'ECONNREFUSED') {
      return NextResponse.json({ message: "Could not connect to backend service." }, { status: 503 });
    }
    
    return NextResponse.json(
      { message: e?.message || "Backend request failed" }, 
      { status: 500 }
    );
  }
}
