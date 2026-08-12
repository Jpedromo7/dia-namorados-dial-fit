import { NextResponse } from "next/server";
import { getAdminEmails } from "@/lib/admin-auth";
import { getSafeRedirectPath } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Supabase não configurado.") };

    if (error) {
      if (next.startsWith("/admin")) {
        return NextResponse.redirect(
          new URL("/admin/login?error=session", requestUrl.origin),
        );
      }

      return NextResponse.redirect(new URL("/", requestUrl.origin));
    }

    if (next.startsWith("/admin") && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const email = user?.email?.toLowerCase();
      const adminEmails = getAdminEmails();

      if (!email || !adminEmails.includes(email)) {
        await supabase.auth.signOut();

        return NextResponse.redirect(
          new URL("/admin/login?error=not-authorized", requestUrl.origin),
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
