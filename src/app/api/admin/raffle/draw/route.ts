import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { drawCampaignWinners } from "@/lib/campaign-db";
import { getErrorMessage } from "@/lib/api";
import { assertSameOrigin, enforceRateLimit, jsonError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "admin-raffle-draw", 10, 60_000);
  } catch (error) {
    return jsonError(error);
  }

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
