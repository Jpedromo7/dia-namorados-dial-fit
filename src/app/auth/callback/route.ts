import { NextResponse } from "next/server";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";
import { getSafeRedirectPath } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"), "/admin/black-friday");
  const staff = await getCurrentBlackFridayStaff();
  if (!staff) {
    return NextResponse.redirect(new URL("/admin/login?error=not-authorized", requestUrl.origin));
  }
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
