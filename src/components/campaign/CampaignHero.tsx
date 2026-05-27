import {
  CalendarHeart,
  ChevronDown,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import {
  CAMPAIGN_COMPLEMENT,
  CAMPAIGN_NAME,
  CAMPAIGN_SUBTITLE,
  DRAW_DATE,
  DRAW_DATE_LABEL,
} from "@/config/campaign";
import { CountdownTimer } from "./CountdownTimer";

export function CampaignHero() {
  return (
    <section className="relative overflow-hidden bg-[#f7fbf6] text-[#101712]">
      <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(14,139,74,0.12),rgba(255,255,255,0.82)_46%,rgba(188,42,64,0.12))]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,23,18,0.04)_1px,transparent_1px),linear-gradient(0deg,rgba(16,23,18,0.04)_1px,transparent_1px)] bg-[size:44px_44px] opacity-60" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center px-5 py-5 sm:px-6">
        <Image
          src="/dial-fit-logo.svg"
          alt="Dial Fit"
          width={165}
          height={54}
          priority
          className="h-auto w-[138px] sm:w-[165px]"
        />
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl gap-8 px-5 pb-14 pt-6 sm:px-6 md:min-h-[74svh] md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#d8b55e]/40 bg-white/80 px-3 py-2 text-sm font-semibold text-[#6f5720] shadow-sm shadow-emerald-950/5">
            <Sparkles size={16} aria-hidden="true" />
            Campanha oficial Dial Fit
          </div>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.03] text-[#101712] sm:text-6xl">
            {CAMPAIGN_NAME}
          </h1>

          <p className="mt-5 max-w-xl text-xl font-medium leading-8 text-[#233027]">
            {CAMPAIGN_SUBTITLE}
          </p>

          <p className="mt-4 max-w-xl text-base leading-7 text-[#536158]">
            {CAMPAIGN_COMPLEMENT}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#inscricao"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#0e8b4a] px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-900/18 transition hover:bg-[#0b723e] focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2"
            >
              Quero participar
              <ChevronDown size={18} aria-hidden="true" />
            </a>

            <div className="inline-flex items-center gap-2 text-sm font-medium text-[#536158]">
              <CalendarHeart size={18} className="text-[#bc2a40]" aria-hidden="true" />
              Sorteio em {DRAW_DATE_LABEL}
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-white/80 bg-white/76 p-5 shadow-xl shadow-emerald-950/10 backdrop-blur md:p-6">
          <CountdownTimer targetDate={DRAW_DATE} />

          <div className="mt-6 rounded-lg border border-[#0e8b4a]/14 bg-[#f7fbf6] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#0e8b4a] text-white">
                <HeartHandshake size={20} aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#101712]">
                  Jantar para casal
                </p>
                <p className="text-sm text-[#536158]">
                  Restaurante Lombardia, com menu especial da campanha.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
