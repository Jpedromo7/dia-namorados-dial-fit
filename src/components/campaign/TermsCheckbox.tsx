"use client";

import { Heart, Sparkles } from "lucide-react";
import { useId, useState, type CSSProperties } from "react";
import { CAMPAIGN_RULES_URL } from "@/config/campaign";

type TermsCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  showError?: boolean;
};

const microHearts = [
  { left: "30%", delay: "0ms", x: "-12px", icon: Heart },
  { left: "43%", delay: "80ms", x: "2px", icon: Sparkles },
  { left: "57%", delay: "120ms", x: "14px", icon: Heart },
] as const;

export function TermsCheckbox({
  checked,
  onCheckedChange,
  showError = false,
}: TermsCheckboxProps) {
  const checkboxId = useId();
  const [burstKey, setBurstKey] = useState(0);

  function handleChange(nextChecked: boolean) {
    onCheckedChange(nextChecked);

    if (nextChecked) {
      setBurstKey((current) => current + 1);
    }
  }

  return (
    <div>
      <label
        htmlFor={checkboxId}
        className={`relative flex items-start gap-3 overflow-hidden rounded-lg border-2 bg-white/86 p-4 text-sm text-[#4e3039] shadow-sm shadow-[#5b1224]/5 transition duration-300 ${
          checked
            ? "border-[#0e8b4a]/60"
            : "border-[#3b111c]/18 hover:border-[#3b111c]/34"
        }`}
      >
        {burstKey > 0
          ? microHearts.map((item, index) => {
              const Icon = item.icon;

              return (
                <Icon
                  key={`${burstKey}-${index}`}
                  aria-hidden="true"
                  size={14}
                  className="terms-heart-rise absolute top-4 text-[#a4213d]"
                  style={
                    {
                      left: item.left,
                      animationDelay: item.delay,
                      "--x": item.x,
                    } as CSSProperties
                  }
                />
              );
            })
          : null}
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={(event) => handleChange(event.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-[#b7c8bc] text-[#0e8b4a] accent-[#0e8b4a]"
        />
        <span className="relative leading-6">
          Confirmo que sou aluno ativo de plano anual ou anual recorrente da
          Dial Fit, sei que plano mensal não participa, e li e concordo com o
          regulamento da campanha.{" "}
          <a
            href={CAMPAIGN_RULES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#0e8b4a] underline decoration-[#0e8b4a]/30 underline-offset-4 hover:text-[#0b723e]"
          >
            Ler regulamento completo
          </a>
        </span>
      </label>
      {showError ? (
        <p className="mt-2 text-sm font-medium text-[#a4213d]">
          Aceite o regulamento para finalizar sua inscrição.
        </p>
      ) : null}
    </div>
  );
}
