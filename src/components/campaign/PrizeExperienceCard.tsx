import { Check, Gift, Sparkles, Utensils } from "lucide-react";
import Image from "next/image";
import {
  LOMBARDIA_LOGO,
  LOMBARDIA_WINE_IMAGE,
  PRIZE_DINNER_DATE_LABEL,
} from "@/config/campaign";

const includedItems = ["Entrada", "Prato principal", "Sobremesa"];

export function PrizeExperienceCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <article
      className={`relative isolate overflow-hidden rounded-[2rem] border border-white/50 bg-[#3a101b] text-white shadow-2xl shadow-[#5b1224]/25 ${
        compact ? "min-h-[360px]" : "min-h-[480px]"
      }`}
    >
      <Image
        src={LOMBARDIA_WINE_IMAGE}
        alt="Garrafa de vinho e taças em mesa posta no Restaurante Lombardia"
        fill
        sizes={compact ? "(min-width: 1024px) 30vw, 100vw" : "100vw"}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,10,20,0.24),rgba(54,11,24,0.7)_48%,rgba(31,8,15,0.94))]" />
      <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#f4d190]/70 to-transparent" />

      <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f4d190]/40 bg-white/12 px-4 py-2 text-sm font-semibold text-[#ffe2a6] backdrop-blur">
            <Gift size={16} aria-hidden="true" />
            Prêmio especial
          </span>
          <Image
            src={LOMBARDIA_LOGO}
            alt="Lombardia Risotos e Massas"
            width={152}
            height={68}
            className="lombardia-logo-clean h-auto w-[118px] sm:w-[142px]"
          />
        </div>

        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/14 text-[#ffe2a6] backdrop-blur">
            <Utensils size={24} aria-hidden="true" />
          </div>
          <h2
            className={`font-display mt-5 max-w-sm font-semibold leading-[1.02] text-white ${
              compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"
            }`}
          >
            Jantar especial para casal
          </h2>
          <p className="mt-4 max-w-sm text-base leading-7 text-white/78">
            Uma experiência especial no Restaurante Lombardia no dia{" "}
            {PRIZE_DINNER_DATE_LABEL}.
          </p>

          <ul className="mt-6 grid gap-3">
            {includedItems.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 rounded-full border border-white/14 bg-white/12 px-4 py-3 text-sm font-semibold text-white backdrop-blur"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0e8b4a] text-white">
                  <Check size={15} aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Sparkles
        aria-hidden="true"
        className="floating-romance absolute bottom-8 right-8 text-[#f4d190]/50"
        size={30}
      />
    </article>
  );
}
