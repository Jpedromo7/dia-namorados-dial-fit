"use client";

export type CampaignStep = "presentation" | "registration" | "confirmation";
const steps: Array<{ id: CampaignStep; label: string }> = [
  { id: "presentation", label: "Campanha" },
  { id: "registration", label: "Inscrição" },
  { id: "confirmation", label: "Confirmação" },
];

export function StepIndicator({ currentStep }: { currentStep: CampaignStep }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);
  return (
    <nav aria-label="Progresso" className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#070b08]/86 px-4 py-3 backdrop-blur-xl">
      <ol className="mx-auto grid max-w-xl grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <li key={step.id} className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-[11px] font-bold uppercase tracking-[0.08em] sm:text-xs ${step.id === currentStep ? "bg-[#55e814] text-[#071006]" : index < currentIndex ? "text-[#74f23d]" : "text-[#657067]"}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">{index + 1}</span><span className="hidden sm:inline">{step.label}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
