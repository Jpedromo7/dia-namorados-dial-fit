import type { CampaignEntry } from "@/types/campaign";

export function abbreviateName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return `${parts[0]} ${parts[1][0].toUpperCase()}.`;
}

export function formatRaffleNumber(value: number) {
  return String(value).padStart(3, "0");
}

export function normalizeDocument(value: string) {
  return value.replace(/[^\da-z]/gi, "").toUpperCase();
}

export function buildPublicParticipantLabel(entry: CampaignEntry) {
  return `${entry.raffleNumber} - ${abbreviateName(entry.studentName)} + ${abbreviateName(entry.companionName)} - Confirmado`;
}

export function entriesToCsv(entries: CampaignEntry[]) {
  const headers = [
    "raffle_number",
    "student_name",
    "student_email",
    "student_phone",
    "student_document",
    "unit",
    "companion_name",
    "companion_document",
    "companion_phone",
    "companion_email",
    "review_unit",
    "completed_review",
    "status",
    "accepted_terms",
    "accepted_terms_at",
    "created_at",
  ];

  const rows = entries.map((entry) => [
    entry.raffleNumber,
    entry.studentName,
    entry.studentEmail,
    entry.studentPhone,
    entry.studentDocument,
    entry.unit,
    entry.companionName,
    entry.companionDocument,
    entry.companionPhone,
    entry.companionEmail ?? "",
    entry.reviewUnit,
    entry.completedReview ? "true" : "false",
    entry.status,
    entry.acceptedTerms ? "true" : "false",
    entry.acceptedTermsAt,
    entry.createdAt,
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell).replaceAll('"', '""');
          return `"${value}"`;
        })
        .join(","),
    )
    .join("\n");
}
