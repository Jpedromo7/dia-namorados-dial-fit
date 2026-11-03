import { NextResponse } from "next/server";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";
import { getSafeRedirectPath } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/admin/black-friday");
  const isAdminRoute = next === "/admin" || next.startsWith("/admin/");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Supabase não configurado.") };

    if (error) {
      if (isAdminRoute) {
        return NextResponse.redirect(
          new URL("/admin/login?error=session", requestUrl.origin),
        );
      }

      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }

    if (isAdminRoute && supabase) {
      const staff = await getCurrentBlackFridayStaff();
      if (!staff) {
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL("/admin/login?error=not-authorized", requestUrl.origin),
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
