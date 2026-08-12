import { Heart, Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import {
  DIALFIT_LOGO,
  LOMBARDIA_FACADE_IMAGE,
  LOMBARDIA_LOGO,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";

function getWinnerLabel(winner: CampaignEntry | undefined, position: number) {
  return winner
    ? `${winner.studentName} + ${winner.companionName}`
    : `${position}º casal vencedor`;
}

export function RaffleResultCard({
  drawReady,
  winners,
}: {
  drawReady: boolean;
  winners: CampaignEntry[];
}) {
  const winnerSlots = Array.from(
    { length: WINNING_COUPLES_COUNT },
    (_, index) => winners[index],
  );

  return (
    <section className="campaign-frame-gold relative isolate overflow-hidden bg-[#3b111c] p-5 text-white sm:p-6">
      <Image
        src={LOMBARDIA_FACADE_IMAGE}
        alt="Fachada do Restaurante Lombardia à noite"
        fill
        sizes="(min-width: 1024px) 46vw, 100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(44,9,20,0.42),rgba(44,9,20,0.78)_52%,rgba(23,7,12,0.94))]" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#f4d190]/70 to-transparent" />
      <Heart
        className="floating-romance absolute right-8 top-8 text-[#f5b8c3]/36"
        size={32}
        aria-hidden="true"
      />
      <Sparkles
        className="floating-romance absolute bottom-10 left-8 text-[#f4d190]/50"
        size={30}
        aria-hidden="true"
      />

      <div className="relative flex min-h-[470px] flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/14 px-4 py-2 text-sm font-semibold text-[#ffe7ad] backdrop-blur">
            <Trophy size={16} aria-hidden="true" />
            Casais sorteados
          </div>
          <div className="flex items-center gap-3">
            <Image
              src={DIALFIT_LOGO}
              alt="Dial Fit Academia"
              width={118}
              height={50}
              className="dialfit-logo-clean h-auto w-[96px]"
            />
            <Image
              src={LOMBARDIA_LOGO}
              alt="Lombardia Risotos e Massas"
              width={126}
              height={56}
              className="lombardia-logo-clean h-auto w-[96px]"
            />
          </div>
        </div>

        <div className="mx-auto max-w-xl text-center">
          <p className="font-editorial text-2xl text-[#ffe7ad]">
            {drawReady ? "Parabéns!" : "Área pronta para o sorteio"}
          </p>
          <h2 className="font-display mt-4 text-4xl font-semibold leading-[1.04] sm:text-5xl">
            {WINNING_COUPLES_COUNT} casais vencedores
          </h2>

          <div className="mt-6 grid gap-3">
            {winnerSlots.map((winner, index) => (
              <div
                key={winner?.id ?? `winner-placeholder-${index}`}
                className="rounded-lg border border-white/18 bg-white/12 px-4 py-3 text-left backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase text-[#ffe7ad]/86">
                  {index + 1}º casal
                </p>
                <p className="mt-1 text-lg font-semibold leading-snug text-white">
                  {getWinnerLabel(winner, index + 1)}
                </p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-white/78">
            {drawReady
              ? "Resultado preparado para print, postagem e divulgação oficial."
              : `No dia e horário do sorteio, os ${WINNING_COUPLES_COUNT} casais vencedores aparecerão aqui com visual especial para divulgação.`}
          </p>
        </div>

        <div className="rounded-lg border border-white/18 bg-white/12 p-4 text-center text-sm text-white/76 backdrop-blur">
          Dia dos Namorados Dial Fit em parceria com o Restaurante Lombardia.
          Jantar dos vencedores em {PRIZE_DINNER_DATE_LABEL}.
        </div>
      </div>
    </section>
  );
}
