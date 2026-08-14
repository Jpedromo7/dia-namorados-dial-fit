"use client";

import { Loader2, Shuffle, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DRAW_DATE, DRAW_DATE_LABEL, WINNERS_COUNT } from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";

export function RaffleDraw({
  entries,
  persistResult = false,
}: {
  entries: CampaignEntry[];
  persistResult?: boolean;
}) {
  const [winners, setWinners] = useState<CampaignEntry[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState("");
  const [drawReady, setDrawReady] = useState(false);
  const validated = useMemo(() => entries.filter((entry) => entry.status === "Validado"), [entries]);

  useEffect(() => {
    const drawTime = new Date(DRAW_DATE).getTime();
    const updateDrawReady = () => setDrawReady(Date.now() >= drawTime);

    updateDrawReady();
    const timer = window.setTimeout(updateDrawReady, Math.max(drawTime - Date.now(), 0));

    return () => window.clearTimeout(timer);
  }, []);

  async function draw() {
    setDrawing(true);
    setMessage("");
    try {
      if (persistResult) {
        const response = await fetch("/api/admin/raffle/draw", { method: "POST" });
        const data = (await response.json().catch(() => null)) as { winners?: CampaignEntry[]; message?: string } | null;
        if (!response.ok || !data?.winners) throw new Error(data?.message ?? "Não foi possível realizar o sorteio.");
        setWinners(data.winners);
      } else {
        const random = validated[Math.floor(Math.random() * validated.length)];
        if (!random) throw new Error("Não há inscrições validadas suficientes.");
        setWinners([random]);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível sortear.");
    } finally {
      setDrawing(false);
    }
  }

  return (
    <section className="campaign-frame p-5 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#55e814]">Apuração</p><h2 className="mt-2 text-3xl font-black text-white">Sorteio do pai vencedor</h2><p className="mt-2 text-sm text-[#a8b2aa]">{validated.length} inscrições validadas · {WINNERS_COUNT} vencedor · {DRAW_DATE_LABEL}</p></div>
        <button onClick={() => void draw()} disabled={drawing || !drawReady || validated.length < WINNERS_COUNT || winners.length > 0} className="campaign-button inline-flex min-h-12 items-center justify-center gap-2 bg-[#55e814] px-6 text-sm font-extrabold text-[#071006] disabled:cursor-not-allowed disabled:opacity-45">
          {drawing ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />} {drawing ? "Sorteando" : "Realizar sorteio"}
        </button>
      </div>
      {!drawReady ? <p className="mt-5 rounded-lg border border-[#f4c85d]/30 bg-[#f4c85d]/8 p-4 text-sm font-semibold text-[#f4d780]">O botão será liberado automaticamente no horário oficial.</p> : null}
      {message ? <p className="mt-5 rounded-lg border border-[#ff7d7d]/30 bg-[#ff7d7d]/8 p-4 text-sm font-semibold text-[#ff9c9c]">{message}</p> : null}
      {winners[0] ? <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#55e814] p-5 text-[#071006]"><Trophy size={32} /><div><p className="text-xs font-black uppercase tracking-[0.14em]">Vencedor</p><p className="mt-1 text-2xl font-black">{winners[0].studentName}</p><p className="font-semibold">Inscrição {winners[0].raffleNumber}</p></div></div> : null}
    </section>
  );
}
