import { NextResponse } from "next/server";
import { changeBlackFridayLead } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { isBlackFridayStatus } from "@/lib/black-friday";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-lead-status", 40, 60_000);
    const auth = await authorizeBlackFridayStaff();
    if (auth.response || !auth.staff) return auth.response;
    const payload = (await readJsonBody(request, 2_000)) as {
      status?: unknown;
      followUpAt?: unknown;
      clearFollowUp?: unknown;
    };
    if (!isBlackFridayStatus(payload?.status)) {
      return NextResponse.json({ message: "Escolha um status válido." }, { status: 400 });
    }
    const { id } = await context.params;
    const result = await changeBlackFridayLead(id, auth.staff.id, {
      status: payload.status,
      followUpAt: typeof payload.followUpAt === "string" ? payload.followUpAt : null,
      clearFollowUp: payload.clearFollowUp === true,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
