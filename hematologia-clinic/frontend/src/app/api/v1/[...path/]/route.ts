import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
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
    const body = request.method !== "GET" && request.method !== "HEAD" 
      ? await request.text() 
      : undefined;

    const backendResponse = await fetch(url, {
      method: request.method,
      headers,
      body,
      // @ts-ignore - cache: "no-store"
      cache: "no-store",
    });

    const data = await backendResponse.text();
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(data);
    } catch (e) {
      jsonResponse = data;
    }

    return NextResponse.json(jsonResponse, { 
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      }
    });
  } catch (error: any) {
    console.error(`Proxy error for ${url}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
