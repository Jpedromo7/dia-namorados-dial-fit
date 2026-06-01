"use client";

import { CheckCircle2, ExternalLink, Heart, Star } from "lucide-react";
import { DIAL_FIT_GOOGLE_REVIEW_URL } from "@/config/campaign";
import type { CampaignUnit } from "@/types/campaign";

const DIAL_FIT_UNIT: CampaignUnit = "Dial Fit";

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
    <section className="campaign-frame-soft bg-[#fff8f7] p-5">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#3b111c]/18 bg-[#f8e4e8] text-[#a4213d]">
          <Heart size={18} aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-semibold text-[#3b111c]">
            Avaliação obrigatória
          </h3>
          <p className="mt-1 text-sm leading-6 text-[#795f66]">
            Sua avaliação faz parte da inscrição e ajuda outras pessoas a
            conhecerem a Dial Fit.
          </p>
        </div>
      </div>

      <article
        className={`mt-5 rounded-lg border-2 bg-white/82 p-4 shadow-sm shadow-[#5b1224]/6 transition ${
          reviewedUnit
            ? "border-[#0e8b4a]/60 ring-2 ring-[#0e8b4a]/12"
            : "border-[#3b111c]/18"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#3b111c]/16 bg-[#fff1dd] text-[#a66b18]">
              <Star size={19} aria-hidden="true" />
            </span>
            <div>
              <h4 className="text-sm font-semibold text-[#4e3039]">
                Avalie a Dial Fit no Google
              </h4>
              <p className="mt-1 text-xs font-medium text-[#795f66]">
                O link abre o Google Maps em uma nova aba.
              </p>
              {reviewedUnit ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#0e8b4a]">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  Avaliação aberta
                </p>
              ) : null}
            </div>
          </div>

          <a
            href={DIAL_FIT_GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onReviewOpened(DIAL_FIT_UNIT)}
            className={`campaign-button inline-flex h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap px-5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2 ${
              reviewedUnit
                ? "bg-[#0e8b4a] text-white"
                : "bg-white text-[#0e8b4a] hover:bg-[#f7fbf6]"
            }`}
          >
            Avaliar no Google Maps
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </article>

      <label
        className={`mt-5 flex cursor-pointer items-start gap-3 rounded-lg border-2 bg-white/74 p-4 transition ${
          showError
            ? "border-[#a4213d] ring-2 ring-[#a4213d]/12"
            : "border-[#3b111c]/18"
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
