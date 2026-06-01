"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { normalizeDocument } from "@/lib/campaign";
import type {
  CampaignEntry,
  RegistrationExtras,
  RegistrationPayload,
} from "@/types/campaign";
import { ConfirmationLayer } from "./ConfirmationLayer";
import { CTAHeartsEffect } from "./CTAHeartsEffect";
import { PresentationLayer } from "./PresentationLayer";
import { RegistrationLayer } from "./RegistrationLayer";
import { type CampaignStep, StepIndicator } from "./StepIndicator";

const LAST_ENTRY_STORAGE_KEY = "dialfit-campaign:last-entry";
const LAST_PHOTO_STORAGE_KEY = "dialfit-campaign:last-couple-photo";
const CAMPAIGN_STORAGE_EVENT = "dialfit-campaign:storage-change";

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

function notifyCampaignStorageChange() {
  window.dispatchEvent(new Event(CAMPAIGN_STORAGE_EVENT));
}

function storeEntry(entry: CampaignEntry) {
  try {
    window.localStorage.setItem(LAST_ENTRY_STORAGE_KEY, JSON.stringify(entry));
    notifyCampaignStorageChange();
  } catch {
    // If storage is unavailable, the registration still succeeds normally.
  }
}

function storeCouplePhoto(photoDataUrl: string | null) {
  try {
    if (photoDataUrl) {
      window.localStorage.setItem(LAST_PHOTO_STORAGE_KEY, photoDataUrl);
    } else {
      window.localStorage.removeItem(LAST_PHOTO_STORAGE_KEY);
    }

    notifyCampaignStorageChange();
  } catch {
    // The photo is optional; storage limits should not block the campaign flow.
  }
}

function clearStoredRegistration() {
  try {
    window.localStorage.removeItem(LAST_ENTRY_STORAGE_KEY);
    window.localStorage.removeItem(LAST_PHOTO_STORAGE_KEY);
    notifyCampaignStorageChange();
  } catch {
    // Clearing local recovery data should not break the public page.
  }
}

function subscribeToLocalStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CAMPAIGN_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CAMPAIGN_STORAGE_EVENT, onStoreChange);
  };
}

function getStoredEntrySnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LAST_ENTRY_STORAGE_KEY) ?? "";
}

function getStoredPhotoSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(LAST_PHOTO_STORAGE_KEY) ?? "";
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

function getVerifiableDocument(entry: CampaignEntry) {
  return (
    normalizeDocument(entry.studentDocument) ||
    normalizeDocument(entry.companionDocument)
  );
}

function useStoredEntry(initialEntries: CampaignEntry[]) {
  const storedEntrySnapshot = useSyncExternalStore(
    subscribeToLocalStorage,
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

function useStoredCouplePhoto() {
  const storedPhotoSnapshot = useSyncExternalStore(
    subscribeToLocalStorage,
    getStoredPhotoSnapshot,
    getServerStoredEntrySnapshot,
  );

  return storedPhotoSnapshot || null;
}

export function CampaignFlow({
  initialEntries = MOCK_CAMPAIGN_ENTRIES,
  initialRaffleWinners = [],
}: {
  initialEntries?: CampaignEntry[];
  initialRaffleWinners?: CampaignEntry[];
}) {
  const [currentStep, setCurrentStep] =
    useState<CampaignStep>("presentation");
  const [entries, setEntries] = useState<CampaignEntry[]>(initialEntries);
  const [latestEntry, setLatestEntry] = useState<CampaignEntry | null>(null);
  const [latestCouplePhotoDataUrl, setLatestCouplePhotoDataUrl] = useState<
    string | null
  >(null);
  const [celebrationKey, setCelebrationKey] = useState(0);
  const storedEntry = useStoredEntry(initialEntries);
  const storedCouplePhotoDataUrl = useStoredCouplePhoto();
  const resumableEntry = latestEntry ?? storedEntry;
  const resumableCouplePhotoDataUrl =
    latestCouplePhotoDataUrl ??
    (storedEntry && resumableEntry?.id === storedEntry.id
      ? storedCouplePhotoDataUrl
      : null);

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

  useEffect(() => {
    const step = new URLSearchParams(window.location.search).get("step");

    if (step === "registration") {
      window.requestAnimationFrame(() => {
        setCurrentStep("registration");
      });
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  useEffect(() => {
    const resetDeletedStoredEntry = () => {
      if (readStoredEntry()) {
        return;
      }

      setLatestEntry(null);
      setLatestCouplePhotoDataUrl(null);
      setEntries(initialEntries);

      if (currentStep === "confirmation") {
        setCurrentStep("presentation");
      }
    };

    window.addEventListener("storage", resetDeletedStoredEntry);
    window.addEventListener(CAMPAIGN_STORAGE_EVENT, resetDeletedStoredEntry);

    return () => {
      window.removeEventListener("storage", resetDeletedStoredEntry);
      window.removeEventListener(
        CAMPAIGN_STORAGE_EVENT,
        resetDeletedStoredEntry,
      );
    };
  }, [currentStep, initialEntries]);

  useEffect(() => {
    if (!storedEntry) {
      return;
    }

    const isStillListed = initialEntries.some(
      (entry) => entry.id === storedEntry.id,
    );

    if (isStillListed) {
      return;
    }

    const document = getVerifiableDocument(storedEntry);

    if (!document) {
      clearStoredRegistration();
      return;
    }

    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch("/api/campaign/entries/lookup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ document }),
          signal: controller.signal,
        });

        if (response.status === 404 || response.status === 400) {
          clearStoredRegistration();
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { entry?: CampaignEntry };

        if (data.entry?.id && data.entry.id !== storedEntry.id) {
          clearStoredRegistration();
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    })();

    return () => controller.abort();
  }, [initialEntries, storedEntry]);

  function resetViewport() {
    window.scrollTo(0, 0);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  }

  function showEntryConfirmation(
    entry: CampaignEntry,
    options: RegistrationExtras = {},
  ) {
    const couplePhotoDataUrl =
      options.couplePhotoDataUrl ??
      (storedEntry?.id === entry.id ? storedCouplePhotoDataUrl : null);

    storeEntry(entry);
    storeCouplePhoto(couplePhotoDataUrl ?? null);
    setEntries((currentEntries) =>
      currentEntries.some((currentEntry) => currentEntry.id === entry.id)
        ? currentEntries
        : [...currentEntries, entry],
    );
    setLatestEntry(entry);
    setLatestCouplePhotoDataUrl(couplePhotoDataUrl ?? null);
    setCurrentStep("confirmation");
    setCelebrationKey((current) => current + 1);
    resetViewport();
  }

  async function handleRegister(
    payload: RegistrationPayload,
    options: RegistrationExtras = {},
  ) {
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

    showEntryConfirmation(entry, options);
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
            couplePhotoDataUrl={resumableCouplePhotoDataUrl}
            entries={publicEntries}
            raffleWinners={initialRaffleWinners}
            latestEntry={latestEntry}
            onRestart={restartFlow}
          />
        ) : null}
      </div>
    </main>
  );
}
