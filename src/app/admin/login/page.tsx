import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { AdminLogin } from "@/components/campaign/AdminLogin";
import { DIALFIT_LOGO } from "@/config/campaign";
import { getCurrentBlackFridayStaff } from "@/lib/black-friday-auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Acesso da equipe | Black Friday Dial Fit" };

function errorMessage(code: unknown) {
  if (code === "not-authorized") return "Esta conta Google ainda não foi liberada por um administrador.";
  if (code === "session") return "Não foi possível concluir o login com Google. Tente novamente.";
  return "";
}

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const params = await searchParams;
  const code = Array.isArray(params.error) ? params.error[0] : params.error;
  const staff = await getCurrentBlackFridayStaff();
  if (staff) redirect("/admin/black-friday");
  const configured = Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET && process.env.DATABASE_URL);

  return <main className="campaign-bg min-h-screen px-5 py-8 text-white">
    <div className="campaign-grid pointer-events-none fixed inset-0" />
    <section className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-xl place-items-center">
      <div className="campaign-frame w-full p-7 text-center backdrop-blur-xl sm:p-9">
        <Image src={DIALFIT_LOGO} alt="Dial Fit Academia" width={2048} height={696} priority style={{ height: "auto" }} className="dialfit-logo-clean mx-auto w-[160px]" />
        <p className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-[#55e814]/30 bg-[#55e814]/8 px-4 py-2 text-sm font-semibold text-[#74f23d]"><LockKeyhole size={16} aria-hidden="true" /> Acesso da equipe</p>
        <p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#55e814]">BLACK FRIDAY DE ARREPIAR · 2026</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-white">Painel protegido</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#a8b2aa]">Entre com sua conta Google autorizada pela administração da Dial Fit.</p>
        <div className="mt-7">
          {errorMessage(code) && <div role="alert" className="campaign-frame-soft mb-4 border-[#ff7d7d]/30 bg-[#ff7d7d]/8 p-4 text-sm font-semibold leading-6 text-[#ff9c9c]">{errorMessage(code)}</div>}
          {configured ? <AdminLogin /> : <div className="campaign-frame-soft border-[#ff7d7d]/30 bg-[#ff7d7d]/8 p-4 text-sm font-semibold leading-6 text-[#ff9c9c]">A autenticação e o banco da equipe ainda não estão configurados.</div>}
        </div>
        <Link href="/" className="campaign-button mt-6 inline-flex h-11 items-center justify-center gap-2 bg-[#111813] px-5 text-sm font-semibold text-[#74f23d]"><ArrowLeft size={16} aria-hidden="true" /> Voltar à campanha</Link>
      </div>
    </section>
  </main>;
}
