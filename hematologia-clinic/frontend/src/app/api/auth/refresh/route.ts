import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: { code: "NO_REFRESH_TOKEN", message: "No hay refresh token" } },
      { status: 401 }
    );
  }

  const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await backendResponse.json();

  if (!backendResponse.ok) {
    // Refresh inválido — limpiar cookies y forzar re-login
    const response = NextResponse.json(data, { status: backendResponse.status });
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    response.cookies.delete("user_role");
    return response;
  }

  const isProduction = process.env.NODE_ENV === "production";

  const response = NextResponse.json({ user: data.user, expires_in: data.expires_in });

  response.cookies.set("access_token", data.access_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: data.expires_in,
    path: "/",
  });

  response.cookies.set("refresh_token", data.refresh_token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/api/auth/refresh",
  });

  return response;
}
