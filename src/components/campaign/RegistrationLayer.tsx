"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  Heart,
  HeartHandshake,
  ImagePlus,
  LogIn,
  Send,
  X,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  DIALFIT_LOGO,
  DRAW_DATE_LABEL,
  LOMBARDIA_FACADE_IMAGE,
  LOMBARDIA_LOGO,
  LOMBARDIA_SALAO_IMAGE,
  LOMBARDIA_WINE_IMAGE,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import { normalizeDocument } from "@/lib/campaign";
import type {
  CampaignUnit,
  RegistrationExtras,
  RegistrationPayload,
} from "@/types/campaign";
import { FloatingHeartsEffect } from "./FloatingHeartsEffect";
import { ReviewUnitsSection } from "./ReviewUnitsSection";
import { TermsCheckbox } from "./TermsCheckbox";

type FormState = {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentDocument: string;
  unit: CampaignUnit | "";
  companionName: string;
  companionDocument: string;
  companionPhone: string;
  companionEmail: string;
};

type FormField = keyof FormState;

const EMPTY_FORM: FormState = {
  studentName: "",
  studentEmail: "",
  studentPhone: "",
  studentDocument: "",
  unit: "Dial Fit",
  companionName: "",
  companionDocument: "",
  companionPhone: "",
  companionEmail: "",
};

const REQUIRED_FIELDS: FormField[] = [
  "studentName",
  "studentEmail",
  "studentPhone",
  "studentDocument",
  "companionName",
  "companionDocument",
  "companionPhone",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOCUMENT_TAKEN_MESSAGE = "Este CPF já está cadastrado na campanha.";
const MAX_COUPLE_PHOTO_BYTES = 8 * 1024 * 1024;
const MAX_COUPLE_PHOTO_DIMENSION = 1200;

const buttonHearts = [
  { left: "18%", delay: "0ms", x: "-12px" },
  { left: "46%", delay: "70ms", x: "0px" },
  { left: "74%", delay: "120ms", x: "14px" },
] as const;

function isFieldEmpty(value: string) {
  return value.trim().length === 0;
}

function loadImageFromObjectUrl(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Imagem inválida."));
    image.src = src;
  });
}

