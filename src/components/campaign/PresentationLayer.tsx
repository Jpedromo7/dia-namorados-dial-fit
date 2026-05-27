"use client";

import {
  ArrowRight,
  Check,
  Heart,
  Info,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  CAMPAIGN_COMPLEMENT,
  CAMPAIGN_SUBTITLE,
  DIALFIT_LOGO,
  DRAW_DATE_LABEL,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import { FloatingHeartsEffect } from "./FloatingHeartsEffect";
import { LombardiaPhotoCarousel } from "./LombardiaPhotoCarousel";

const howItWorks = [
  "Cadastre seus dados como aluno ativo.",
  "Indique quem vai viver esse jantar com você.",
  "Acompanhe a confirmação e aguarde o sorteio especial.",
];

export function PresentationLayer({ onStart }: { onStart: () => void }) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#fff5ef] px-5 pb-8 pt-24 sm:px-6 lg:pt-[6.5rem]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#fff7f1_0%,#f8dfe3_38%,#f3c7d0_62%,#5b1224_100%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
      <div className="absolute -left-[18%] top-[18%] h-[52%] w-[44%] rotate-[-10deg] rounded-[42%] border border-white/35 bg-white/12 backdrop-blur-sm" />
      <div className="absolute -right-[18%] bottom-[4%] h-[58%] w-[48%] rotate-[12deg] rounded-[45%] border border-[#ffe4a8]/20 bg-[#3b111c]/14 backdrop-blur-sm" />
      <FloatingHeartsEffect />

      <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-7xl flex-col">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={180}
            height={74}
            priority
            className="dialfit-logo-clean h-auto w-[150px] sm:w-[176px]"
          />
          <div className="hidden items-center gap-2 rounded-full border border-white/45 bg-white/40 px-4 py-2 text-sm font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/8 backdrop-blur xl:inline-flex">
            <Heart size={16} aria-hidden="true" />
            Sorteio em {DRAW_DATE_LABEL}
          </div>
        </header>

        <div className="mb-8 lg:hidden">
          <LombardiaPhotoCarousel />
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <div className="max-w-2xl">
            <h1 className="font-display max-w-3xl text-5xl font-semibold leading-[0.93] text-[#3b111c] sm:text-6xl lg:text-[5.35rem]">
              <span className="block">Dia dos</span>
              <span className="block">Namorados</span>
              <span className="block text-[#7a1027]">Dial Fit</span>
            </h1>

            <p className="font-editorial mt-6 max-w-xl text-2xl leading-8 text-[#7a1027] sm:text-3xl sm:leading-10">
              {CAMPAIGN_SUBTITLE}
            </p>

            <div className="flex max-w-xl flex-col">
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={onStart}
                  className="group relative inline-flex min-h-[3.35rem] items-center justify-center gap-2 overflow-hidden rounded-full bg-[#0e8b4a] px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-[#0e8b4a]/22 transition duration-300 hover:-translate-y-0.5 hover:bg-[#0b723e] hover:shadow-2xl hover:shadow-[#0e8b4a]/26 focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2"
                >
                  <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] transition duration-700 group-hover:translate-x-[120%]" />
                  <span className="relative">Quero participar</span>
                  <ArrowRight
                    className="relative"
                    size={18}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setShowHowItWorks((current) => !current)}
                  className="inline-flex min-h-[3.35rem] items-center justify-center gap-2 rounded-full border border-[#7d2237]/20 bg-white/72 px-7 py-4 text-sm font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/8 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[#7d2237]/34 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#d8b55e] focus:ring-offset-2"
                >
                  <Info size={18} aria-hidden="true" />
                  Ver como funciona
                </button>
              </div>

              <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  ["Sorteio", DRAW_DATE_LABEL],
                  ["Jantar", PRIZE_DINNER_DATE_LABEL],
                  ["Prêmio", `${WINNING_COUPLES_COUNT} casais vencedores`],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`rounded-[1.25rem] border p-4 shadow-sm shadow-[#5b1224]/8 backdrop-blur ${
                      index === 2
                        ? "border-[#d8b55e]/48 bg-[#fff8e8]/74"
                        : "border-white/64 bg-white/58"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#a4213d]">
                      {index === 2 ? (
                        <Trophy size={15} aria-hidden="true" />
                      ) : (
                        <Heart size={15} aria-hidden="true" />
                      )}
                      {label}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-5 text-[#4e3039]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-base leading-7 text-[#60454d] sm:text-lg">
                {CAMPAIGN_COMPLEMENT}
              </p>
            </div>

            {showHowItWorks ? (
              <div className="mt-6 max-w-xl rounded-[1.5rem] border border-white/70 bg-white/62 p-4 shadow-lg shadow-[#5b1224]/10 backdrop-blur-xl">
                <div className="grid gap-3">
                  {howItWorks.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-[#5f4650]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff0f3] text-[#a4213d]">
                        <Check size={15} aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>

          <div className="relative hidden gap-5 lg:grid lg:min-h-[560px]">
            <div className="lg:absolute lg:right-0 lg:top-0 lg:w-[92%]">
              <LombardiaPhotoCarousel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
