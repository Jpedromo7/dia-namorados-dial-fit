import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { BLACK_FRIDAY_CAMPAIGN_SLUG } from "@/lib/black-friday";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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
  const supabase = createSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ message: "Banco não configurado." }, { status: 503 });

  const now = new Date();
  const leadRetentionCutoff = new Date(now);
  leadRetentionCutoff.setUTCFullYear(leadRetentionCutoff.getUTCFullYear() - 1);
  const rateRetentionCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [{ count: deletedLeads, error: leadError }, { count: deletedRateKeys, error: rateError }] = await Promise.all([
    supabase.from("black_friday_leads").delete({ count: "exact" }).eq("campaign_slug", BLACK_FRIDAY_CAMPAIGN_SLUG).lt("created_at", leadRetentionCutoff.toISOString()),
    supabase.from("black_friday_rate_limits").delete({ count: "exact" }).lt("window_started_at", rateRetentionCutoff.toISOString()),
  ]);
  if (leadError || rateError) {
    return NextResponse.json({ message: "Não foi possível aplicar a retenção agora." }, { status: 503 });
  }
  return NextResponse.json({ deletedLeads: deletedLeads ?? 0, deletedRateKeys: deletedRateKeys ?? 0 });
}
