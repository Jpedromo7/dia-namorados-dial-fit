"use client";

import { ArrowLeft, Check, Copy, Dumbbell, Gift, Share2, ShieldCheck, SprayCan, Stethoscope, Trophy } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CAMPAIGN_NAME, DIALFIT_LOGO, DRAW_DATE_LABEL, PRIZES } from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";

const prizeIcons = [Dumbbell, Stethoscope, SprayCan];

export function ConfirmationLayer({
  latestEntry,
  raffleWinners,
  onRestart,
}: {
  latestEntry: CampaignEntry | null;
  raffleWinners: CampaignEntry[];
  onRestart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const winner = raffleWinners[0];

  async function share() {
    const text = `Estou participando do sorteio de Dia dos Pais da Dial Fit. Meu número é ${latestEntry?.raffleNumber ?? "---"}.`;
    if (navigator.share) {
      await navigator.share({ title: CAMPAIGN_NAME, text, url: window.location.origin });
      return;
    }
    await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-16 pt-24 sm:px-7 lg:pt-28">
      <header className="flex items-center justify-between border-b border-white/10 pb-5">
        <button onClick={onRestart} className="inline-flex items-center gap-2 text-sm font-semibold text-[#a8b2aa] hover:text-white"><ArrowLeft size={18} /> Início</button>
        <Image src={DIALFIT_LOGO} alt="Dial Fit" width={2048} height={696} style={{ height: "auto" }} className="dialfit-logo-clean w-[128px]" />
      </header>

      <section className="mt-10 grid gap-7 lg:grid-cols-[1fr_0.78fr]">
        <div className="campaign-frame overflow-hidden">
          <div className="border-b border-white/10 bg-[#55e814] p-6 text-[#071006] sm:p-8">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071006] text-[#55e814]"><Check size={24} /></span><div><p className="text-xs font-black uppercase tracking-[0.16em]">Cadastro recebido</p><h1 className="mt-1 text-3xl font-black sm:text-4xl">Você está participando!</h1></div></div>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#a8b2aa]">Número da sorte</p>
            <p className="display-condensed mt-2 text-8xl leading-none text-[#55e814]">{latestEntry?.raffleNumber ?? "---"}</p>
            <p className="mt-5 text-xl font-bold text-white">{latestEntry?.studentName ?? "Pai aluno Dial Fit"}</p>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#55e814]/25 bg-[#55e814]/7 p-4">
              <ShieldCheck className="mt-0.5 shrink-0 text-[#55e814]" size={20} />
              <div><p className="font-bold text-white">Status: {latestEntry?.status ?? "Pendente"}</p><p className="mt-1 text-sm leading-6 text-[#a8b2aa]">A equipe Dial Fit validará seu vínculo de aluno ativo antes do sorteio.</p></div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => void share()} className="campaign-button inline-flex min-h-12 items-center justify-center gap-2 bg-[#55e814] px-6 text-sm font-extrabold text-[#071006]">{copied ? <Copy size={18} /> : <Share2 size={18} />} {copied ? "Link copiado" : "Compartilhar"}</button>
              <button onClick={onRestart} className="campaign-button min-h-12 bg-[#111813] px-6 text-sm font-bold text-white">Voltar à campanha</button>
            </div>
          </div>
        </div>

        <aside className="campaign-frame p-6 sm:p-7">
          <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#55e814]">O combo sorteado</p><h2 className="mt-2 text-2xl font-black text-white">Três presentes</h2></div><Gift className="text-[#55e814]" size={30} /></div>
          <div className="mt-6 grid gap-3">
            {PRIZES.map((prize, index) => {
              const Icon = prizeIcons[index];
              return <div key={prize.title} className="flex items-center gap-3 rounded-xl border border-white/9 bg-white/[0.03] p-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#55e814] text-[#071006]"><Icon size={20} /></span><div><p className="font-bold text-white">{prize.title}</p><p className="text-xs text-[#a8b2aa]">{prize.partner}</p></div></div>;
            })}
          </div>
          <p className="mt-5 border-t border-white/10 pt-5 text-sm leading-6 text-[#a8b2aa]">Sorteio em <strong className="text-white">{DRAW_DATE_LABEL}</strong>.</p>
        </aside>
      </section>

      <section className="campaign-frame mt-7 p-6 sm:p-8">
        <div className="flex items-center gap-3"><Trophy className="text-[#55e814]" size={27} /><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#55e814]">Resultado oficial</p><h2 className="mt-1 text-2xl font-black text-white">{winner ? "Pai vencedor" : "Aguardando o sorteio"}</h2></div></div>
        {winner ? <div className="mt-6 rounded-xl bg-[#55e814] p-5 text-[#071006]"><p className="text-2xl font-black">{winner.studentName}</p><p className="mt-1 font-semibold">Inscrição {winner.raffleNumber}</p></div> : <p className="mt-5 text-sm leading-6 text-[#a8b2aa]">O nome do vencedor aparecerá aqui depois da apuração no painel administrativo.</p>}
      </section>
    </div>
  );
}
