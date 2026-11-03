import "server-only";

import { createHmac } from "node:crypto";
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
import { BlackFridayDatabaseError } from "@/lib/black-friday-db-errors";
import { queryNeon } from "@/lib/neon/database";

export { BlackFridayDatabaseError } from "@/lib/black-friday-db-errors";

type DatabaseLead = BlackFridayLead & { assignee: Pick<BlackFridayStaff, "id" | "email"> | null };
type PgError = Error & { code?: string };

const LEAD_SELECT = `
  select l.id, l.name, l.phone, l.preferred_contact_time, l.status, l.assigned_to,
    l.source, l.utm_source, l.utm_medium, l.utm_campaign, l.consented_at,
    l.consent_version, l.contacted_at, l.converted_at, l.follow_up_at,
    l.created_at, l.updated_at,
    case when s.id is null then null else jsonb_build_object('id', s.id, 'email', s.email) end as assignee,
    (select a.created_at from public.black_friday_activity a where a.lead_id = l.id order by a.created_at desc limit 1) as last_interaction_at
  from public.black_friday_leads l
  left join public.black_friday_staff s on s.id = l.assigned_to
`;

function pgCode(error: unknown) {
  return error && typeof error === "object" && "code" in error ? String((error as PgError).code) : "";
}

function databaseError(error: unknown, fallback: string): BlackFridayDatabaseError {
  if (pgCode(error) === "42501") return new BlackFridayDatabaseError("Sua conta não tem permissão para esta ação.", 403);
  if (pgCode(error) === "22023") return new BlackFridayDatabaseError("Confira os dados informados.", 400);
  return new BlackFridayDatabaseError(fallback, 503);
}

function normalizeContactTime(value: unknown) {
  return value === "morning" || value === "afternoon" || value === "evening" || value === "anytime" ? value : null;
}

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : "";
}

async function callFunction<T>(statement: string, parameters: unknown[], fallback: string) {
  try {
    const rows = await queryNeon<{ result: T }>(statement, parameters);
    return rows[0]?.result ?? null;
  } catch (error) {
    throw databaseError(error, fallback);
  }
}

export async function checkBlackFridaySubmissionLimit(request: Request) {
  const secret = process.env.RATE_LIMIT_HMAC_SECRET;
  if (!secret || secret.length < 32) throw new BlackFridayDatabaseError("O banco da pré-lista não está configurado.", 503);
  const address = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const requestKey = createHmac("sha256", secret).update(address).digest("hex");
  try {
    const rows = await queryNeon<{ allowed: boolean }>("select public.black_friday_allow_submission($1::text) as allowed", [requestKey]);
    if (rows[0]?.allowed !== true) throw new BlackFridayDatabaseError("Muitas tentativas em sequência. Aguarde e tente novamente.", 429);
  } catch (error) {
    if (error instanceof BlackFridayDatabaseError) throw error;
    throw databaseError(error, "Não foi possível validar o envio agora.");
  }
}

