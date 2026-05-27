import { DRAW_DATE, WINNING_COUPLES_COUNT } from "@/config/campaign";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { formatRaffleNumber, normalizeDocument } from "@/lib/campaign";
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

type CreateEntryResult =
  | { ok: true; entry: CampaignEntry }
  | { ok: false; status: number; message: string };

const VALID_STATUSES: EntryStatus[] = [
  "Pendente",
  "Validado",
  "Desclassificado",
];

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

function isValidStatus(status: string): status is EntryStatus {
  return VALID_STATUSES.includes(status as EntryStatus);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validatePayload(payload: RegistrationPayload) {
  const requiredValues = [
    payload.studentName,
    payload.studentEmail,
    payload.studentPhone,
    payload.studentDocument,
    payload.companionName,
    payload.companionDocument,
    payload.companionPhone,
    payload.reviewUnit,
  ];

  if (requiredValues.some((value) => !String(value ?? "").trim())) {
    return "Preencha todos os campos obrigatórios.";
  }

  if (!isEmail(payload.studentEmail)) {
    return "Informe um e-mail válido.";
  }

  if (payload.companionEmail && !isEmail(payload.companionEmail)) {
    return "Informe um e-mail válido para o acompanhante.";
  }

  if (!payload.acceptedTerms || !payload.completedReview) {
    return "Confirme a avaliação e aceite o regulamento.";
  }

  if (
    normalizeDocument(payload.studentDocument) ===
    normalizeDocument(payload.companionDocument)
  ) {
    return "Aluno e acompanhante precisam ter CPFs diferentes.";
  }

  return null;
}

export async function getPublicCampaignEntries() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return MOCK_CAMPAIGN_ENTRIES;
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .order("raffle_number", { ascending: true });

  if (error || !data) {
    return MOCK_CAMPAIGN_ENTRIES;
  }

  return (data as CampaignEntryRow[]).map(mapEntryRow);
}

export async function getAdminCampaignEntries() {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return MOCK_CAMPAIGN_ENTRIES;
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

export async function createCampaignEntry(
  payload: RegistrationPayload,
): Promise<CreateEntryResult> {
  const validationMessage = validatePayload(payload);

  if (validationMessage) {
    return { ok: false, status: 400, message: validationMessage };
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
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
    return MOCK_CAMPAIGN_ENTRIES.filter((entry) => entry.status === "Validado")
      .sort(() => Math.random() - 0.5)
      .slice(0, WINNING_COUPLES_COUNT);
  }

  const { data, error } = await supabase
    .from("campaign_entries")
    .select("*")
    .eq("status", "Validado");

  if (error || !data) {
    throw new Error("Não foi possível carregar participantes validados.");
  }

  const shuffledEntries = (data as CampaignEntryRow[]).sort(
    () => Math.random() - 0.5,
  );
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
    throw new Error("Não foi possível salvar o resultado do sorteio.");
  }

  return selectedEntries.map(mapEntryRow);
}
