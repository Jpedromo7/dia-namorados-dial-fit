import { NextResponse } from "next/server";
import { getBlackFridayDashboard } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authorizeBlackFridayStaff();
  if (auth.response) return auth.response;
  try {
    return NextResponse.json(await getBlackFridayDashboard(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
