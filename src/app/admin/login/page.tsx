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
  title: "Login Admin | Dia dos Pais Dial Fit",
};

function getLoginErrorMessage(errorCode: unknown) {
  if (errorCode === "not-authorized") {
    return "Conta Google conectada, mas esse e-mail não está autorizado para o painel administrativo.";
  }

  if (errorCode === "session") {
    return "Não foi possível concluir o login com Google. Tente novamente.";
  }

  return "";
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const loginErrorMessage = getLoginErrorMessage((await searchParams).error);
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
    <main className="campaign-bg min-h-screen px-5 py-8 text-white">
      <div className="campaign-grid pointer-events-none fixed inset-0" />
      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center">
        <div className="campaign-frame w-full p-7 text-center backdrop-blur-xl">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={2048}
            height={696}
            priority
            style={{ height: "auto" }}
            className="dialfit-logo-clean mx-auto w-[160px]"
          />
          <p className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-[#55e814]/30 bg-[#55e814]/8 px-4 py-2 text-sm font-semibold text-[#74f23d]">
            <LockKeyhole size={16} aria-hidden="true" />
            Painel administrativo
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-white">
            Acesso restrito
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#a8b2aa]">
            Entre com o e-mail autorizado para validar inscrições e realizar o
            sorteio.
          </p>

          <div className="mt-7">
            {loginErrorMessage ? (
              <div className="campaign-frame-soft mb-4 border-[#ff7d7d]/30 bg-[#ff7d7d]/8 p-4 text-sm font-semibold leading-6 text-[#ff9c9c]">
                {loginErrorMessage}
              </div>
            ) : null}

            {configured ? (
              <AdminLogin />
            ) : (
              <div className="campaign-frame-soft border-[#ff7d7d]/30 bg-[#ff7d7d]/8 p-4 text-sm font-semibold leading-6 text-[#ff9c9c]">
                Configure as variáveis do Supabase e ADMIN_EMAILS para liberar o
                login.
              </div>
            )}
          </div>

          <Link
            href="/"
            className="campaign-button mt-6 inline-flex h-11 items-center justify-center gap-2 bg-[#111813] px-5 text-sm font-semibold text-[#74f23d]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar para a campanha
          </Link>
        </div>
      </section>
    </main>
  );
}