export async function createBlackFridayLead(value: unknown) {
  if (!value || typeof value !== "object") throw new BlackFridayDatabaseError("Revise os dados e tente novamente.", 400);
  const raw = value as Record<string, unknown>;
  const name = cleanBlackFridayText(raw.name, 120);
  const phone = normalizeBrazilianPhone(typeof raw.phone === "string" ? raw.phone : "");
  const preferredContactTime = normalizeContactTime(raw.preferredContactTime);
  const consent = raw.consent === true;
  const utmSource = cleanUtm(raw.utmSource);
  const utmMedium = cleanUtm(raw.utmMedium);
  const utmCampaign = cleanUtm(raw.utmCampaign);

  if (raw.website && String(raw.website).trim()) return { accepted: true };
  if (!name || name.length < 3 || !phone || !consent) throw new BlackFridayDatabaseError("Confira o nome, o WhatsApp e a autorização de contato.", 400);
  if (typeof raw.startedAt === "number" && Date.now() - raw.startedAt < 1200) return { accepted: true };

  try {
    await queryNeon(
      `insert into public.black_friday_leads
       (campaign_slug, name, phone, preferred_contact_time, status, source, utm_source, utm_medium, utm_campaign, consented_at, consent_version)
       values ($1, $2, $3, $4, 'novo', $5, $6, $7, $8, now(), $9)`,
      [BLACK_FRIDAY_CAMPAIGN_SLUG, name, phone, preferredContactTime, deriveBlackFridaySource(utmSource, utmMedium), utmSource || null, utmMedium || null, utmCampaign || null, BLACK_FRIDAY_CONSENT_VERSION],
    );
  } catch (error) {
    if (pgCode(error) === "23505") return { accepted: true };
    throw databaseError(error, "Não foi possível concluir o pré-cadastro agora. Tente novamente.");
  }
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

function dateStart(value?: string) {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00-03:00`).toISOString() : null;
}

function dateEnd(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const end = new Date(`${value}T00:00:00-03:00`);
  end.setUTCDate(end.getUTCDate() + 1);
  return end.toISOString();
}

export async function getBlackFridayLeads(filters: LeadFilters = {}) {
  const page = Math.max(1, Math.floor(filters.page || 1));
  const pageSize = Math.min(1000, Math.max(1, Math.floor(filters.pageSize || 30)));
  const params: unknown[] = [BLACK_FRIDAY_CAMPAIGN_SLUG];
  const clauses = ["l.campaign_slug = $1"];
  const add = (value: unknown) => { params.push(value); return `$${params.length}`; };

  if (filters.status && isBlackFridayStatus(filters.status)) clauses.push(`l.status = ${add(filters.status)}`);
  if (filters.assignedTo === "unassigned") clauses.push("l.assigned_to is null");
  else if (filters.assignedTo) clauses.push(`l.assigned_to = ${add(filters.assignedTo)}`);
  if (filters.source) clauses.push(`l.source = ${add(filters.source)}`);
  const from = dateStart(filters.from);
  const to = dateEnd(filters.to);
  if (from) clauses.push(`l.created_at >= ${add(from)}::timestamptz`);
  if (to) clauses.push(`l.created_at < ${add(to)}::timestamptz`);
  const search = cleanBlackFridayText(filters.search, 100);
  if (search) {
    const digits = search.replace(/\D/g, "");
    const parameter = add(`%${digits.length >= 5 ? digits : search}%`);
    clauses.push(digits.length >= 5 ? `l.phone ilike ${parameter}` : `l.name ilike ${parameter}`);
  }

  const where = clauses.join(" and ");
  const countParams = [...params];
  params.push(pageSize, (page - 1) * pageSize);
  try {
    const [countRows, leads] = await Promise.all([
      queryNeon<{ total: number }>(`select count(*)::int as total from public.black_friday_leads l where ${where}`, countParams),
      queryNeon<DatabaseLead>(`${LEAD_SELECT}
        where ${where}
        order by l.created_at desc
        limit $${params.length - 1} offset $${params.length}`,
      params),
    ]);
    const total = Number(countRows[0]?.total ?? 0);
    return { leads, total, page, pageSize };
  } catch (error) {
    throw databaseError(error, "Não foi possível carregar os interessados.");
  }
}

export async function getBlackFridayLeadDetails(id: string) {
  const leadId = validId(id);
  if (!leadId) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  try {
    const [lead] = await queryNeon<DatabaseLead>(`${LEAD_SELECT} where l.id = $1::uuid and l.campaign_slug = $2 limit 1`, [leadId, BLACK_FRIDAY_CAMPAIGN_SLUG]);
    if (!lead) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
    const activity = await queryNeon<BlackFridayActivity & { actor: Pick<BlackFridayStaff, "id" | "email"> | null }>(
      `select a.id, a.lead_id, a.actor_staff_id, a.event_type, a.body, a.follow_up_at, a.created_at,
        case when s.id is null then null else jsonb_build_object('id', s.id, 'email', s.email) end as actor
       from public.black_friday_activity a
       left join public.black_friday_staff s on s.id = a.actor_staff_id
       where a.lead_id = $1::uuid order by a.created_at desc limit 200`,
      [leadId],
    );
    return { lead, activity };
  } catch (error) {
    if (error instanceof BlackFridayDatabaseError) throw error;
    throw databaseError(error, "Não foi possível carregar o interessado.");
  }
}

export async function deleteBlackFridayLead(id: string) {
  const leadId = validId(id);
  if (!leadId) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  try {
    const rows = await queryNeon<{ id: string }>("delete from public.black_friday_leads where id = $1::uuid and campaign_slug = $2 returning id", [leadId, BLACK_FRIDAY_CAMPAIGN_SLUG]);
    if (!rows[0]) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  } catch (error) {
    if (error instanceof BlackFridayDatabaseError) throw error;
    throw databaseError(error, "Não foi possível excluir este cadastro.");
  }
}

export async function getBlackFridayDashboard() {
  try {
    const [reportRows, recent, followUps] = await Promise.all([
      queryNeon<{ report: BlackFridayReport }>("select public.black_friday_report(null, null) as report"),
      queryNeon<DatabaseLead>(`${LEAD_SELECT} where l.campaign_slug = $1 order by l.created_at desc limit 8`, [BLACK_FRIDAY_CAMPAIGN_SLUG]),
      queryNeon<DatabaseLead>(`${LEAD_SELECT} where l.campaign_slug = $1 and l.status in ('novo','em_contato','aguardando_resposta') and l.follow_up_at is not null order by l.follow_up_at asc limit 8`, [BLACK_FRIDAY_CAMPAIGN_SLUG]),
    ]);
    return { report: reportRows[0]?.report, recent, followUps };
  } catch (error) {
    throw databaseError(error, "Não foi possível carregar os indicadores do painel.");
  }
}

export async function getBlackFridayReport(filters: Pick<LeadFilters, "from" | "to"> = {}) {
  try {
    const rows = await queryNeon<{ report: BlackFridayReport }>("select public.black_friday_report($1::timestamptz, $2::timestamptz) as report", [dateStart(filters.from), dateEnd(filters.to)]);
    return rows[0]?.report as BlackFridayReport;
  } catch (error) {
    throw databaseError(error, "Não foi possível gerar o relatório.");
  }
}

export async function listBlackFridayStaff() {
  try {
    return await queryNeon<BlackFridayStaff>("select id, email, role, is_active from public.black_friday_staff order by email asc");
  } catch (error) {
    throw databaseError(error, "Não foi possível carregar a equipe.");
  }
}

export async function addBlackFridayStaff(email: string, role: BlackFridayRole, actorUserId: string) {
  try {
    const rows = await queryNeon<BlackFridayStaff>(
      `insert into public.black_friday_staff (email, role, is_active, created_by)
       values ($1, $2, true, $3::uuid)
       on conflict (email) do update set role = excluded.role, is_active = true, created_by = excluded.created_by
       returning id, email, role, is_active`,
      [email.toLowerCase(), role, actorUserId],
    );
    if (!rows[0]) throw new Error("Missing staff row");
    return rows[0];
  } catch (error) {
    throw databaseError(error, "Não foi possível autorizar esta conta.");
  }
}

export async function updateBlackFridayStaff(id: string, values: { role?: BlackFridayRole; is_active?: boolean }) {
  const staffId = validId(id);
  if (!staffId) throw new BlackFridayDatabaseError("Usuário autorizado não encontrado.", 404);
  try {
    const rows = await queryNeon<BlackFridayStaff>(
      `update public.black_friday_staff set
        role = coalesce($2::text, role), is_active = coalesce($3::boolean, is_active)
       where id = $1::uuid returning id, email, role, is_active`,
      [staffId, values.role ?? null, values.is_active ?? null],
    );
    if (!rows[0]) throw new BlackFridayDatabaseError("Usuário autorizado não encontrado.", 404);
    return rows[0];
  } catch (error) {
    if (error instanceof BlackFridayDatabaseError) throw error;
    throw databaseError(error, "Não foi possível atualizar o acesso.");
  }
}

export async function assignBlackFridayLead(leadId: string, actorStaffId: string, allowReassign: boolean, targetStaffId?: string) {
  return await callFunction<{ assigned: boolean; lead: BlackFridayLead | null }>(
    "select public.black_friday_assign_lead($1::uuid, $2::uuid, $3::boolean, $4::uuid) as result",
    [leadId, actorStaffId, allowReassign, targetStaffId ?? actorStaffId],
    "Não foi possível assumir este atendimento.",
  ) as { assigned: boolean; lead: BlackFridayLead | null };
}

export async function changeBlackFridayLead(leadId: string, actorStaffId: string, values: { status: BlackFridayStatus; followUpAt?: string | null; clearFollowUp?: boolean }) {
  if (!isBlackFridayStatus(values.status)) throw new BlackFridayDatabaseError("Status inválido.", 400);
  const followUpAt = values.followUpAt ? new Date(values.followUpAt) : null;
  if (followUpAt && Number.isNaN(followUpAt.valueOf())) throw new BlackFridayDatabaseError("Data de retorno inválida.", 400);
  const result = await callFunction<{ lead: BlackFridayLead }>(
    "select public.black_friday_change_lead($1::uuid, $2::uuid, $3::text, $4::timestamptz, $5::boolean) as result",
    [leadId, actorStaffId, values.status, followUpAt?.toISOString() ?? null, values.clearFollowUp === true],
    "Não foi possível atualizar o interessado.",
  );
  if (!result) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  return result;
}

export async function addBlackFridayNote(leadId: string, actorStaffId: string, note: string, followUpAt?: string | null) {
  const cleanNote = cleanBlackFridayText(note, 2000);
  if (!cleanNote) throw new BlackFridayDatabaseError("Escreva uma observação antes de salvar.", 400);
  const date = followUpAt ? new Date(followUpAt) : null;
  if (date && Number.isNaN(date.valueOf())) throw new BlackFridayDatabaseError("Data de retorno inválida.", 400);
  const result = await callFunction<{ lead: BlackFridayLead }>(
    "select public.black_friday_add_note($1::uuid, $2::uuid, $3::text, $4::timestamptz) as result",
    [leadId, actorStaffId, cleanNote, date?.toISOString() ?? null],
    "Não foi possível salvar a observação.",
  );
  if (!result) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  return result;
}

export async function logBlackFridayContact(leadId: string, actorStaffId: string, message: string) {
  const cleanMessage = cleanBlackFridayText(message, 2000);
  if (!cleanMessage) throw new BlackFridayDatabaseError("A mensagem de contato está vazia.", 400);
  const result = await callFunction<{ lead: BlackFridayLead }>(
    "select public.black_friday_log_contact($1::uuid, $2::uuid, $3::text) as result",
    [leadId, actorStaffId, cleanMessage],
    "Não foi possível registrar o contato.",
  );
  if (!result) throw new BlackFridayDatabaseError("Interessado não encontrado.", 404);
  return result;
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
  return [columns.map(([label]) => escape(label)).join(","), ...leads.map((lead) => columns.map(([, value]) => escape(value(lead))).join(","))].join("\r\n");
}

export function isBlackFridayStaffRole(value: unknown): value is BlackFridayRole {
  return value === "administrator" || value === "receptionist";
}
