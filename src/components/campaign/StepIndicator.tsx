"use client";

export type CampaignStep = "presentation" | "registration" | "confirmation";

const steps: Array<{ id: CampaignStep; label: string; number: string }> = [
  { id: "presentation", label: "Campanha", number: "1" },
  { id: "registration", label: "Cadastro", number: "2" },
  { id: "confirmation", label: "Confirmação", number: "3" },
];

export function StepIndicator({ currentStep }: { currentStep: CampaignStep }) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav
      aria-label="Progresso da campanha"
      className="pointer-events-none fixed inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6"
    >
      <ol className="campaign-frame-soft pointer-events-auto mx-auto grid max-w-xl grid-cols-3 gap-1 bg-[#fffaf8]/92 p-1.5 backdrop-blur-xl">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isComplete = index < currentIndex;

          return (
            <li key={step.id} className="min-w-0">
              <div
                aria-current={isActive ? "step" : undefined}
                className={`relative flex min-h-10 min-w-0 items-center justify-center gap-0.5 rounded-md px-0.5 py-2 text-[10px] font-semibold transition duration-300 sm:min-h-11 sm:gap-2 sm:px-3 sm:text-sm ${
                  isActive
                    ? "bg-[#5b1224] text-white shadow-md shadow-[#5b1224]/18"
                    : isComplete
                      ? "text-[#0e8b4a]"
                      : "text-[#7a5f67]"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[11px] sm:h-6 sm:w-6 sm:text-xs ${
                    isActive
                      ? "border-white bg-white text-[#5b1224]"
                      : isComplete
                        ? "border-[#0e8b4a]/24 bg-[#e7f7ed] text-[#0e8b4a]"
                        : "border-[#ead0d6] bg-[#f7e8ec] text-[#7a5f67]"
                  }`}
                >
                  {step.number}
                </span>
                <span className="whitespace-nowrap">{step.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
