import type { Metadata } from "next";
import { ArrowLeft, FileCheck2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  CAMPAIGN_KICKER,
  CAMPAIGN_NAME,
  DIALFIT_LOGO,
  DRAW_DATE_LABEL,
  PRIZES,
  REGISTRATION_END_LABEL,
} from "@/config/campaign";

export const metadata: Metadata = {
  title: `Regulamento | ${CAMPAIGN_NAME}`,
  description: "Regulamento da campanha Agosto dos Pais Dial Fit.",
};

const sections = [
  {
    title: "1. Campanha e promotora",
    body: "A campanha Agosto dos Pais Dial Fit é promovida pela Dial Fit Academia e tem como finalidade celebrar o Agosto dos Pais entre seus alunos, conforme as condições deste regulamento.",
  },
  {
    title: "2. Quem pode participar",
    body: "Podem participar pessoas físicas com 18 anos ou mais que sejam pais e estejam com vínculo de aluno ativo na Dial Fit no período da campanha e na data da validação. A condição de pai é declarada pelo próprio participante no formulário.",
  },
  {
    title: "3. Período",
    body: `As inscrições serão recebidas até ${REGISTRATION_END_LABEL}. O sorteio está previsto para ${DRAW_DATE_LABEL}, no horário de Brasília.` ,
  },
  {
    title: "4. Como participar",
    body: "O participante deverá preencher seus próprios dados, acessar o perfil indicado da Dial Fit no Google Maps, confirmar a realização da avaliação, declarar que é pai e aluno ativo e aceitar este regulamento. Será aceita somente uma inscrição por CPF.",
  },
  {
    title: "5. Validação",
    body: "Toda inscrição começa com status Pendente. A equipe Dial Fit poderá conferir o vínculo ativo do aluno, a consistência dos dados, o aceite do regulamento e o cumprimento das etapas. Somente inscrições com status Validado participarão do sorteio.",
  },
  {
    title: "6. Prêmio",
    body: `Um único vencedor receberá um combo composto por: ${PRIZES.map((prize) => `1 ${prize.title} — ${prize.partner}`).join("; ")}. Os itens são pessoais, não convertíveis em dinheiro e serão entregues conforme orientação da Dial Fit e dos parceiros.` ,
  },
  {
    title: "7. Sorteio e resultado",
    body: "A apuração eletrônica escolherá aleatoriamente uma inscrição entre os participantes validados. O resultado será registrado no painel da campanha e poderá ser divulgado nos canais oficiais da Dial Fit.",
  },
  {
    title: "8. Contato e entrega",
    body: "O vencedor será contatado pelos dados informados. Caso os dados estejam incorretos, o vínculo não seja confirmado ou não haja resposta dentro do prazo informado pela Dial Fit, poderá ser realizada nova apuração entre os demais participantes validados.",
  },
  {
    title: "9. Desclassificação",
    body: "Serão desclassificadas inscrições duplicadas, fraudulentas, com dados falsos ou incompletos, realizadas por pessoa que não seja pai ou não seja aluno ativo, ou que descumpram este regulamento.",
  },
  {
    title: "10. Dados pessoais",
    body: "Nome, CPF, telefone e e-mail serão utilizados para controlar a inscrição, validar a condição de aluno, realizar o sorteio e contatar o vencedor. O acesso aos dados completos será restrito à administração da campanha, observadas as regras aplicáveis de proteção de dados.",
  },
  {
    title: "11. Disposições finais",
    body: "A participação implica ciência integral deste regulamento. Situações não previstas serão analisadas pela Dial Fit, respeitando a legislação aplicável. Eventuais informações complementares e autorizações aplicáveis poderão ser incorporadas à divulgação oficial da campanha.",
  },
];

export default function RulesPage() {
  return (
    <main className="campaign-bg relative min-h-screen px-5 py-10 text-white sm:px-7">
      <div className="campaign-grid pointer-events-none fixed inset-0" />
      <div className="relative mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#a8b2aa] hover:text-white"><ArrowLeft size={18} /> Voltar</Link>
          <Image src={DIALFIT_LOGO} alt="Dial Fit" width={2048} height={696} style={{ height: "auto" }} className="dialfit-logo-clean w-[132px]" />
        </header>

        <article className="campaign-frame mt-8 overflow-hidden">
          <div className="border-b border-white/10 bg-[#55e814] p-6 text-[#071006] sm:p-9">
            <FileCheck2 size={34} />
            <p className="mt-5 text-xs font-black uppercase tracking-[0.18em]">Termos de participação</p>
            <h1 className="mt-2 text-4xl font-black sm:text-5xl">Regulamento oficial</h1>
            <p className="mt-3 font-semibold">{CAMPAIGN_NAME}</p>
            <p className="mt-1 text-sm font-black uppercase tracking-[0.14em]">{CAMPAIGN_KICKER}</p>
          </div>
          <div className="grid gap-7 p-6 sm:p-9">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-extrabold text-white">{section.title}</h2>
                <p className="mt-2 text-sm leading-7 text-[#b7c0b9]">{section.body}</p>
              </section>
            ))}
            <p className="border-t border-white/10 pt-6 text-xs font-semibold uppercase tracking-[0.13em] text-[#6f7b71]">Versão publicada em 12 de agosto de 2026.</p>
          </div>
        </article>
      </div>
    </main>
  );
}
