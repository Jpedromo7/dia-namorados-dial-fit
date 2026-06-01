"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  ShieldCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CAMPAIGN_UNITS } from "@/config/campaign";
import { entriesToCsv, normalizeDocument } from "@/lib/campaign";
import type { CampaignEntry, CampaignUnit, EntryStatus } from "@/types/campaign";
import { RaffleDraw } from "./RaffleDraw";

type UnitFilter = "Todas" | CampaignUnit;
type StatusFilter = "Todos" | EntryStatus;

const STATUS_OPTIONS: EntryStatus[] = [
  "Pendente",
  "Validado",
  "Desclassificado",
];

const statusStyles: Record<EntryStatus, string> = {
  Pendente: "border-[#f0d8a0] bg-[#fff8e8] text-[#7a5b17]",
  Validado: "border-[#bfe8ce] bg-[#effaf3] text-[#0e8b4a]",
  Desclassificado: "border-[#f1c0cc] bg-[#fff0f3] text-[#a4213d]",
};

function downloadCsv(entries: CampaignEntry[]) {
  const blob = new Blob([entriesToCsv(entries)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "inscricoes-dia-dos-namorados-dial-fit.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDuplicateDocuments(entries: CampaignEntry[]) {
  const counts = new Map<string, number>();

  for (const entry of entries) {
    for (const documentValue of [
      entry.studentDocument,
      entry.companionDocument,
    ]) {
      const normalized = normalizeDocument(documentValue);

      if (!normalized) {
        continue;
      }

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([documentValue]) => documentValue);
}

function StatusBadge({ status }: { status: EntryStatus }) {
  const Icon =
    status === "Validado"
      ? CheckCircle2
      : status === "Desclassificado"
        ? XCircle
        : AlertTriangle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      <Icon size={14} aria-hidden="true" />
      {status}
    </span>
  );
}

export function AdminCampaignPanel({
  initialEntries,
  persistChanges = false,
}: {
  initialEntries: CampaignEntry[];
  persistChanges?: boolean;
}) {
  const [entries, setEntries] = useState<CampaignEntry[]>(initialEntries);
  const [unitFilter, setUnitFilter] = useState<UnitFilter>("Todas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [statusMessage, setStatusMessage] = useState("");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const unitMatches = unitFilter === "Todas" || entry.unit === unitFilter;
      const statusMatches =
        statusFilter === "Todos" || entry.status === statusFilter;

      return unitMatches && statusMatches;
    });
  }, [entries, statusFilter, unitFilter]);

  const validatedTotal = entries.filter(
    (entry) => entry.status === "Validado",
  ).length;
  const pendingTotal = entries.filter((entry) => entry.status === "Pendente").length;
  const disqualifiedTotal = entries.filter(
    (entry) => entry.status === "Desclassificado",
  ).length;
  const duplicateDocuments = getDuplicateDocuments(entries);

  async function updateStatus(id: string, status: EntryStatus) {
    const previousEntries = entries;
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.id === id ? { ...entry, status } : entry,
      ),
    );
    setStatusMessage("");

    if (!persistChanges) {
      setStatusMessage("Status atualizado no modo demonstração.");
      return;
    }

    const response = await fetch(`/api/admin/entries/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      setEntries(previousEntries);
      setStatusMessage(data?.message ?? "Não foi possível salvar o status.");
      return;
    }

    const { entry } = (await response.json()) as { entry: CampaignEntry };

    setEntries((currentEntries) =>
      currentEntries.map((currentEntry) =>
        currentEntry.id === entry.id ? entry : currentEntry,
      ),
    );
    setStatusMessage("Status salvo no banco.");
  }

  return (
    <section className="grid min-w-0 gap-6">
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="campaign-frame-soft bg-white/82 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#3b111c]/18 bg-[#f7fbf6] text-[#0e8b4a]">
              <UsersRound size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6f555d]">
                Total de inscritos
              </p>
              <p className="text-3xl font-semibold text-[#3b111c]">
                {entries.length}
              </p>
            </div>
          </div>
        </article>

        <article className="campaign-frame-soft bg-white/82 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#3b111c]/18 bg-[#effaf3] text-[#0e8b4a]">
              <ShieldCheck size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6f555d]">
                Validados
              </p>
              <p className="text-3xl font-semibold text-[#3b111c]">
                {validatedTotal}
              </p>
            </div>
          </div>
        </article>

        <article className="campaign-frame-soft bg-white/82 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#3b111c]/18 bg-[#fff8e8] text-[#7a5b17]">
              <Filter size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6f555d]">
                Pendentes / desclass.
              </p>
              <p className="text-3xl font-semibold text-[#3b111c]">
                {pendingTotal}/{disqualifiedTotal}
              </p>
            </div>
          </div>
        </article>

        <article className="campaign-frame-soft bg-white/82 p-5 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#3b111c]/18 bg-[#fff0f3] text-[#a4213d]">
              <AlertTriangle size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#6f555d]">
                CPFs duplicados
              </p>
              <p className="text-3xl font-semibold text-[#3b111c]">
                {duplicateDocuments.length}
              </p>
            </div>
          </div>
        </article>
      </div>

      {duplicateDocuments.length > 0 ? (
        <div className="campaign-frame-soft bg-[#fff0f3]/88 p-4 text-sm font-semibold text-[#a4213d]">
          Atenção: existem documentos repetidos na base mockada. Revise antes
          de validar as inscrições.
        </div>
      ) : null}

      <section className="campaign-frame min-w-0 bg-white/86 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#3b111c]">
              Lista completa de inscritos
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6f555d]">
              Dados completos apenas para administração. A página pública segue
              exibindo somente nomes abreviados.
            </p>
          </div>

          <button
            type="button"
            onClick={() => downloadCsv(entries)}
            className="campaign-button inline-flex h-11 w-fit items-center justify-center gap-2 bg-[#0e8b4a] px-5 text-sm font-semibold text-white"
          >
            <Download size={17} aria-hidden="true" />
            Exportar CSV
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(["Todas", ...CAMPAIGN_UNITS] as UnitFilter[]).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setUnitFilter(unit)}
              className={`h-10 rounded-md border-2 px-4 text-sm font-semibold transition ${
                unitFilter === unit
                  ? "border-[#0e8b4a] bg-[#0e8b4a] text-white"
                  : "border-[#ead0d6] bg-white/80 text-[#6f555d] hover:border-[#0e8b4a]/40"
              }`}
            >
              {unit}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(["Todos", ...STATUS_OPTIONS] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`h-10 rounded-md border-2 px-4 text-sm font-semibold transition ${
                statusFilter === status
                  ? "border-[#5b1224] bg-[#5b1224] text-white"
                  : "border-[#ead0d6] bg-white/80 text-[#6f555d] hover:border-[#5b1224]/36"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-lg border-2 border-[#3b111c]">
          <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#fff6f1] text-[#6f555d]">
              <tr>
                <th className="px-4 py-3 font-semibold">Nº</th>
                <th className="px-4 py-3 font-semibold">Aluno</th>
                <th className="px-4 py-3 font-semibold">CPF do aluno</th>
                <th className="px-4 py-3 font-semibold">Acompanhante</th>
                <th className="px-4 py-3 font-semibold">CPF acompanhante</th>
                <th className="px-4 py-3 font-semibold">Avaliação</th>
                <th className="px-4 py-3 font-semibold">Unidade</th>
                <th className="px-4 py-3 font-semibold">Criado em</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ead0d6] bg-white">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="align-top">
                  <td className="px-4 py-3 font-mono font-semibold text-[#0e8b4a]">
                    {entry.raffleNumber}
                  </td>
                  <td className="px-4 py-3 text-[#3b111c]">
                    <p className="font-semibold">{entry.studentName}</p>
                    <p className="mt-1 text-xs text-[#7a5f67]">
                      {entry.studentPhone} · {entry.studentEmail}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#5b1224]">
                    {entry.studentDocument}
                  </td>
                  <td className="px-4 py-3 text-[#3b111c]">
                    <p className="font-semibold">{entry.companionName}</p>
                    <p className="mt-1 text-xs text-[#7a5f67]">
                      {entry.companionPhone}
                      {entry.companionEmail ? ` · ${entry.companionEmail}` : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#5b1224]">
                    {entry.companionDocument}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full border border-[#bfe8ce] bg-[#effaf3] px-3 py-1 text-xs font-semibold text-[#0e8b4a]">
                      {entry.completedReview
                        ? `Confirmada · ${entry.reviewUnit}`
                        : "Pendente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#6f555d]">{entry.unit}</td>
                  <td className="px-4 py-3 text-[#6f555d]">
                    {formatDateTime(entry.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} />
                    <select
                      value={entry.status}
                      onChange={(event) =>
                        updateStatus(entry.id, event.target.value as EntryStatus)
                      }
                      className="campaign-field mt-2 h-10 px-3 text-sm font-semibold"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {statusMessage ? (
          <p className="mt-3 text-sm font-semibold text-[#0e8b4a]">
            {statusMessage}
          </p>
        ) : null}
      </section>

      <RaffleDraw entries={entries} persistResult={persistChanges} />
    </section>
  );
}
