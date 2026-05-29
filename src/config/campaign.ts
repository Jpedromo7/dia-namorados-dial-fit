export const CAMPAIGN_NAME = "Dia dos Namorados Dial Fit";
export const CAMPAIGN_SUBTITLE =
  "Concorra a um jantar especial para casal no Restaurante Lombardia.";
export const CAMPAIGN_COMPLEMENT =
  "Alunos ativos podem se cadastrar e indicar um acompanhante para participar da campanha.";
export const WINNING_COUPLES_COUNT = 2;

export const DIALFIT_LOGO = "/campanha-namorados/dialfit-logo.png";
export const LOMBARDIA_LOGO = "/campanha-namorados/lombardia-logo.png";
export const LOMBARDIA_HERO_IMAGE =
  "/campanha-namorados/lombardia-hero.jpg";
export const LOMBARDIA_WINE_IMAGE =
  "/campanha-namorados/lombardia-vinho.jpg";
export const LOMBARDIA_FACADE_IMAGE =
  "/campanha-namorados/lombardia-fachada.jpg";
export const LOMBARDIA_SALAO_IMAGE =
  "/campanha-namorados/lombardia-salao.jpg";

export const DRAW_DATE = "2026-06-12T18:00:00-03:00";
export const DRAW_DATE_LABEL = "12 de junho de 2026, às 18h";

export const PRIZE_DINNER_DATE = "2026-06-18";
export const PRIZE_DINNER_DATE_LABEL = "18 de junho de 2026";

export const DIAL_FIT_GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/search/?api=1&query=Dial%20Fit%20Academia";
export const DIAL_BEACH_GOOGLE_REVIEW_URL =
  "https://www.google.com/maps/search/?api=1&query=Dial%20Beach%20Academia";
export const CAMPAIGN_RULES_URL =
  "/campanha-namorados/regulamento-dia-dos-namorados-dial-fit.pdf";

export const CAMPAIGN_UNITS = ["Dial Fit", "Dial Beach"] as const;

/*
Banco de dados futuro sugerido para Supabase:

campaign_entries:
- id
- student_name
- student_email
- student_phone
- student_document
- unit
- companion_name
- companion_document
- companion_phone
- companion_email
- review_unit
- completed_review
- status
- accepted_terms
- accepted_terms_at
- created_at
- raffle_number

campaign_settings:
- id
- campaign_name
- draw_date
- rules_url
- dial_fit_review_url
- dial_beach_review_url
*/
