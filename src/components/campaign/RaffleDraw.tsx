"use client";

import { Clipboard, Download, Shuffle, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DRAW_DATE,
  DRAW_DATE_LABEL,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import type { CampaignEntry } from "@/types/campaign";

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function randomIntExclusive(maxExclusive: number) {
  const randomValues = new Uint32Array(1);
  const randomRange = 2 ** 32;
  const limit = Math.floor(randomRange / maxExclusive) * maxExclusive;
  let value = 0;

  do {
    window.crypto.getRandomValues(randomValues);
    value = randomValues[0] ?? 0;
  } while (value >= limit);

  return value % maxExclusive;
}

function drawDistinctWinners(entries: CampaignEntry[]) {
  const shuffledEntries = [...entries];

  for (let index = shuffledEntries.length - 1; index > 0; index -= 1) {
    const targetIndex = randomIntExclusive(index + 1);
    const currentEntry = shuffledEntries[index];
    shuffledEntries[index] = shuffledEntries[targetIndex] as CampaignEntry;
    shuffledEntries[targetIndex] = currentEntry as CampaignEntry;
  }

  return shuffledEntries.slice(0, WINNING_COUPLES_COUNT);
}

function formatWinnerLine(entry: CampaignEntry, index: number) {
  return `${index + 1}º casal: ${entry.studentName} + ${entry.companionName}`;
}

export function RaffleDraw({
  entries,
  persistResult = false,
}: {
  entries: CampaignEntry[];
  persistResult?: boolean;
}) {
  const [winners, setWinners] = useState<CampaignEntry[]>([]);
  const [copyStatus, setCopyStatus] = useState("");
  const [drawIsOpen, setDrawIsOpen] = useState(false);
  const [drawStatus, setDrawStatus] = useState("");
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    const drawTime = new Date(DRAW_DATE).getTime();
    const updateDrawState = () => setDrawIsOpen(Date.now() >= drawTime);

    updateDrawState();
    const intervalId = window.setInterval(updateDrawState, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const validatedEntries = useMemo(
    () => entries.filter((entry) => entry.status === "Validado"),
    [entries],
  );

  const hasEnoughValidatedEntries =
    validatedEntries.length >= WINNING_COUPLES_COUNT;
  const canDraw = drawIsOpen && hasEnoughValidatedEntries && !drawing;

  async function drawWinners() {
    if (!canDraw) {
      return;
    }

    setDrawing(true);
    setDrawStatus("");
    setCopyStatus("");

    if (!persistResult) {
      setWinners(drawDistinctWinners(validatedEntries));
      setDrawing(false);
      setDrawStatus("Sorteio realizado no modo demonstração.");
      return;
    }

    const response = await fetch("/api/admin/raffle/draw", {
      method: "POST",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      setDrawStatus(data?.message ?? "Não foi possível realizar o sorteio.");
      setDrawing(false);
      return;
    }

    const data = (await response.json()) as { winners: CampaignEntry[] };
    setWinners(data.winners);
    setDrawStatus("Resultado salvo no banco.");
    setDrawing(false);
  }

  async function copyNames() {
    if (winners.length === 0) {
      return;
    }

    const text = winners
      .map((winner, index) => formatWinnerLine(winner, index))
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Nomes copiados.");
    } catch {
      setCopyStatus("Nao foi possivel copiar automaticamente.");
    }
  }

  function downloadResult() {
    if (winners.length === 0) {
      return;
    }

    downloadTextFile(
      "resultado-sorteio-dois-casais.txt",
      [
        "Casais sorteados",
        ...winners.flatMap((winner, index) => [
          "",
          formatWinnerLine(winner, index),
          `Inscrição: ${winner.raffleNumber}`,
        ]),
      ].join("\n"),
    );
  }

  return (
    <section className="campaign-frame min-w-0 bg-white/86 p-5 backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-[#3b111c]/18 bg-[#fff0f3] px-4 py-2 text-sm font-semibold text-[#a4213d]">
            <Trophy size={16} aria-hidden="true" />
            Tela de sorteio
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[#3b111c]">
            Sorteio da campanha
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6f555d]">
            O botão será liberado automaticamente em {DRAW_DATE_LABEL}.
            Participam apenas inscrições com status Validado, e serão sorteados{" "}
            {WINNING_COUPLES_COUNT} casais aleatórios.
          </p>
        </div>

        <button
          type="button"
          onClick={drawWinners}
          disabled={!canDraw}
          className="campaign-button inline-flex h-11 w-fit items-center justify-center gap-2 bg-[#0e8b4a] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9db9a9]"
        >
          <Shuffle size={17} aria-hidden="true" />
          {drawing
            ? "Sorteando..."
            : drawIsOpen
              ? "Realizar sorteio"
              : "Sorteio bloqueado"}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h3 className="text-sm font-semibold text-[#3b111c]">
            Participantes validados
          </h3>
          <div className="mt-3 max-h-72 overflow-auto rounded-lg border-2 border-[#3b111c]">
            {validatedEntries.length > 0 ? (
              <ul className="divide-y divide-[#ead0d6] bg-white">
                {validatedEntries.map((entry) => (
                  <li
                    key={entry.id}
                    className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[70px_1fr]"
                  >
                    <span className="font-mono font-semibold text-[#0e8b4a]">
                      {entry.raffleNumber}
                    </span>
                    <div>
                      <p className="font-semibold text-[#3b111c]">
                        {entry.studentName} + {entry.companionName}
                      </p>
                      <p className="mt-1 text-xs text-[#7a5f67]">
                        {entry.studentDocument} · {entry.companionDocument}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-5 text-sm text-[#7a5f67]">
                Nenhum participante validado ainda.
              </p>
            )}
          </div>
        </div>

        <div className="campaign-frame-soft relative overflow-hidden bg-[#fff8e8] p-5">
          <Sparkles
            className="absolute right-5 top-5 text-[#d8b55e]/46"
            size={28}
            aria-hidden="true"
          />
          {winners.length > 0 ? (
            <>
              <p className="text-sm font-semibold text-[#7a5b17]">
                Casais sorteados
              </p>
              <div className="mt-3 grid gap-3">
                {winners.map((winner, index) => (
                  <article
                    key={winner.id}
                    className="rounded-lg border-2 border-[#3b111c]/18 bg-white p-4 shadow-sm shadow-[#5b1224]/6"
                  >
                    <p className="text-xs font-semibold text-[#7a5b17]">
                      {index + 1}º casal
                    </p>
                    <h3 className="mt-2 text-xl font-semibold leading-tight text-[#3b111c]">
                      {winner.studentName} + {winner.companionName}
                    </h3>
                    <p className="mt-2 text-sm text-[#6f555d]">
                      Inscrição {winner.raffleNumber}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={copyNames}
                  className="campaign-button inline-flex h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-[#0e8b4a]"
                >
                  <Clipboard size={17} aria-hidden="true" />
                  Copiar nomes
                </button>
                <button
                  type="button"
                  onClick={downloadResult}
                  className="campaign-button inline-flex h-11 items-center justify-center gap-2 bg-white px-4 text-sm font-semibold text-[#0e8b4a]"
                >
                  <Download size={17} aria-hidden="true" />
                  Baixar resultado
                </button>
              </div>
              {copyStatus ? (
                <p className="mt-3 text-sm font-medium text-[#0e8b4a]">
                  {copyStatus}
                </p>
              ) : null}
              {drawStatus ? (
                <p className="mt-3 text-sm font-medium text-[#0e8b4a]">
                  {drawStatus}
                </p>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-52 items-center justify-center text-center">
              <div>
                <Trophy
                  size={38}
                  className="mx-auto text-[#d8b55e]"
                  aria-hidden="true"
                />
                <h3 className="mt-4 text-xl font-semibold text-[#3b111c]">
                  Área para mostrar os casais sorteados
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#7a5f67]">
                  Clique em Realizar sorteio para selecionar aleatoriamente os{" "}
                  {WINNING_COUPLES_COUNT} casais vencedores. O jantar será em{" "}
                  {PRIZE_DINNER_DATE_LABEL}.
                </p>
                {!drawIsOpen ? (
                  <p className="mt-3 text-sm font-medium text-[#a61f3d]">
                    O sorteio só será liberado em {DRAW_DATE_LABEL}.
                  </p>
                ) : null}
                {drawIsOpen && !hasEnoughValidatedEntries ? (
                  <p className="mt-3 text-sm font-medium text-[#a61f3d]">
                    É preciso ter pelo menos {WINNING_COUPLES_COUNT} inscrições
                    validadas para realizar o sorteio.
                  </p>
                ) : null}
                {drawStatus ? (
                  <p className="mt-3 text-sm font-medium text-[#a61f3d]">
                    {drawStatus}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
