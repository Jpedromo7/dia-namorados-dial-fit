import { CAMPAIGN_SLUG } from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";

const baseEntry = {
  campaignSlug: CAMPAIGN_SLUG,
  unit: "Dial Fit" as const,
  reviewUnit: "Dial Fit" as const,
  completedReview: true as const,
  parenthoodDeclared: true as const,
  acceptedTerms: true as const,
  companionName: "",
  companionDocument: "",
  companionPhone: "",
  companionEmail: "",
};

export const MOCK_CAMPAIGN_ENTRIES: CampaignEntry[] = [
  {
    ...baseEntry,
    id: "entry-pais-001",
    raffleNumber: "001",
    studentName: "João Pedro Almeida",
    studentEmail: "joao.almeida@example.com",
    studentPhone: "(11) 99999-0101",
    studentDocument: "529.982.247-25",
    status: "Validado",
    acceptedTermsAt: "2026-08-11T17:30:00-03:00",
    createdAt: "2026-08-11T17:30:00-03:00",
  },
  {
    ...baseEntry,
    id: "entry-pais-002",
    raffleNumber: "002",
    studentName: "Carlos Eduardo Santos",
    studentEmail: "carlos.santos@example.com",
    studentPhone: "(11) 99999-0201",
    studentDocument: "111.444.777-35",
    status: "Pendente",
    acceptedTermsAt: "2026-08-12T09:15:00-03:00",
    createdAt: "2026-08-12T09:15:00-03:00",
  },
  {
    ...baseEntry,
    id: "entry-pais-003",
    raffleNumber: "003",
    studentName: "Marcos Vinícius Oliveira",
    studentEmail: "marcos.oliveira@example.com",
    studentPhone: "(11) 99999-0301",
    studentDocument: "123.456.789-09",
    status: "Validado",
    acceptedTermsAt: "2026-08-12T10:40:00-03:00",
    createdAt: "2026-08-12T10:40:00-03:00",
  },
];
