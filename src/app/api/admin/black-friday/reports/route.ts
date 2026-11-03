import { NextResponse } from "next/server";
import { getBlackFridayReport } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeBlackFridayStaff(true);
  if (auth.response) return auth.response;
  try {
    const url = new URL(request.url);
    return NextResponse.json(await getBlackFridayReport({
      from: url.searchParams.get("from") ?? "",
      to: url.searchParams.get("to") ?? "",
    }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
