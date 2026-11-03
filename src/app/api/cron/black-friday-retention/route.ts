import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { BLACK_FRIDAY_CAMPAIGN_SLUG } from "@/lib/black-friday";
import { queryNeon } from "@/lib/neon/database";

export const dynamic = "force-dynamic";

function hasValidCronAuthorization(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || !authorization.startsWith("Bearer ")) return false;
  const provided = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function GET(request: Request) {
  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
  }
  const now = new Date();
  const leadRetentionCutoff = new Date(now);
  leadRetentionCutoff.setUTCFullYear(leadRetentionCutoff.getUTCFullYear() - 1);
  const rateRetentionCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    const [leadRows, rateRows] = await Promise.all([
      queryNeon<{ id: string }>("delete from public.black_friday_leads where campaign_slug = $1 and created_at < $2::timestamptz returning id", [BLACK_FRIDAY_CAMPAIGN_SLUG, leadRetentionCutoff.toISOString()]),
      queryNeon<{ request_key: string }>("delete from public.black_friday_rate_limits where window_started_at < $1::timestamptz returning request_key", [rateRetentionCutoff.toISOString()]),
    ]);
    return NextResponse.json({ deletedLeads: leadRows.length, deletedRateKeys: rateRows.length });
  } catch {
    return NextResponse.json({ message: "Não foi possível aplicar a retenção agora." }, { status: 503 });
  }
}
