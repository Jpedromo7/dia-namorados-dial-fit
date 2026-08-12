import type { Metadata } from "next";
import { ArrowUpRight, Database, LogOut, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminCampaignPanel } from "@/components/campaign/AdminCampaignPanel";
import { CAMPAIGN_NAME, DIALFIT_LOGO, DRAW_DATE_LABEL } from "@/config/campaign";
import { MOCK_CAMPAIGN_ENTRIES } from "@/data/mockEntries";
import { getCurrentAdmin, getAdminEmails } from "@/lib/admin-auth";
import { getAdminCampaignEntries } from "@/lib/campaign-db";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { hasSupabasePublicConfig } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Admin | ${CAMPAIGN_NAME}`, description: "Painel administrativo da campanha de Dia dos Pais." };

export default async function AdminPage() {
  const configured = hasSupabasePublicConfig() && hasSupabaseAdminConfig() && getAdminEmails().length > 0;
  const admin = await getCurrentAdmin();
  if (configured && !admin) redirect("/admin/login");

  let initialEntries = configured ? [] : MOCK_CAMPAIGN_ENTRIES;
  let databaseError = "";
  if (configured) {
    try { initialEntries = await getAdminCampaignEntries(); }
    catch { databaseError = "O banco não respondeu. Confira a conexão e aplique a nova migração da campanha de Dia dos Pais."; }
  }

  return (
    <main className="campaign-bg relative min-h-screen px-5 py-7 text-white sm:px-7">
      <div className="campaign-grid pointer-events-none fixed inset-0" />
      <div className="relative mx-auto grid max-w-7xl gap-7">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/"><Image src={DIALFIT_LOGO} alt="Dial Fit" width={2048} height={696} style={{ height: "auto" }} className="dialfit-logo-clean w-[150px]" /></Link>
          <div className="flex gap-3"><Link href="/" className="campaign-button inline-flex h-11 items-center gap-2 bg-[#111813] px-5 text-sm font-bold text-white">Ver campanha <ArrowUpRight size={16} /></Link>{configured ? <form action="/auth/sign-out" method="post"><button className="campaign-button inline-flex h-11 items-center gap-2 border-[#ff7d7d]/40 bg-[#ff7d7d]/8 px-5 text-sm font-bold text-[#ff9c9c]"><LogOut size={16} /> Sair</button></form> : null}</div>
        </header>

        {!configured ? <div className="rounded-xl border border-[#f4c85d]/30 bg-[#f4c85d]/8 p-4 text-sm font-semibold text-[#f4d780]">Painel em modo demonstração. Os dados são locais e não serão persistidos.</div> : null}
        {databaseError ? <div className="rounded-xl border border-[#ff7d7d]/30 bg-[#ff7d7d]/8 p-4 text-sm font-semibold text-[#ff9c9c]">{databaseError}</div> : null}

        <section className="campaign-frame p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#55e814]"><ShieldCheck size={16} /> Administração</p><h1 className="mt-3 text-4xl font-black text-white sm:text-6xl">{CAMPAIGN_NAME}</h1><p className="mt-3 text-[#a8b2aa]">Validação dos pais alunos, exportação e sorteio do combo de prêmios.</p></div>
            <div className="campaign-frame-soft p-4"><p className="flex items-center gap-2 font-bold text-white"><Database size={17} className="text-[#55e814]" /> {configured ? "Banco conectado" : "Modo demonstração"}</p><p className="mt-2 text-xs text-[#a8b2aa]">{configured ? admin?.email : "Dados de exemplo"}</p></div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="campaign-frame-soft p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#55e814]">Sorteio</p><p className="mt-2 font-bold text-white">{DRAW_DATE_LABEL}</p></div><div className="campaign-frame-soft p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#55e814]">Premiação</p><p className="mt-2 font-bold text-white">1 combo · 1 vencedor</p></div></div>
        </section>
        <AdminCampaignPanel initialEntries={initialEntries} persistChanges={configured && !databaseError} />
      </div>
    </main>
  );
}
