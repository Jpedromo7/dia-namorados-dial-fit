import { NextResponse } from "next/server";
import { isBlackFridayStaffRole, listBlackFridayStaff, updateBlackFridayStaff } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-staff-update", 20, 60_000);
    const auth = await authorizeBlackFridayStaff(true);
    if (auth.response || !auth.staff) return auth.response;
    const { id } = await context.params;
    const payload = (await readJsonBody(request, 1_000)) as { role?: unknown; is_active?: unknown };
    const values: { role?: "administrator" | "receptionist"; is_active?: boolean } = {};
    if (payload?.role !== undefined) {
      if (!isBlackFridayStaffRole(payload.role)) {
        return NextResponse.json({ message: "Escolha um perfil válido." }, { status: 400 });
      }
      values.role = payload.role;
    }
    if (payload?.is_active !== undefined) {
      if (typeof payload.is_active !== "boolean") {
        return NextResponse.json({ message: "O estado de acesso é inválido." }, { status: 400 });
      }
      values.is_active = payload.is_active;
    }
    if (Object.keys(values).length === 0) {
      return NextResponse.json({ message: "Nenhuma alteração foi informada." }, { status: 400 });
    }

    const staff = await listBlackFridayStaff();
    const target = staff.find((person) => person.id === id);
    if (!target) return NextResponse.json({ message: "Usuário autorizado não encontrado." }, { status: 404 });
    const removesAdmin = target.is_active && target.role === "administrator" &&
      ((values.is_active === false) || (values.role === "receptionist"));
    const activeAdmins = staff.filter((person) => person.is_active && person.role === "administrator").length;
    if (removesAdmin && activeAdmins <= 1) {
      return NextResponse.json({ message: "Mantenha pelo menos um administrador ativo." }, { status: 409 });
    }

    const updated = await updateBlackFridayStaff(id, values);
    return NextResponse.json({ staff: updated }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
