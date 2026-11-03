import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ message: "Use o acesso por e-mail e senha da equipe." }, { status: 410 });
}
