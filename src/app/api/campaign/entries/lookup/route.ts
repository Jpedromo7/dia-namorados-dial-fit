import { NextResponse } from "next/server";
import { findCampaignEntryByDocument } from "@/lib/campaign-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    document?: string;
  } | null;

  const result = await findCampaignEntryByDocument(payload?.document ?? "");

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ entry: result.entry });
}
