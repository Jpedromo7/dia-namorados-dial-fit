import "server-only";

import { randomInt } from "node:crypto";
import {
  CAMPAIGN_SLUG,
  CAMPAIGN_UNITS,
  DRAW_DATE,
  REGISTRATION_END_DATE,
  WINNERS_COUNT,
} from "@/config/campaign";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { abbreviateName, formatRaffleNumber } from "@/lib/campaign";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CampaignEntry,
  CampaignUnit,
  EntryStatus,
  RegistrationPayload,
} from "@/types/campaign";

type CampaignEntryRow = {
  id: string;
  campaign_slug: string;
  raffle_number: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_document: string;
  unit: CampaignUnit;
  companion_name: string | null;
  companion_document: string | null;
  companion_phone: string | null;
  companion_email: string | null;
  review_unit: CampaignUnit;
  completed_review: boolean;
  parenthood_declared: boolean;
  status: EntryStatus;
  accepted_terms: boolean;
  accepted_terms_at: string;
  created_at: string;
};

type RaffleResultRow = {
  position: number;
  campaign_entries: CampaignEntryRow | CampaignEntryRow[] | null;
};

type CreateEntryResult =
  | { ok: true; entry: CampaignEntry }
  | { ok: false; status: number; message: string };
type LookupEntryResult =
  | { ok: true; entry: CampaignEntry }
  | { ok: false; status: number; message: string };
type NormalizedPayloadResult =
  | { ok: true; payload: RegistrationPayload }
  | { ok: false; status: number; message: string };

const VALID_STATUSES: EntryStatus[] = [
  "Pendente",
  "Validado",
  "Desclassificado",
];

function isDemoMode() {
  return process.env.CAMPAIGN_DEMO_MODE === "true";
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function cpfDigits(value: unknown) {
  return cleanText(value, 24).replace(/\D/g, "");
}

function hasValidCpfChecksum(value: string) {
  if (!/^\d{11}$/.test(value) || /^(\d)\1{10}$/.test(value)) return false;
  const digits = value.split("").map(Number);
  const calculateDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return calculateDigit(9) === digits[9] && calculateDigit(10) === digits[10];
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

function isCampaignUnit(value: string): value is CampaignUnit {
  return CAMPAIGN_UNITS.includes(value as CampaignUnit);
}

function normalizeRegistrationPayload(value: unknown): NormalizedPayloadResult {
  if (!value || typeof value !== "object") {
    return { ok: false, status: 400, message: "Dados de inscrição inválidos." };
  }

  const raw = value as Partial<Record<keyof RegistrationPayload, unknown>>;
  const studentName = cleanText(raw.studentName, 120);
  const studentEmail = cleanText(raw.studentEmail, 254).toLowerCase();
  const studentPhone = cleanText(raw.studentPhone, 32);
  const studentDocument = cpfDigits(raw.studentDocument);
  const unit = cleanText(raw.unit, 40);
  const reviewUnit = cleanText(raw.reviewUnit, 40);

  if (
    !studentName ||
    !studentEmail ||
    !studentPhone ||
    !studentDocument ||
    !unit ||
    !reviewUnit
  ) {
    return { ok: false, status: 400, message: "Preencha todos os campos obrigatórios." };
  }
  if (studentName.length < 3) {
    return { ok: false, status: 400, message: "Informe seu nome completo." };
  }
  if (!isEmail(studentEmail)) {
    return { ok: false, status: 400, message: "Informe um e-mail válido." };
  }
  if (!isPhone(studentPhone)) {
    return { ok: false, status: 400, message: "Informe um telefone válido com DDD." };
  }
  if (!hasValidCpfChecksum(studentDocument)) {
    return { ok: false, status: 400, message: "Informe um CPF válido." };
  }
  if (!isCampaignUnit(unit) || !isCampaignUnit(reviewUnit)) {
    return { ok: false, status: 400, message: "Selecione uma unidade válida." };
  }
  if (!raw.parenthoodDeclared) {
    return { ok: false, status: 400, message: "Confirme que você é pai e aluno da Dial Fit." };
  }
  if (!raw.completedReview || !raw.acceptedTerms) {
    return { ok: false, status: 400, message: "Confirme a avaliação e aceite o regulamento." };
  }

  return {
    ok: true,
    payload: {
      studentName,
      studentEmail,
      studentPhone,
      studentDocument,
      unit,
      reviewUnit,
      completedReview: true,
      parenthoodDeclared: true,
      acceptedTerms: true,
      companionName: "",
      companionDocument: "",
      companionPhone: "",
      companionEmail: "",
    },
  };
}

function mapEntryRow(row: CampaignEntryRow, raffleNumber?: string): CampaignEntry {
  return {
    id: row.id,
    campaignSlug: row.campaign_slug,
    raffleNumber: raffleNumber ?? formatRaffleNumber(row.raffle_number),
    studentName: row.student_name,
    studentEmail: row.student_email,
    studentPhone: row.student_phone,
    studentDocument: row.student_document,
    unit: row.unit,
    reviewUnit: row.review_unit,
    completedReview: true,
    parenthoodDeclared: row.parenthood_declared as true,
    acceptedTerms: row.accepted_terms as true,
    companionName: "",
    companionDocument: "",
    companionPhone: "",
    companionEmail: "",
    status: row.status,
    acceptedTermsAt: row.accepted_terms_at,
    createdAt: row.created_at,
  };
}

function mapEntryRows(rows: CampaignEntryRow[]) {
  return [...rows]
    .sort((a, b) => a.raffle_number - b.raffle_number)
    .map((row, index) => mapEntryRow(row, formatRaffleNumber(index + 1)));
}

function redactPublicEntry(entry: CampaignEntry): CampaignEntry {
  return {
    ...entry,
    studentName: abbreviateName(entry.studentName),
    studentEmail: "",
    studentPhone: "",
    studentDocument: "",
  };
}

function shuffleEntries<T>(entries: T[]) {
  const shuffled = [...entries];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = randomInt(index + 1);
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }
  return shuffled;
}

export async function getPublicCampaignEntries() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (isDemoMode()) return MOCK_CAMPAIGN_ENTRIES.map(redactPublicEntry);
    throw new Error("Banco da campanha não configurado.");
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .order("raffle_number", { ascending: true });
  if (error || !data) {
    if (isDemoMode()) return MOCK_CAMPAIGN_ENTRIES.map(redactPublicEntry);
    throw new Error(error?.message ?? "Não foi possível carregar inscritos.");
  }
  return mapEntryRows(data as CampaignEntryRow[]).map(redactPublicEntry);
}

