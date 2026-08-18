"use client";

import {
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Gift,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Stethoscope,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  CAMPAIGN_COMPLEMENT,
  CAMPAIGN_KICKER,
  CAMPAIGN_NAME,
  CAMPAIGN_SUBTITLE,
  DIALFIT_LOGO,
  DRAW_DATE_LABEL,
  PRIZES,
} from "@/config/campaign";

const prizeIcons = [Dumbbell, Stethoscope, SprayCan];

const heroRainItems = [
  { kind: "dumbbell", left: "3%", delay: "-2s", duration: "11s", size: 30 },
  { kind: "biceps", left: "10%", delay: "-8s", duration: "15s", size: 30 },
  { kind: "heart", left: "17%", delay: "-5s", duration: "12s", size: 25 },
  { kind: "dumbbell", left: "24%", delay: "-11s", duration: "17s", size: 22 },
  { kind: "biceps", left: "31%", delay: "-1s", duration: "13s", size: 25 },
  { kind: "heart", left: "38%", delay: "-9s", duration: "14s", size: 22 },
  { kind: "dumbbell", left: "46%", delay: "-4s", duration: "12s", size: 28 },
  { kind: "biceps", left: "53%", delay: "-13s", duration: "18s", size: 28 },
  { kind: "heart", left: "60%", delay: "-7s", duration: "13s", size: 27 },
  { kind: "dumbbell", left: "67%", delay: "-3s", duration: "16s", size: 24 },
  { kind: "biceps", left: "74%", delay: "-10s", duration: "14s", size: 24 },
  { kind: "heart", left: "81%", delay: "-6s", duration: "16s", size: 23 },
  { kind: "dumbbell", left: "88%", delay: "-12s", duration: "15s", size: 32 },
  { kind: "biceps", left: "95%", delay: "-4s", duration: "17s", size: 27 },
] as const;

