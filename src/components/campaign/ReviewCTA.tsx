import { ExternalLink, MapPin, Star } from "lucide-react";
import {
  DIAL_BEACH_GOOGLE_REVIEW_URL,
  DIAL_FIT_GOOGLE_REVIEW_URL,
} from "@/config/campaign";

export function ReviewCTA() {
  return (
    <div className="rounded-lg border border-[#e8c4ca] bg-[#fff8f8] p-5 shadow-sm shadow-[#5b1224]/6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#a61f3d] text-white">
          <Star size={19} aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[#3b111c]">
            Falta só um passo para concluir
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6f555d]">
            Antes de finalizar sua inscrição, deixe sua avaliação sincera sobre
            a Dial Fit no Google Maps. Sua opinião ajuda nossa academia a
            crescer e mostra para outras pessoas como é treinar com a gente.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a
          href={DIAL_FIT_GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#0e8b4a]/20 bg-white px-4 py-3 text-center text-sm font-semibold text-[#0e8b4a] transition hover:border-[#0e8b4a]/45 hover:bg-[#f7fbf6]"
        >
          <MapPin size={17} aria-hidden="true" />
          Avaliar Dial Fit no Google Maps
          <ExternalLink size={15} aria-hidden="true" />
        </a>
        <a
          href={DIAL_BEACH_GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#0e8b4a]/20 bg-white px-4 py-3 text-center text-sm font-semibold text-[#0e8b4a] transition hover:border-[#0e8b4a]/45 hover:bg-[#f7fbf6]"
        >
          <MapPin size={17} aria-hidden="true" />
          Avaliar Dial Beach no Google Maps
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </div>

      <p className="mt-4 text-sm font-medium text-[#6f555d]">
        Depois de avaliar, volte para esta página e finalize sua inscrição.
      </p>
    </div>
  );
}
