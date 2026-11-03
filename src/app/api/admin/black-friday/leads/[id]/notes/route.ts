import { NextResponse } from "next/server";
import { addBlackFridayNote } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-lead-note", 30, 60_000);
    const auth = await authorizeBlackFridayStaff();
    if (auth.response || !auth.staff) return auth.response;
    const payload = (await readJsonBody(request, 3_000)) as { note?: unknown; followUpAt?: unknown };
    const { id } = await context.params;
    const result = await addBlackFridayNote(
      id,
      auth.staff.id,
      typeof payload?.note === "string" ? payload.note : "",
      typeof payload?.followUpAt === "string" ? payload.followUpAt : null,
    );
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
