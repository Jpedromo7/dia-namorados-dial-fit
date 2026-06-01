import { randomInt } from "node:crypto";
import { DRAW_DATE, WINNING_COUPLES_COUNT } from "@/config/campaign";
import { CAMPAIGN_UNITS } from "@/config/campaign";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import {
  abbreviateName,
  formatRaffleNumber,
  normalizeDocument,
} from "@/lib/campaign";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  CampaignEntry,
  CampaignUnit,
  EntryStatus,
  RegistrationPayload,
} from "@/types/campaign";

type CampaignEntryRow = {
  id: string;
  raffle_number: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  student_document: string;
  unit: CampaignUnit;
  companion_name: string;
  companion_document: string;
  companion_phone: string;
  companion_email: string | null;
  review_unit: CampaignUnit;
  completed_review: boolean;
  status: EntryStatus;
  accepted_terms: boolean;
  accepted_terms_at: string;
  created_at: string;
};

type RaffleResultRow = {
  position: number;
  campaign_entries: CampaignEntryRow | CampaignEntryRow[] | null;
};

type CampaignEntryDocumentRow = {
  role: "student" | "companion";
  campaign_entries: CampaignEntryRow | CampaignEntryRow[] | null;
};

type CreateEntryResult =
  | { ok: true; entry: CampaignEntry }
  | { ok: false; status: number; message: string };

type NormalizedPayloadResult =
  | { ok: true; payload: RegistrationPayload }
  | { ok: false; status: number; message: string };

type LookupEntryResult =
  | { ok: true; entry: CampaignEntry }
  | { ok: false; status: number; message: string };

const VALID_STATUSES: EntryStatus[] = [
  "Pendente",
  "Validado",
  "Desclassificado",
];

function isDemoMode() {
  return process.env.NODE_ENV !== "production";
}

function redactPublicEntry(entry: CampaignEntry): CampaignEntry {
  return {
    ...entry,
    studentName: abbreviateName(entry.studentName),
    companionName: abbreviateName(entry.companionName),
    studentEmail: "",
    studentPhone: "",
    studentDocument: "",
    companionDocument: "",
    companionPhone: "",
    companionEmail: "",
  };
}

function mapEntryRow(row: CampaignEntryRow): CampaignEntry {
  return {
    id: row.id,
    raffleNumber: formatRaffleNumber(row.raffle_number),
    studentName: row.student_name,
    studentEmail: row.student_email,
    studentPhone: row.student_phone,
    studentDocument: row.student_document,
    unit: row.unit,
    companionName: row.companion_name,
    companionDocument: row.companion_document,
    companionPhone: row.companion_phone,
    companionEmail: row.companion_email ?? "",
    reviewUnit: row.review_unit,
    completedReview: true,
    status: row.status,
    acceptedTerms: row.accepted_terms as true,
    acceptedTermsAt: row.accepted_terms_at,
    createdAt: row.created_at,
  };
}

function getEntryFromJoinedRow(row: CampaignEntryDocumentRow) {
  const entry = Array.isArray(row.campaign_entries)
    ? row.campaign_entries[0]
    : row.campaign_entries;

  return entry ? mapEntryRow(entry) : null;
}

function sanitizeLookupEntry(
  entry: CampaignEntry,
  document: string,
  role: CampaignEntryDocumentRow["role"],
) {
  const normalizedDocument = normalizeDocument(document);

  return {
    ...entry,
    studentEmail: "",
    studentPhone: "",
    studentDocument: role === "student" ? normalizedDocument : "",
    companionDocument: role === "companion" ? normalizedDocument : "",
    companionPhone: "",
    companionEmail: "",
  };
}

function isValidStatus(status: string): status is EntryStatus {
  return VALID_STATUSES.includes(status as EntryStatus);
}

function isCampaignUnit(unit: string): unit is CampaignUnit {
  return CAMPAIGN_UNITS.includes(unit as CampaignUnit);
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function cpfDigits(value: unknown) {
  return cleanText(value, 24).replace(/\D/g, "");
}

function hasValidCpfChecksum(documentValue: string) {
  if (!/^\d{11}$/.test(documentValue) || /^(\d)\1{10}$/.test(documentValue)) {
    return false;
  }

  const digits = documentValue.split("").map(Number);
  const calculateDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;

    return remainder === 10 ? 0 : remainder;
  };

  return calculateDigit(9) === digits[9] && calculateDigit(10) === digits[10];
}

function isPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 13;
}

