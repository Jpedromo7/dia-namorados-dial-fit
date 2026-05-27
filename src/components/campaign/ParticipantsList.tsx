import { ShieldCheck } from "lucide-react";
import { abbreviateName } from "@/lib/campaign";
import type { CampaignEntry } from "@/types/campaign";

export function ParticipantsList({ entries }: { entries: CampaignEntry[] }) {
  return (
    <section className="bg-white px-5 py-14 text-[#101712] sm:px-6 lg:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md bg-[#f7fbf6] px-3 py-2 text-sm font-semibold text-[#0e8b4a]">
              <ShieldCheck size={16} aria-hidden="true" />
              Lista pública segura
            </div>
            <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
              Participantes cadastrados
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#536158]">
            Esta lista mostra apenas número de inscrição, nomes abreviados e
            status de confirmação.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-[#dfe9e2]">
          <ul className="divide-y divide-[#dfe9e2] bg-white">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-[90px_1fr_auto] sm:items-center sm:px-5"
              >
                <span className="font-mono font-semibold text-[#0e8b4a]">
                  {entry.raffleNumber}
                </span>
                <span className="font-medium text-[#233027]">
                  {abbreviateName(entry.studentName)} +{" "}
                  {abbreviateName(entry.companionName)}
                </span>
                <span className="inline-flex w-fit rounded-md bg-[#effaf3] px-3 py-1 text-xs font-semibold text-[#0e8b4a]">
                  Confirmado
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
