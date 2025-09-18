import { NextResponse } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

async function proxyToBackend(id: string) {
  console.log("[proxy] Backend API URL:", API_BASE)
  if (!API_BASE) {
    console.error("[proxy] Backend API URL is not configured.")
    return { error: "Backend API URL is not configured." }
  }

  const backendUrl = `${API_BASE}/flights/${id}`
  console.log(`[proxy] Sending GET request to backend: ${backendUrl}`)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      cache: "no-store"
    })
    clearTimeout(timeout)

    console.log(`[proxy] Backend response status: ${res.status}`)

    if (res.status === 204) {
      console.warn("[proxy] Backend returned 204 No Content.")
      return { error: "Backend returned no content" }
    }

    const responseText = await res.text()
    console.log(`[proxy] Backend raw response text length:`, responseText.length)

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
      return { error: "Request to backend timed out.", status: 504 }
    }
    return { error: e?.message || "Backend request failed", status: 502 }
  }
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  console.log(`[api/flights/{id}] Received GET request for id: ${id}`)

  if (!id) {
    console.error("[api/flights/{id}] No flight ID provided.")
    return NextResponse.json({ message: "Flight ID is required" }, { status: 400 })
  }

  console.log(`[api/flights/{id}] Validated ID for proxy: ${id}`)

  const proxied = await proxyToBackend(id)

  if (!proxied) {
    console.error("[api/flights/{id}] Empty response from proxy function.")
    return NextResponse.json({ message: "Empty response from backend proxy" }, { status: 502 })
  }

  if ("error" in proxied) {
    const status = typeof proxied.status === "number" ? proxied.status : 500
    console.error(`[api/flights/{id}] Proxy returned an error. Status: ${status}, Message: ${proxied.error}`)
    return NextResponse.json({ message: proxied.error }, { status })
  }

  try {
    console.log("[api/flights/{id}] Successfully proxied. Sending response to client.")
    return NextResponse.json(proxied)
  } catch (err) {
    console.error("[api/flights/{id}] Cannot serialize backend response:", err)
    console.error("[api/flights/{id}] Data that failed serialization:", proxied)
    return NextResponse.json({ message: "Invalid data from backend" }, { status: 500 })
  }
}
