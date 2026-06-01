"use client";

import {
  CheckCircle2,
  Heart,
  Home,
  Share2,
  Utensils,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  CAMPAIGN_NAME,
  DIALFIT_LOGO,
  DRAW_DATE,
  DRAW_DATE_LABEL,
  LOMBARDIA_FACADE_IMAGE,
  LOMBARDIA_LOGO,
  LOMBARDIA_SALAO_IMAGE,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";
import { CountdownTimer } from "./CountdownTimer";
import { FloatingHeartsEffect } from "./FloatingHeartsEffect";
import { ParticipationShareCard } from "./ParticipationShareCard";
import { ParticipantsPreview } from "./ParticipantsPreview";
import { RaffleResultCard } from "./RaffleResultCard";

export function ConfirmationLayer({
  couplePhotoDataUrl,
  entries,
  latestEntry,
  onRestart,
}: {
  couplePhotoDataUrl?: string | null;
  entries: CampaignEntry[];
  latestEntry: CampaignEntry | null;
  onRestart: () => void;
}) {
  const [shareStatus, setShareStatus] = useState("");
  const [drawReady, setDrawReady] = useState(false);
  const raffleWinners = useMemo(
    () =>
      drawReady
        ? entries
            .filter((entry) => entry.status === "Validado")
            .slice(0, WINNING_COUPLES_COUNT)
        : [],
    [drawReady, entries],
  );

  useEffect(() => {
    const drawTime = new Date(DRAW_DATE).getTime();
    const updateDrawState = () => setDrawReady(Date.now() >= drawTime);

    updateDrawState();
    const intervalId = window.setInterval(updateDrawState, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function shareCampaign() {
    const shareData = {
      title: CAMPAIGN_NAME,
      text: "Participe da campanha Dia dos Namorados Dial Fit.",
      url: window.location.origin,
    };

    if (navigator.share) {
      await navigator.share(shareData);
      setShareStatus("Campanha compartilhada.");
      return;
    }

    await navigator.clipboard.writeText(shareData.url);
    setShareStatus("Link copiado.");
  }

  return (
    <section className="campaign-bg relative isolate min-h-screen overflow-hidden px-5 pb-10 pt-24 sm:px-6 lg:pt-[6.5rem]">
      <div className="absolute inset-0 opacity-20">
        <Image
          src={LOMBARDIA_SALAO_IMAGE}
          alt=""
          fill
          sizes="100vw"
          className="object-cover blur-sm"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,247,241,0.9),rgba(255,247,241,0.78)_46%,rgba(91,18,36,0.24))]" />
      <FloatingHeartsEffect />

      <div className="relative mx-auto grid w-full max-w-7xl gap-6">
        <header className="flex items-center justify-between gap-4">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={170}
            height={70}
            className="dialfit-logo-clean h-auto w-[142px] sm:w-[166px]"
          />
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <section className="campaign-frame bg-white/88 p-6 text-center backdrop-blur-xl sm:p-8">
            <div className="campaign-frame-soft mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center bg-[#e7f7ed] text-[#0e8b4a]">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-md bg-white">
                <Heart
                  className="absolute -right-1 -top-1 text-[#a4213d]"
                  size={18}
                  fill="currentColor"
                  aria-hidden="true"
                />
                <CheckCircle2 size={36} aria-hidden="true" />
              </span>
            </div>
            <h1 className="font-display mt-6 text-4xl font-semibold leading-tight text-[#3b111c] sm:text-5xl">
              Inscrição realizada com sucesso!
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6f555d]">
              Boa sorte! Seu cadastro foi recebido para a campanha{" "}
              {CAMPAIGN_NAME}.
            </p>
            <div className="campaign-frame-soft mx-auto mt-7 inline-flex items-center gap-3 bg-[#fff8e8] px-6 py-4 text-[#5b1224]">
              <span className="text-sm font-semibold">Seu número:</span>
              <span className="font-display text-4xl font-semibold leading-none text-[#0e8b4a]">
                {latestEntry?.raffleNumber ?? "001"}
              </span>
            </div>
          </section>

          <section className="campaign-frame-gold relative min-h-[430px] overflow-hidden bg-[#3b111c]">
            <Image
              src={LOMBARDIA_FACADE_IMAGE}
              alt="Fachada do Restaurante Lombardia à noite"
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,10,20,0.08),rgba(43,10,20,0.48)_44%,rgba(22,7,12,0.92))]" />
            <div className="absolute inset-x-6 bottom-6 text-white">
              <Image
                src={LOMBARDIA_LOGO}
                alt="Lombardia Risotos e Massas"
                width={166}
                height={74}
                className="lombardia-logo-clean h-auto w-[142px]"
              />
              <h2 className="font-display mt-5 text-4xl font-semibold leading-tight">
                O jantar dos vencedores será no Lombardia
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
                Serão {WINNING_COUPLES_COUNT} casais vencedores, em uma
                experiência real, elegante e especial no dia{" "}
                {PRIZE_DINNER_DATE_LABEL}.
              </p>
            </div>
          </section>
        </div>

        <section className="campaign-frame bg-white/88 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#3b111c]/18 bg-[#fff0f3] px-4 py-2 text-sm font-semibold text-[#a4213d]">
                <Utensils size={16} aria-hidden="true" />
                Expectativa para o sorteio
              </div>
              <p className="mt-4 text-sm leading-6 text-[#6f555d]">
                Acompanhe o tempo restante até {DRAW_DATE_LABEL}.
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <CountdownTimer
                targetDate={DRAW_DATE}
                title="Contagem regressiva para o sorteio"
                description={`O resultado com os ${WINNING_COUPLES_COUNT} casais vencedores será divulgado aqui. O jantar será em ${PRIZE_DINNER_DATE_LABEL}.`}
                large
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <ParticipantsPreview entries={entries} />
          {drawReady ? (
            <RaffleResultCard drawReady={drawReady} winners={raffleWinners} />
          ) : (
            <ParticipationShareCard
              couplePhotoDataUrl={couplePhotoDataUrl}
              entry={latestEntry}
            />
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={shareCampaign}
            className="campaign-button inline-flex h-[3.25rem] items-center justify-center gap-2 bg-[#0e8b4a] px-7 text-sm font-semibold text-white"
          >
            <Share2 size={18} aria-hidden="true" />
            Compartilhar campanha
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="campaign-button inline-flex h-[3.25rem] items-center justify-center gap-2 bg-white/90 px-7 text-sm font-semibold text-[#5b1224] backdrop-blur"
          >
            <Home size={18} aria-hidden="true" />
            Voltar para o início
          </button>
        </div>

        {shareStatus ? (
          <p className="text-center text-sm font-semibold text-[#0e8b4a]">
            {shareStatus}
          </p>
        ) : null}
      </div>
    </section>
  );
}
