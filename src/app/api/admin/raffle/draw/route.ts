import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { drawCampaignWinners } from "@/lib/campaign-db";
import { getErrorMessage } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  try {
    const winners = await drawCampaignWinners(admin.email);

    return NextResponse.json({ winners });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
