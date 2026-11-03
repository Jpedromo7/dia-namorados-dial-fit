import "server-only";

import { createHmac } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  BLACK_FRIDAY_CAMPAIGN_SLUG,
  BLACK_FRIDAY_CONSENT_VERSION,
  cleanBlackFridayText,
  cleanUtm,
  deriveBlackFridaySource,
  isBlackFridayStatus,
  normalizeBrazilianPhone,
  type BlackFridayActivity,
  type BlackFridayLead,
  type BlackFridayReport,
  type BlackFridayRole,
  type BlackFridayStaff,
  type BlackFridayStatus,
} from "@/lib/black-friday";

const LEAD_FIELDS =
  "id,name,phone,preferred_contact_time,status,assigned_to,source,utm_source,utm_medium,utm_campaign,consented_at,consent_version,contacted_at,converted_at,follow_up_at,created_at,updated_at,assignee:black_friday_staff!black_friday_leads_assigned_to_fkey(id,email)";

export class BlackFridayDatabaseError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "BlackFridayDatabaseError";
    this.status = status;
  }
}

function getDatabase() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    throw new BlackFridayDatabaseError("O banco da pré-lista não está configurado.", 503);
  }
  return supabase;
}

function normalizeContactTime(value: unknown) {
  if (value === "morning" || value === "afternoon" || value === "evening" || value === "anytime") {
    return value;
  }
  return null;
}

export async function checkBlackFridaySubmissionLimit(request: Request) {
  const supabase = getDatabase();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new BlackFridayDatabaseError("O banco da pré-lista não está configurado.", 503);

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  const requestKey = createHmac("sha256", key).update(address).digest("hex");
  const { data, error } = await supabase.rpc("black_friday_allow_submission", {
    p_request_key: requestKey,
  });
  if (error) throw new BlackFridayDatabaseError("Não foi possível validar o envio agora.", 503);
  if (data !== true) throw new BlackFridayDatabaseError("Muitas tentativas em sequência. Aguarde e tente novamente.", 429);
}

export async function createBlackFridayLead(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new BlackFridayDatabaseError("Revise os dados e tente novamente.", 400);
  }
  const raw = value as Record<string, unknown>;
  const name = cleanBlackFridayText(raw.name, 120);
  const phone = normalizeBrazilianPhone(typeof raw.phone === "string" ? raw.phone : "");
  const preferredContactTime = normalizeContactTime(raw.preferredContactTime);
  const consent = raw.consent === true;
  const utmSource = cleanUtm(raw.utmSource);
  const utmMedium = cleanUtm(raw.utmMedium);
  const utmCampaign = cleanUtm(raw.utmCampaign);

  if (raw.website && String(raw.website).trim()) return { accepted: true };
  if (!name || name.length < 3 || !phone || !consent) {
    throw new BlackFridayDatabaseError("Confira o nome, o WhatsApp e a autorização de contato.", 400);
  }
  if (typeof raw.startedAt === "number" && Date.now() - raw.startedAt < 1200) {
    return { accepted: true };
  }

  const supabase = getDatabase();
  const { error } = await supabase.from("black_friday_leads").insert({
    campaign_slug: BLACK_FRIDAY_CAMPAIGN_SLUG,
    name,
    phone,
    preferred_contact_time: preferredContactTime,
    status: "novo",
    source: deriveBlackFridaySource(utmSource, utmMedium),
    utm_source: utmSource || null,
    utm_medium: utmMedium || null,
    utm_campaign: utmCampaign || null,
    consented_at: new Date().toISOString(),
    consent_version: BLACK_FRIDAY_CONSENT_VERSION,
  });

  if (error?.code === "23505") return { accepted: true };
  if (error) throw new BlackFridayDatabaseError("Não foi possível concluir o pré-cadastro agora. Tente novamente.", 503);
  return { accepted: true };
}

