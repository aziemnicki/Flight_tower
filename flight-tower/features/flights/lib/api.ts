export function getApiBase() {
  // This is kept for potential direct calls but search/details now use the proxy
  return process.env.NEXT_PUBLIC_API_BASE_URL || ""
}

export async function searchFlights(payload: {
  lat: number
  lon: number
  radius_km: number
  limit: number
}) {
  console.log("[api.ts] searchFlights called with payload:", payload)
  try {
    const res = await fetch(`/api/flights/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    
    console.log(`[api.ts] searchFlights response status: ${res.status}`)

    if (!res.ok) {
      const errorText = await res.text().catch(() => `Request failed with status ${res.status}`)
      console.error("[api.ts] searchFlights failed:", errorText)
      throw new Error(errorText || "Failed to search flights")
    }

    const data = await res.json()
    console.log("[api.ts] searchFlights received data:", data)
    return data
  } catch (error) {
    console.error("[api.ts] An error occurred in searchFlights:", error)
    throw error
  }
}

export async function getFlightDetail(id: string) {
  const url = `/api/flights/${encodeURIComponent(id)}`;
  console.log(`[api.ts] getFlightDetail called for id: ${id}, URL: ${url}`)
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    console.log(`[api.ts] getFlightDetail response status: ${res.status}`)

    if (!res.ok) {
      const errorText = await res.text().catch(() => `Request failed with status ${res.status}`)
      console.error(`[api.ts] getFlightDetail failed for id ${id}:`, errorText)
      throw new Error(errorText || "Failed to fetch flight detail")
    }

    const data = await res.json()
    console.log(`[api.ts] getFlightDetail received data for id ${id}:`, data)
    return data
  } catch (error) {
    console.error(`[api.ts] An error occurred in getFlightDetail for id ${id}:`, error)
    throw error
  }
}

export async function getIpLocation() {
  const res = await fetch(`${getApiBase()}/geo/ip`, { cache: "no-store" })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || "Failed to fetch IP location")
  }
  return res.json()
}
