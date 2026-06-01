import { NextResponse } from "next/server";
import { findCampaignEntryByDocument } from "@/lib/campaign-db";
import {
  assertSameOrigin,
  enforceRateLimit,
  jsonError,
  readJsonBody,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "campaign-entry-lookup", 20, 5 * 60_000);
    const payload = (await readJsonBody(request, 1_000)) as {
      document?: unknown;
    } | null;

    const document =
      typeof payload?.document === "string" ? payload.document : "";
    const result = await findCampaignEntryByDocument(document);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({ entry: result.entry });
  } catch (error) {
    return jsonError(error);
  }
}