export type LeadFilters = {
  search?: string;
  status?: string;
  assignedTo?: string;
  source?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export async function getBlackFridayLeads(filters: LeadFilters = {}) {
  const supabase = getDatabase();
  const page = Math.max(1, Math.floor(filters.page || 1));
  const pageSize = Math.min(1000, Math.max(1, Math.floor(filters.pageSize || 30)));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("black_friday_leads")
    .select(LEAD_FIELDS, { count: "exact" })
    .eq("campaign_slug", BLACK_FRIDAY_CAMPAIGN_SLUG);
  if (filters.status && isBlackFridayStatus(filters.status)) query = query.eq("status", filters.status);
  if (filters.assignedTo === "unassigned") query = query.is("assigned_to", null);
  else if (filters.assignedTo) query = query.eq("assigned_to", filters.assignedTo);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)) {
    query = query.gte("created_at", new Date(`${filters.from}T00:00:00-03:00`).toISOString());
  }
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    const end = new Date(`${filters.to}T00:00:00-03:00`);
    end.setUTCDate(end.getUTCDate() + 1);
    query = query.lt("created_at", end.toISOString());
  }
  const search = cleanBlackFridayText(filters.search, 100);
  if (search) {
    const digits = search.replace(/\D/g, "");
    query = digits.length >= 5
      ? query.ilike("phone", `%${digits}%`)
      : query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
  if (error) throw new BlackFridayDatabaseError("Não foi possível carregar os interessados.", 503);

  const leads = (data ?? []) as unknown as BlackFridayLead[];
  if (!leads.length) return { leads, total: count ?? 0, page, pageSize };

  const { data: events, error: eventError } = await supabase
    .from("black_friday_activity")
    .select("lead_id,created_at")
    .in("lead_id", leads.map((lead) => lead.id))
    .order("created_at", { ascending: false })
    .limit(1000);
  if (eventError) throw new BlackFridayDatabaseError("Não foi possível carregar o histórico dos interessados.", 503);

  const lastInteraction = new Map<string, string>();
  for (const event of events ?? []) {
    if (!lastInteraction.has(event.lead_id)) lastInteraction.set(event.lead_id, event.created_at);
  }
  return {
    leads: leads.map((lead) => ({ ...lead, last_interaction_at: lastInteraction.get(lead.id) ?? null })),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getBlackFridayLeadDetails(id: string) {
  const supabase = getDatabase();
  const leadId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : "";
  if (!leadId) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);

  const { data: leadData, error: leadError } = await supabase
    .from("black_friday_leads")
    .select(LEAD_FIELDS)
    .eq("id", leadId)
    .eq("campaign_slug", BLACK_FRIDAY_CAMPAIGN_SLUG)
    .maybeSingle();
  if (leadError) throw new BlackFridayDatabaseError("Não foi possível carregar o interessado.", 503);
  if (!leadData) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);

  const { data: activityData, error: activityError } = await supabase
    .from("black_friday_activity")
    .select("id,lead_id,actor_staff_id,event_type,body,follow_up_at,created_at,actor:black_friday_staff!black_friday_activity_actor_staff_id_fkey(id,email)")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (activityError) throw new BlackFridayDatabaseError("Não foi possível carregar o histórico do interessado.", 503);

  return {
    lead: leadData as unknown as BlackFridayLead,
    activity: (activityData ?? []) as unknown as BlackFridayActivity[],
  };
}

export async function deleteBlackFridayLead(id: string) {
  const leadId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : "";
  if (!leadId) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  const supabase = getDatabase();
  const { data, error } = await supabase
    .from("black_friday_leads")
    .delete()
    .eq("id", leadId)
    .eq("campaign_slug", BLACK_FRIDAY_CAMPAIGN_SLUG)
    .select("id")
    .maybeSingle();
  if (error) throw new BlackFridayDatabaseError("Não foi possível excluir este cadastro.", 503);
  if (!data) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
}

