import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:8000";

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    roles: string[];
    must_change_password: boolean;
  };
}

function isLoginResponse(data: unknown): data is LoginResponse {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.access_token === "string" &&
    typeof d.refresh_token === "string" &&
    typeof d.expires_in === "number" &&
    typeof d.user === "object" &&
    d.user !== null
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let backendResponse;
    try {
      backendResponse = await fetch(`${BACKEND_URL}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : "Connection error";
      console.error("Backend fetch failed:", fetchError);
      return NextResponse.json(
        { detail: "No se pudo conectar con el servidor backend.", error: message },
        { status: 502 }
      );
    }

    const text = await backendResponse.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Invalid JSON from backend:", text);
      return NextResponse.json(
        { detail: "Respuesta inválida del servidor backend.", html: text.substring(0, 200) },
        { status: backendResponse.status || 500 }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    if (!isLoginResponse(data)) {
      console.error("Unexpected response shape from backend:", data);
      return NextResponse.json(
        { detail: "Respuesta inesperada del servidor backend." },
        { status: 502 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      user: data.user,
      expires_in: data.expires_in,
    });

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

    const primaryRole = data.user.roles[0] ?? "user";
    response.cookies.set("user_role", primaryRole, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Internal API error:", error);
    return NextResponse.json(
      { detail: "Error interno del servidor", error: message },
      { status: 500 }
    );
  }
}
