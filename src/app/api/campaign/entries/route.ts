import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function archived() {
  return NextResponse.json({ message: "Esta campanha foi encerrada." }, { status: 410 });
}

export async function GET() { return archived(); }
export async function POST() { return archived(); }
