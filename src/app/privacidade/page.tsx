import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { DIALFIT_LOGO } from "@/config/campaign";

export const metadata: Metadata = {
  title: "Política de Privacidade | Dial Fit",
  description: "Como a Dial Fit utiliza e protege os dados enviados à pré-lista Black Friday de Arrepiar 2026.",
  robots: { index: false, follow: false },
};

const controllerName = process.env.NEXT_PUBLIC_DATA_CONTROLLER_NAME?.trim() || "Academia Dial Fit";
const privacyEmail = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL?.trim() || "";
const privacyWhatsApp = process.env.NEXT_PUBLIC_PRIVACY_CONTACT_WHATSAPP?.replace(/\D/g, "") || "";

export default function PrivacyPage() {
  const hasContact = Boolean(privacyEmail || privacyWhatsApp);
  return <main className="campaign-bg relative min-h-screen px-5 py-8 text-white sm:px-7 sm:py-12">
    <div className="campaign-grid pointer-events-none fixed inset-0" />
    <div className="relative mx-auto max-w-3xl">
      <header className="flex items-center justify-between border-b border-white/10 pb-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a8b2aa] hover:text-white"><ArrowLeft size={17} /> Voltar à campanha</Link>
        <Image src={DIALFIT_LOGO} alt="Dial Fit" width={2048} height={696} className="dialfit-logo-clean w-[124px]" />
      </header>
      <article className="campaign-frame mt-7 overflow-hidden">
        <div className="border-b border-white/10 bg-[#101910] p-6 sm:p-9"><ShieldCheck size={30} className="text-[#55e814]" /><p className="mt-5 text-xs font-black uppercase tracking-[.18em] text-[#55e814]">Black Friday de Arrepiar · 2026</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Política de Privacidade</h1><p className="mt-3 text-sm text-[#a8b2aa]">Última atualização: 3 de novembro de 2026</p></div>
        <div className="grid gap-7 p-6 sm:p-9">
          <section><h2 className="text-lg font-extrabold">Quem é responsável pelos dados</h2><p className="mt-2 text-sm leading-7 text-[#b7c0b9]">O responsável informado para esta campanha é <strong className="text-white">{controllerName}</strong>, que opera a pré-lista Black Friday de Arrepiar da Dial Fit.</p></section>
          <section><h2 className="text-lg font-extrabold">Quais dados são tratados e para quê</h2><p className="mt-2 text-sm leading-7 text-[#b7c0b9]">Tratamos seu nome e número de WhatsApp, o horário preferido para contato se você informar, a origem técnica do acesso e o registro da autorização. Usamos esses dados somente para receber seu pré-cadastro, apresentar informações da campanha e organizar o atendimento solicitado. O pré-cadastro não reserva matrícula nem obriga contratação.</p></section>
          <section><h2 className="text-lg font-extrabold">Compartilhamento e acesso</h2><p className="mt-2 text-sm leading-7 text-[#b7c0b9]">Os dados pessoais ficam disponíveis à equipe Dial Fit autorizada para atendimento. A infraestrutura técnica da aplicação e do banco de dados processa as informações para manter o serviço. A lista de interessados não é exibida publicamente, e não vendemos seus dados.</p></section>
          <section><h2 className="text-lg font-extrabold">Retenção e segurança</h2><p className="mt-2 text-sm leading-7 text-[#b7c0b9]">Mantemos cada cadastro por até 12 meses a partir do recebimento, salvo solicitação de exclusão anterior, obrigação legal ou necessidade de defesa de direitos. Uma rotina diária elimina os cadastros vencidos e o histórico associado. O acesso administrativo exige e-mail confirmado, senha e autorização individual; as tabelas são protegidas por políticas de acesso no banco.</p></section>
          <section><h2 className="text-lg font-extrabold">Seus direitos e como pedir exclusão</h2><p className="mt-2 text-sm leading-7 text-[#b7c0b9]">Você pode pedir acesso, correção, exclusão dos dados ou retirar sua autorização para novos contatos. Para localizar o cadastro, informe o nome e o WhatsApp utilizados. A retirada da autorização interrompe os contatos futuros da campanha. Obrigações legais ou registros mínimos de auditoria podem exigir a conservação de parte das informações pelo prazo aplicável.</p>
            {hasContact ? <div className="mt-4 flex flex-wrap gap-3">{privacyEmail && <a href={`mailto:${privacyEmail}?subject=${encodeURIComponent("Privacidade — Black Friday Dial Fit")}`} className="campaign-button inline-flex h-11 items-center justify-center bg-[#55e814] px-4 text-sm font-bold text-[#071006]">Solicitar por e-mail</a>}{privacyWhatsApp && <a href={`https://wa.me/${privacyWhatsApp}?text=${encodeURIComponent("Olá, quero solicitar a exclusão dos meus dados ou retirar minha autorização de contato da Black Friday Dial Fit.")}`} target="_blank" rel="noreferrer" className="campaign-button inline-flex h-11 items-center justify-center border border-white/15 bg-[#111813] px-4 text-sm font-bold text-white">Solicitar pelo WhatsApp</a>}</div> : <div role="status" className="mt-4 rounded-lg border border-[#f0c45c]/30 bg-[#f0c45c]/8 p-4 text-sm leading-6 text-[#f5d98d]">O canal de privacidade da campanha ainda precisa ser configurado pela Dial Fit. Antes da divulgação pública, informe um e-mail ou WhatsApp oficial para pedidos de exclusão e retirada de consentimento.</div>}
          </section>
          <p className="border-t border-white/10 pt-5 text-xs leading-6 text-[#77837a]">A autorização é registrada junto com a versão do aviso apresentado no formulário. Esta política se aplica somente à pré-lista Black Friday de Arrepiar 2026 e não altera os dados das campanhas anteriores.</p>
        </div>
      </article>
    </div>
  </main>;
}
