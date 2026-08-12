import type { CampaignEntry } from "@/types/campaign";

export function abbreviateName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export function formatRaffleNumber(value: number) {
  return String(value).padStart(3, "0");
}

export function normalizeDocument(value: string) {
  return value.replace(/[^\da-z]/gi, "").toUpperCase();
}

export function buildPublicParticipantLabel(entry: CampaignEntry) {
  return `${entry.raffleNumber} - ${abbreviateName(entry.studentName)} - Confirmado`;
}

export function entriesToCsv(entries: CampaignEntry[]) {
  const headers = [
    "raffle_number",
    "student_name",
    "student_email",
    "student_phone",
    "student_document",
    "father_declared",
    "completed_review",
    "status",
    "accepted_terms_at",
    "created_at",
  ];
  const rows = entries.map((entry) => [
    entry.raffleNumber,
    entry.studentName,
    entry.studentEmail,
    entry.studentPhone,
    entry.studentDocument,
    entry.parenthoodDeclared ? "true" : "false",
    entry.completedReview ? "true" : "false",
    entry.status,
    entry.acceptedTermsAt,
    entry.createdAt,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}