async function prepareCouplePhoto(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha uma imagem válida.");
  }

  if (file.size > MAX_COUPLE_PHOTO_BYTES) {
    throw new Error("Escolha uma foto de até 8 MB.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const largestSide = Math.max(sourceWidth, sourceHeight);
    const scale = Math.min(1, MAX_COUPLE_PHOTO_DIMENSION / largestSide);
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Não foi possível preparar a foto.");
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.84);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function trimForm(
  form: FormState,
  reviewedUnit: CampaignUnit | "",
): RegistrationPayload | null {
  if (!form.unit || !reviewedUnit) {
    return null;
  }

  return {
    studentName: form.studentName.trim(),
    studentEmail: form.studentEmail.trim(),
    studentPhone: form.studentPhone.trim(),
    studentDocument: form.studentDocument.trim(),
    unit: form.unit,
    companionName: form.companionName.trim(),
    companionDocument: form.companionDocument.trim(),
    companionPhone: form.companionPhone.trim(),
    companionEmail: form.companionEmail.trim(),
    reviewUnit: reviewedUnit,
    completedReview: true,
    acceptedTerms: true,
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm font-medium text-[#a4213d]">{message}</p>;
}

function TextField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  required = false,
  error,
  onChange,
}: {
  label: string;
  name: Exclude<FormField, "unit">;
  type?: string;
  placeholder?: string;
  value: string;
  required?: boolean;
  error?: string;
  onChange: (name: Exclude<FormField, "unit">, value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#4e3039]">
        {label}
        {required ? <span className="text-[#a4213d]"> *</span> : null}
      </span>
      <input
        name={name}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(name, event.target.value)}
        className="mt-2 h-12 w-full rounded-[1rem] border border-[#ead0d6] bg-white/86 px-4 text-sm text-[#24191c] outline-none transition duration-300 placeholder:text-[#a98d95] hover:border-[#d8aeb8] focus:border-[#0e8b4a] focus:ring-2 focus:ring-[#0e8b4a]/16"
      />
      <FieldError message={error} />
    </label>
  );
}

function StoredRegistrationHint({
  document,
  onShowStoredRegistration,
}: {
  document: string;
  onShowStoredRegistration: (document: string) => void;
}) {
  return (
    <div className="mt-3 rounded-[1rem] border border-[#0e8b4a]/18 bg-[#f4fbf6] p-3 text-sm text-[#315143]">
      <p className="font-medium">
        Encontramos uma inscrição salva neste aparelho.
      </p>
      <button
        type="button"
        onClick={() => onShowStoredRegistration(document)}
        className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#0e8b4a] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#0e8b4a]/14 transition duration-300 hover:-translate-y-0.5 hover:bg-[#0b723e]"
      >
        <Check size={14} aria-hidden="true" />
        Ver minha inscrição
      </button>
    </div>
  );
}

export function RegistrationLayer({
  canShowStoredRegistration,
  onBack,
  onRegister,
  onShowStoredRegistration,
  takenDocuments,
}: {
  canShowStoredRegistration: (document: string) => boolean;
  onBack: () => void;
  onRegister: (
    payload: RegistrationPayload,
    extras?: RegistrationExtras,
  ) => Promise<void> | void;
  onShowStoredRegistration: (document: string) => void;
  takenDocuments: string[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [reviewedUnit, setReviewedUnit] = useState<CampaignUnit | "">("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [buttonBurst, setButtonBurst] = useState(0);
  const [couplePhotoDataUrl, setCouplePhotoDataUrl] = useState<string | null>(
    null,
  );
  const [photoError, setPhotoError] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const submitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        window.clearTimeout(submitTimerRef.current);
      }
    };
  }, []);

  const fieldErrors = useMemo(() => {
    const errors: Partial<Record<FormField, string>> = {};
    const takenDocumentSet = new Set(takenDocuments);

    for (const field of REQUIRED_FIELDS) {
      if (isFieldEmpty(form[field])) {
        errors[field] = "Campo obrigatório.";
      }
    }

    if (form.studentEmail && !emailPattern.test(form.studentEmail.trim())) {
      errors.studentEmail = "Informe um e-mail válido.";
    }

    if (
      form.companionEmail &&
      !emailPattern.test(form.companionEmail.trim())
    ) {
      errors.companionEmail = "Informe um e-mail válido.";
    }

    const studentDocument = normalizeDocument(form.studentDocument);
    const companionDocument = normalizeDocument(form.companionDocument);

    if (studentDocument && takenDocumentSet.has(studentDocument)) {
      errors.studentDocument = DOCUMENT_TAKEN_MESSAGE;
    }

    if (companionDocument && takenDocumentSet.has(companionDocument)) {
      errors.companionDocument = DOCUMENT_TAKEN_MESSAGE;
    }

    if (
      studentDocument &&
      companionDocument &&
      studentDocument === companionDocument
    ) {
      errors.studentDocument = "Aluno e acompanhante precisam ter CPFs diferentes.";
      errors.companionDocument =
        "Aluno e acompanhante precisam ter CPFs diferentes.";
    }

    return errors;
  }, [form, takenDocuments]);

  const requiredFieldsComplete = REQUIRED_FIELDS.every((field) => {
    return !isFieldEmpty(form[field]);
  });

  const hasEmailErrors =
    Boolean(fieldErrors.studentEmail) || Boolean(fieldErrors.companionEmail);
  const hasDocumentErrors =
    Boolean(fieldErrors.studentDocument) ||
    Boolean(fieldErrors.companionDocument);
  const canResumeStudentRegistration =
    fieldErrors.studentDocument === DOCUMENT_TAKEN_MESSAGE &&
    canShowStoredRegistration(form.studentDocument);
  const canResumeCompanionRegistration =
    fieldErrors.companionDocument === DOCUMENT_TAKEN_MESSAGE &&
    canShowStoredRegistration(form.companionDocument);
  const reviewIsComplete = Boolean(reviewedUnit) && reviewConfirmed;
  const formIsReady =
    requiredFieldsComplete &&
    !hasEmailErrors &&
    !hasDocumentErrors &&
    reviewIsComplete &&
    acceptedTerms &&
    !isPreparingPhoto &&
    !isSubmitting;

  function updateField(name: Exclude<FormField, "unit">, value: string) {
    setSubmitError("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleGoogleSignIn() {
    setSubmitError(
      "O login com Google dos alunos ficará disponível quando o OAuth for ativado no Supabase.",
    );
  }

  async function handleCouplePhotoChange(file: File | undefined) {
    if (!file) {
      return;
    }

    setPhotoError("");
    setSubmitError("");
    setIsPreparingPhoto(true);

    try {
      const preparedPhoto = await prepareCouplePhoto(file);
      setCouplePhotoDataUrl(preparedPhoto);
    } catch (error) {
      setCouplePhotoDataUrl(null);
      setPhotoError(
        error instanceof Error
          ? error.message
          : "Não foi possível preparar a foto.",
      );
    } finally {
      setIsPreparingPhoto(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    }
  }

  function removeCouplePhoto() {
    setCouplePhotoDataUrl(null);
    setPhotoError("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttemptedSubmit(true);

    if (!formIsReady) {
      return;
    }

    const payload = trimForm(form, reviewedUnit);

    if (!payload) {
      return;
    }

    setButtonBurst((current) => current + 1);
    setIsSubmitting(true);
    setSubmitError("");

    submitTimerRef.current = window.setTimeout(async () => {
      try {
        await onRegister(payload, { couplePhotoDataUrl });
        setAcceptedTerms(false);
        setCouplePhotoDataUrl(null);
        setPhotoError("");
        setReviewedUnit("");
        setReviewConfirmed(false);
        setAttemptedSubmit(false);
        setForm(EMPTY_FORM);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir sua inscrição.",
        );
      } finally {
        setIsSubmitting(false);
      }
    }, 520);
  }

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-[#fff6f1] px-5 pb-10 pt-24 sm:px-6 lg:pt-[6.5rem]">
      <div className="absolute inset-0 bg-[linear-gradient(145deg,#fff7f1_0%,#fbe6e8_45%,#f5cdd5_100%)]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),transparent)]" />
      <div className="absolute -left-[12%] bottom-[6%] h-[44%] w-[36%] rounded-[42%] border border-white/44 bg-white/14 backdrop-blur-sm" />
      <div className="absolute -right-[14%] top-[14%] h-[48%] w-[38%] rounded-[45%] border border-[#f6d28e]/28 bg-[#5b1224]/10 backdrop-blur-sm" />
      <FloatingHeartsEffect />

      <div className="relative mx-auto grid w-full max-w-7xl gap-6">
        <header className="flex items-center justify-between gap-4">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={170}
            height={70}
            className="dialfit-logo-clean h-auto w-[142px] sm:w-[166px]"
          />
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#7d2237]/18 bg-white/62 px-5 text-sm font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/8 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Voltar
          </button>
        </header>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-stretch">
          <div className="rounded-[2rem] border border-white/66 bg-white/72 p-4 shadow-2xl shadow-[#5b1224]/12 backdrop-blur-xl sm:p-6 lg:p-8">
            <div className="max-w-2xl">
              <h1 className="font-display text-4xl font-semibold leading-tight text-[#3b111c] sm:text-5xl">
                Faça sua inscrição
              </h1>
              <p className="mt-3 text-base leading-7 text-[#6f555d]">
                Preencha seus dados e indique seu acompanhante para participar
                da campanha.
              </p>
            </div>

            <form noValidate onSubmit={handleSubmit} className="mt-8 grid gap-7">
              <fieldset className="grid gap-5 rounded-[1.5rem] border border-[#f0d1d8] bg-[#fffaf8]/66 p-5">
                <legend className="ml-2 px-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-lg font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/6">
                    <UserRound size={19} aria-hidden="true" />
                    Dados do aluno ativo
                  </span>
                </legend>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#ead0d6] bg-white px-4 text-sm font-semibold text-[#4e3039] shadow-sm shadow-[#5b1224]/4 transition duration-300 hover:-translate-y-0.5 hover:border-[#0e8b4a]/42 hover:bg-[#f7fbf6] sm:w-fit"
                >
                  <LogIn size={18} aria-hidden="true" />
                  Entrar com Google
                </button>

                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Nome completo do aluno"
                    name="studentName"
                    value={form.studentName}
                    required
                    placeholder="Ex.: Ana Carolina Martins"
                    error={
                      attemptedSubmit ? fieldErrors.studentName : undefined
                    }
                    onChange={updateField}
                  />
                  <TextField
                    label="E-mail"
                    name="studentEmail"
                    type="email"
                    value={form.studentEmail}
                    required
                    placeholder="voce@email.com"
                    error={
                      attemptedSubmit ? fieldErrors.studentEmail : undefined
                    }
                    onChange={updateField}
                  />
                  <TextField
                    label="WhatsApp"
                    name="studentPhone"
                    value={form.studentPhone}
                    required
                    placeholder="(00) 00000-0000"
                    error={
                      attemptedSubmit ? fieldErrors.studentPhone : undefined
                    }
                    onChange={updateField}
                  />
                  <div>
                    <TextField
                      label="CPF do aluno"
                      name="studentDocument"
                      value={form.studentDocument}
                      required
                      placeholder="CPF do aluno"
                      error={
                        attemptedSubmit || form.studentDocument
                          ? fieldErrors.studentDocument
                          : undefined
                      }
                      onChange={updateField}
                    />
                    {canResumeStudentRegistration ? (
                      <StoredRegistrationHint
                        document={form.studentDocument}
                        onShowStoredRegistration={onShowStoredRegistration}
                      />
                    ) : null}
                  </div>
                </div>
                <p className="text-xs font-medium leading-5 text-[#7a5f67]">
                  Cada CPF pode aparecer em apenas uma inscrição da campanha.
                </p>
              </fieldset>

              <fieldset className="grid gap-5 rounded-[1.5rem] border border-[#f0d1d8] bg-[#fffaf8]/66 p-5">
                <legend className="ml-2 px-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-lg font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/6">
                    <HeartHandshake size={19} aria-hidden="true" />
                    Dados do acompanhante
                  </span>
                </legend>

                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    label="Nome do acompanhante"
                    name="companionName"
                    value={form.companionName}
                    required
                    placeholder="Nome completo do acompanhante"
                    error={
                      attemptedSubmit ? fieldErrors.companionName : undefined
                    }
                    onChange={updateField}
                  />
                  <div>
                    <TextField
                      label="CPF do acompanhante"
                      name="companionDocument"
                      value={form.companionDocument}
                      required
                      placeholder="CPF do acompanhante"
                      error={
                        attemptedSubmit || form.companionDocument
                          ? fieldErrors.companionDocument
                          : undefined
                      }
                      onChange={updateField}
                    />
                    {canResumeCompanionRegistration ? (
                      <StoredRegistrationHint
                        document={form.companionDocument}
                        onShowStoredRegistration={onShowStoredRegistration}
                      />
                    ) : null}
                  </div>
                  <TextField
                    label="WhatsApp do acompanhante"
                    name="companionPhone"
                    value={form.companionPhone}
                    required
                    placeholder="(00) 00000-0000"
                    error={
                      attemptedSubmit ? fieldErrors.companionPhone : undefined
                    }
                    onChange={updateField}
                  />
                  <TextField
                    label="E-mail do acompanhante, opcional"
                    name="companionEmail"
                    type="email"
                    value={form.companionEmail}
                    placeholder="acompanhante@email.com"
                    error={
                      attemptedSubmit ? fieldErrors.companionEmail : undefined
                    }
                    onChange={updateField}
                  />
                </div>
              </fieldset>

              <fieldset className="grid gap-4 rounded-[1.5rem] border border-[#f0d1d8] bg-[#fffaf8]/66 p-5">
                <legend className="ml-2 px-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-lg font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/6">
                    <Camera size={19} aria-hidden="true" />
                    Foto para o story
                  </span>
                </legend>

                <div className="grid gap-4 md:grid-cols-[190px_1fr] md:items-center">
                  <div
                    className="relative min-h-[190px] overflow-hidden rounded-[1.45rem] border border-[#ead0d6] bg-[#fff2f4] shadow-sm shadow-[#5b1224]/6"
                    style={
                      couplePhotoDataUrl
                        ? {
                            backgroundImage: `linear-gradient(180deg,rgba(43,10,20,0.02),rgba(43,10,20,0.18)),url(${couplePhotoDataUrl})`,
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                          }
                        : undefined
                    }
                  >
                    {!couplePhotoDataUrl ? (
                      <div className="flex h-full min-h-[190px] flex-col items-center justify-center gap-3 px-5 text-center text-[#8b6270]">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#a4213d] shadow-sm shadow-[#5b1224]/8">
                          <ImagePlus size={24} aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold">
                          Foto opcional do casal
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#4e3039]">
                      Deixe o story mais pessoal
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-[#7a5f67]">
                      A foto é opcional e será usada apenas para montar a arte
                      de participação no próprio navegador.
                    </p>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <label
                        htmlFor="couplePhoto"
                        className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0e8b4a] px-5 text-sm font-semibold text-white shadow-lg shadow-[#0e8b4a]/16 transition duration-300 hover:-translate-y-0.5 hover:bg-[#0b723e]"
                      >
                        <ImagePlus size={18} aria-hidden="true" />
                        {couplePhotoDataUrl ? "Trocar foto" : "Escolher foto"}
                      </label>
                      <input
                        ref={photoInputRef}
                        id="couplePhoto"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) =>
                          void handleCouplePhotoChange(
                            event.target.files?.[0],
                          )
                        }
                      />
                      {couplePhotoDataUrl ? (
                        <button
                          type="button"
                          onClick={removeCouplePhoto}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#7d2237]/18 bg-white px-5 text-sm font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/5 transition duration-300 hover:-translate-y-0.5 hover:bg-[#fff7f1]"
                        >
                          <X size={18} aria-hidden="true" />
                          Remover
                        </button>
                      ) : null}
                    </div>

                    {isPreparingPhoto ? (
                      <p className="mt-3 text-sm font-semibold text-[#0e8b4a]">
                        Preparando foto...
                      </p>
                    ) : null}
                    {photoError ? (
                      <p className="mt-3 text-sm font-semibold text-[#a4213d]">
                        {photoError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </fieldset>

              <ReviewUnitsSection
                reviewedUnit={reviewedUnit}
                reviewConfirmed={reviewConfirmed}
                showError={attemptedSubmit && !reviewIsComplete}
                onReviewOpened={setReviewedUnit}
                onReviewConfirmedChange={setReviewConfirmed}
              />

              <TermsCheckbox
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                showError={attemptedSubmit && !acceptedTerms}
              />

              <div className="flex flex-col gap-4 border-t border-[#ead0d6] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={!formIsReady}
                  className="group relative inline-flex h-[3.25rem] items-center justify-center gap-2 overflow-hidden rounded-full bg-[#0e8b4a] px-7 text-sm font-semibold text-white shadow-xl shadow-[#0e8b4a]/20 transition duration-300 hover:-translate-y-0.5 hover:bg-[#0b723e] focus:outline-none focus:ring-2 focus:ring-[#0e8b4a] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#9db9a9] disabled:shadow-none disabled:hover:translate-y-0"
                >
                  {buttonBurst > 0
                    ? buttonHearts.map((heart) => (
                        <Heart
                          key={`${buttonBurst}-${heart.left}`}
                          aria-hidden="true"
                          size={14}
                          className="terms-heart-rise absolute top-2 text-white/88"
                          style={
                            {
                              left: heart.left,
                              animationDelay: heart.delay,
                              "--x": heart.x,
                            } as CSSProperties
                          }
                        />
                      ))
                    : null}
                  <span className="absolute inset-0 translate-x-[-120%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.28),transparent)] transition duration-700 group-hover:translate-x-[120%]" />
                  <Send className="relative" size={18} aria-hidden="true" />
                  <span className="relative">
                    {isSubmitting
                      ? "Finalizando..."
                      : "Finalizar minha inscrição"}
                  </span>
                </button>
                <p className="text-sm leading-6 text-[#7a5f67]">
                  A avaliação no Google Maps é obrigatória para concluir a
                  inscrição.
                </p>
              </div>
              {submitError ? (
                <div className="rounded-[1.2rem] border border-[#f1c0cc] bg-[#fff0f3] p-4 text-sm font-semibold text-[#a4213d]">
                  {submitError}
                </div>
              ) : null}
            </form>
          </div>

          <aside className="min-w-0 lg:h-full">
            <div className="relative flex h-full min-h-[760px] overflow-hidden rounded-[2rem] border border-white/48 bg-[#3b111c] shadow-2xl shadow-[#5b1224]/18">
              <Image
                src={LOMBARDIA_SALAO_IMAGE}
                alt="Salão interno amplo do Restaurante Lombardia"
                fill
                sizes="(min-width: 1024px) 430px, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(42,9,19,0.18),rgba(42,9,19,0.7)_48%,rgba(24,6,12,0.96))]" />
              <div className="absolute left-6 top-10 h-40 w-40 rounded-full bg-[#f4d190]/16 blur-2xl" />
              <div className="absolute bottom-28 right-2 h-52 w-52 rounded-full bg-[#e9a2ae]/14 blur-2xl" />

              <div className="relative z-10 flex w-full flex-col p-6 text-white sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <Image
                    src={DIALFIT_LOGO}
                    alt="Dial Fit Academia"
                    width={134}
                    height={56}
                    className="dialfit-logo-clean h-auto w-[112px]"
                  />
                  <span className="text-sm font-semibold text-[#ffe7ad]/82">
                    +
                  </span>
                  <Image
                    src={LOMBARDIA_LOGO}
                    alt="Lombardia Risotos e Massas"
                    width={142}
                    height={64}
                    className="lombardia-logo-clean h-auto w-[118px]"
                  />
                </div>

                <div className="mt-8">
                  <h2 className="font-display mt-5 text-4xl font-semibold leading-[1.02] sm:text-5xl lg:text-[3.25rem]">
                    Dois casais viverão uma noite especial
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-white/82">
                    Alunos ativos da Dial Fit podem se cadastrar com um
                    acompanhante. O sorteio acontece em {DRAW_DATE_LABEL}, e o
                    jantar dos vencedores será no dia{" "}
                    {PRIZE_DINNER_DATE_LABEL}.
                  </p>
                </div>

                <div className="mt-7 grid gap-3">
                  <div className="relative min-h-[250px] overflow-hidden rounded-[1.6rem] border border-white/16 bg-white/10 shadow-2xl shadow-black/18">
                    <Image
                      src={LOMBARDIA_WINE_IMAGE}
                      alt="Mesa posta com vinho e taças no Restaurante Lombardia"
                      fill
                      sizes="(min-width: 1024px) 390px, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(43,10,20,0.02),rgba(43,10,20,0.5))]" />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-[1.35rem] border border-white/14 bg-white/12 p-4 backdrop-blur">
                      <p className="text-sm font-semibold text-[#ffe7ad]">
                        {WINNING_COUPLES_COUNT} casais vencedores
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/76">
                        Cada casal sorteado ganha uma experiência especial no
                        Restaurante Lombardia.
                      </p>
                    </div>

                    <div className="relative min-h-[220px] overflow-hidden rounded-[1.5rem] border border-white/14 bg-white/12 sm:min-h-[260px] lg:min-h-[300px]">
                      <Image
                        src={LOMBARDIA_FACADE_IMAGE}
                        alt="Fachada do Restaurante Lombardia à noite"
                        fill
                        sizes="(min-width: 1024px) 390px, 100vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(35,8,17,0.72),rgba(35,8,17,0.2))]" />
                      <p className="absolute bottom-5 left-5 right-5 text-base font-semibold leading-6 text-white">
                        Prêmio real, elegante e preparado para uma noite de Dia
                        dos Namorados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-7">
                  <p className="text-sm font-semibold text-[#ffe7ad]">
                    O jantar de cada casal inclui:
                  </p>
                  <div className="mt-4 grid gap-2">
                    {["Entrada", "Prato principal", "Sobremesa"].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-full border border-white/14 bg-white/12 px-4 py-3 text-sm font-semibold backdrop-blur"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0e8b4a]">
                          <Check size={15} aria-hidden="true" />
                        </span>
                        {item}
                      </div>
                    ),
                    )}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-white/58">
                    Bebidas, taxa de serviço, deslocamento e itens adicionais
                    não estão inclusos, salvo autorização da organização.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
