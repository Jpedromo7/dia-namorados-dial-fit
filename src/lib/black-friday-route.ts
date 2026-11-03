import { NextResponse } from "next/server";
import { getCurrentBlackFridayStaff, isBlackFridayAdministrator } from "@/lib/black-friday-auth";
import { BlackFridayDatabaseError } from "@/lib/black-friday-db";
import type { BlackFridayStaff } from "@/lib/black-friday";

export async function authorizeBlackFridayStaff(adminOnly = false) {
  const staff = await getCurrentBlackFridayStaff();
  if (!staff) {
    return {
      staff: null,
      response: NextResponse.json({ message: "Entre com uma conta autorizada." }, { status: 401 }),
    };
  }
  if (adminOnly && !isBlackFridayAdministrator(staff)) {
    return {
      staff: null,
      response: NextResponse.json({ message: "Sua conta não tem permissão para esta ação." }, { status: 403 }),
    };
  }
  return { staff: staff as BlackFridayStaff & { authUserId: string }, response: null };
}

export function blackFridayRouteError(error: unknown) {
  if (error instanceof BlackFridayDatabaseError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  if (error instanceof Error && error.name === "HttpError") {
    const status = "status" in error && typeof error.status === "number" ? error.status : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
  return NextResponse.json({ message: "Não foi possível concluir esta ação agora." }, { status: 500 });
}

export function getLeadFilters(url: URL) {
  const params = url.searchParams;
  const page = Number(params.get("page") || 1);
  const pageSize = Number(params.get("pageSize") || 30);
  return {
    search: params.get("search") ?? "",
    status: params.get("status") ?? "",
    assignedTo: params.get("assignedTo") ?? "",
    source: params.get("source") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 30,
  };
}
