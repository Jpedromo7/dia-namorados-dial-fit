"use client";

import { useId } from "react";
import { CAMPAIGN_RULES_URL } from "@/config/campaign";

export function TermsCheckbox({
  checked,
  onCheckedChange,
  showError = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showError?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border bg-[#0d130f] p-4 ${showError ? "border-[#ff7d7d]" : checked ? "border-[#55e814]/55" : "border-[#344137]"}`}>
        <input id={id} type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-1 h-5 w-5 accent-[#55e814]" />
        <span className="text-sm leading-6 text-[#dce2dd]">Li e concordo com o <a href={CAMPAIGN_RULES_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-[#74f23d] underline underline-offset-4">regulamento completo da campanha</a>, incluindo os critérios de validação da inscrição. <span className="text-[#55e814]">*</span></span>
      </label>
      {showError ? <p className="mt-2 text-sm font-semibold text-[#ff7d7d]">Aceite o regulamento para finalizar.</p> : null}
    </div>
  );
}
