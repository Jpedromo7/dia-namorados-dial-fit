import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/admin-auth";
import { updateCampaignEntryStatus } from "@/lib/campaign-db";
import { getErrorMessage } from "@/lib/api";
import {
  assertSameOrigin,
  enforceRateLimit,
  jsonError,
  readJsonBody,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "admin-entry-status", 40, 60_000);
  } catch (error) {
    return jsonError(error);
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const { status } = (await readJsonBody(request, 512)) as {
      status?: string;
    };
    const entry = await updateCampaignEntryStatus(id, status ?? "");

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof Error && error.name === "HttpError") {
      return jsonError(error);
    }

    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: 400 },
    );
  }
}
