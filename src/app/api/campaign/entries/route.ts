import { NextResponse } from "next/server";
import {
  createCampaignEntry,
  getPublicCampaignEntries,
} from "@/lib/campaign-db";
import type { RegistrationPayload } from "@/types/campaign";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = await getPublicCampaignEntries();

  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as RegistrationPayload;
  const result = await createCampaignEntry(payload);

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }

  return NextResponse.json({ entry: result.entry }, { status: 201 });
}
