import { NextResponse } from "next/server";
import { logBlackFridayContact } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-lead-contact", 30, 60_000);
    const auth = await authorizeBlackFridayStaff();
    if (auth.response || !auth.staff) return auth.response;
    const payload = (await readJsonBody(request, 3_000)) as { message?: unknown };
    const { id } = await context.params;
    const result = await logBlackFridayContact(id, auth.staff.id, typeof payload?.message === "string" ? payload.message : "");
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
