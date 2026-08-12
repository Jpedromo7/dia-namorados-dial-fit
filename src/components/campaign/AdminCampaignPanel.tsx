"use client";

import { AlertTriangle, CheckCircle2, Download, Filter, ShieldCheck, Trash2, UsersRound, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { entriesToCsv, normalizeDocument } from "@/lib/campaign";
import type { CampaignEntry, EntryStatus } from "@/types/campaign";
import { RaffleDraw } from "./RaffleDraw";

type StatusFilter = "Todos" | EntryStatus;
const statuses: EntryStatus[] = ["Pendente", "Validado", "Desclassificado"];
const storageKey = "dialfit-fathers-day:last-entry";

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function exportCsv(entries: CampaignEntry[]) {
  const blob = new Blob([entriesToCsv(entries)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "inscricoes-dia-dos-pais-dial-fit.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const Icon = status === "Validado" ? CheckCircle2 : status === "Desclassificado" ? XCircle : AlertTriangle;
  const style = status === "Validado" ? "border-[#55e814]/35 bg-[#55e814]/8 text-[#74f23d]" : status === "Desclassificado" ? "border-[#ff7d7d]/35 bg-[#ff7d7d]/8 text-[#ff9c9c]" : "border-[#f4c85d]/35 bg-[#f4c85d]/8 text-[#f4d780]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${style}`}><Icon size={14} />{status}</span>;
}

export function AdminCampaignPanel({ initialEntries, persistChanges = false }: { initialEntries: CampaignEntry[]; persistChanges?: boolean }) {
  const [entries, setEntries] = useState(initialEntries);
  const [filter, setFilter] = useState<StatusFilter>("Todos");
  const [message, setMessage] = useState("");
  const filtered = useMemo(() => entries.filter((entry) => filter === "Todos" || entry.status === filter), [entries, filter]);
  const duplicates = entries.length - new Set(entries.map((entry) => normalizeDocument(entry.studentDocument))).size;

  async function updateStatus(id: string, status: EntryStatus) {
    const previous = entries;
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, status } : entry));
    if (!persistChanges) { setMessage("Status atualizado no modo demonstração."); return; }
    const response = await fetch(`/api/admin/entries/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) { setEntries(previous); setMessage("Não foi possível salvar o status."); return; }
    const { entry } = (await response.json()) as { entry: CampaignEntry };
    setEntries((current) => current.map((item) => item.id === id ? entry : item));
    setMessage("Status salvo com sucesso.");
  }

  async function remove(entry: CampaignEntry) {
    if (!window.confirm(`Excluir a inscrição ${entry.raffleNumber} de ${entry.studentName}?`)) return;
    if (persistChanges) {
      const response = await fetch(`/api/admin/entries/${entry.id}`, { method: "DELETE" });
      if (!response.ok) { setMessage("Não foi possível excluir a inscrição."); return; }
    }
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "null") as CampaignEntry | null;
      if (stored?.id === entry.id) window.localStorage.removeItem(storageKey);
    } catch {}
    setMessage("Inscrição excluída.");
  }

  const cards = [
    [UsersRound, "Total", entries.length, "text-white"],
    [ShieldCheck, "Validados", entries.filter((e) => e.status === "Validado").length, "text-[#74f23d]"],
    [Filter, "Pendentes", entries.filter((e) => e.status === "Pendente").length, "text-[#f4d780]"],
    [AlertTriangle, "CPFs duplicados", duplicates, "text-[#ff9c9c]"],
  ] as const;

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([Icon, label, value, color]) => <article key={label} className="campaign-frame-soft p-5"><Icon size={20} className="text-[#55e814]" /><p className="mt-4 text-sm text-[#a8b2aa]">{label}</p><p className={`mt-1 text-3xl font-black ${color}`}>{value}</p></article>)}
      </div>

      <section className="campaign-frame overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-black text-white">Inscrições</h2><p className="mt-1 text-sm text-[#a8b2aa]">Valide se o participante é pai e aluno ativo.</p></div>
          <button onClick={() => exportCsv(entries)} className="campaign-button inline-flex h-11 items-center justify-center gap-2 bg-[#55e814] px-5 text-sm font-extrabold text-[#071006]"><Download size={17} /> Exportar CSV</button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {(["Todos", ...statuses] as StatusFilter[]).map((status) => <button key={status} onClick={() => setFilter(status)} className={`rounded-lg border px-4 py-2 text-sm font-bold ${filter === status ? "border-[#55e814] bg-[#55e814] text-[#071006]" : "border-[#344137] bg-[#0d130f] text-[#a8b2aa]"}`}>{status}</button>)}
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border border-[#344137]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#0d130f] text-[#a8b2aa]"><tr><th className="px-4 py-3">Nº</th><th className="px-4 py-3">Pai/aluno</th><th className="px-4 py-3">CPF</th><th className="px-4 py-3">Avaliação</th><th className="px-4 py-3">Criado em</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ação</th></tr></thead>
            <tbody className="divide-y divide-[#273229] bg-[#111813]">
              {filtered.map((entry) => <tr key={entry.id}>
                <td className="px-4 py-4 font-mono font-bold text-[#74f23d]">{entry.raffleNumber}</td>
                <td className="px-4 py-4"><p className="font-bold text-white">{entry.studentName}</p><p className="mt-1 text-xs text-[#a8b2aa]">{entry.studentPhone} · {entry.studentEmail}</p></td>
                <td className="px-4 py-4 font-mono text-xs text-white">{entry.studentDocument}</td>
                <td className="px-4 py-4 text-[#74f23d]">{entry.completedReview ? "Confirmada" : "Pendente"}</td>
                <td className="px-4 py-4 text-[#a8b2aa]">{formatDate(entry.createdAt)}</td>
                <td className="px-4 py-4"><StatusBadge status={entry.status} /><select value={entry.status} onChange={(event) => void updateStatus(entry.id, event.target.value as EntryStatus)} className="campaign-field mt-2 block h-10 px-3 text-xs font-bold">{statuses.map((status) => <option key={status}>{status}</option>)}</select></td>
                <td className="px-4 py-4"><button onClick={() => void remove(entry)} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#ff7d7d]/30 bg-[#ff7d7d]/7 px-4 text-xs font-bold text-[#ff9c9c]"><Trash2 size={15} /> Excluir</button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {message ? <p className="mt-4 text-sm font-semibold text-[#74f23d]">{message}</p> : null}
      </section>
      <RaffleDraw entries={entries} persistResult={persistChanges} />
    </section>
  );
}