export async function getBlackFridayDashboard() {
  const supabase = getDatabase();
  const [{ data: report, error: reportError }, { data: recent, error: recentError }, { data: followUps, error: followUpError }] = await Promise.all([
    supabase.rpc("black_friday_report", { p_start: null, p_end: null }),
    supabase.from("black_friday_leads").select(LEAD_FIELDS).eq("campaign_slug", BLACK_FRIDAY_CAMPAIGN_SLUG).order("created_at", { ascending: false }).limit(8),
    supabase.from("black_friday_leads").select(LEAD_FIELDS).eq("campaign_slug", BLACK_FRIDAY_CAMPAIGN_SLUG).in("status", ["novo", "em_contato", "aguardando_resposta"]).not("follow_up_at", "is", null).order("follow_up_at", { ascending: true }).limit(8),
  ]);
  if (reportError || recentError || followUpError) {
    throw new BlackFridayDatabaseError("Não foi possível carregar os indicadores do painel.", 503);
  }

  return {
    report,
    recent: (recent ?? []) as unknown as BlackFridayLead[],
    followUps: (followUps ?? []) as unknown as BlackFridayLead[],
  };
}

export async function getBlackFridayReport(filters: Pick<LeadFilters, "from" | "to"> = {}) {
  const supabase = getDatabase();
  const start = filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from)
    ? new Date(`${filters.from}T00:00:00-03:00`).toISOString()
    : null;
  let end: string | null = null;
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to)) {
    const nextDay = new Date(`${filters.to}T00:00:00-03:00`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    end = nextDay.toISOString();
  }
  const { data, error } = await supabase.rpc("black_friday_report", { p_start: start, p_end: end });
  if (error) throw new BlackFridayDatabaseError("Não foi possível gerar o relatório.", 503);
  return data as BlackFridayReport;
}

export async function listBlackFridayStaff() {
  const supabase = getDatabase();
  const { data, error } = await supabase
    .from("black_friday_staff")
    .select("id,email,role,is_active")
    .order("email", { ascending: true });
  if (error) throw new BlackFridayDatabaseError("Não foi possível carregar a equipe.", 503);
  return (data ?? []) as BlackFridayStaff[];
}

export async function addBlackFridayStaff(email: string, role: BlackFridayRole, actorUserId: string) {
  const supabase = getDatabase();
  const { data, error } = await supabase
    .from("black_friday_staff")
    .upsert(
      { email: email.toLowerCase(), role, is_active: true, created_by: actorUserId },
      { onConflict: "email" },
    )
    .select("id,email,role,is_active")
    .single();
  if (error || !data) throw new BlackFridayDatabaseError("Não foi possível autorizar esta conta.", 503);
  return data as BlackFridayStaff;
}

export async function updateBlackFridayStaff(id: string, values: { role?: BlackFridayRole; is_active?: boolean }) {
  const supabase = getDatabase();
  const { data, error } = await supabase
    .from("black_friday_staff")
    .update(values)
    .eq("id", id)
    .select("id,email,role,is_active")
    .maybeSingle();
  if (error) throw new BlackFridayDatabaseError("Não foi possível atualizar o acesso.", 503);
  if (!data) throw new BlackFridayDatabaseError("Usuário autorizado não encontrado.", 404);
  return data as BlackFridayStaff;
}

function getRpcError(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "42501") throw new BlackFridayDatabaseError("Sua conta não tem permissão para esta ação.", 403);
  if (error?.code === "22023") throw new BlackFridayDatabaseError("Confira os dados informados.", 400);
  if (error) throw new BlackFridayDatabaseError(fallback, 503);
}

export async function assignBlackFridayLead(leadId: string, actorStaffId: string, allowReassign: boolean, targetStaffId?: string) {
  const supabase = getDatabase();
  const { data, error } = await supabase.rpc("black_friday_assign_lead", {
    p_lead_id: leadId,
    p_actor_staff_id: actorStaffId,
    p_allow_reassign: allowReassign,
    p_target_staff_id: targetStaffId ?? actorStaffId,
  });
  getRpcError(error, "Não foi possível assumir este atendimento.");
  return data as { assigned: boolean; lead: BlackFridayLead | null };
}

