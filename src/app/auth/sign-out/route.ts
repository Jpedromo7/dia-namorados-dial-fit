import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const supabase = await createSupabaseServerClient();
  await supabase?.auth.signOut();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}
