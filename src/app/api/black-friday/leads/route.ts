import { NextResponse } from "next/server";
import { checkBlackFridaySubmissionLimit, createBlackFridayLead } from "@/lib/black-friday-db";
import { assertSameOrigin, enforceRateLimit, readJsonBody } from "@/lib/security";
import { blackFridayRouteError } from "@/lib/black-friday-route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, "black-friday-lead-create", 8, 60_000);
    const payload = await readJsonBody(request, 4_000);
    await checkBlackFridaySubmissionLimit(request);
    await createBlackFridayLead(payload);
    return NextResponse.json(
      { message: "Seu pré-cadastro foi recebido. Nossa equipe entrará em contato pelo WhatsApp." },
      { status: 201 },
    );
  } catch (error) {
    return blackFridayRouteError(error);
  }
}
