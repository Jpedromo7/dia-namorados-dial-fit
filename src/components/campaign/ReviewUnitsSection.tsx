"use client";

import { CheckCircle2, ExternalLink, Heart, Star } from "lucide-react";
import {
  DIAL_BEACH_GOOGLE_REVIEW_URL,
  DIAL_FIT_GOOGLE_REVIEW_URL,
} from "@/config/campaign";
import type { CampaignUnit } from "@/types/campaign";

const reviewTargets: Array<{
  unit: CampaignUnit;
  href: string;
  label: string;
}> = [
  {
    unit: "Dial Fit",
    href: DIAL_FIT_GOOGLE_REVIEW_URL,
    label: "Dial Fit",
  },
  {
    unit: "Dial Beach",
    href: DIAL_BEACH_GOOGLE_REVIEW_URL,
    label: "Dial Beach",
  },
];

export function ReviewUnitsSection({
  reviewedUnit,
  reviewConfirmed,
  showError,
  onReviewOpened,
  onReviewConfirmedChange,
}: {
  reviewedUnit: CampaignUnit | "";
  reviewConfirmed: boolean;
  showError: boolean;
  onReviewOpened: (unit: CampaignUnit) => void;
  onReviewConfirmedChange: (checked: boolean) => void;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#f0d1d8] bg-[#fff8f7] p-5 shadow-sm shadow-[#5b1224]/6">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8e4e8] text-[#a4213d]">
          <Heart size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-semibold text-[#3b111c]">
            Avaliação obrigatória
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#795f66]">
            Sua avaliação faz parte da inscrição e ajuda outras pessoas a
            conhecerem nossas unidades.
          </p>
        </div>
      </div>

      <article
        className={`mt-5 rounded-[1.25rem] border bg-white/82 p-4 shadow-sm shadow-[#5b1224]/6 transition ${
          reviewedUnit
            ? "border-[#0e8b4a]/42 ring-2 ring-[#0e8b4a]/12"
            : "border-white"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fff1dd] text-[#a66b18]">
              <Star size={19} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[#4e3039]">
                Escolha uma unidade para avaliar no Google
              </h4>
              <p className="mt-1 text-xs font-medium text-[#795f66]">
                Os links abrem o Google Maps em uma nova aba.
              </p>
              {reviewedUnit ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0e8b4a]">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  {reviewedUnit} aberta para avaliação
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
            {reviewTargets.map((target) => {
              const selected = reviewedUnit === target.unit;

              return (
                <a
                  key={target.unit}
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onReviewOpened(target.unit)}
                  className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold shadow-md transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2 ${
                    selected
                      ? "bg-[#0e8b4a] text-white shadow-[#0e8b4a]/18"
                      : "border border-[#0e8b4a]/22 bg-white text-[#0e8b4a] shadow-[#5b1224]/6 hover:bg-[#f7fbf6]"
                  }`}
                >
                  Avaliar {target.label}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              );
            })}
          </div>
        </div>
      </article>

      <label
        className={`mt-5 flex cursor-pointer items-start gap-3 rounded-[1.2rem] border bg-white/74 p-4 transition ${
          showError
            ? "border-[#a4213d] ring-2 ring-[#a4213d]/12"
            : "border-white"
        }`}
      >
        <input
          type="checkbox"
          checked={reviewConfirmed}
          onChange={(event) =>
            onReviewConfirmedChange(event.currentTarget.checked)
          }
          className="mt-1 h-5 w-5 rounded border-[#d8aeb8] text-[#0e8b4a] accent-[#0e8b4a]"
        />
        <span className="text-sm leading-6 text-[#4e3039]">
          Confirmo que abri o Google Maps e deixei minha avaliação para concluir
          a inscrição.
          <span className="font-semibold text-[#a4213d]"> *</span>
          {reviewedUnit ? (
            <span className="mt-1 block text-xs font-semibold text-[#0e8b4a]">
              Unidade selecionada: {reviewedUnit}
            </span>
          ) : null}
        </span>
      </label>

      {showError ? (
        <p className="mt-2 text-sm font-semibold text-[#a4213d]">
          Abra uma avaliação e marque a confirmação para finalizar.
        </p>
      ) : null}
    </section>
  );
}
