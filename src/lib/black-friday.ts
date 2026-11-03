export const BLACK_FRIDAY_CAMPAIGN_SLUG = "black-friday-de-arrepiar-2026";
export const BLACK_FRIDAY_CONSENT_VERSION = "black-friday-2026-v1";

export const BLACK_FRIDAY_STATUSES = [
  "novo",
  "em_contato",
  "aguardando_resposta",
  "matriculado",
  "nao_convertido",
] as const;

export type BlackFridayStatus = (typeof BLACK_FRIDAY_STATUSES)[number];
export type BlackFridayRole = "administrator" | "receptionist";

export const BLACK_FRIDAY_STATUS_LABELS: Record<BlackFridayStatus, string> = {
  novo: "Novo",
  em_contato: "Em contato",
  aguardando_resposta: "Aguardando resposta",
  matriculado: "Matriculado",
  nao_convertido: "Não convertido",
};

export const BLACK_FRIDAY_ROLE_LABELS: Record<BlackFridayRole, string> = {
  administrator: "Administrador",
  receptionist: "Recepcionista",
};

export type BlackFridayStaff = {
  id: string;
  email: string;
  role: BlackFridayRole;
  is_active: boolean;
};

export type BlackFridayLead = {
  id: string;
  name: string;
  phone: string;
  preferred_contact_time: "morning" | "afternoon" | "evening" | "anytime" | null;
  status: BlackFridayStatus;
  assigned_to: string | null;
  assignee?: Pick<BlackFridayStaff, "id" | "email"> | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  consented_at: string;
  consent_version: string;
  contacted_at: string | null;
  converted_at: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  last_interaction_at?: string | null;
};

export type BlackFridayActivity = {
  id: string;
  lead_id: string;
  actor_staff_id: string | null;
  event_type: "assignment" | "status_change" | "note" | "follow_up" | "contact_logged";
  body: string;
  follow_up_at: string | null;
  created_at: string;
  actor?: Pick<BlackFridayStaff, "id" | "email"> | null;
};

export type BlackFridayReport = {
  total: number;
  converted: number;
  contacted: number;
  awaiting_response: number;
  average_first_contact_seconds: number | null;
  by_status: Array<{ status: BlackFridayStatus; count: number }>;
  daily: Array<{ date: string; count: number }>;
  by_source: Array<{ source: string; count: number }>;
  by_staff: Array<{ staff: string; count: number }>;
};

export function normalizeBrazilianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const local = (digits.length === 12 || digits.length === 13) && digits.startsWith("55")
    ? digits.slice(2)
    : digits;

  if (!/^[1-9]\d{9,10}$/.test(local) || /^(\d)\1+$/.test(local)) return null;
  return local;
}

export function formatBrazilianPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (digits.length > 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length > 2) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length > 0) return `(${digits}`;
  return "";
}

export function isBlackFridayStatus(value: unknown): value is BlackFridayStatus {
  return typeof value === "string" && (BLACK_FRIDAY_STATUSES as readonly string[]).includes(value);
}

export function cleanBlackFridayText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function cleanUtm(value: unknown) {
  return cleanBlackFridayText(value, 120);
}

export function deriveBlackFridaySource(utmSource: string, utmMedium: string) {
  const source = utmSource.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const medium = utmMedium.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const combined = `${source}-${medium}`;

  if (combined.includes("instagram") && (combined.includes("story") || combined.includes("stories"))) {
    return "Instagram Stories";
  }
  if (combined.includes("bio")) return "Link da bio";
  if (source.includes("whatsapp") || medium.includes("whatsapp")) return "WhatsApp";
  if (combined.includes("qr") || combined.includes("qrcode")) return "QR Code";
  if (source.includes("direct") || medium.includes("direct")) return "Divulgação direta";
  if (source || medium) return "Outros canais";
  return "Acesso direto";
}

export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}
