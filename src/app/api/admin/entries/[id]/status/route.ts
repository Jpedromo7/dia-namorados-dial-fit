import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { updateCampaignEntryStatus } from "@/lib/campaign-db";
import { getErrorMessage } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const { status } = (await request.json()) as { status?: string };

  try {
    const entry = await updateCampaignEntryStatus(id, status ?? "");

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