function normalizeRegistrationPayload(value: unknown): NormalizedPayloadResult {
  if (!value || typeof value !== "object") {
    return {
      ok: false,
      status: 400,
      message: "Dados de inscrição inválidos.",
    };
  }

  const payload = value as Partial<Record<keyof RegistrationPayload, unknown>>;
  const studentName = cleanText(payload.studentName, 120);
  const studentEmail = cleanText(payload.studentEmail, 254).toLowerCase();
  const studentPhone = cleanText(payload.studentPhone, 32);
  const studentDocument = cpfDigits(payload.studentDocument);
  const unit = cleanText(payload.unit, 40);
  const companionName = cleanText(payload.companionName, 120);
  const companionDocument = cpfDigits(payload.companionDocument);
  const companionPhone = cleanText(payload.companionPhone, 32);
  const companionEmail = cleanText(payload.companionEmail, 254).toLowerCase();
  const reviewUnit = cleanText(payload.reviewUnit, 40);

  const requiredValues = [
    studentName,
    studentEmail,
    studentPhone,
    studentDocument,
    unit,
    companionName,
    companionDocument,
    companionPhone,
    reviewUnit,
  ];

  if (requiredValues.some((value) => !String(value ?? "").trim())) {
    return {
      ok: false,
      status: 400,
      message: "Preencha todos os campos obrigatórios.",
    };
  }

  if (studentName.length < 3 || companionName.length < 3) {
    return {
      ok: false,
      status: 400,
      message: "Informe nomes completos válidos.",
    };
  }

  if (!isEmail(studentEmail)) {
    return { ok: false, status: 400, message: "Informe um e-mail válido." };
  }

  if (companionEmail && !isEmail(companionEmail)) {
    return {
      ok: false,
      status: 400,
      message: "Informe um e-mail válido para o acompanhante.",
    };
  }

  if (!isPhone(studentPhone) || !isPhone(companionPhone)) {
    return {
      ok: false,
      status: 400,
      message: "Informe telefones válidos com DDD.",
    };
  }

  if (
    !hasValidCpfChecksum(studentDocument) ||
    !hasValidCpfChecksum(companionDocument)
  ) {
    return { ok: false, status: 400, message: "Informe CPFs válidos." };
  }

  if (!isCampaignUnit(unit) || !isCampaignUnit(reviewUnit)) {
    return {
      ok: false,
      status: 400,
      message: "Selecione uma unidade válida.",
    };
  }

  if (!payload.acceptedTerms || !payload.completedReview) {
    return {
      ok: false,
      status: 400,
      message: "Confirme a avaliação e aceite o regulamento.",
    };
  }

  if (studentDocument === companionDocument) {
    return {
      ok: false,
      status: 400,
      message: "Aluno e acompanhante precisam ter CPFs diferentes.",
    };
  }

  return {
    ok: true,
    payload: {
      studentName,
      studentEmail,
      studentPhone,
      studentDocument,
      unit,
      companionName,
      companionDocument,
      companionPhone,
      companionEmail,
      reviewUnit,
      completedReview: true,
      acceptedTerms: true,
    },
  };
}

function shuffleEntries<T>(entries: T[]) {
  const shuffledEntries = [...entries];

  for (let index = shuffledEntries.length - 1; index > 0; index -= 1) {
    const targetIndex = randomInt(index + 1);
    const currentEntry = shuffledEntries[index];
    shuffledEntries[index] = shuffledEntries[targetIndex];
    shuffledEntries[targetIndex] = currentEntry;
  }

  return shuffledEntries;
}

export async function getPublicCampaignEntries() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return isDemoMode() ? MOCK_CAMPAIGN_ENTRIES.map(redactPublicEntry) : [];
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .order("raffle_number", { ascending: true });

  if (error || !data) {
    return MOCK_CAMPAIGN_ENTRIES;
  }

  return (data as CampaignEntryRow[]).map(mapEntryRow).map(redactPublicEntry);
}

export async function getAdminCampaignEntries() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (isDemoMode()) {
      return MOCK_CAMPAIGN_ENTRIES;
    }

    throw new Error("Banco da campanha não configurado.");
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .order("raffle_number", { ascending: true });

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível carregar inscritos.");
  }

  return (data as CampaignEntryRow[]).map(mapEntryRow);
}

export async function findCampaignEntryByDocument(
  document: string,
): Promise<LookupEntryResult> {
  const normalizedDocument = cpfDigits(document);

  if (!hasValidCpfChecksum(normalizedDocument)) {
    return {
      ok: false,
      status: 400,
      message: "Informe um CPF válido para consultar sua inscrição.",
    };
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!isDemoMode()) {
      return {
        ok: false,
        status: 503,
        message: "Banco da campanha não configurado.",
      };
    }

    const entry = MOCK_CAMPAIGN_ENTRIES.find(
      (item) =>
        cpfDigits(item.studentDocument) === normalizedDocument ||
        cpfDigits(item.companionDocument) === normalizedDocument,
    );

    if (!entry) {
      return {
        ok: false,
        status: 404,
        message: "Não encontramos inscrição com esse CPF.",
      };
    }

    const role =
      cpfDigits(entry.studentDocument) === normalizedDocument
        ? "student"
        : "companion";

    return {
      ok: true,
      entry: sanitizeLookupEntry(entry, normalizedDocument, role),
    };
  }

  const { data, error } = await supabase
    .from("campaign_entry_documents")
    .select("role,campaign_entries(*)")
    .eq("document_normalized", normalizedDocument)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      status: 500,
      message: "Não foi possível consultar sua inscrição agora.",
    };
  }

  if (!data) {
    return {
      ok: false,
      status: 404,
      message: "Não encontramos inscrição com esse CPF.",
    };
  }

  const documentRow = data as CampaignEntryDocumentRow;
  const entry = getEntryFromJoinedRow(documentRow);

  if (!entry) {
    return {
      ok: false,
      status: 404,
      message: "Não encontramos inscrição com esse CPF.",
    };
  }

  return {
    ok: true,
    entry: sanitizeLookupEntry(entry, normalizedDocument, documentRow.role),
  };
}

