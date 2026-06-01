"use client";

import {
  ArrowRight,
  Check,
  Heart,
  Info,
  Loader2,
  Search,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";
import {
  CAMPAIGN_COMPLEMENT,
  CAMPAIGN_SUBTITLE,
  DIALFIT_LOGO,
  DRAW_DATE_LABEL,
  LOMBARDIA_LOGO,
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

export function PresentationLayer({
  hasStoredRegistration,
  onLookupRegistration,
  onResume,
  onStart,
}: {
  hasStoredRegistration: boolean;
  onLookupRegistration: (document: string) => Promise<void> | void;
  onResume: () => void;
  onStart: () => void;
}) {
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [lookupDocument, setLookupDocument] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  async function handleLookupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (lookupDocument.trim().length < 6) {
      setLookupError("Digite o CPF usado na inscrição.");
      return;
    }

    setIsLookingUp(true);
    setLookupError("");

    try {
      await onLookupRegistration(lookupDocument);
    } catch (error) {
      setLookupError(
        error instanceof Error
          ? error.message
          : "Não foi possível encontrar sua inscrição.",
      );
    } finally {
      setIsLookingUp(false);
    }
  }

  return (
    <section className="campaign-bg relative isolate min-h-screen overflow-hidden px-5 pb-10 pt-24 sm:px-6 lg:pt-[6.5rem]">
      <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),transparent)]" />
      <FloatingHeartsEffect />

      <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-[1440px] flex-col">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={180}
            height={74}
            priority
            className="dialfit-logo-clean h-auto w-[142px] sm:w-[176px]"
          />
          <div className="campaign-frame-soft hidden items-center gap-2 bg-[#fffaf8]/90 px-4 py-3 text-sm font-semibold text-[#5b1224] backdrop-blur xl:inline-flex">
            <Heart size={16} aria-hidden="true" />
            Sorteio em {DRAW_DATE_LABEL}
          </div>
        </header>

        <div className="campaign-frame grid flex-1 overflow-hidden bg-white/88 backdrop-blur lg:grid-cols-[0.96fr_1.04fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-md border-2 border-[#3b111c] bg-[#fff8e8] px-3 py-2 text-sm font-semibold text-[#5b1224]">
                <Trophy size={16} aria-hidden="true" />
                Campanha oficial Dial Fit
              </span>
              <span className="inline-flex items-center gap-2 rounded-md border-2 border-[#3b111c] bg-[#e7f7ed] px-3 py-2 text-sm font-semibold text-[#0b723e]">
                {WINNING_COUPLES_COUNT} casais vencedores
              </span>
            </div>

            <h1 className="font-display max-w-3xl text-[2.35rem] font-semibold leading-[0.96] text-[#3b111c] min-[380px]:text-5xl sm:text-6xl lg:text-[5.35rem]">
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
                  className="campaign-button group relative inline-flex min-h-[3.35rem] items-center justify-center gap-2 overflow-hidden bg-[#0e8b4a] px-8 py-4 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2"
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
                  className="campaign-button inline-flex min-h-[3.35rem] items-center justify-center gap-2 bg-white/90 px-7 py-4 text-sm font-semibold text-[#5b1224] backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#d8b55e] focus:ring-offset-2"
                >
                  <Info size={18} aria-hidden="true" />
                  Ver como funciona
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLookup((current) => !current);
                    setLookupError("");
                  }}
                  className="campaign-button inline-flex min-h-[3.35rem] items-center justify-center gap-2 bg-white/90 px-7 py-4 text-sm font-semibold text-[#5b1224] backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#d8b55e] focus:ring-offset-2"
                >
                  <Search size={18} aria-hidden="true" />
                  Já me cadastrei
                </button>
                {hasStoredRegistration ? (
                  <button
                    type="button"
                    onClick={onResume}
                    className="campaign-button inline-flex min-h-[3.35rem] items-center justify-center gap-2 bg-[#f7fbf6] px-7 py-4 text-sm font-semibold text-[#0b723e] backdrop-blur focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2"
                  >
                    <Check size={18} aria-hidden="true" />
                    Ver minha inscrição
                  </button>
                ) : null}
              </div>

              {showLookup ? (
                <form
                  noValidate
                  onSubmit={handleLookupSubmit}
                  className="campaign-frame-soft mt-4 max-w-xl bg-[#fffaf8]/92 p-4 backdrop-blur-xl"
                >
                  <label className="block">
                    <span className="text-sm font-semibold text-[#5b1224]">
                      Acesse sua inscrição pelo CPF
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#7a5f67]">
                      Digite o CPF do aluno ou do acompanhante para abrir a
                      página de confirmação.
                    </span>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={lookupDocument}
                        placeholder="000.000.000-00"
                        onChange={(event) =>
                          setLookupDocument(event.target.value)
                        }
                        className="campaign-field h-12 min-w-0 px-4 text-sm placeholder:text-[#a98d95]"
                      />
                      <button
                        type="submit"
                        disabled={isLookingUp}
                        className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-[#0e8b4a] px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:bg-[#9db9a9]"
                      >
                        {isLookingUp ? (
                          <Loader2
                            className="animate-spin"
                            size={17}
                            aria-hidden="true"
                          />
                        ) : (
                          <Search size={17} aria-hidden="true" />
                        )}
                        Abrir confirmação
                      </button>
                    </div>
                  </label>
                  {lookupError ? (
                    <p className="mt-3 text-sm font-semibold text-[#a4213d]">
                      {lookupError}
                    </p>
                  ) : null}
                </form>
              ) : null}

              <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
                {[
                  ["Sorteio", DRAW_DATE_LABEL],
                  ["Jantar", PRIZE_DINNER_DATE_LABEL],
                  ["Prêmio", `${WINNING_COUPLES_COUNT} casais vencedores`],
                ].map(([label, value], index) => (
                  <div
                    key={label}
                    className={`campaign-frame-soft p-4 backdrop-blur ${
                      index === 2
                        ? "bg-[#fff8e8]/88"
                        : "bg-white/80"
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
              <div className="campaign-frame-soft mt-6 max-w-xl bg-white/88 p-4 backdrop-blur-xl">
                <div className="grid gap-3">
                  {howItWorks.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 text-sm text-[#5f4650]"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#3b111c]/18 bg-[#fff0f3] text-[#a4213d]">
                        <Check size={15} aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>

          <aside className="relative min-h-[430px] overflow-hidden border-t-2 border-[#3b111c] bg-[#3b111c] lg:min-h-[640px] lg:border-l-2 lg:border-t-0">
            <div className="absolute inset-0">
              <LombardiaPhotoCarousel />
            </div>
            <div className="pointer-events-none absolute left-5 top-5 z-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.72)]">
              <Image
                src={LOMBARDIA_LOGO}
                alt="Lombardia Risotos e Massas"
                width={176}
                height={80}
                className="lombardia-logo-clean h-auto w-[150px] sm:w-[176px]"
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