export async function getAdminCampaignEntries() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (isDemoMode()) return MOCK_CAMPAIGN_ENTRIES;
    throw new Error("Banco da campanha não configurado.");
  }
  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .order("raffle_number", { ascending: true });
  if (error || !data) throw new Error(error?.message ?? "Não foi possível carregar inscritos.");
  return mapEntryRows(data as CampaignEntryRow[]);
}

export async function findCampaignEntryByDocument(document: string): Promise<LookupEntryResult> {
  const normalizedDocument = cpfDigits(document);
  if (!hasValidCpfChecksum(normalizedDocument)) {
    return { ok: false, status: 400, message: "Informe um CPF válido para consultar sua inscrição." };
  }
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!isDemoMode()) return { ok: false, status: 503, message: "Banco da campanha não configurado." };
    const entry = MOCK_CAMPAIGN_ENTRIES.find((item) => cpfDigits(item.studentDocument) === normalizedDocument);
    if (!entry) return { ok: false, status: 404, message: "Não encontramos inscrição com esse CPF." };
    return { ok: true, entry: { ...entry, studentEmail: "", studentPhone: "" } };
  }
  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .eq("student_document_normalized", normalizedDocument)
    .maybeSingle();
  if (error) return { ok: false, status: 500, message: "Não foi possível consultar sua inscrição agora." };
  if (!data) return { ok: false, status: 404, message: "Não encontramos inscrição com esse CPF." };
  const entries = await getAdminCampaignEntries();
  const current = entries.find((entry) => entry.id === (data as CampaignEntryRow).id) ?? mapEntryRow(data as CampaignEntryRow);
  return { ok: true, entry: { ...current, studentEmail: "", studentPhone: "" } };
}

export async function createCampaignEntry(rawPayload: unknown): Promise<CreateEntryResult> {
  if (Date.now() > new Date(REGISTRATION_END_DATE).getTime()) {
    return {
      ok: false,
      status: 403,
      message: "As inscrições para esta campanha foram encerradas.",
    };
  }

  const normalized = normalizeRegistrationPayload(rawPayload);
  if (!normalized.ok) return normalized;
  const payload = normalized.payload;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!isDemoMode()) return { ok: false, status: 503, message: "Banco da campanha não configurado." };
    const now = new Date().toISOString();
    return {
      ok: true,
      entry: {
        ...payload,
        id: `local-${Date.now()}`,
        campaignSlug: CAMPAIGN_SLUG,
        raffleNumber: formatRaffleNumber(MOCK_CAMPAIGN_ENTRIES.length + 1),
        status: "Pendente",
        acceptedTermsAt: now,
        createdAt: now,
      },
    };
  }
  const { data, error } = await supabase
    .from("campaign_entries")
    .insert({
      campaign_slug: CAMPAIGN_SLUG,
      student_name: payload.studentName,
      student_email: payload.studentEmail,
      student_phone: payload.studentPhone,
      student_document: payload.studentDocument,
      unit: payload.unit,
      companion_name: null,
      companion_document: null,
      companion_phone: null,
      companion_email: null,
      review_unit: payload.reviewUnit,
      completed_review: true,
      parenthood_declared: true,
      accepted_terms: true,
      accepted_terms_at: new Date().toISOString(),
      status: "Pendente",
    })
    .select("*")
    .single();
  if (error) {
    if (error.code === "23505") return { ok: false, status: 409, message: "Este CPF já está cadastrado na campanha." };
    return { ok: false, status: 500, message: "Não foi possível salvar a inscrição agora." };
  }
  const entries = await getAdminCampaignEntries();
  return { ok: true, entry: entries.find((entry) => entry.id === (data as CampaignEntryRow).id) ?? mapEntryRow(data as CampaignEntryRow) };
}

