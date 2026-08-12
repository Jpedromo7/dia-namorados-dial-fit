import type { CAMPAIGN_UNITS } from "@/config/campaign";

export type CampaignUnit = (typeof CAMPAIGN_UNITS)[number];
export type EntryStatus = "Pendente" | "Validado" | "Desclassificado";

export type RegistrationPayload = {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentDocument: string;
  unit: CampaignUnit;
  reviewUnit: CampaignUnit;
  completedReview: true;
  parenthoodDeclared: true;
  acceptedTerms: true;
  // Mantidos vazios apenas para compatibilidade de leitura com a campanha anterior.
  companionName: string;
  companionDocument: string;
  companionPhone: string;
  companionEmail?: string;
};

export type RegistrationExtras = Record<string, never>;

export type CampaignEntry = RegistrationPayload & {
  id: string;
  campaignSlug: string;
  status: EntryStatus;
  acceptedTermsAt: string;
  createdAt: string;
  raffleNumber: string;
};
