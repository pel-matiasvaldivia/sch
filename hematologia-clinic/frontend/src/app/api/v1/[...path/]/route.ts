import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

async function proxyRequest(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = `${BACKEND_URL}/v1/${path}`;

  const cookieStore = cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  try {
    const body =
      request.method !== "GET" && request.method !== "HEAD"
        ? await request.text()
        : undefined;

    const backendResponse = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const text = await backendResponse.text();
    let jsonResponse: unknown;
    try {
      jsonResponse = JSON.parse(text);
    } catch {
      jsonResponse = text;
    }

    return NextResponse.json(jsonResponse, {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Proxy error for ${url}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", message },
      { status: 500 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