export async function createCampaignEntry(
  rawPayload: unknown,
): Promise<CreateEntryResult> {
  const normalizedPayload = normalizeRegistrationPayload(rawPayload);

  if (!normalizedPayload.ok) {
    return normalizedPayload;
  }

  const payload = normalizedPayload.payload;
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!isDemoMode()) {
      return {
        ok: false,
        status: 503,
        message: "Banco da campanha não configurado.",
      };
    }

    const now = new Date().toISOString();

    return {
      ok: true,
      entry: {
        ...payload,
        id: `local-${Date.now()}`,
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
      student_name: payload.studentName,
      student_email: payload.studentEmail,
      student_phone: payload.studentPhone,
      student_document: payload.studentDocument,
      unit: payload.unit,
      companion_name: payload.companionName,
      companion_document: payload.companionDocument,
      companion_phone: payload.companionPhone,
      companion_email: payload.companionEmail || null,
      review_unit: payload.reviewUnit,
      completed_review: true,
      accepted_terms: true,
      accepted_terms_at: new Date().toISOString(),
      status: "Pendente",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        status: 409,
        message: "Um dos CPFs já está cadastrado na campanha.",
      };
    }

    return {
      ok: false,
      status: 500,
      message: "Não foi possível salvar a inscrição agora.",
    };
  }

  return { ok: true, entry: mapEntryRow(data as CampaignEntryRow) };
}

export async function updateCampaignEntryStatus(
  id: string,
  status: string,
): Promise<CampaignEntry> {
  if (!isValidStatus(status)) {
    throw new Error("Status inválido.");
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!isDemoMode()) {
      throw new Error("Banco da campanha não configurado.");
    }

    const entry = MOCK_CAMPAIGN_ENTRIES.find((item) => item.id === id);

    if (!entry) {
      throw new Error("Inscrição não encontrada.");
    }

    return { ...entry, status };
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Não foi possível atualizar o status.");
  }

  return mapEntryRow(data as CampaignEntryRow);
}

function getRaffleEntryFromResult(row: RaffleResultRow) {
  const entry = Array.isArray(row.campaign_entries)
    ? row.campaign_entries[0]
    : row.campaign_entries;

  return entry ? mapEntryRow(entry) : null;
}

export async function getRaffleWinners() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("raffle_results")
    .select("position,campaign_entries(*)")
    .order("position", { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as RaffleResultRow[])
    .map(getRaffleEntryFromResult)
    .filter((entry): entry is CampaignEntry => Boolean(entry));
}

export async function drawCampaignWinners(adminEmail: string) {
  const drawTime = new Date(DRAW_DATE).getTime();

  if (Date.now() < drawTime) {
    throw new Error("O sorteio ainda está bloqueado pelo horário oficial.");
  }

  const existingWinners = await getRaffleWinners();

  if (existingWinners.length >= WINNING_COUPLES_COUNT) {
    return existingWinners;
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    if (!isDemoMode()) {
      throw new Error("Banco da campanha não configurado.");
    }

    return shuffleEntries(
      MOCK_CAMPAIGN_ENTRIES.filter((entry) => entry.status === "Validado"),
    ).slice(0, WINNING_COUPLES_COUNT);
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .eq("status", "Validado");

  if (error || !data) {
    throw new Error("Não foi possível carregar participantes validados.");
  }

  const shuffledEntries = shuffleEntries(data as CampaignEntryRow[]);
  const selectedEntries = shuffledEntries.slice(0, WINNING_COUPLES_COUNT);

  if (selectedEntries.length < WINNING_COUPLES_COUNT) {
    throw new Error("Não há inscrições validadas suficientes para o sorteio.");
  }

  const now = new Date().toISOString();
  const { error: insertError } = await supabase.from("raffle_results").insert(
    selectedEntries.map((entry, index) => ({
      position: index + 1,
      entry_id: entry.id,
      drawn_at: now,
      created_by_email: adminEmail,
    })),
  );

  if (insertError) {
    const winners = await getRaffleWinners();

    if (winners.length >= WINNING_COUPLES_COUNT) {
      return winners;
    }

    throw new Error("Não foi possível salvar o resultado do sorteio.");
  }

  return selectedEntries.map(mapEntryRow);
}
