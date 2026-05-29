import type { Metadata } from "next";
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
    <main className="min-h-screen bg-[#fff6f1] px-5 py-8 text-[#1f1719]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(244,209,144,0.32),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(164,33,61,0.18),transparent_30%),linear-gradient(145deg,#fff8f2_0%,#f7dce2_52%,#fff6f1_100%)]" />
      <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center">
        <div className="w-full rounded-[2rem] border border-white/70 bg-white/78 p-7 text-center shadow-2xl shadow-[#5b1224]/12 backdrop-blur-xl">
          <Image
            src={DIALFIT_LOGO}
            alt="Dial Fit Academia"
            width={178}
            height={74}
            priority
            className="dialfit-logo-clean mx-auto h-auto w-[160px]"
          />
          <p className="mt-8 text-sm font-semibold text-[#0e8b4a]">
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
              <div className="rounded-[1.2rem] border border-[#f1c0cc] bg-[#fff0f3] p-4 text-sm font-semibold leading-6 text-[#a4213d]">
                Configure as variáveis do Supabase e ADMIN_EMAILS para liberar o
                login.
              </div>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex text-sm font-semibold text-[#0e8b4a] underline-offset-4 hover:underline"
          >
            Voltar para a campanha
          </Link>
        </div>
      </section>
    </main>
  );
}
