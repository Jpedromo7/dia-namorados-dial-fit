import { NextResponse } from "next/server";
import { getBlackFridayLeads } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError, getLeadFilters } from "@/lib/black-friday-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeBlackFridayStaff();
  if (auth.response) return auth.response;
  try {
    const result = await getBlackFridayLeads(getLeadFilters(new URL(request.url)));
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
