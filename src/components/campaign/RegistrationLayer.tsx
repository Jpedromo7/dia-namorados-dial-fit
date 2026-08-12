"use client";

import { ArrowLeft, Check, Loader2, ShieldCheck, UserRound } from "lucide-react";
import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { DIALFIT_LOGO, DRAW_DATE_LABEL } from "@/config/campaign";
import { normalizeDocument } from "@/lib/campaign";
import type { CampaignUnit, RegistrationPayload } from "@/types/campaign";
import { ReviewUnitsSection } from "./ReviewUnitsSection";
import { TermsCheckbox } from "./TermsCheckbox";

type FormState = {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentDocument: string;
};

const EMPTY_FORM: FormState = {
  studentName: "",
  studentEmail: "",
  studentPhone: "",
  studentDocument: "",
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  placeholder: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label} <span className="text-[#55e814]">*</span></span>
      <input type={type} inputMode={inputMode} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} className="campaign-field mt-2 h-12 w-full px-4 text-sm" />
      {error ? <span className="mt-2 block text-sm font-semibold text-[#ff7d7d]">{error}</span> : null}
    </label>
  );
}

export function RegistrationLayer({
  onBack,
  onRegister,
  takenDocuments,
}: {
  onBack: () => void;
  onRegister: (payload: RegistrationPayload) => Promise<void>;
  takenDocuments: string[];
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [reviewedUnit, setReviewedUnit] = useState<CampaignUnit | "">("");
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [fatherDeclared, setFatherDeclared] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.studentName.trim().split(/\s+/).length < 2) next.studentName = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.studentEmail.trim())) next.studentEmail = "Informe um e-mail válido.";
    const phoneDigits = form.studentPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 13) next.studentPhone = "Informe um telefone com DDD.";
    const document = normalizeDocument(form.studentDocument);
    if (document.length !== 11) next.studentDocument = "Informe um CPF com 11 dígitos.";
    else if (takenDocuments.includes(document)) next.studentDocument = "Este CPF já está cadastrado nesta campanha.";
    return next;
  }, [form, takenDocuments]);

  function setField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setAttempted(true);
    setSubmitError("");
    if (Object.keys(errors).length || !reviewedUnit || !reviewConfirmed || !fatherDeclared || !acceptedTerms) return;

    setSubmitting(true);
    try {
      await onRegister({
        studentName: form.studentName.trim(),
        studentEmail: form.studentEmail.trim(),
        studentPhone: form.studentPhone.trim(),
        studentDocument: form.studentDocument.trim(),
        unit: "Dial Fit",
        reviewUnit: reviewedUnit,
        completedReview: true,
        parenthoodDeclared: true,
        acceptedTerms: true,
        companionName: "",
        companionDocument: "",
        companionPhone: "",
        companionEmail: "",
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Não foi possível concluir sua inscrição.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-24 sm:px-7 lg:pt-28">
      <header className="flex items-center justify-between border-b border-white/10 pb-5">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-[#a8b2aa] transition hover:text-white"><ArrowLeft size={18} /> Voltar</button>
        <Image src={DIALFIT_LOGO} alt="Dial Fit" width={2048} height={696} style={{ height: "auto" }} className="dialfit-logo-clean w-[128px]" />
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={submit} noValidate className="campaign-frame p-5 sm:p-8">
          <div className="flex items-start gap-4 border-b border-white/10 pb-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#55e814] text-[#071006]"><UserRound size={24} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#55e814]">Inscrição individual</p>
              <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Dados do pai/aluno</h1>
              <p className="mt-2 text-sm leading-6 text-[#a8b2aa]">Somente o pai que é aluno da Dial Fit precisa se cadastrar.</p>
            </div>
          </div>

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label="Nome completo" value={form.studentName} onChange={(value) => setField("studentName", value)} placeholder="Seu nome completo" error={attempted ? errors.studentName : undefined} /></div>
            <Field label="CPF" value={form.studentDocument} onChange={(value) => setField("studentDocument", value)} inputMode="numeric" placeholder="000.000.000-00" error={attempted ? errors.studentDocument : undefined} />
            <Field label="WhatsApp" value={form.studentPhone} onChange={(value) => setField("studentPhone", value)} inputMode="tel" placeholder="(00) 00000-0000" error={attempted ? errors.studentPhone : undefined} />
            <div className="sm:col-span-2"><Field label="E-mail" value={form.studentEmail} onChange={(value) => setField("studentEmail", value)} type="email" inputMode="email" placeholder="voce@email.com" error={attempted ? errors.studentEmail : undefined} /></div>
          </div>

          <label className={`mt-6 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${fatherDeclared ? "border-[#55e814]/55 bg-[#55e814]/7" : attempted ? "border-[#ff7d7d] bg-[#ff7d7d]/5" : "border-[#344137] bg-[#0d130f]"}`}>
            <input type="checkbox" checked={fatherDeclared} onChange={(event) => setFatherDeclared(event.target.checked)} className="mt-1 h-5 w-5 accent-[#55e814]" />
            <span className="text-sm leading-6 text-[#dce2dd]"><strong className="text-white">Declaro que sou pai e aluno ativo da Dial Fit.</strong> Estou ciente de que a equipe poderá conferir meu vínculo antes do sorteio.</span>
          </label>

          <div className="mt-6"><ReviewUnitsSection reviewedUnit={reviewedUnit} reviewConfirmed={reviewConfirmed} showError={attempted && (!reviewedUnit || !reviewConfirmed)} onReviewOpened={setReviewedUnit} onReviewConfirmedChange={setReviewConfirmed} /></div>
          <div className="mt-6"><TermsCheckbox checked={acceptedTerms} onCheckedChange={setAcceptedTerms} showError={attempted && !acceptedTerms} /></div>

          {submitError ? <p className="mt-5 rounded-lg border border-[#ff7d7d]/40 bg-[#ff7d7d]/8 p-4 text-sm font-semibold text-[#ff9c9c]">{submitError}</p> : null}
          <button type="submit" disabled={submitting} className="campaign-button mt-7 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-[#55e814] px-7 text-sm font-extrabold uppercase tracking-[0.08em] text-[#071006] disabled:cursor-wait disabled:opacity-60">
            {submitting ? <Loader2 className="animate-spin" size={19} /> : <Check size={19} />} {submitting ? "Enviando inscrição" : "Confirmar participação"}
          </button>
        </form>

        <aside className="grid content-start gap-4">
          <div className="campaign-frame-soft p-5">
            <ShieldCheck size={25} className="text-[#55e814]" />
            <h2 className="mt-4 text-xl font-extrabold text-white">Antes de enviar</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#a8b2aa]">
              <li>• Você deve ser pai.</li><li>• Seu plano Dial Fit deve estar ativo.</li><li>• É permitida uma inscrição por CPF.</li><li>• A avaliação e o regulamento precisam ser confirmados.</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-[#55e814] p-5 text-[#071006]">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em]">Sorteio</p>
            <p className="mt-2 text-2xl font-black leading-tight">{DRAW_DATE_LABEL}</p>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#163311]">Somente inscrições validadas entram na apuração.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
