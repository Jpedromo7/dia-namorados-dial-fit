"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity, ArrowRight, CalendarClock, Check,
  ChevronLeft, ChevronRight, CircleAlert, Clock3, Download, ExternalLink,
  Filter, LayoutDashboard, ListFilter, LogOut, MessageCircle, Plus, Search,
  ShieldCheck, Users, X,
} from "lucide-react";
import {
  BLACK_FRIDAY_ROLE_LABELS, BLACK_FRIDAY_STATUSES, BLACK_FRIDAY_STATUS_LABELS,
  formatBrazilianPhone, toWhatsAppNumber, type BlackFridayActivity,
  type BlackFridayLead, type BlackFridayReport, type BlackFridayRole,
  type BlackFridayStaff, type BlackFridayStatus,
} from "@/lib/black-friday";

type View = "dashboard" | "leads" | "reports" | "team";
type Notice = { tone: "success" | "error"; text: string } | null;

const panelNavigation = [
  { href: "/admin/black-friday", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/black-friday/leads", label: "Interessados", icon: Users },
  { href: "/admin/black-friday/relatorios", label: "Relatórios", icon: Activity },
  { href: "/admin/black-friday/equipe", label: "Equipe", icon: ShieldCheck, admin: true },
];

const statusClasses: Record<BlackFridayStatus, string> = {
  novo: "bg-blue-50 text-blue-700 ring-blue-200",
  em_contato: "bg-violet-50 text-violet-700 ring-violet-200",
  aguardando_resposta: "bg-amber-50 text-amber-800 ring-amber-200",
  matriculado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  nao_convertido: "bg-slate-100 text-slate-600 ring-slate-200",
};

function formatDate(value?: string | null, withTime = true) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Fortaleza",
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  }).format(new Date(value));
}

function formatContactTime(value: BlackFridayLead["preferred_contact_time"]) {
  if (!value) return "Não informado";
  return ({ morning: "Manhã", afternoon: "Tarde", evening: "Noite", anytime: "Qualquer horário" } as const)[value];
}

function StatusPill({ status }: { status: BlackFridayStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusClasses[status]}`}>{BLACK_FRIDAY_STATUS_LABELS[status]}</span>;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers }, cache: "no-store" });
  const data = await response.json().catch(() => ({})) as T & { message?: string };
  if (response.status === 401) { window.location.replace("/admin/login"); throw new Error("Sua sessão expirou. Entre novamente."); }
  if (!response.ok) throw new Error(data.message ?? "Não foi possível concluir esta ação.");
  return data;
}

function PanelFrame({ children, view, staff, isAdmin, notice, setNotice }: {
  children: ReactNode; view: View; staff: Pick<BlackFridayStaff, "email" | "role">;
  isAdmin: boolean; notice: Notice; setNotice: (notice: Notice) => void;
}) {
  return <main className="min-h-screen bg-[#f4f6f3] text-[#17221b]">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[250px] flex-col border-r border-[#e2e8e3] bg-white lg:flex">
      <Link href="/admin/black-friday" className="flex h-[82px] items-center gap-3 border-b border-[#edf0ed] px-6">
        <span className="grid size-10 place-items-center rounded-xl bg-[#142419] text-[#62e92b]"><Activity size={21} /></span>
        <span><strong className="block text-sm font-black tracking-wide">DIAL FIT</strong><small className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.16em] text-[#849087]">Black Friday 2026</small></span>
      </Link>
      <nav className="grid gap-1 px-3 py-5">
        {panelNavigation.filter((item) => !item.admin || isAdmin).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${view === (href.endsWith("leads") ? "leads" : href.endsWith("relatorios") ? "reports" : href.endsWith("equipe") ? "team" : "dashboard") ? "bg-[#edf8e9] text-[#287914]" : "text-[#68756b] hover:bg-[#f5f7f4] hover:text-[#17221b]"}`}><Icon size={18} />{label}</Link>)}
      </nav>
      <div className="mt-auto border-t border-[#edf0ed] p-4">
        <div className="mb-3 rounded-lg bg-[#f6f8f5] p-3"><p className="truncate text-sm font-bold">{staff.email}</p><p className="mt-1 text-xs text-[#77837a]">{BLACK_FRIDAY_ROLE_LABELS[staff.role]}</p></div>
        <form action="/auth/sign-out" method="post"><button className="flex h-10 w-full items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[#68756b] hover:bg-[#f5f7f4]"><LogOut size={16} /> Sair</button></form>
      </div>
    </aside>
    <div className="lg:pl-[250px]">
      <header className="sticky top-0 z-10 flex min-h-[66px] items-center justify-between border-b border-[#e2e8e3] bg-white/95 px-4 backdrop-blur sm:px-7">
        <div className="flex items-center gap-3"><Link className="grid size-9 place-items-center rounded-lg text-[#59665d] hover:bg-[#f3f6f2] lg:hidden" href="/admin/black-friday"><Activity size={18} /></Link><span className="text-sm font-bold text-[#344139]">{panelNavigation.find((item) => item.href === (view === "leads" ? "/admin/black-friday/leads" : view === "reports" ? "/admin/black-friday/relatorios" : view === "team" ? "/admin/black-friday/equipe" : "/admin/black-friday"))?.label}</span></div>
        <div className="hidden items-center gap-2 text-xs font-medium text-[#78847b] sm:flex"><span className="size-2 rounded-full bg-[#48bf2b]" /> Ambiente protegido · Fortaleza</div>
        <span className="max-w-[135px] truncate text-right text-[10px] font-semibold text-[#68756b] sm:hidden">{staff.email}</span>
        <form action="/auth/sign-out" method="post" className="lg:hidden"><button aria-label="Sair" className="grid size-9 place-items-center rounded-lg text-[#66736a]"><LogOut size={17} /></button></form>
      </header>
      <nav className="flex gap-1 overflow-x-auto border-b border-[#e2e8e3] bg-white px-3 py-2 lg:hidden">
        {panelNavigation.filter((item) => !item.admin || isAdmin).map(({ href, label }) => <Link key={href} href={href} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${view === (href.endsWith("leads") ? "leads" : href.endsWith("relatorios") ? "reports" : href.endsWith("equipe") ? "team" : "dashboard") ? "bg-[#edf8e9] text-[#287914]" : "text-[#68756b]"}`}>{label}</Link>)}
      </nav>
      <div className="flex min-h-[calc(100vh-66px)] flex-col">
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
        <footer className="border-t border-[#e2e8e3] bg-white px-4 py-4 text-center text-xs text-[#88938a] sm:px-7">Dial Fit · Operação Black Friday 2026</footer>
      </div>
    </div>
    {notice && <div role="status" className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${notice.tone === "success" ? "bg-[#18331c] text-white" : "bg-[#4c1e1e] text-white"}`}><span className="mt-0.5">{notice.tone === "success" ? <Check size={17} /> : <CircleAlert size={17} />}</span><span className="flex-1">{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={16} /></button></div>}
  </main>;
}