export async function updateCampaignEntryStatus(id: string, status: string) {
  if (!VALID_STATUSES.includes(status as EntryStatus)) throw new Error("Status inválido.");
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!isDemoMode()) throw new Error("Banco da campanha não configurado.");
    const entry = MOCK_CAMPAIGN_ENTRIES.find((item) => item.id === id);
    if (!entry) throw new Error("Inscrição não encontrada.");
    return { ...entry, status: status as EntryStatus };
  }
  const { data, error } = await supabase
    .from("campaign_entries")
    .update({ status })
    .eq("id", id)
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Não foi possível atualizar o status.");
  return mapEntryRow(data as CampaignEntryRow);
}

export async function deleteCampaignEntry(id: string) {
  const entryId = cleanText(id, 80);
  if (!entryId) throw new Error("Inscrição inválida.");
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!isDemoMode()) throw new Error("Banco da campanha não configurado.");
    if (!MOCK_CAMPAIGN_ENTRIES.some((item) => item.id === entryId)) throw new Error("Inscrição não encontrada.");
    return { id: entryId };
  }
  const { data: raffleResult } = await supabase.from("raffle_results").select("id").eq("entry_id", entryId).maybeSingle();
  if (raffleResult) throw new Error("Não é possível excluir uma inscrição já sorteada.");
  const { data, error } = await supabase
    .from("campaign_entries")
    .delete()
    .eq("id", entryId)
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .select("id")
    .single();
  if (error || !data) throw new Error("Não foi possível excluir a inscrição.");
  return { id: entryId };
}

function resultEntry(row: RaffleResultRow) {
  const entry = Array.isArray(row.campaign_entries) ? row.campaign_entries[0] : row.campaign_entries;
  return entry ? mapEntryRow(entry) : null;
}

export async function getRaffleWinners() {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (isDemoMode()) return [];
    throw new Error("Banco da campanha não configurado.");
  }
  const { data, error } = await supabase
    .from("raffle_results")
    .select("position,campaign_entries(*)")
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .order("position", { ascending: true });
  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível carregar o resultado do sorteio.");
  }
  return (data as RaffleResultRow[]).map(resultEntry).filter((entry): entry is CampaignEntry => Boolean(entry));
}

export async function getPublicRaffleWinners() {
  return (await getRaffleWinners()).map(redactPublicEntry);
}

export async function drawCampaignWinners(adminEmail: string) {
  if (Date.now() < new Date(DRAW_DATE).getTime()) throw new Error("O sorteio ainda está bloqueado pelo horário oficial.");
  const existing = await getRaffleWinners();
  if (existing.length >= WINNERS_COUNT) return existing;
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    if (!isDemoMode()) throw new Error("Banco da campanha não configurado.");
    return shuffleEntries(MOCK_CAMPAIGN_ENTRIES.filter((entry) => entry.status === "Validado")).slice(0, WINNERS_COUNT);
  }
  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .eq("campaign_slug", CAMPAIGN_SLUG)
    .eq("status", "Validado");
  if (error || !data) throw new Error("Não foi possível carregar participantes validados.");
  const selected = shuffleEntries(data as CampaignEntryRow[]).slice(0, WINNERS_COUNT);
  if (selected.length < WINNERS_COUNT) throw new Error("Não há inscrições validadas suficientes para o sorteio.");
  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from("raffle_results").insert(
    selected.map((entry, index) => ({
      campaign_slug: CAMPAIGN_SLUG,
      position: index + 1,
      entry_id: entry.id,
      drawn_at: now,
      created_by_email: adminEmail,
    })),
  );
  if (insertError) throw new Error("Não foi possível salvar o resultado do sorteio.");
  return selected.map((entry) => mapEntryRow(entry));
}
