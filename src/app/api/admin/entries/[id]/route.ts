import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { getErrorMessage } from "@/lib/api";
import { deleteCampaignEntry } from "@/lib/campaign-db";
import { assertSameOrigin, enforceRateLimit, jsonError } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "admin-entry-delete", 20, 60_000);
  } catch (error) {
    return jsonError(error);
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const result = await deleteCampaignEntry(id);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
