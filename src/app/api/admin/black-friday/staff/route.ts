import { NextResponse } from "next/server";
import { addBlackFridayStaff, listBlackFridayStaff } from "@/lib/black-friday-db";
import { isBlackFridayStaffRole } from "@/lib/black-friday-db";
import { authorizeBlackFridayStaff, blackFridayRouteError } from "@/lib/black-friday-route";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";

export const dynamic = "force-dynamic";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  const auth = await authorizeBlackFridayStaff();
  if (auth.response) return auth.response;
  try {
    return NextResponse.json({ staff: await listBlackFridayStaff() }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-staff-create", 20, 60_000);
    const auth = await authorizeBlackFridayStaff(true);
    if (auth.response || !auth.staff) return auth.response;
    const payload = (await readJsonBody(request, 1_000)) as { email?: unknown; role?: unknown };
    const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!isEmail(email) || email.length > 254 || !isBlackFridayStaffRole(payload?.role)) {
      return NextResponse.json({ message: "Informe um e-mail válido e um perfil para a equipe." }, { status: 400 });
    }
    const staff = await addBlackFridayStaff(email, payload.role, auth.staff.authUserId);
    return NextResponse.json({ staff }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
