import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(data, { status: backendResponse.status });
  }

  // Setear tokens en cookies httpOnly para prevenir XSS
  const response = NextResponse.json({
    user: data.user,
    expires_in: data.expires_in,
  });

  const isProduction = process.env.NODE_ENV === "production";

  // Access token en cookie httpOnly
  response.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: data.expires_in,
    path: "/",
  });

  // Refresh token en cookie httpOnly con TTL más largo
  response.cookies.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 días
    path: "/api/auth/refresh", // Solo accesible para el endpoint de refresh
  });

  // Role en cookie legible por el cliente (para el middleware)
  const primaryRole = data.user.roles[0] || "user";
  response.cookies.set("user_role", primaryRole, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
