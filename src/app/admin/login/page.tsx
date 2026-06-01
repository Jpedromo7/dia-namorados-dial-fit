import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AdminLogin } from "@/components/campaign/AdminLogin";
import { DIALFIT_LOGO } from "@/config/campaign";
import {
  hasSupabasePublicConfig,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { getAdminEmails } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login Admin | Dia dos Namorados Dial Fit",
};

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const adminEmails = getAdminEmails();

  if (supabase && adminEmails.length > 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email && adminEmails.includes(user.email.toLowerCase())) {
      redirect("/admin");
    }
  }

  const configured = hasSupabasePublicConfig() && adminEmails.length > 0;

  return (
    <main className="campaign-bg min-h-screen px-5 py-8 text-[#1f1719]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.78),transparent)]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center">
        <div className="campaign-frame w-full bg-white/88 p-7 text-center backdrop-blur-xl">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={178}
            height={74}
            priority
            className="dialfit-logo-clean mx-auto h-auto w-[160px]"
          />
          <p className="mx-auto mt-8 inline-flex items-center gap-2 rounded-md border border-[#3b111c]/18 bg-[#e7f7ed] px-4 py-2 text-sm font-semibold text-[#0e8b4a]">
            <LockKeyhole size={16} aria-hidden="true" />
            Painel administrativo
          </p>
          <h1 className="font-display mt-3 text-4xl font-semibold leading-tight text-[#3b111c]">
            Acesso restrito
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#6f555d]">
            Entre com o e-mail autorizado para validar inscrições e realizar o
            sorteio.
          </p>

          <div className="mt-7">
            {configured ? (
              <AdminLogin />
            ) : (
              <div className="campaign-frame-soft bg-[#fff0f3] p-4 text-sm font-semibold leading-6 text-[#a4213d]">
                Configure as variáveis do Supabase e ADMIN_EMAILS para liberar o
                login.
              </div>
            )}
          </div>

          <Link
            href="/"
            className="campaign-button mt-6 inline-flex h-11 items-center justify-center gap-2 bg-white px-5 text-sm font-semibold text-[#0e8b4a]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para a campanha
          </Link>
        </div>
      </section>
    </main>
  );
}
