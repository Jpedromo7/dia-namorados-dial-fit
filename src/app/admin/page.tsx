import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCampaignPanel } from "@/components/campaign/AdminCampaignPanel";
import {
  CAMPAIGN_NAME,
  DIALFIT_LOGO,
  DRAW_DATE_LABEL,
  PRIZE_DINNER_DATE_LABEL,
  WINNING_COUPLES_COUNT,
} from "@/config/campaign";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { getCurrentAdmin, getAdminEmails } from "@/lib/admin-auth";
import { getAdminCampaignEntries } from "@/lib/campaign-db";
import {
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Dia dos Namorados Dial Fit",
  description: "Painel administrativo da campanha Dia dos Namorados Dial Fit.",
};

export default async function AdminPage() {
  const configured = hasSupabasePublicConfig() && getAdminEmails().length > 0;
  const admin = await getCurrentAdmin();

  if (configured && !admin) {
    redirect("/admin/login");
  }

  const initialEntries = configured
    ? await getAdminCampaignEntries()
    : MOCK_CAMPAIGN_ENTRIES;

  return (
    <main className="min-h-screen bg-[#fff6f1] px-5 py-6 text-[#1f1719] sm:px-6 lg:py-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(244,209,144,0.32),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(164,33,61,0.18),transparent_30%),linear-gradient(145deg,#fff8f2_0%,#f7dce2_52%,#fff6f1_100%)]" />
      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-8">
        <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" aria-label="Voltar para a campanha">
            <Image
              src={DIALFIT_LOGO}
              alt="Dial Fit Academia"
              width={165}
              height={54}
              priority
              className="dialfit-logo-clean h-auto w-[148px] sm:w-[165px]"
            />
          </Link>

          <Link
            href="/"
            className="inline-flex h-11 w-fit items-center justify-center rounded-full border border-[#0e8b4a]/20 bg-white/78 px-5 text-sm font-semibold text-[#0e8b4a] shadow-sm shadow-[#5b1224]/8 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#0e8b4a]/45 hover:bg-white"
          >
            Ver página pública
          </Link>
        </header>

        {!configured ? (
          <div className="rounded-[1.2rem] border border-[#f1c0cc] bg-[#fff0f3]/90 p-4 text-sm font-semibold leading-6 text-[#a4213d] shadow-sm shadow-[#5b1224]/6">
            Admin em modo demonstração. Configure Supabase e ADMIN_EMAILS para
            ativar login Google, banco real e sorteio persistido.
          </div>
        ) : (
          <form action="/auth/sign-out" method="post" className="justify-self-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#ead0d6] bg-white/78 px-4 text-sm font-semibold text-[#5b1224] shadow-sm shadow-[#5b1224]/8 transition hover:-translate-y-0.5 hover:bg-white"
            >
              Sair do admin
            </button>
          </form>
        )}

        <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-5 shadow-2xl shadow-[#5b1224]/10 backdrop-blur-xl sm:p-7">
          <div className="min-w-0 max-w-2xl">
            <p className="text-sm font-semibold text-[#0e8b4a]">
              Painel administrativo
            </p>
            <h1 className="font-display mt-3 whitespace-nowrap text-[clamp(2.2rem,5.2vw,3.7rem)] font-semibold leading-tight text-[#3b111c]">
              {CAMPAIGN_NAME}
            </h1>
            <p className="mt-3 text-base leading-7 text-[#6f555d]">
              Validação das inscrições, controle por CPF, exportação e sorteio
              dos {WINNING_COUPLES_COUNT} casais vencedores.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Sorteio oficial", DRAW_DATE_LABEL],
              ["Jantar dos vencedores", PRIZE_DINNER_DATE_LABEL],
              ["Quantidade de prêmios", `${WINNING_COUPLES_COUNT} casais`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[1.2rem] border border-[#f0d1d8] bg-[#fffaf8]/78 p-4"
              >
                <p className="text-xs font-semibold text-[#a4213d]">
                  {label}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#3b111c]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <AdminCampaignPanel
          initialEntries={initialEntries}
          persistChanges={configured}
        />
      </div>
    </main>
  );
}