export async function changeBlackFridayLead(
  leadId: string,
  actorStaffId: string,
  values: { status: BlackFridayStatus; followUpAt?: string | null; clearFollowUp?: boolean },
) {
  if (!isBlackFridayStatus(values.status)) throw new BlackFridayDatabaseError("Status inválido.", 400);
  const followUpAt = values.followUpAt ? new Date(values.followUpAt) : null;
  if (followUpAt && Number.isNaN(followUpAt.valueOf())) throw new BlackFridayDatabaseError("Data de retorno inválida.", 400);

  const supabase = getDatabase();
  const { data, error } = await supabase.rpc("black_friday_change_lead", {
    p_lead_id: leadId,
    p_actor_staff_id: actorStaffId,
    p_status: values.status,
    p_follow_up_at: followUpAt?.toISOString() ?? null,
    p_clear_follow_up: values.clearFollowUp === true,
  });
  getRpcError(error, "Não foi possível atualizar o interessado.");
  if (!data) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  return data as { lead: BlackFridayLead };
}

export async function addBlackFridayNote(leadId: string, actorStaffId: string, note: string, followUpAt?: string | null) {
  const cleanNote = cleanBlackFridayText(note, 2000);
  if (!cleanNote) throw new BlackFridayDatabaseError("Escreva uma observação antes de salvar.", 400);
  const date = followUpAt ? new Date(followUpAt) : null;
  if (date && Number.isNaN(date.valueOf())) throw new BlackFridayDatabaseError("Data de retorno inválida.", 400);

  const supabase = getDatabase();
  const { data, error } = await supabase.rpc("black_friday_add_note", {
    p_lead_id: leadId,
    p_actor_staff_id: actorStaffId,
    p_note: cleanNote,
    p_follow_up_at: date?.toISOString() ?? null,
  });
  getRpcError(error, "Não foi possível salvar a observação.");
  if (!data) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  return data as { lead: BlackFridayLead };
}

export async function logBlackFridayContact(leadId: string, actorStaffId: string, message: string) {
  const cleanMessage = cleanBlackFridayText(message, 2000);
  if (!cleanMessage) throw new BlackFridayDatabaseError("A mensagem de contato está vazia.", 400);

  const supabase = getDatabase();
  const { data, error } = await supabase.rpc("black_friday_log_contact", {
    p_lead_id: leadId,
    p_actor_staff_id: actorStaffId,
    p_message: cleanMessage,
  });
  getRpcError(error, "Não foi possível registrar o contato.");
  if (!data) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  return data as { lead: BlackFridayLead };
}

export async function exportBlackFridayLeads(filters: LeadFilters = {}) {
  const rows: BlackFridayLead[] = [];
  let page = 1;
  while (true) {
    const result = await getBlackFridayLeads({ ...filters, page, pageSize: 1000 });
    rows.push(...result.leads);
    if (rows.length >= result.total || result.leads.length === 0) break;
    page += 1;
  }
  return rows;
}

export function buildBlackFridayCsv(leads: BlackFridayLead[]) {
  const columns: Array<[string, (lead: BlackFridayLead) => string]> = [
    ["Nome", (lead) => lead.name],
    ["WhatsApp", (lead) => lead.phone],
    ["Cadastro em", (lead) => lead.created_at],
    ["Melhor horário", (lead) => lead.preferred_contact_time ?? ""],
    ["Origem", (lead) => lead.source],
    ["Status", (lead) => lead.status],
    ["Responsável", (lead) => lead.assignee?.email ?? ""],
    ["Último contato", (lead) => lead.contacted_at ?? ""],
  ];
  const escape = (value: string) => {
    const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [
    columns.map(([label]) => escape(label)).join(","),
    ...leads.map((lead) => columns.map(([, value]) => escape(value(lead))).join(",")),
  ].join("\r\n");
}

export function isBlackFridayStaffRole(value: unknown): value is BlackFridayRole {
  return value === "administrator" || value === "receptionist";
}
