"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeDocument } from "@/lib/campaign";
import type { CampaignEntry, RegistrationPayload } from "@/types/campaign";
import { ConfirmationLayer } from "./ConfirmationLayer";
import { PresentationLayer } from "./PresentationLayer";
import { RegistrationLayer } from "./RegistrationLayer";
import { type CampaignStep, StepIndicator } from "./StepIndicator";

const STORAGE_KEY = "dialfit-fathers-day:last-entry";

function readStoredEntry(): CampaignEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<CampaignEntry>;
    return parsed.id && parsed.studentDocument && parsed.raffleNumber
      ? (parsed as CampaignEntry)
      : null;
  } catch {
    return null;
  }
}

export function CampaignFlow({
  initialEntries,
  initialRaffleWinners,
}: {
  initialEntries: CampaignEntry[];
  initialRaffleWinners: CampaignEntry[];
}) {
  const [step, setStep] = useState<CampaignStep>("presentation");
  const [entries, setEntries] = useState(initialEntries);
  const [entry, setEntry] = useState<CampaignEntry | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = readStoredEntry();
      if (stored) setEntry(stored);
      if (new URLSearchParams(window.location.search).get("step") === "registration") {
        setStep("registration");
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const takenDocuments = useMemo(
    () => entries.map((item) => normalizeDocument(item.studentDocument)).filter(Boolean),
    [entries],
  );

  function showConfirmation(nextEntry: CampaignEntry) {
    setEntry(nextEntry);
    setEntries((current) =>
      current.some((item) => item.id === nextEntry.id) ? current : [...current, nextEntry],
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntry));
    } catch {}
    setStep("confirmation");
  }

  async function register(payload: RegistrationPayload) {
    const response = await fetch("/api/campaign/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => null)) as
      | { entry?: CampaignEntry; message?: string }
      | null;
    if (!response.ok || !data?.entry) {
      throw new Error(data?.message ?? "Não foi possível concluir sua inscrição.");
    }
    showConfirmation(data.entry);
  }

  async function lookup(document: string) {
    const response = await fetch("/api/campaign/entries/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document }),
    });
    const data = (await response.json().catch(() => null)) as
      | { entry?: CampaignEntry; message?: string }
      | null;
    if (!response.ok || !data?.entry) {
      throw new Error(data?.message ?? "Não foi possível encontrar sua inscrição.");
    }
    showConfirmation(data.entry);
  }

  return (
    <main className="campaign-bg relative min-h-screen overflow-hidden text-white">
      <div className="campaign-grid pointer-events-none fixed inset-0" />
      <StepIndicator currentStep={step} />
      <div key={step} className="animate-campaign-layer relative">
        {step === "presentation" ? (
          <PresentationLayer
            hasStoredRegistration={Boolean(entry)}
            onLookupRegistration={lookup}
            onResume={() => entry && showConfirmation(entry)}
            onStart={() => setStep("registration")}
          />
        ) : null}
        {step === "registration" ? (
          <RegistrationLayer
            onBack={() => setStep("presentation")}
            onRegister={register}
            takenDocuments={takenDocuments}
          />
        ) : null}
        {step === "confirmation" ? (
          <ConfirmationLayer
            latestEntry={entry}
            raffleWinners={initialRaffleWinners}
            onRestart={() => setStep("presentation")}
          />
        ) : null}
      </div>
    </main>
  );
}
