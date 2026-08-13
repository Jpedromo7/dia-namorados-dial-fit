export const CAMPAIGN_SLUG = "dia-dos-pais-2026";
export const CAMPAIGN_NAME = "Agosto dos Pais Dial Fit";
export const CAMPAIGN_KICKER = "Pai forte. Família forte.";
export const CAMPAIGN_SUBTITLE =
  "Pai que treina, inspira. Participe do sorteio especial da Dial Fit.";
export const CAMPAIGN_COMPLEMENT =
  "Participação exclusiva para pais que sejam alunos ativos da Dial Fit. Uma inscrição por CPF.";

export const WINNERS_COUNT = 1;
export const DRAW_DATE = "2026-08-14T18:00:00-03:00";
export const DRAW_DATE_LABEL = "14 de agosto de 2026, às 18h";
export const REGISTRATION_END_LABEL = "14 de agosto de 2026, às 17h59";

export const DIALFIT_LOGO = "/campanha-namorados/dialfit-logo.png";
export const DIAL_FIT_GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/search/?api=1&query=Dial%20Fit%20Academia";
export const CAMPAIGN_RULES_URL = "/regulamento";

export const CAMPAIGN_UNITS = ["Dial Fit"] as const;

export const PRIZES = [
  {
    title: "Creatina",
    partner: "RR Suplementos",
    description: "1 unidade de creatina para reforçar a rotina de treino.",
  },
  {
    title: "Consulta online",
    partner: "Dra. Dayanne Botelho",
    description: "1 consulta online com acompanhamento profissional.",
  },
  {
    title: "Kit de limpeza",
    partner: "Mult Limpo",
    description: "1 kit especial de produtos de limpeza.",
  },
] as const;

// Compatibilidade temporária para componentes legados que não fazem mais parte
// do fluxo público. Eles podem ser removidos em uma limpeza posterior.
export const WINNING_COUPLES_COUNT = WINNERS_COUNT;
export const PRIZE_DINNER_DATE = "2026-08-14";
export const PRIZE_DINNER_DATE_LABEL = "14 de agosto de 2026";
export const LOMBARDIA_LOGO = DIALFIT_LOGO;
export const LOMBARDIA_HERO_IMAGE = "/romantic-dinner-campaign.png";
export const LOMBARDIA_WINE_IMAGE = "/romantic-dinner-campaign.png";
export const LOMBARDIA_FACADE_IMAGE = "/romantic-dinner-campaign.png";
export const LOMBARDIA_SALAO_IMAGE = "/romantic-dinner-campaign.png";
