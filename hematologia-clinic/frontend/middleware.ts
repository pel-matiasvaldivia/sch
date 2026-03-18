import { NextRequest, NextResponse } from "next/server";

// Rutas que requieren autenticación
const PROTECTED_ROUTES = ["/dashboard"];
// Rutas solo para admin
const ADMIN_ROUTES = ["/dashboard/users", "/dashboard/settings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const userRole = request.cookies.get("user_role")?.value;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar acceso a rutas de admin
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si ya está autenticado y va a login, redirigir al dashboard
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