export function PresentationLayer({
  hasStoredRegistration,
  onLookupRegistration,
  onResume,
  onStart,
}: {
  hasStoredRegistration: boolean;
  onLookupRegistration: (document: string) => Promise<void>;
  onResume: () => void;
  onStart: () => void;
}) {
  const [showLookup, setShowLookup] = useState(false);
  const [document, setDocument] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLookup(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLookupRegistration(document);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "Não foi possível consultar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 pb-16 pt-24 sm:px-7 lg:pb-24 lg:pt-28">
      <header className="flex items-center justify-between border-b border-white/10 pb-5">
        <Image
          src={DIALFIT_LOGO}
          alt="Dial Fit Academia"
          width={2048}
          height={696}
          priority
          style={{ height: "auto" }}
          className="dialfit-logo-clean w-[142px] sm:w-[170px]"
        />
        <Link href="/regulamento" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a8b2aa] transition hover:text-[#55e814]">
          Regulamento
        </Link>
      </header>

      <section className="relative isolate grid gap-12 overflow-hidden py-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
        <div className="hero-symbol-rain pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          {heroRainItems.map((item, index) => (
            <span
              key={`${item.kind}-${item.left}`}
              className={`hero-rain-item hero-rain-item-${index % 3}`}
              style={{
                left: item.left,
                animationDelay: item.delay,
                animationDuration: item.duration,
                fontSize: item.size,
              }}
            >
              {item.kind === "dumbbell" ? (
                <Dumbbell size={item.size} strokeWidth={2.4} />
              ) : item.kind === "biceps" ? (
                "💪"
              ) : (
                "💚"
              )}
            </span>
          ))}
        </div>

        <div className="relative z-10 lg:pr-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#55e814]/35 bg-[#55e814]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#74f23d]">
            <Sparkles size={14} /> Campanha oficial Dial Fit
          </div>
          <p className="mt-7 text-sm font-bold uppercase tracking-[0.22em] text-white/58">{CAMPAIGN_KICKER}</p>
          <h1 className="display-condensed mt-4 max-w-3xl leading-[0.78] text-white">
            <span className="block text-[clamp(3.25rem,9.5vw,7.6rem)]">Agosto dos</span>
            <span className="mt-3 block text-[clamp(6.3rem,19vw,14.2rem)] text-[#55e814]">Pais</span>
          </h1>
          <p className="mt-8 max-w-xl text-xl font-semibold leading-8 text-white sm:text-2xl">{CAMPAIGN_SUBTITLE}</p>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#a8b2aa]">{CAMPAIGN_COMPLEMENT}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button onClick={onStart} className="campaign-button inline-flex min-h-14 items-center justify-center gap-3 bg-[#55e814] px-7 text-sm font-extrabold uppercase tracking-[0.09em] text-[#071006]">
              Quero participar <ChevronRight size={19} />
            </button>
            <button onClick={() => setShowLookup((value) => !value)} className="campaign-button inline-flex min-h-14 items-center justify-center gap-3 bg-[#111813] px-7 text-sm font-bold text-white">
              <Search size={18} /> Já me inscrevi
            </button>
          </div>
          {hasStoredRegistration ? (
            <button onClick={onResume} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#74f23d] hover:underline">
              <Check size={16} /> Abrir a inscrição salva neste aparelho
            </button>
          ) : null}

          {showLookup ? (
            <form onSubmit={submitLookup} className="campaign-frame-soft mt-6 max-w-xl p-4">
              <label className="text-sm font-semibold text-white">Consulte pelo CPF</label>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input value={document} onChange={(event) => setDocument(event.target.value)} inputMode="numeric" placeholder="000.000.000-00" className="campaign-field h-12 flex-1 px-4" />
                <button disabled={loading} className="campaign-button inline-flex h-12 items-center justify-center gap-2 bg-[#55e814] px-5 font-bold text-[#071006] disabled:opacity-60">
                  {loading ? <Loader2 className="animate-spin" size={17} /> : <Search size={17} />} Consultar
                </button>
              </div>
              {error ? <p className="mt-3 text-sm font-semibold text-[#ff7d7d]">{error}</p> : null}
            </form>
          ) : null}
        </div>

        <aside className="relative z-10 mt-12 lg:mt-0">
          <div className="hero-slash -left-24 top-12" />
          <div className="campaign-frame relative overflow-hidden p-5 sm:p-7">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#55e814]/16 blur-3xl" />
            <div className="relative flex items-center justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#55e814]">Sorteio especial</p>
                <p className="mt-2 text-lg font-bold text-white">Três prêmios. Três pais vencedores.</p>
              </div>
              <Gift size={34} className="text-[#55e814]" />
            </div>
            <div className="relative mt-5 grid gap-3">
              {PRIZES.map((prize, index) => {
                const Icon = prizeIcons[index];
                return (
                  <article key={prize.title} className="group flex items-center gap-4 rounded-xl border border-white/9 bg-white/[0.035] p-4 transition hover:border-[#55e814]/35 hover:bg-[#55e814]/[0.06]">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#55e814] text-[#071006]"><Icon size={23} /></span>
                    <div><p className="font-extrabold uppercase text-white">1 {prize.title}</p><p className="mt-1 text-sm text-[#a8b2aa]">{prize.partner}</p></div>
                  </article>
                );
              })}
            </div>
            <div className="relative mt-5 flex items-center gap-3 rounded-xl border border-[#55e814]/24 bg-[#55e814]/8 p-4">
              <CalendarDays className="text-[#55e814]" size={22} />
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#74f23d]">Data do sorteio</p><p className="mt-1 font-semibold text-white">{DRAW_DATE_LABEL}</p></div>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 border-t border-white/10 pt-8 md:grid-cols-3">
        {[
          [ShieldCheck, "Exclusivo para pais", "O participante precisa ser pai e aluno ativo da Dial Fit."],
          [Search, "Uma inscrição por CPF", "O cadastro é individual e será conferido pela equipe."],
          [Gift, "Três vencedores", "Cada pai sorteado recebe um dos três prêmios da campanha."],
        ].map(([Icon, title, copy]) => (
          <article key={String(title)} className="campaign-frame-soft p-5">
            <Icon size={22} className="text-[#55e814]" />
            <h2 className="mt-4 font-bold text-white">{String(title)}</h2>
            <p className="mt-2 text-sm leading-6 text-[#a8b2aa]">{String(copy)}</p>
          </article>
        ))}
      </section>
      <p className="sr-only">{CAMPAIGN_NAME}</p>
    </div>
  );
}
