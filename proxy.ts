import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getNeonAuth } from "@/lib/neon/auth-server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login") return NextResponse.next();
  if (pathname === "/auth/callback" || pathname === "/auth/sign-out" || pathname.startsWith("/api/auth/")) return NextResponse.next();
  if (pathname.startsWith("/admin/black-friday")) {
    const auth = getNeonAuth();
    if (auth) return auth.middleware({ loginUrl: "/admin/login" })(request);
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|docx)$).*)",
  ],
};
