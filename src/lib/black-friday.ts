export const BLACK_FRIDAY_STATUSES = [
  "Novo",
  "Em contato",
  "Em negociação",
  "Venda concluída",
  "Não interessado",
] as const;

export type BlackFridayStatus = (typeof BLACK_FRIDAY_STATUSES)[number];

export type BlackFridayLead = {
  id: string;
  name: string;
  phone: string;
  status: BlackFridayStatus;
  assigned_to: string;
  notes: string;
  consented_at: string;
  created_at: string;
  updated_at: string;
};

export function normalizeBrazilianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const local = digits.length >= 12 && digits.startsWith("55") ? digits.slice(2) : digits;
  if (!/^[1-9]\d{9,10}$/.test(local) || /^(\d)\1+$/.test(local)) return null;
  return local;
}

export function formatBrazilianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  if (digits.length === 10) return "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
  return phone;
}

export function isBlackFridayStatus(value: unknown): value is BlackFridayStatus {
  return typeof value === "string" && (BLACK_FRIDAY_STATUSES as readonly string[]).includes(value);
}
