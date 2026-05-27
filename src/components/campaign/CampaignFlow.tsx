"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { normalizeDocument } from "@/lib/campaign";
import type { CampaignEntry, RegistrationPayload } from "@/types/campaign";
import { ConfirmationLayer } from "./ConfirmationLayer";
import { CTAHeartsEffect } from "./CTAHeartsEffect";
import { PresentationLayer } from "./PresentationLayer";
import { RegistrationLayer } from "./RegistrationLayer";
import { type CampaignStep, StepIndicator } from "./StepIndicator";

export function CampaignFlow({
  initialEntries = MOCK_CAMPAIGN_ENTRIES,
}: {
  initialEntries?: CampaignEntry[];
}) {
  const [currentStep, setCurrentStep] =
    useState<CampaignStep>("presentation");
  const [entries, setEntries] = useState<CampaignEntry[]>(initialEntries);
  const [latestEntry, setLatestEntry] = useState<CampaignEntry | null>(null);
  const [celebrationKey, setCelebrationKey] = useState(0);

  const publicEntries = useMemo(
    () =>
      [...entries].sort(
        (first, second) =>
          Number(first.raffleNumber) - Number(second.raffleNumber),
      ),
    [entries],
  );

  const takenDocuments = useMemo(
    () =>
      entries.flatMap((entry) => [
        normalizeDocument(entry.studentDocument),
        normalizeDocument(entry.companionDocument),
      ]).filter(Boolean),
    [entries],
  );

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  function resetViewport() {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  async function handleRegister(payload: RegistrationPayload) {
    const response = await fetch("/api/campaign/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      throw new Error(
        data?.message ?? "Não foi possível concluir sua inscrição.",
      );
    }

    const { entry } = (await response.json()) as { entry: CampaignEntry };

    setEntries((currentEntries) => [...currentEntries, entry]);
    setLatestEntry(entry);
    setCurrentStep("confirmation");
    setCelebrationKey((current) => current + 1);
    resetViewport();
  }

  function startRegistration() {
    setCelebrationKey((current) => current + 1);
    setCurrentStep("registration");
    resetViewport();
  }

  function restartFlow() {
    setCurrentStep("presentation");
    resetViewport();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff6f1] text-[#1f1719]">
      <StepIndicator currentStep={currentStep} />
      <CTAHeartsEffect burstKey={celebrationKey} />

      <div key={currentStep} className="animate-campaign-layer">
        {currentStep === "presentation" ? (
          <PresentationLayer onStart={startRegistration} />
        ) : null}

        {currentStep === "registration" ? (
          <RegistrationLayer
            onBack={() => setCurrentStep("presentation")}
            onRegister={handleRegister}
            takenDocuments={takenDocuments}
          />
        ) : null}

        {currentStep === "confirmation" ? (
          <ConfirmationLayer
            entries={publicEntries}
            latestEntry={latestEntry}
            onRestart={restartFlow}
          />
        ) : null}
      </div>
    </main>
  );
}
