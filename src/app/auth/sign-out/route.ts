import { NextResponse } from "next/server";
import { getNeonAuth } from "@/lib/neon/auth-server";
import { assertSameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  await getNeonAuth()?.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
