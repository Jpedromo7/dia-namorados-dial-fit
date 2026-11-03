import { NextResponse } from "next/server";
import { deleteBlackFridayLead, getBlackFridayLeadDetails } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { assertSameOrigin, enforceRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeBlackFridayStaff();
  if (auth.response) return auth.response;
  try {
    const { id } = await context.params;
    return NextResponse.json(await getBlackFridayLeadDetails(id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-lead-delete", 10, 60_000);
    const auth = await authorizeBlackFridayStaff(true);
    if (auth.response) return auth.response;
    const { id } = await context.params;
    await deleteBlackFridayLead(id);
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
