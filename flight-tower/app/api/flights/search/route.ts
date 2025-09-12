import { NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

async function proxyToBackend(body: any) {
  console.log("[proxy] Backend API URL:", API_BASE)
  if (!API_BASE) {
    console.error("[proxy] Backend API URL is not configured.")
    return { error: "Backend API URL is not configured." }
  }

  const backendUrl = `${API_BASE}/flights/search`
  console.log(`[proxy] Sending POST request to backend: ${backendUrl}`)
  console.log(`[proxy] Request body to backend:`, JSON.stringify(body, null, 2))

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    console.log(`[proxy] Backend response status: ${res.status}`)

    if (res.status === 204) {
      console.warn("[proxy] Backend returned 204 No Content.")
      return { error: "Backend returned no content" }
    }

    const responseText = await res.text()
    console.log(`[proxy] Backend raw response text:`, responseText)

    if (!res.ok) {
      console.error(`[proxy] Backend responded with non-OK status ${res.status}. Body: ${responseText}`)
      return { error: responseText, status: res.status }
    }

    let json = null
    try {
      json = JSON.parse(responseText)
      console.log("[proxy] Successfully parsed JSON from backend.")
    } catch (err) {
      console.error("[proxy] Backend did not return valid JSON. Raw text was:", responseText, "Error:", err)
      return { error: "Backend returned invalid (non-JSON) response", status: 502 }
    }

    console.log("[proxy] Returning JSON from backend to client.")
    return json
  } catch (e: any) {
    console.error("[proxy] Error proxying to backend:", e)
    if (e.name === 'AbortError') {
      return { error: "Request to backend timed out.", status: 504 };
    }
    return { error: e?.message || "Backend request failed", status: 502 }
  }
}

export async function POST(req: Request) {
  console.log("[api/flights/search] Received POST request.")
  let body: any = {}
  try {
    body = await req.json()
    console.log("[api/flights/search] Parsed request body:", body)
  } catch (e) {
    console.error("[api/flights/search] Invalid JSON in request body.", e)
    return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 })
  }

  const lat = Number(body.lat ?? 0)
  const lon = Number(body.lon ?? 0)
  const radius_km = Math.min(100, Math.max(5, Number(body.radius_km ?? 25)))
  const limit = Math.min(50, Math.max(1, Number(body.limit ?? 10)))
  
  const validatedBody = { lat, lon, radius_km, limit }
  console.log("[api/flights/search] Validated body for proxy:", validatedBody)

  const proxied = await proxyToBackend(validatedBody)

  if (!proxied) {
    console.error("[api/flights/search] Empty response from proxy function.")
    return NextResponse.json({ message: "Empty response from backend proxy" }, { status: 502 })
  }

  if ("error" in proxied) {
    const status = typeof proxied.status === "number" ? proxied.status : 500
    console.error(`[api/flights/search] Proxy returned an error. Status: ${status}, Message: ${proxied.error}`)
    return NextResponse.json({ message: proxied.error }, { status })
  }

  try {
    console.log("[api/flights/search] Successfully proxied. Sending response to client.")
    return NextResponse.json(proxied)
  } catch (err) {
    console.error("[api/flights/search] Cannot serialize backend response:", err)
    console.error("[api/flights/search] Data that failed serialization:", proxied)
    return NextResponse.json({ message: "Invalid data from backend" }, { status: 500 })
  }
}