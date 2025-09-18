import { NextResponse } from "next/server";

// Używaj zmiennej serwerowej (nie publicznej) dla bezpieczeństwa
const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  console.log(`[PROXY /api/flights/{id}] Received request for id: ${id}`);

  if (!BACKEND_URL) {
    console.error("[PROXY /api/flights/{id}] Critical error: BACKEND_URL environment variable is not configured.");
    return NextResponse.json({ message: "Server configuration error: Backend URL is missing." }, { status: 500 });
  }

  const backendUrl = `${BACKEND_URL}/api/flights/${id}`;
  console.log(`[PROXY /api/flights/{id}] Forwarding request to: ${backendUrl}`);

  try {
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store" // Ważne, aby Vercel nie cache'ował odpowiedzi API
    });

    console.log(`[PROXY /api/flights/{id}] Backend responded with status: ${res.status}`);

    // Kopiowanie odpowiedzi z backendu 1:1
    const body = await res.text();
    const headers = { 'Content-Type': res.headers.get('Content-Type') || 'application/json' };

    return new Response(body, { status: res.status, headers });

  } catch (error: any) {
    console.error(`[PROXY /api/flights/{id}] Failed to proxy request:`, error);
    return NextResponse.json({ message: "Failed to connect to backend service.", error: error.message }, { status: 502 }); // 502 Bad Gateway
  }
}
