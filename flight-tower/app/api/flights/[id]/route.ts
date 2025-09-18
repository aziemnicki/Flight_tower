import { NextResponse } from "next/server";

// Użyj poprawnej zmiennej i URL backendu
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  console.log(`[PROXY /api/flights/{id}] Received request for id: ${id}`);

  if (!BACKEND_URL) {
    console.error("[PROXY /api/flights/{id}] Backend URL is not configured.");
    return NextResponse.json({ message: "Backend URL is not configured." }, { status: 500 });
  }

  // POPRAWKA: Backend ma endpoint /flights/{id}, nie /api/flights/{id}
  const backendUrl = `${BACKEND_URL}/flights/${id}`;
  console.log(`[PROXY /api/flights/{id}] Forwarding request to: ${backendUrl}`);

  try {
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store"
    });

    console.log(`[PROXY /api/flights/{id}] Backend responded with status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[PROXY /api/flights/{id}] Backend error: ${errorText}`);
      return NextResponse.json({ message: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error(`[PROXY /api/flights/{id}] Error:`, error);
    return NextResponse.json({ message: "Failed to connect to backend service." }, { status: 502 });
  }
}
