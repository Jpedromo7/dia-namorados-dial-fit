import type { Metadata } from "next";
import { ArrowUpRight, Database, LogOut, ShieldCheck } from "lucide-react";
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
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | Dia dos Namorados Dial Fit",
  description: "Painel administrativo da campanha Dia dos Namorados Dial Fit.",
};

export default async function AdminPage() {
  const configured =
    hasSupabasePublicConfig() &&
    hasSupabaseAdminConfig() &&
    getAdminEmails().length > 0;
  const admin = await getCurrentAdmin();

  if (configured && !admin) {
    redirect("/admin/login");
  }

  const initialEntries = configured
    ? await getAdminCampaignEntries()
    : MOCK_CAMPAIGN_ENTRIES;

  return (
    <main className="campaign-bg min-h-screen px-5 py-6 text-[#1f1719] sm:px-6 lg:py-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),transparent)]" />
      <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-8">
        <header className="campaign-frame flex min-w-0 flex-col gap-5 bg-white/90 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/"
              className="campaign-button inline-flex h-11 w-fit items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-[#0e8b4a]"
            >
              Ver página pública
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            {configured ? (
              <form action="/auth/sign-out" method="post">
                <button
                  type="submit"
                  className="campaign-button inline-flex h-11 w-fit items-center justify-center gap-2 bg-[#5b1224] px-5 text-sm font-semibold text-white"
                >
                  <LogOut size={16} aria-hidden="true" />
                  Sair
                </button>
              </form>
            ) : null}
          </div>
        </header>

        {!configured ? (
          <div className="campaign-frame-soft bg-[#fff0f3]/92 p-4 text-sm font-semibold leading-6 text-[#a4213d]">
            Admin em modo demonstração. Configure Supabase, Service Role e
            ADMIN_EMAILS para ativar banco real, login restrito e sorteio
            persistido.
          </div>
        ) : null}

        <section className="campaign-frame min-w-0 overflow-hidden bg-white/88 p-5 backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-md border border-[#3b111c]/18 bg-[#e7f7ed] px-4 py-2 text-sm font-semibold text-[#0e8b4a]">
                <ShieldCheck size={16} aria-hidden="true" />
                Painel administrativo
              </p>
              <h1 className="font-display mt-4 text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-tight text-[#3b111c]">
              {CAMPAIGN_NAME}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#6f555d]">
                Validação das inscrições, controle por CPF, exportação e sorteio
                dos {WINNING_COUPLES_COUNT} casais vencedores.
              </p>
            </div>

            <div className="campaign-frame-soft bg-[#fffaf8]/90 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#5b1224]">
                <Database size={16} aria-hidden="true" />
                {configured ? "Banco conectado" : "Modo demonstração"}
              </p>
              <p className="mt-1 text-xs font-medium text-[#7a5f67]">
                {configured
                  ? admin?.email
                  : "Dados locais para conferência visual"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Sorteio oficial", DRAW_DATE_LABEL],
              ["Jantar dos vencedores", PRIZE_DINNER_DATE_LABEL],
              ["Quantidade de prêmios", `${WINNING_COUPLES_COUNT} casais`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="campaign-frame-soft bg-[#fffaf8]/78 p-4"
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
