import type { CAMPAIGN_UNITS } from "@/config/campaign";

export type CampaignUnit = (typeof CAMPAIGN_UNITS)[number];
export type EntryStatus = "Pendente" | "Validado" | "Desclassificado";

export type RegistrationPayload = {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentDocument: string;
  unit: CampaignUnit;
  companionName: string;
  companionDocument: string;
  companionPhone: string;
  companionEmail?: string;
  reviewUnit: CampaignUnit;
  completedReview: true;
  acceptedTerms: true;
};

export type RegistrationExtras = {
  couplePhotoDataUrl?: string | null;
};

export type CampaignEntry = RegistrationPayload & {
  id: string;
  status: EntryStatus;
  acceptedTermsAt: string;
  createdAt: string;
  raffleNumber: string;
};
