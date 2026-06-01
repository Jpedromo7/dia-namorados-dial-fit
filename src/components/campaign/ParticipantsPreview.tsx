import { HeartHandshake, ShieldCheck } from "lucide-react";
import { abbreviateName } from "@/lib/campaign";
import type { CampaignEntry } from "@/types/campaign";

export function ParticipantsPreview({ entries }: { entries: CampaignEntry[] }) {
  return (
    <section className="campaign-frame bg-white/88 p-5 backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-[#3b111c]/18 bg-[#fff0f3] px-4 py-2 text-sm font-semibold text-[#a4213d]">
            <ShieldCheck size={16} aria-hidden="true" />
            Participantes cadastrados
          </div>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[#3b111c]">
            Lista pública segura
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[#6f555d]">
          Lista pública segura com nomes abreviados.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        {entries.map((entry) => (
          <article
            key={entry.id}
            className="campaign-frame-soft grid gap-3 bg-[#fffaf8]/86 p-4 text-sm sm:grid-cols-[74px_1fr_auto] sm:items-center"
          >
            <span className="font-mono text-base font-semibold text-[#0e8b4a]">
              {entry.raffleNumber}
            </span>
            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-[#4e3039]">
              <HeartHandshake
                size={16}
                className="shrink-0 text-[#a4213d]"
                aria-hidden="true"
              />
              <span className="truncate">
                {abbreviateName(entry.studentName)} +{" "}
                {abbreviateName(entry.companionName)}
              </span>
            </span>
            <span className="inline-flex w-fit rounded-md border border-[#0e8b4a]/20 bg-[#e7f7ed] px-3 py-1 text-xs font-semibold text-[#0e8b4a]">
              Confirmado
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