function MetricCard({ label, value, note, accent = "#267f18" }: { label: string; value: string | number; note?: string; accent?: string }) {
  return <div className="rounded-xl border border-[#e3e9e3] bg-white p-4 shadow-[0_2px_8px_rgba(20,35,22,.03)] sm:p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-[.08em] text-[#77837a]">{label}</p><span className="size-2 rounded-full" style={{ background: accent }} /></div><p className="mt-3 text-3xl font-black tracking-tight text-[#17221b]">{value}</p>{note && <p className="mt-1 text-xs text-[#89948b]">{note}</p>}</div>;
}

function LeadTable({ leads, busy, onSelect, onRefresh, compact = false }: { leads: BlackFridayLead[]; busy: boolean; onSelect: (lead: BlackFridayLead) => void; onRefresh?: () => void; compact?: boolean }) {
  if (busy && !leads.length) return <div className="p-8 text-center text-sm text-[#79857c]">Carregando interessados…</div>;
  if (!leads.length) return <div className="grid min-h-40 place-items-center p-6 text-center"><div><Users className="mx-auto text-[#9aa59b]" size={23} /><p className="mt-2 text-sm font-semibold text-[#546158]">Ainda não há cadastros neste período.</p><p className="mt-1 text-xs text-[#89948b]">Os novos pré-cadastros aparecerão aqui.</p>{onRefresh && <button onClick={onRefresh} className="mt-3 text-xs font-bold text-[#287914]">Atualizar</button>}</div></div>;
  return <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-[#f8faf7] text-[10px] font-bold uppercase tracking-[.1em] text-[#839087]"><tr>{["Interessado", "WhatsApp", "Cadastro", "Origem", "Status", "Responsável", ...(!compact ? ["Última interação"] : [])].map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr></thead><tbody className="divide-y divide-[#edf0ed]">{leads.map((lead) => <tr key={lead.id} onClick={() => onSelect(lead)} className="cursor-pointer transition hover:bg-[#fbfcfa]"><td className="px-4 py-3.5"><span className="font-bold text-[#243128]">{lead.name}</span></td><td className="px-4 py-3.5 text-[#536057]">{formatBrazilianPhone(lead.phone)}</td><td className="px-4 py-3.5 text-[#657168]">{formatDate(lead.created_at)}</td><td className="px-4 py-3.5 text-[#657168]">{lead.source}</td><td className="px-4 py-3.5"><StatusPill status={lead.status} /></td><td className="px-4 py-3.5 text-[#657168]">{lead.assignee?.email?.split("@")[0] ?? "Sem responsável"}</td>{!compact && <td className="px-4 py-3.5 text-[#7b867d]">{formatDate(lead.last_interaction_at)}</td>}</tr>)}</tbody></table></div>;
}

export function BlackFridayAdmin({ view, staff, isAdmin }: { view: View; staff: Pick<BlackFridayStaff, "id" | "email" | "role">; isAdmin: boolean }) {
  const [notice, setNotice] = useState<Notice>(null);
  const [dashboard, setDashboard] = useState<{ report: BlackFridayReport; recent: BlackFridayLead[]; followUps: BlackFridayLead[] } | null>(null);
  const [leads, setLeads] = useState<BlackFridayLead[]>([]);
  const [team, setTeam] = useState<BlackFridayStaff[]>([]);
  const [report, setReport] = useState<BlackFridayReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<BlackFridayLead | null>(null);
  const [detail, setDetail] = useState<{ lead: BlackFridayLead; activity: BlackFridayActivity[] } | null>(null);
  const [filters, setFilters] = useState({ search: "", status: "", assignedTo: "", source: "", from: "", to: "", page: 1 });
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(30);
  const [reportDates, setReportDates] = useState({ from: "", to: "" });
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [message, setMessage] = useState("");
  const [reassignmentTarget, setReassignmentTarget] = useState("");
  const [teamEmail, setTeamEmail] = useState("");
  const [teamRole, setTeamRole] = useState<BlackFridayRole>("receptionist");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries({ ...filters, pageSize }).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
    return params.toString();
  }, [filters, pageSize]);

  const loadLeads = useCallback(async () => {
    setBusy(true);
    try { const result = await api<{ leads: BlackFridayLead[]; total: number }>(`/api/admin/black-friday/leads?${queryString}`); setLeads(result.leads); setTotal(result.total); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Falha ao carregar interessados." }); }
    finally { setBusy(false); }
  }, [queryString]);

  const loadTeam = useCallback(async () => {
    try { const result = await api<{ staff: BlackFridayStaff[] }>("/api/admin/black-friday/staff"); setTeam(result.staff); }
    catch (error) { if (view === "team") setNotice({ tone: "error", text: error instanceof Error ? error.message : "Falha ao carregar equipe." }); }
  }, [view]);

  useEffect(() => {
    if (view === "dashboard") void api<typeof dashboard>("/api/admin/black-friday/dashboard").then(setDashboard).catch((error) => setNotice({ tone: "error", text: error instanceof Error ? error.message : "Falha ao carregar indicadores." }));
    if (view === "leads") window.setTimeout(() => void loadLeads(), 0);
    if (view === "reports") void api<BlackFridayReport>(`/api/admin/black-friday/reports?${new URLSearchParams(reportDates)}`).then(setReport).catch((error) => setNotice({ tone: "error", text: error instanceof Error ? error.message : "Falha ao carregar relatórios." }));
    if (view !== "reports") window.setTimeout(() => void loadTeam(), 0);
  }, [view, loadLeads, loadTeam, reportDates]);

  async function openLead(lead: BlackFridayLead) {
    setSelected(lead); setDetail(null); setNote(""); setFollowUp("");
    try { const result = await api<{ lead: BlackFridayLead; activity: BlackFridayActivity[] }>(`/api/admin/black-friday/leads/${lead.id}`); setDetail(result); setMessage(`Olá, ${result.lead.name}! Tudo bem? Aqui é da Academia Dial Fit. Vimos que você entrou na nossa pré-lista da Black Friday de Arrepiar! Estamos entrando em contato para apresentar nossa condição especial. Podemos conversar?`); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Falha ao abrir o cadastro." }); }
  }

  async function reloadDetail() { if (selected) { const result = await api<{ lead: BlackFridayLead; activity: BlackFridayActivity[] }>(`/api/admin/black-friday/leads/${selected.id}`); setDetail(result); setSelected(result.lead); } }

  async function takeLead(reassign = false, assignedTo?: string) {
    if (!selected) return;
    try { const result = await api<{ assigned: boolean; lead: BlackFridayLead }>(`/api/admin/black-friday/leads/${selected.id}/assign`, { method: "POST", body: JSON.stringify({ reassign, ...(assignedTo ? { assignedTo } : {}) }) }); setNotice({ tone: "success", text: reassign ? "Responsabilidade atualizada." : "Atendimento assumido." }); setSelected(result.lead); await reloadDetail(); if (view === "leads") await loadLeads(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível assumir o atendimento." }); await reloadDetail().catch(() => {}); }
  }

  async function updateStatus(status: BlackFridayStatus) {
    if (!selected) return;
    try { await api(`/api/admin/black-friday/leads/${selected.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); setNotice({ tone: "success", text: "Status atualizado." }); await reloadDetail(); if (view === "leads") await loadLeads(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível atualizar o status." }); }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected) return;
    try { await api(`/api/admin/black-friday/leads/${selected.id}/notes`, { method: "POST", body: JSON.stringify({ note, followUpAt: followUp ? new Date(`${followUp}:00-03:00`).toISOString() : null }) }); setNotice({ tone: "success", text: "Observação salva no histórico." }); setNote(""); setFollowUp(""); await reloadDetail(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível salvar." }); }
  }

  async function logContact() {
    if (!selected) return;
    try { await api(`/api/admin/black-friday/leads/${selected.id}/contact`, { method: "POST", body: JSON.stringify({ message }) }); setNotice({ tone: "success", text: "Contato registrado no histórico." }); await reloadDetail(); if (view === "leads") await loadLeads(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível registrar o contato." }); }
  }

  async function eraseLead() {
    if (!selected || !isAdmin) return;
    if (!confirm(`Excluir permanentemente o cadastro de ${selected.name} e o histórico associado?`)) return;
    try {
      await api(`/api/admin/black-friday/leads/${selected.id}`, { method: "DELETE" });
      setSelected(null); setDetail(null);
      setNotice({ tone: "success", text: "Cadastro e histórico excluídos." });
      if (view === "leads") await loadLeads();
      if (view === "dashboard") {
        const latest = await api<typeof dashboard>("/api/admin/black-friday/dashboard");
        setDashboard(latest);
      }
    } catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível excluir o cadastro." }); }
  }

  async function exportCsv() {
    try { const response = await fetch(`/api/admin/black-friday/reports/csv?${queryString}`); if (!response.ok) throw new Error("Não foi possível exportar os dados."); const blob = await response.blob(); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "black-friday-dial-fit.csv"; anchor.click(); URL.revokeObjectURL(url); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Falha na exportação." }); }
  }

  async function addStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await api("/api/admin/black-friday/staff", { method: "POST", body: JSON.stringify({ email: teamEmail, role: teamRole }) }); setTeamEmail(""); setNotice({ tone: "success", text: "Acesso autorizado. A pessoa poderá entrar com essa conta Google." }); await loadTeam(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível liberar o acesso." }); }
  }

  async function updateStaff(person: BlackFridayStaff, values: { role?: BlackFridayRole; is_active?: boolean }) {
    try { await api(`/api/admin/black-friday/staff/${person.id}`, { method: "PATCH", body: JSON.stringify(values) }); setNotice({ tone: "success", text: "Acesso atualizado." }); await loadTeam(); }
    catch (error) { setNotice({ tone: "error", text: error instanceof Error ? error.message : "Não foi possível atualizar o acesso." }); }
  }

  const metrics = dashboard?.report;
  const canOperateSelected = Boolean(detail && (isAdmin || detail.lead.assigned_to === staff.id));
  const conversionRate = metrics?.total ? `${((metrics.converted / metrics.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "0%";
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return <PanelFrame view={view} staff={staff} isAdmin={isAdmin} notice={notice} setNotice={setNotice}>
    {view === "dashboard" && <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#378524]">Operação comercial</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Bom dia, equipe.</h1><p className="mt-2 text-sm text-[#748077]">Acompanhe os cadastros e organize os próximos atendimentos.</p></div><Link href="/admin/black-friday/leads" className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#19301e] px-4 text-sm font-bold text-white hover:bg-[#25462c]">Ver interessados <ArrowRight size={16} /></Link></div>
      {!dashboard ? <div className="rounded-xl border border-[#e3e9e3] bg-white p-8 text-sm text-[#79857c]">Carregando dados reais da campanha…</div> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{[
          ["Total de interessados", metrics?.total ?? 0, "Pré-cadastros recebidos", "#34871e"],
          ["Novos contatos", metrics?.by_status?.find((item) => item.status === "novo")?.count ?? 0, "Ainda sem atendimento iniciado", "#3481cc"],
          ["Em atendimento", metrics?.by_status?.find((item) => item.status === "em_contato")?.count ?? 0, "Conversa iniciada", "#7451bd"],
          ["Aguardando resposta", metrics?.awaiting_response ?? 0, "Contatos enviados", "#d1951d"],
          ["Matriculados", metrics?.converted ?? 0, `Conversão sobre o total · ${conversionRate}`, "#23824e"],
          ["Não convertidos", metrics?.by_status?.find((item) => item.status === "nao_convertido")?.count ?? 0, "Atendimentos encerrados", "#738078"],
        ].map(([label, value, note, color]) => <MetricCard key={String(label)} label={String(label)} value={value as string | number} note={String(note)} accent={String(color)} />)}</div>
        <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <section className="overflow-hidden rounded-xl border border-[#e3e9e3] bg-white"><header className="flex items-center justify-between border-b border-[#edf0ed] px-5 py-4"><div><h2 className="font-extrabold">Cadastros recentes</h2><p className="mt-1 text-xs text-[#859087]">Últimos interessados recebidos</p></div><Link href="/admin/black-friday/leads" className="text-xs font-bold text-[#317b20]">Ver lista →</Link></header><LeadTable leads={dashboard.recent} busy={false} onSelect={openLead} compact /></section>
          <section className="overflow-hidden rounded-xl border border-[#e3e9e3] bg-white"><header className="border-b border-[#edf0ed] px-5 py-4"><h2 className="font-extrabold">Atendimentos pendentes</h2><p className="mt-1 text-xs text-[#859087]">Próximos retornos agendados</p></header>{dashboard.followUps.length ? <div className="divide-y divide-[#edf0ed]">{dashboard.followUps.map((lead) => <button onClick={() => openLead(lead)} key={lead.id} className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-[#fbfcfa]"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-[#fff5df] text-[#be8514]"><CalendarClock size={17} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{lead.name}</strong><small className="mt-1 block text-xs text-[#748077]">{lead.assignee?.email?.split("@")[0] ?? "Sem responsável"} · retorno {formatDate(lead.follow_up_at)}</small></span><StatusPill status={lead.status} /></button>)}</div> : <div className="grid min-h-40 place-items-center p-6 text-sm text-[#859087]">Nenhum retorno agendado.</div>}</section>
        </div>
      </>}
    </div>}

    {view === "leads" && <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#378524]">Captação e atendimento</p><h1 className="mt-2 text-3xl font-black tracking-tight">Interessados</h1><p className="mt-2 text-sm text-[#748077]">{total.toLocaleString("pt-BR")} cadastros · dados atualizados sem recarregar a página</p></div><button onClick={() => void loadLeads()} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg border border-[#dce4dc] bg-white px-3 text-sm font-semibold text-[#46544a]"><Activity size={16} /> Atualizar</button></div>
      <section className="rounded-xl border border-[#e3e9e3] bg-white p-4 shadow-[0_2px_8px_rgba(20,35,22,.03)]"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#758178]"><Filter size={15} /> Buscar e filtrar</div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><label className="relative sm:col-span-2"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b978e]" /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))} placeholder="Nome ou telefone" className="h-10 w-full rounded-lg border border-[#dce4dc] bg-[#fbfcfa] pl-9 pr-3 text-sm outline-none focus:border-[#65aa51]" /></label><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))} className="h-10 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-3 text-sm"><option value="">Todos os status</option>{BLACK_FRIDAY_STATUSES.map((status) => <option value={status} key={status}>{BLACK_FRIDAY_STATUS_LABELS[status]}</option>)}</select><select value={filters.assignedTo} onChange={(event) => setFilters((current) => ({ ...current, assignedTo: event.target.value, page: 1 }))} className="h-10 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-3 text-sm"><option value="">Todos responsáveis</option><option value="unassigned">Sem responsável</option>{team.map((person) => <option key={person.id} value={person.id}>{person.email.split("@")[0]}</option>)}</select><select value={filters.source} onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value, page: 1 }))} className="h-10 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-3 text-sm"><option value="">Todas as origens</option>{["Instagram Stories", "Link da bio", "WhatsApp", "QR Code", "Divulgação direta", "Outros canais", "Acesso direto"].map((source) => <option key={source}>{source}</option>)}</select><div className="flex gap-2"><input aria-label="Data inicial" type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value, page: 1 }))} className="h-10 min-w-0 w-1/2 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-2 text-xs" /><input aria-label="Data final" type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value, page: 1 }))} className="h-10 min-w-0 w-1/2 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-2 text-xs" /></div></div></section>
      <section className="overflow-hidden rounded-xl border border-[#e3e9e3] bg-white shadow-[0_2px_8px_rgba(20,35,22,.03)]"><div className="flex items-center justify-between border-b border-[#edf0ed] px-4 py-3.5"><div className="flex items-center gap-2 text-sm font-extrabold"><ListFilter size={17} className="text-[#468d32]" /> Lista de cadastros</div><span className="text-xs text-[#879188]">{busy ? "Atualizando…" : `${total} registros`}</span></div><LeadTable leads={leads} busy={busy} onSelect={openLead} onRefresh={() => void loadLeads()} /><div className="flex items-center justify-between border-t border-[#edf0ed] px-4 py-3"><span className="text-xs text-[#7d887f">Página {filters.page} de {pages}</span><div className="flex gap-2"><button aria-label="Página anterior" disabled={filters.page <= 1 || busy} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="grid size-9 place-items-center rounded-lg border border-[#dce4dc] disabled:opacity-40"><ChevronLeft size={17} /></button><button aria-label="Próxima página" disabled={filters.page >= pages || busy} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="grid size-9 place-items-center rounded-lg border border-[#dce4dc] disabled:opacity-40"><ChevronRight size={17} /></button></div></div></section>
    </div>}

    {view === "reports" && <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#378524]">Desempenho da campanha</p><h1 className="mt-2 text-3xl font-black tracking-tight">Relatórios</h1><p className="mt-2 text-sm text-[#748077]">Indicadores calculados a partir dos cadastros reais no banco.</p></div><button onClick={() => void exportCsv()} className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#19301e] px-4 text-sm font-bold text-white"><Download size={16} /> Exportar CSV</button></div>
      <section className="flex flex-wrap items-end gap-3 rounded-xl border border-[#e3e9e3] bg-white p-4"><div className="mr-auto flex items-center gap-2 text-sm font-bold"><CalendarClock size={17} className="text-[#448d32]" /> Período do relatório</div><label className="grid gap-1 text-[10px] font-bold uppercase text-[#7d887f]">De<input type="date" value={reportDates.from} onChange={(event) => setReportDates((current) => ({ ...current, from: event.target.value }))} className="h-10 rounded-lg border border-[#dce4dc] px-3 text-sm font-normal text-[#26352a]" /></label><label className="grid gap-1 text-[10px] font-bold uppercase text-[#7d887f]">Até<input type="date" value={reportDates.to} onChange={(event) => setReportDates((current) => ({ ...current, to: event.target.value }))} className="h-10 rounded-lg border border-[#dce4dc] px-3 text-sm font-normal text-[#26352a]" /></label></section>
      {!report ? <section className="rounded-xl border border-[#e3e9e3] bg-white p-8 text-sm text-[#79857c]">Carregando relatório…</section> : <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Total de cadastros" value={report.total} /><MetricCard label="Atendimentos iniciados" value={report.contacted} accent="#7553ba" /><MetricCard label="Aguardando resposta" value={report.awaiting_response} accent="#d1951d" /><MetricCard label="Matrículas" value={report.converted} note={`${report.total ? ((report.converted / report.total) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) : "0"}% de conversão`} accent="#23824e" /></div>
        <div className="grid gap-5 xl:grid-cols-2"><ReportBars title="Inscritos por dia" rows={(report.daily ?? []).map((item) => ({ label: formatDate(`${item.date}T12:00:00`, false), value: item.count }))} empty="Nenhum cadastro no período." /><ReportBars title="Cadastros por origem" rows={(report.by_source ?? []).map((item) => ({ label: item.source, value: item.count }))} empty="Nenhuma origem registrada." /><ReportBars title="Desempenho por recepcionista" rows={(report.by_staff ?? []).map((item) => ({ label: item.staff, value: item.count }))} empty="Ainda sem atendimentos atribuídos." /><section className="rounded-xl border border-[#e3e9e3] bg-white p-5"><h2 className="font-extrabold">Tempo médio até o primeiro atendimento</h2><p className="mt-1 text-xs text-[#859087]">Considera cadastros com contato registrado.</p><p className="mt-5 text-3xl font-black">{report.average_first_contact_seconds == null ? "Sem dados suficientes" : report.average_first_contact_seconds < 3600 ? `${Math.round(report.average_first_contact_seconds / 60)} min` : `${(report.average_first_contact_seconds / 3600).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} h`}</p><p className="mt-1 text-xs text-[#859087]">Média entre cadastro e primeiro contato.</p></section></div>
      </>}
    </div>}

    {view === "team" && <div className="grid gap-5">
      <div><p className="text-xs font-black uppercase tracking-[.16em] text-[#378524]">Acesso seguro</p><h1 className="mt-2 text-3xl font-black tracking-tight">Equipe autorizada</h1><p className="mt-2 text-sm text-[#748077]">Libere o e-mail Google de cada pessoa. Só contas ativas cadastradas aqui acessam os dados.</p></div>
      <form onSubmit={addStaff} className="grid gap-3 rounded-xl border border-[#e3e9e3] bg-white p-4 sm:grid-cols-[1fr_200px_auto] sm:items-end"><label className="grid gap-1.5 text-xs font-bold text-[#67746a]">E-mail da conta Google<input type="email" required maxLength={254} value={teamEmail} onChange={(event) => setTeamEmail(event.target.value)} placeholder="nome@empresa.com" className="h-11 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-3 text-sm font-normal text-[#243128] outline-none focus:border-[#65aa51]" /></label><label className="grid gap-1.5 text-xs font-bold text-[#67746a]">Perfil<select value={teamRole} onChange={(event) => setTeamRole(event.target.value as BlackFridayRole)} className="h-11 rounded-lg border border-[#dce4dc] bg-[#fbfcfa] px-3 text-sm font-normal text-[#243128]"><option value="receptionist">Recepcionista</option><option value="administrator">Administrador</option></select></label><button className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#19301e] px-4 text-sm font-bold text-white"><Plus size={17} /> Autorizar acesso</button></form>
      <section className="overflow-hidden rounded-xl border border-[#e3e9e3] bg-white"><header className="border-b border-[#edf0ed] px-5 py-4"><h2 className="font-extrabold">Contas autorizadas</h2><p className="mt-1 text-xs text-[#859087]">A autorização é verificada no servidor a cada solicitação.</p></header>{!team.length ? <div className="p-8 text-center text-sm text-[#7c887f]">Nenhuma conta cadastrada.</div> : <div className="divide-y divide-[#edf0ed]">{team.map((person) => <div key={person.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_200px_140px] sm:items-center"><div className="min-w-0"><p className="truncate text-sm font-bold">{person.email}</p><p className={`mt-1 text-xs font-semibold ${person.is_active ? "text-[#278347]" : "text-[#a14b4b]"}`}>{person.is_active ? "Acesso ativo" : "Acesso suspenso"}</p></div><select aria-label={`Perfil de ${person.email}`} disabled={!person.is_active || (person.role === "administrator" && team.filter((item) => item.is_active && item.role === "administrator").length === 1)} value={person.role} onChange={(event) => void updateStaff(person, { role: event.target.value as BlackFridayRole })} className="h-10 rounded-lg border border-[#dce4dc] bg-white px-3 text-sm disabled:opacity-50"><option value="administrator">Administrador</option><option value="receptionist">Recepcionista</option></select><button disabled={person.email === staff.email && person.role === "administrator"} onClick={() => void updateStaff(person, { is_active: !person.is_active })} className={`h-10 rounded-lg px-3 text-xs font-bold disabled:opacity-40 ${person.is_active ? "border border-[#f0d6d6] bg-[#fff8f8] text-[#a54444]" : "border border-[#cfe6cc] bg-[#f5fbf3] text-[#397c2c]"}`}>{person.is_active ? "Suspender" : "Reativar"}</button></div>)}</div>}</section>
    </div>}

    {selected && <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#101711]/40 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setDetail(null); } }}><section role="dialog" aria-modal="true" aria-label={`Cadastro de ${selected.name}`} className="max-h-[94dvh] w-full max-w-4xl overflow-y-auto rounded-t-2xl bg-[#f8faf7] shadow-2xl sm:rounded-2xl"><header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#e4eae4] bg-white px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#378524]">Detalhes do interessado</p><h2 className="mt-1 text-xl font-black">{selected.name}</h2></div><button onClick={() => { setSelected(null); setDetail(null); }} aria-label="Fechar cadastro" className="grid size-9 place-items-center rounded-lg border border-[#e4eae4] bg-white text-[#566259]"><X size={18} /></button></header>
      {!detail ? <div className="p-10 text-center text-sm text-[#78847b]">Carregando cadastro e histórico…</div> : <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_1.15fr]">
        <div className="grid content-start gap-4"><section className="rounded-xl border border-[#e3e9e3] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><StatusPill status={detail.lead.status} /><span className="text-xs text-[#879188]">Recebido {formatDate(detail.lead.created_at)}</span></div><div className="mt-4 grid gap-3 text-sm"><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#89948b]">WhatsApp</p><p className="mt-1 font-bold">{formatBrazilianPhone(detail.lead.phone)}</p></div><div className="grid grid-cols-2 gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#89948b]">Horário preferido</p><p className="mt-1">{formatContactTime(detail.lead.preferred_contact_time)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#89948b]">Origem</p><p className="mt-1">{detail.lead.source}</p></div></div><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#89948b]">Responsável</p><p className="mt-1">{detail.lead.assignee?.email ?? "Sem responsável"}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#89948b]">Próximo retorno</p><p className="mt-1">{formatDate(detail.lead.follow_up_at)}</p></div></div>
          {detail.lead.assigned_to ? <div className="mt-4">{isAdmin && <div className="flex gap-2"><select aria-label="Escolher responsável" value={reassignmentTarget} onChange={(event) => setReassignmentTarget(event.target.value)} className="h-10 min-w-0 flex-1 rounded-lg border border-[#dce4dc] bg-white px-3 text-xs"><option value="">Escolha novo responsável</option>{team.filter((person) => person.is_active).map((person) => <option value={person.id} key={person.id}>{person.email}</option>)}</select><button disabled={!reassignmentTarget} onClick={() => { if (confirm("Confirmar a reatribuição deste atendimento?")) void takeLead(true, reassignmentTarget); }} className="h-10 rounded-lg border border-[#dce4dc] px-3 text-xs font-bold disabled:opacity-40">Reatribuir</button></div>}</div> : <button onClick={() => void takeLead()} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#19301e] text-sm font-bold text-white"><Check size={16} /> Assumir atendimento</button>}
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]"><select aria-label="Atualizar status" disabled={!canOperateSelected} value={detail.lead.status} onChange={(event) => void updateStatus(event.target.value as BlackFridayStatus)} className="h-10 rounded-lg border border-[#dce4dc] bg-white px-3 text-sm disabled:opacity-60">{BLACK_FRIDAY_STATUSES.map((status) => <option key={status} value={status}>{BLACK_FRIDAY_STATUS_LABELS[status]}</option>)}</select><a onClick={(event) => { if (!canOperateSelected || !message.trim()) { event.preventDefault(); setNotice({ tone: "error", text: canOperateSelected ? "Escreva uma mensagem antes de abrir o WhatsApp." : "Este atendimento está atribuído a outra pessoa." }); } }} href={canOperateSelected && message.trim() ? `https://wa.me/${toWhatsAppNumber(detail.lead.phone)}?text=${encodeURIComponent(message.trim())}` : undefined} target="_blank" rel="noreferrer" className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold ${canOperateSelected && message.trim() ? "bg-[#20b85a] text-white" : "cursor-not-allowed bg-[#a8b2aa] text-white"}`}><MessageCircle size={16} /> Abrir WhatsApp <ExternalLink size={14} /></a></div>
          {!canOperateSelected && <p className="mt-3 rounded-lg bg-[#fff6e3] p-3 text-xs leading-5 text-[#896515]">Este atendimento está com {detail.lead.assignee?.email ?? "outra pessoa"}. Peça a um administrador para reatribuir.</p>}
        </section></div>
        <section className="rounded-xl border border-[#e3e9e3] bg-white p-4"><h3 className="text-sm font-extrabold">Mensagem inicial</h3><textarea disabled={!canOperateSelected} value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={2000} className="mt-3 w-full resize-y rounded-lg border border-[#dce4dc] bg-[#fbfcfa] p-3 text-sm leading-6 outline-none focus:border-[#65aa51] disabled:opacity-60" /><p className="mt-2 text-xs text-[#879188]">O WhatsApp abre com o texto preenchido. Envio manual pela equipe.</p><button disabled={!canOperateSelected} onClick={() => void logContact()} className="mt-3 h-10 w-full rounded-lg border border-[#dce4dc] bg-white text-xs font-bold text-[#344139] disabled:opacity-50">Registrar contato enviado</button></section>
        <section className="rounded-xl border border-[#e3e9e3] bg-white p-4"><h3 className="text-sm font-extrabold">Adicionar observação</h3><form onSubmit={saveNote} className="mt-3 grid gap-3"><textarea disabled={!canOperateSelected} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2000} required placeholder="Registre o contexto útil para o próximo atendimento…" className="w-full rounded-lg border border-[#dce4dc] bg-[#fbfcfa] p-3 text-sm outline-none focus:border-[#65aa51] disabled:opacity-60" /><label className="grid gap-1 text-xs font-bold text-[#78847b]">Agendar retorno <input disabled={!canOperateSelected} type="datetime-local" value={followUp} onChange={(event) => setFollowUp(event.target.value)} className="h-10 rounded-lg border border-[#dce4dc] px-3 text-sm font-normal text-[#26352a] disabled:opacity-60" /></label><button disabled={!canOperateSelected} className="h-10 rounded-lg bg-[#edf8e9] text-sm font-bold text-[#287914] disabled:opacity-50">Salvar no histórico</button></form></section>
        <section className="rounded-xl border border-[#e3e9e3] bg-white p-4"><h3 className="flex items-center gap-2 text-sm font-extrabold"><Clock3 size={16} className="text-[#468d32]" /> Histórico de atendimento</h3>{detail.activity.length ? <ol className="mt-4 grid gap-3">{detail.activity.map((entry) => <li key={entry.id} className="border-l-2 border-[#d9ead4] pl-3"><p className="text-xs font-bold text-[#344139]">{entry.body}</p><p className="mt-1 text-[10px] text-[#879188]">{entry.actor?.email ?? "Equipe"} · {formatDate(entry.created_at)}</p></li>)}</ol> : <p className="mt-3 text-xs text-[#879188]">Nenhuma interação registrada ainda.</p>}</section>
        {isAdmin && <button onClick={() => void eraseLead()} className="rounded-xl border border-[#efd4d4] bg-white px-4 py-3 text-left text-xs font-bold text-[#a54444] hover:bg-[#fff8f8]">Excluir cadastro e histórico · atendimento de solicitação de privacidade</button>}
      </div>}
    </section></div>}
  </PanelFrame>;
}

function ReportBars({ title, rows, empty }: { title: string; rows: Array<{ label: string; value: number }>; empty: string }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return <section className="rounded-xl border border-[#e3e9e3] bg-white p-5"><h2 className="font-extrabold">{title}</h2>{rows.length ? <div className="mt-5 grid gap-3">{rows.map((row) => <div key={row.label} className="grid grid-cols-[minmax(96px,150px)_1fr_42px] items-center gap-3"><span className="truncate text-xs text-[#657168]" title={row.label}>{row.label}</span><div className="h-2 overflow-hidden rounded-full bg-[#edf1eb]"><div className="h-full rounded-full bg-[#55bd39]" style={{ width: `${Math.max(4, row.value / max * 100)}%` }} /></div><strong className="text-right text-xs">{row.value}</strong></div>)}</div> : <p className="py-10 text-center text-sm text-[#879188]">{empty}</p>}</section>;
}
