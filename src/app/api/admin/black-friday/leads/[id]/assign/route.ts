import { NextResponse } from "next/server";
import { assignBlackFridayLead } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-lead-assign", 30, 60_000);
    const auth = await authorizeBlackFridayStaff();
    if (auth.response || !auth.staff) return auth.response;
    const payload = (await readJsonBody(request, 1_000)) as { reassign?: unknown; assignedTo?: unknown };
    const assignedTo = typeof payload?.assignedTo === "string" && /^[0-9a-f-]{36}$/i.test(payload.assignedTo)
      ? payload.assignedTo
      : undefined;
    if (payload?.assignedTo !== undefined && !assignedTo) {
      return NextResponse.json({ message: "Escolha uma pessoa válida da equipe." }, { status: 400 });
    }
    const { id } = await context.params;
    const result = await assignBlackFridayLead(id, auth.staff.id, payload?.reassign === true || Boolean(assignedTo), assignedTo);
    if (!result.assigned) {
      return NextResponse.json({
        message: result.lead?.assigned_to
          ? "Este atendimento já foi assumido por outra pessoa da equipe."
          : "Não foi possível assumir este atendimento.",
        lead: result.lead,
      }, { status: result.lead ? 409 : 404 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
