"use client";

import { CheckCircle2, ExternalLink, Star } from "lucide-react";
import { DIAL_FIT_GOOGLE_REVIEW_URL } from "@/config/campaign";
import type { CampaignUnit } from "@/types/campaign";

const UNIT: CampaignUnit = "Dial Fit";

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
    <section className={`rounded-xl border bg-[#0d130f] p-5 ${showError ? "border-[#ff7d7d]" : "border-[#344137]"}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#55e814] text-[#071006]"><Star size={20} /></span>
        <div><h3 className="text-lg font-extrabold text-white">Avaliação obrigatória</h3><p className="mt-1 text-sm leading-6 text-[#a8b2aa]">Abra o perfil da Dial Fit no Google Maps e deixe sua avaliação antes de concluir.</p></div>
      </div>
      <a href={DIAL_FIT_GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" onClick={() => onReviewOpened(UNIT)} className="campaign-button mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 border-[#55e814]/50 bg-[#172019] px-5 text-sm font-bold text-[#74f23d]">
        {reviewedUnit ? <CheckCircle2 size={17} /> : <ExternalLink size={17} />} {reviewedUnit ? "Google Maps aberto" : "Avaliar no Google Maps"}
      </a>
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.025] p-4">
        <input type="checkbox" checked={reviewConfirmed} onChange={(event) => onReviewConfirmedChange(event.target.checked)} className="mt-1 h-5 w-5 accent-[#55e814]" />
        <span className="text-sm leading-6 text-[#dce2dd]">Confirmo que abri o Google Maps e deixei minha avaliação. <span className="text-[#55e814]">*</span></span>
      </label>
      {showError ? <p className="mt-3 text-sm font-semibold text-[#ff7d7d]">Abra o Google Maps e marque a confirmação.</p> : null}
    </section>
  );
}
