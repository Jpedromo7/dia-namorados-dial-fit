"use client";

import { useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { normalizeDocument } from "@/lib/campaign";
import type { CampaignEntry, RegistrationPayload } from "@/types/campaign";
import { ConfirmationLayer } from "./ConfirmationLayer";
import { CTAHeartsEffect } from "./CTAHeartsEffect";
import { PresentationLayer } from "./PresentationLayer";
import { RegistrationLayer } from "./RegistrationLayer";
import { type CampaignStep, StepIndicator } from "./StepIndicator";

const LAST_ENTRY_STORAGE_KEY = "dialfit-campaign:last-entry";

function isStoredCampaignEntry(value: unknown): value is CampaignEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<CampaignEntry>;

  return (
    typeof entry.id === "string" &&
    typeof entry.studentName === "string" &&
    typeof entry.studentDocument === "string" &&
    typeof entry.companionName === "string" &&
    typeof entry.companionDocument === "string" &&
    typeof entry.raffleNumber === "string"
  );
}

function readStoredEntry() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedEntry = window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY);

    if (!storedEntry) {
      return null;
    }

    const parsedEntry: unknown = JSON.parse(storedEntry);

    return isStoredCampaignEntry(parsedEntry) ? parsedEntry : null;
  } catch {
    return null;
  }
}

function storeEntry(entry: CampaignEntry) {
  try {
    window.localStorage.setItem(LAST_ENTRY_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // If storage is unavailable, the registration still succeeds normally.
  }
}

function subscribeToStoredEntry(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredEntrySnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY) ?? "";
}

function getServerStoredEntrySnapshot() {
  return "";
}

function entryHasDocument(entry: CampaignEntry, document: string) {
  const normalizedDocument = normalizeDocument(document);

  if (!normalizedDocument) {
    return false;
  }

  return [
    normalizeDocument(entry.studentDocument),
    normalizeDocument(entry.companionDocument),
  ].includes(normalizedDocument);
}

function findStoredEntryInList(
  storedEntry: CampaignEntry,
  entries: CampaignEntry[],
) {
  return (
    entries.find((entry) => entry.id === storedEntry.id) ??
    entries.find(
      (entry) =>
        entryHasDocument(entry, storedEntry.studentDocument) ||
        entryHasDocument(entry, storedEntry.companionDocument),
    ) ??
    storedEntry
  );
}

function useStoredEntry(initialEntries: CampaignEntry[]) {
  const storedEntrySnapshot = useSyncExternalStore(
    subscribeToStoredEntry,
    getStoredEntrySnapshot,
    getServerStoredEntrySnapshot,
  );

  return useMemo(() => {
    if (!storedEntrySnapshot) {
      return null;
    }

    try {
      const parsedEntry: unknown = JSON.parse(storedEntrySnapshot);

      return isStoredCampaignEntry(parsedEntry)
        ? findStoredEntryInList(parsedEntry, initialEntries)
        : null;
    } catch {
      return null;
    }
  }, [initialEntries, storedEntrySnapshot]);
}

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
  const storedEntry = useStoredEntry(initialEntries);
  const resumableEntry = latestEntry ?? storedEntry;

  const entriesWithResumableEntry = useMemo(() => {
    if (!resumableEntry) {
      return entries;
    }

    return entries.some((entry) => entry.id === resumableEntry.id)
      ? entries
      : [...entries, resumableEntry];
  }, [entries, resumableEntry]);

  const publicEntries = useMemo(
    () =>
      [...entriesWithResumableEntry].sort(
        (first, second) =>
          Number(first.raffleNumber) - Number(second.raffleNumber),
      ),
    [entriesWithResumableEntry],
  );

  const takenDocuments = useMemo(
    () =>
      entriesWithResumableEntry
        .flatMap((entry) => [
          normalizeDocument(entry.studentDocument),
          normalizeDocument(entry.companionDocument),
        ])
        .filter(Boolean),
    [entriesWithResumableEntry],
  );

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  function resetViewport() {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  function showEntryConfirmation(entry: CampaignEntry) {
    storeEntry(entry);
    setEntries((currentEntries) =>
      currentEntries.some((currentEntry) => currentEntry.id === entry.id)
        ? currentEntries
        : [...currentEntries, entry],
    );
    setLatestEntry(entry);
    setCurrentStep("confirmation");
    setCelebrationKey((current) => current + 1);
    resetViewport();
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

    showEntryConfirmation(entry);
  }

  async function handleLookupRegistration(document: string) {
    const response = await fetch("/api/campaign/entries/lookup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ document }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      throw new Error(
        data?.message ?? "Não foi possível encontrar sua inscrição.",
      );
    }

    const { entry } = (await response.json()) as { entry: CampaignEntry };

    showEntryConfirmation(entry);
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

  function resumeStoredRegistration() {
    const entry = resumableEntry ?? readStoredEntry();

    if (!entry) {
      return;
    }

    showEntryConfirmation(entry);
  }

  function canShowStoredRegistration(document: string) {
    return resumableEntry ? entryHasDocument(resumableEntry, document) : false;
  }

  function showStoredRegistrationFromDocument(document: string) {
    if (!resumableEntry || !entryHasDocument(resumableEntry, document)) {
      return;
    }

    showEntryConfirmation(resumableEntry);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff6f1] text-[#1f1719]">
      <StepIndicator currentStep={currentStep} />
      <CTAHeartsEffect burstKey={celebrationKey} />

      <div key={currentStep} className="animate-campaign-layer">
        {currentStep === "presentation" ? (
          <PresentationLayer
            hasStoredRegistration={Boolean(resumableEntry)}
            onLookupRegistration={handleLookupRegistration}
            onResume={resumeStoredRegistration}
            onStart={startRegistration}
          />
        ) : null}

        {currentStep === "registration" ? (
          <RegistrationLayer
            canShowStoredRegistration={canShowStoredRegistration}
            onBack={() => setCurrentStep("presentation")}
            onRegister={handleRegister}
            onShowStoredRegistration={showStoredRegistrationFromDocument}
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
