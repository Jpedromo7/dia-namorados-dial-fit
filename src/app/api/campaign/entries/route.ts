import { NextResponse } from "next/server";
import {
  createCampaignEntry,
  getPublicCampaignEntries,
} from "@/lib/campaign-db";
import {
  assertSameOrigin,
  enforceRateLimit,
  jsonError,
  readJsonBody,
} from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getPublicCampaignEntries();

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "campaign-entry-create", 8, 60_000);
    const payload = await readJsonBody(request, 6_000);
    const result = await createCampaignEntry(payload);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status },
      );
    }

    return NextResponse.json({ entry: result.entry }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
