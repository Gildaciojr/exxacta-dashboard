// src\app\(dashboard)\dashboard\page.tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { EmpresaModal } from "@/components/empresa-modal";
import { LeadModal } from "@/components/lead-modal";
import { Lead, LeadStatus } from "@/types/lead";
import { InteracaoModal } from "@/components/interacao-modal";
import { InteracaoCreateModal } from "@/components/interacao-create-modal";
import { useRealtimeLeadsInteracoes } from "@/hooks/useRealtimeLeadsInteracoes";
import { EmailTemplateModal } from "@/components/EmailTemplateModal";
import { AddEntityModal } from "@/components/add-entity-modal";
import { LogoutButton } from "@/components/LogoutButton";
import { HasdataImportCard } from "@/components/hasdata-import-card";
import { ApifyImportCard } from "@/components/apify-import-card";
import type { Empresa } from "@/types/empresa";

import { AnimatePresence, motion } from "framer-motion";

import {
  Building2,
  Users,
  MessagesSquare,
  Mail,
  Plus,
  Filter,
  Search,
  ChevronLeft,
  Globe,
  Linkedin,
  CalendarClock,
  BadgeCheck,
  BadgeAlert,
  BadgeHelp,
  ArrowUpRight,
  Flame,
} from "lucide-react";

/* ===================== TYPES ===================== */

type Interacao = {
  id: string;
  lead_id: string;
  status: string;
  observacao: string | null;
  canal: string | null;
  criado_em: string;

  lead?: {
    nome: string;
  } | null;
};

/**
 * Tipos mínimos para eventos realtime
 */
type RealtimeLeadRow = Partial<Lead> & { id: string };
type RealtimeInteracaoRow = Partial<Interacao> & {
  id: string;
  lead_id: string;
  status: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRealtimeLeadRow(value: unknown): value is RealtimeLeadRow {
  return isObject(value) && typeof (value as { id?: unknown }).id === "string";
}

function isRealtimeInteracaoRow(value: unknown): value is RealtimeInteracaoRow {
  return (
    isObject(value) &&
    typeof (value as { id?: unknown }).id === "string" &&
    typeof (value as { lead_id?: unknown }).lead_id === "string" &&
    typeof (value as { status?: unknown }).status === "string"
  );
}

/* ===================== PIPELINE CONFIG (STATUS DO LEAD) ===================== */
/**
 * ✅ IMPORTANTE
 * - Lead.status é domínio e no seu banco é enum status_interacao
 * - Pipeline é apenas visual/UX, mas usamos as chaves reais do enum
 *
 * ✅ NOVO: "aquecimento" entra entre email_enviado e contatado (Em contato)
 */
const PIPELINE_STATUSES = [
  { key: "novo", label: "Novo" },

  // intermediários
  { key: "email_enviado", label: "Contato realizado" },

  // ✅ NOVO (NÃO ATIVA N8N)
  { key: "aquecimento", label: "Aquecimento" },

  // ✅ ÚNICO QUE ATIVA N8N (regra ficará no backend /api/status)
  { key: "contatado", label: "Em contato" },

  { key: "interessado", label: "Interessado" },
  { key: "qualificado", label: "Qualificado" },

  // temperaturas / finais
  { key: "frio", label: "Frio" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
] as const;

type PipelineStatusKey = LeadStatus;

function isPipelineStatusKey(value: string): value is PipelineStatusKey {
  return (
    PIPELINE_STATUSES as ReadonlyArray<{ key: LeadStatus; label: string }>
  ).some((s) => s.key === value);
}

function normalizeStatus(
  value: LeadStatus | string | null | undefined
): LeadStatus {
  const v = (value || "").trim().toLowerCase();

  const map: Record<string, LeadStatus> = {
    email_enviado: "email_enviado",
    aquecimento: "aquecimento",
    follow_up: "contatado",
    respondeu: "interessado",
    negociacao: "qualificado",
  };

  if (v in map) return map[v];

  if (
    [
      "novo",
      "email_enviado",
      "aquecimento",
      "contatado",
      "follow_up",
      "respondeu",
      "interessado",
      "negociacao",
      "qualificado",
      "frio",
      "fechado",
      "perdido",
    ].includes(v)
  ) {
    return v as LeadStatus;
  }

  return "novo";
}

function statusLabel(status: string) {
  const found = PIPELINE_STATUSES.find((s) => s.key === status);
  return found?.label ?? status;
}

// 🎨 Cores por status
const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700 border-blue-300",
  email_enviado: "bg-sky-100 text-sky-700 border-sky-300",

  // ✅ NOVO
  aquecimento: "bg-amber-100 text-amber-800 border-amber-300",

  contatado: "bg-indigo-100 text-indigo-700 border-indigo-300",
  interessado: "bg-purple-100 text-purple-700 border-purple-300",
  qualificado: "bg-green-100 text-green-700 border-green-300",
  frio: "bg-gray-200 text-gray-700 border-gray-400",
  fechado: "bg-emerald-200 text-emerald-700 border-emerald-500",
  perdido: "bg-red-200 text-red-700 border-red-500",
};

function canalLabel(canal?: string | null) {
  const v = (canal || "").trim().toLowerCase();
  if (!v) return "Não informado";
  const map: Record<string, string> = {
    linkedin: "LinkedIn",
    email: "E-mail",
    telefone: "Telefone",
    reuniao: "Reunião",
    automacao_n8n: "Automação (n8n)",
  };
  return map[v] ?? (canal as string);
}

function statusIconByKey(key: string) {
  const k = (key || "").trim().toLowerCase();

  // ✅ NOVO
  if (k === "aquecimento") return Flame;

  if (k === "fechado") return BadgeCheck;
  if (k === "perdido") return BadgeAlert;
  if (k === "frio") return BadgeHelp;
  return CalendarClock;
}

/* ===================== STATUS UPDATE (FRONT → BACKEND) ===================== */

async function updateLeadStatus(leadId: string, status: LeadStatus) {
  await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lead_id: leadId,
      status,
    }),
  });
}

function formatDateBR(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

function formatEmpresaTamanho(tamanho?: string | null) {
  const t = (tamanho || "").trim();
  if (!t) return "Não informado";
  return t.replaceAll("_ate_", " até ").replaceAll("_", " ");
}

/* ===================== PAGE ===================== */

export default function DashboardPage() {
  const [view, setView] = useState<"home" | "empresas" | "leads" | "interacoes">(
    "home"
  );

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [openAdd, setOpenAdd] = useState(false);

  // 🔎 filtros locais (apenas UI)
  const [searchLeads, setSearchLeads] = useState("");
  const [searchEmpresas, setSearchEmpresas] = useState("");
  const [searchInteracoes, setSearchInteracoes] = useState("");

  // refs para evitar duplicação com closures antigas no realtime
  const leadsIdsRef = useRef<Set<string>>(new Set());
  const interacoesIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    leadsIdsRef.current = new Set(leads.map((l) => l.id));
  }, [leads]);

  useEffect(() => {
    interacoesIdsRef.current = new Set(interacoes.map((i) => i.id));
  }, [interacoes]);

  // ===== EMPRESA MODAL =====
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(
    null
  );
  const [openEmpresaModal, setOpenEmpresaModal] = useState(false);

  // ===== LEAD MODAL =====
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [openLeadModal, setOpenLeadModal] = useState(false);

  // ===== INTERAÇÃO MODAL (EDITÁVEL) =====
  const [interacaoSelecionada, setInteracaoSelecionada] =
    useState<Interacao | null>(null);
  const [openInteracaoModal, setOpenInteracaoModal] = useState(false);

  // ===== EMAIL TEMPLATE MODAL =====
  const [openEmailModal, setOpenEmailModal] = useState(false);

  // ===== INTERAÇÃO MODAL (CRIAR) =====
  const [openNovaInteracaoModal, setOpenNovaInteracaoModal] = useState(false);

  // ===== PIPELINE: FILTRO POR STATUS DO LEAD =====
  const [pipelineStatus, setPipelineStatus] = useState<string>("todos");

  async function onChangeLeadStatus(lead: Lead, newStatus: LeadStatus) {
    const current = normalizeStatus(lead.status);
    if (current === newStatus) return;

    // 1️⃣ Atualiza backend (gera interação automaticamente)
    await updateLeadStatus(lead.id, newStatus);

    // 2️⃣ UX otimista
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
    );
  }

  // ===== ABRIR MODAIS =====
  function abrirEmpresa(e: Empresa) {
    setEmpresaSelecionada(e);
    setOpenEmpresaModal(true);
  }

  function abrirLead(l: Lead) {
    setLeadSelecionado(l);
    setOpenLeadModal(true);
  }

  function abrirInteracao(i: Interacao) {
    setInteracaoSelecionada(i);
    setOpenInteracaoModal(true);
  }

  // ===== LOAD DATA =====
  async function loadData() {
    const { data: empresasData } = await supabase.from("empresas").select("*");
    const { data: leadsData } = await supabase.from("leads").select("*");
    const { data: interacoesData } = await supabase
      .from("interacoes")
      .select(
        `
        *,
        lead:leads (
          nome
        )
      `
      )
      .order("criado_em", { ascending: false });

    setEmpresas((empresasData as Empresa[]) || []);
    setLeads((leadsData as Lead[]) || []);
    setInteracoes((interacoesData as Interacao[]) || []);
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  /* =========================================================
     ✅ REALTIME (SEM REFRESH)
  ========================================================= */

  useRealtimeLeadsInteracoes({
    onInteracaoInsert: async (rowUnknown: unknown) => {
      if (!isRealtimeInteracaoRow(rowUnknown)) return;
      const row = rowUnknown;

      if (interacoesIdsRef.current.has(row.id)) return;

      const { data: interacaoCompleta } = await supabase
        .from("interacoes")
        .select(
          `
          *,
          lead:leads (
            nome
          )
        `
        )
        .eq("id", row.id)
        .single();

      if (interacaoCompleta) {
        const item = interacaoCompleta as Interacao;

        setInteracoes((prev) => {
          if (prev.some((i) => i.id === item.id)) return prev;
          const next = [item, ...prev];
          next.sort((a, b) => {
            const da = new Date(a.criado_em).getTime();
            const db = new Date(b.criado_em).getTime();
            return db - da;
          });
          return next;
        });
        return;
      }

      const fallback: Interacao = {
        id: row.id,
        lead_id: row.lead_id,
        status: row.status,
        canal: row.canal ?? null,
        observacao: row.observacao ?? null,
        criado_em: row.criado_em ?? new Date().toISOString(),
        lead: null,
      };

      setInteracoes((prev) => {
        if (prev.some((i) => i.id === fallback.id)) return prev;
        const next = [fallback, ...prev];
        next.sort((a, b) => {
          const da = new Date(a.criado_em).getTime();
          const db = new Date(b.criado_em).getTime();
          return db - da;
        });
        return next;
      });
    },

    onInteracaoUpdate: async (rowUnknown: unknown) => {
      if (!isRealtimeInteracaoRow(rowUnknown)) return;
      const row = rowUnknown;

      setInteracoes((prev) =>
        prev.map((it) =>
          it.id === row.id
            ? {
                ...it,
                ...row,
                canal: row.canal ?? it.canal ?? null,
                observacao: row.observacao ?? it.observacao ?? null,
                criado_em: row.criado_em ?? it.criado_em,
              }
            : it
        )
      );
    },

    onLeadUpdate: async (rowUnknown: unknown) => {
      if (!isRealtimeLeadRow(rowUnknown)) return;
      const row = rowUnknown;

      setLeads((prev) =>
        prev.map((l) =>
          l.id === row.id
            ? { ...l, ...row, status: normalizeStatus(row.status) }
            : l
        )
      );

      const { data: leadCompleto } = await supabase
        .from("leads")
        .select("*")
        .eq("id", row.id)
        .single();

      if (leadCompleto) {
        const item = leadCompleto as Lead;
        setLeads((prev) =>
          prev.map((l) => (l.id === item.id ? { ...l, ...item } : l))
        );
      }
    },

    onLeadInsert: async (rowUnknown: unknown) => {
      if (!isRealtimeLeadRow(rowUnknown)) return;
      const row = rowUnknown;

      if (leadsIdsRef.current.has(row.id)) return;

      const { data: leadCompleto } = await supabase
        .from("leads")
        .select("*")
        .eq("id", row.id)
        .single();

      if (leadCompleto) {
        const item = leadCompleto as Lead;
        setLeads((prev) => {
          if (prev.some((l) => l.id === item.id)) return prev;
          return [item, ...prev];
        });
        return;
      }

      if (
        typeof row.nome === "string" &&
        typeof row.linkedin_url === "string" &&
        typeof row.perfil === "string" &&
        typeof row.criado_em === "string"
      ) {
        const fallback: Lead = {
          id: row.id,
          nome: row.nome,
          cargo: row.cargo ?? null,
          linkedin_url: row.linkedin_url,
          email: row.email ?? null,
          telefone: row.telefone ?? null,
          perfil: row.perfil,
          empresa_id: row.empresa_id ?? null,
          criado_em: row.criado_em,
          status: normalizeStatus(row.status),
        };

        setLeads((prev) => {
          if (prev.some((l) => l.id === fallback.id)) return prev;
          return [fallback, ...prev];
        });
      }
    },
  });

  // ===== DERIVADOS DO PIPELINE =====
  const leadsNormalized = useMemo(
    () =>
      leads.map((l) => ({
        ...l,
        status: normalizeStatus(l.status),
      })),
    [leads]
  );

  const leadsSearched = useMemo(() => {
    const q = searchLeads.trim().toLowerCase();
    if (!q) return leadsNormalized;
    return leadsNormalized.filter((l) => {
      const nome = (l.nome || "").toLowerCase();
      const cargo = (l.cargo || "").toLowerCase();
      const perfil = (l.perfil || "").toLowerCase();
      const link = (l.linkedin_url || "").toLowerCase();
      return (
        nome.includes(q) ||
        cargo.includes(q) ||
        perfil.includes(q) ||
        link.includes(q)
      );
    });
  }, [leadsNormalized, searchLeads]);

  const leadsFiltrados =
    pipelineStatus === "todos"
      ? leadsSearched
      : leadsSearched.filter((l) => l.status === pipelineStatus);

  const pipelineColumns = PIPELINE_STATUSES.map((col) => ({
    ...col,
    leads: leadsFiltrados.filter((l) => l.status === col.key),
  }));

  // empresas / interacoes buscadas
  const empresasSearched = useMemo(() => {
    const q = searchEmpresas.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) => {
      const nome = (e.nome || "").toLowerCase();
      const cidade = (e.cidade || "").toLowerCase();
      const site = (e.site || "").toLowerCase();
      const linkedin = (e.linkedin_url || "").toLowerCase();
      const tamanho = (e.tamanho || "").toLowerCase();
      return (
        nome.includes(q) ||
        cidade.includes(q) ||
        site.includes(q) ||
        linkedin.includes(q) ||
        tamanho.includes(q)
      );
    });
  }, [empresas, searchEmpresas]);

  const interacoesSearched = useMemo(() => {
    const q = searchInteracoes.trim().toLowerCase();
    if (!q) return interacoes;
    return interacoes.filter((it) => {
      const lead = (it.lead?.nome || "").toLowerCase();
      const status = (it.status || "").toLowerCase();
      const canal = (it.canal || "").toLowerCase();
      const obs = (it.observacao || "").toLowerCase();
      return (
        lead.includes(q) ||
        status.includes(q) ||
        canal.includes(q) ||
        obs.includes(q)
      );
    });
  }, [interacoes, searchInteracoes]);

  function goHome() {
    setView("home");
  }

  function titleForView() {
    if (view === "empresas") return "Empresas";
    if (view === "leads") return "Leads";
    if (view === "interacoes") return "Interações";
    return "Dashboard";
  }

  function subtitleForView() {
    if (view === "empresas")
      return "Gerencie empresas e visualize detalhes com padrão corporativo.";
    if (view === "leads")
      return "Pipeline e lista detalhada de leads — com filtros e status visuais.";
    if (view === "interacoes")
      return "Histórico de interações (editável) — manual e automações.";
    return "Resumo executivo da operação.";
  }

  return (
    <div className="space-y-6">
      {/* ===================== TOP BAR ===================== */}
      <div
        className="
          exx-card
          flex items-center justify-between gap-3
          bg-gradient-to-br from-white to-[#E0F2FE]
          border border-[#BFDBFE]
          rounded-2xl shadow-md
          hover:shadow-[0_0_18px_4px_rgba(191,219,254,0.75)]
          transition-all duration-300
          px-6 py-4
        "
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {view !== "home" ? (
              <button
                onClick={goHome}
                className="
                  inline-flex items-center gap-2
                  text-sm font-semibold text-[#0A2A5F]
                  px-3 py-2 rounded-xl
                  border border-[#BFDBFE]
                  bg-white/70
                  hover:bg-white hover:shadow-sm
                  transition
                "
                title="Voltar"
              >
                <ChevronLeft size={16} />
                Voltar
              </button>
            ) : (
              <span
                className="
                  inline-flex items-center gap-2
                  text-xs font-semibold
                  text-[#0A2A5F]
                  px-3 py-1.5 rounded-full
                  border border-[#BFDBFE]
                  bg-white/60
                "
              >
                <BadgeCheck size={14} />
                Exxacta • Painel do Cliente
              </span>
            )}

            <span className="text-xl font-extrabold text-[#0A2A5F] tracking-wide truncate">
              {titleForView()}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 truncate">
            {subtitleForView()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpenAdd(true)}
            className="
              hidden sm:inline-flex
              items-center gap-2
              bg-gradient-to-br from-white to-[#E0F2FE]
              border border-[#BFDBFE]
              rounded-xl shadow-sm
              hover:shadow-md hover:-translate-y-[1px]
              transition-all duration-300
              px-4 py-2
              text-[#0A2A5F] font-semibold text-sm
            "
          >
            <Plus size={16} />
            Novo registro
          </button>

          <LogoutButton />
        </div>
      </div>

      {/* ===================== IMPORTS ===================== */}
      <HasdataImportCard />
      <ApifyImportCard />

      {/* ===================== STATS / NAV ===================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          title="Empresas registradas"
          subtitle="Cadastros no banco"
          value={empresas.length}
          icon={Building2}
          onClick={() => setView("empresas")}
        />

        <Card
          title="Leads coletados"
          subtitle="Pipeline + lista"
          value={leads.length}
          icon={Users}
          onClick={() => setView("leads")}
        />

        <Card
          title="Interações registradas"
          subtitle="Editar + histórico"
          value={interacoes.length}
          icon={MessagesSquare}
          onClick={() => setView("interacoes")}
        />

        <Card
          title="E-mail automático"
          subtitle="Dia 01 • Dia 03 • Dia 07"
          value={0}
          icon={Mail}
          onClick={() => setOpenEmailModal(true)}
          highlight
        />
      </div>

      {/* ===================== QUICK ACTIONS (MOBILE) ===================== */}
      <div className="flex justify-end">
        <button
          onClick={() => setOpenAdd(true)}
          className="
            sm:hidden
            flex items-center gap-2
            bg-gradient-to-br from-white to-[#E0F2FE]
            border border-[#BFDBFE]
            rounded-xl shadow-md
            hover:shadow-lg hover:-translate-y-[2px] hover:scale-[1.01]
            transition-all duration-300
            px-5 py-3
            text-[#0A2A5F] font-semibold
          "
        >
          <Plus size={18} />
          Adicionar Cliente / Empresa
        </button>
      </div>

      <AddEntityModal open={openAdd} onClose={() => setOpenAdd(false)} />

      {/* ===================== CONTENT ===================== */}
      {view === "home" && (
        <div
          className="
            bg-gradient-to-br from-white to-[#E0F2FE]
            border border-[#BFDBFE]
            rounded-2xl shadow-sm
            p-6
          "
        >
          <p className="text-slate-600 text-sm">
            Selecione um card para visualizar os dados. O painel foi otimizado
            para leitura rápida (padrão empresa) e com ações diretas.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setView("leads")}
              className="
                inline-flex items-center gap-2
                px-4 py-2 rounded-xl
                bg-slate-900 text-white text-sm font-semibold
                hover:bg-slate-800 transition
              "
            >
              <Users size={16} />
              Abrir Pipeline de Leads
            </button>

            <button
              onClick={() => setOpenEmailModal(true)}
              className="
                inline-flex items-center gap-2
                px-4 py-2 rounded-xl
                border border-[#BFDBFE]
                bg-white/70 text-[#0A2A5F] text-sm font-semibold
                hover:bg-white hover:shadow-sm transition
              "
            >
              <Mail size={16} />
              Configurar E-mail Automático
            </button>
          </div>
        </div>
      )}

      {view === "empresas" && (
        <EmpresasSection
          empresas={empresasSearched}
          onSelect={abrirEmpresa}
          searchValue={searchEmpresas}
          onSearchChange={setSearchEmpresas}
        />
      )}

      {view === "leads" && (
        <>
          {/* PIPELINE HEADER */}
          <div
            className="
              bg-gradient-to-br from-white to-[#E0F2FE]
              border border-[#BFDBFE]
              rounded-2xl shadow-md
              hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
              transition-all duration-300
              p-6
              text-[#1E293B]
            "
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-[#0A2A5F]">
                  Pipeline de Leads
                </h2>
                <p className="text-xs text-slate-500">
                  Clique em um lead para ver detalhes. Filtre por status e
                  visualize em colunas. Use a busca para localizar rapidamente
                  um nome/cargo/perfil/LinkedIn.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div
                  className="
                    flex items-center gap-2
                    rounded-xl border border-[#BFDBFE]
                    bg-white/70
                    px-3 py-2
                    shadow-sm
                  "
                >
                  <Search size={16} className="text-slate-500" />
                  <input
                    value={searchLeads}
                    onChange={(e) => setSearchLeads(e.target.value)}
                    placeholder="Buscar leads..."
                    className="
                      bg-transparent outline-none
                      text-sm text-slate-700
                      placeholder:text-slate-400
                      w-full sm:w-[240px]
                    "
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Filter size={14} />
                    Filtrar:
                  </span>

                  <select
                    value={pipelineStatus}
                    onChange={(e) => setPipelineStatus(e.target.value)}
                    className="
                      rounded-xl border border-[#BFDBFE]
                      px-3 py-2 text-sm bg-white
                      focus:outline-none focus:ring-2 focus:ring-slate-900/20
                      shadow-sm
                    "
                  >
                    <option value="todos">Todos</option>
                    {PIPELINE_STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* PIPELINE COLUNAS */}
          <div className="w-full overflow-x-auto pt-2">
            <div className="min-w-[1400px] grid grid-cols-[repeat(8,minmax(220px,1fr))] gap-3">
              {pipelineColumns.map((col) => {
                const StatusIco = statusIconByKey(col.key);
                return (
                  <div
                    key={col.key}
                    className="
                      rounded-2xl border
                      bg-gradient-to-br from-white to-[#E0F2FE]
                      border-[#BFDBFE]
                      shadow-sm
                      hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
                      hover:-translate-y-[2px]
                      transition-all duration-300
                    "
                  >
                    <div className="px-3 py-3 border-b border-[#BFDBFE]/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="
                            w-9 h-9 rounded-xl
                            bg-white/70 border border-[#BFDBFE]
                            flex items-center justify-center
                            shadow-sm
                          "
                        >
                          <StatusIco size={16} className="text-[#0A2A5F]" />
                        </span>

                        <p className="text-sm font-extrabold text-[#0A2A5F] leading-tight">
                          {col.label}
                        </p>
                      </div>

                      <span
                        className={`
                          text-[11px] px-2.5 py-1 rounded-full border
                          ${
                            STATUS_COLORS[col.key] ??
                            "bg-slate-100 text-slate-700 border-slate-300"
                          }
                        `}
                      >
                        {col.leads.length}
                      </span>
                    </div>

                    <div
                      className="
                        p-3 space-y-2
                        max-h-[calc(100vh-360px)]
                        overflow-y-auto
                        scrollbar-thin
                        scrollbar-thumb-slate-300
                        scrollbar-track-transparent
                      "
                    >
                      {col.leads.length === 0 && (
                        <div
                          className="
                            rounded-xl border border-dashed border-[#BFDBFE]
                            bg-white/50
                            p-3
                          "
                        >
                          <p className="text-xs text-slate-400">
                            Sem leads aqui.
                          </p>
                        </div>
                      )}

                      <AnimatePresence initial={false}>
                        {col.leads.map((lead) => {
                          const st = normalizeStatus(lead.status);
                          return (
                            <motion.button
                              layout
                              layoutId={`lead-${lead.id}`}
                              key={lead.id}
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.98 }}
                              transition={{
                                type: "spring",
                                stiffness: 420,
                                damping: 32,
                              }}
                              onClick={() => abrirLead(lead)}
                              className="
                                group
                                relative overflow-hidden
                                w-full text-left
                                rounded-xl
                                bg-gradient-to-br from-white/90 to-[#E0F2FE]
                                border border-[#BFDBFE]
                                hover:shadow-[0_0_12px_3px_rgba(191,219,254,0.75)]
                                hover:-translate-y-[2px]
                                transition-all duration-300
                                px-4 py-3
                              "
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug">
                                    {lead.nome}
                                  </p>
                                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                    {lead.cargo || "Cargo não informado"}
                                  </p>
                                </div>

                                <span
                                  className="
                                    opacity-0 group-hover:opacity-100
                                    transition
                                    text-[#0A2A5F]
                                  "
                                  title="Abrir detalhes"
                                >
                                  <ArrowUpRight size={16} />
                                </span>
                              </div>

                              <div className="mt-3 flex items-center justify-between gap-2">
                                <span
                                  className="
                                    text-[10px] uppercase tracking-wide
                                    text-slate-600
                                    px-2 py-1 rounded-full
                                    bg-white/70 border border-[#BFDBFE]
                                  "
                                >
                                  {lead.perfil}
                                </span>

                                {/* DROPDOWN STATUS (CARD) */}
                                <div
                                  className="flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <select
                                    value={st}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      if (!isPipelineStatusKey(next)) return;
                                      void onChangeLeadStatus(lead, next);
                                    }}
                                    className={`
                                      text-[11px] px-2.5 py-1 rounded-full border
                                      bg-white/80
                                      focus:outline-none focus:ring-2 focus:ring-slate-900/10
                                      ${
                                        STATUS_COLORS[st] ??
                                        "bg-slate-100 text-slate-700 border-slate-300"
                                      }
                                    `}
                                    title="Alterar status do lead"
                                  >
                                    {PIPELINE_STATUSES.map((s) => (
                                      <option key={s.key} value={s.key}>
                                        {s.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <LeadsSection
            leads={leadsSearched}
            onSelect={abrirLead}
            totalAll={leads.length}
            searchValue={searchLeads}
            pipelineStatus={pipelineStatus}
          />
        </>
      )}

      {view === "interacoes" && (
        <>
          <div
            className="
              bg-gradient-to-br from-white to-[#E0F2FE]
              border border-[#BFDBFE]
              rounded-2xl shadow-md
              hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
              transition-all duration-300
              p-6
              flex flex-col lg:flex-row lg:items-center lg:justify-between
              gap-4
            "
          >
            <div>
              <h2 className="text-lg font-extrabold text-[#0A2A5F]">
                Interações registradas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Cards editáveis (SaaS). Clique para abrir e editar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div
                className="
                  flex items-center gap-2
                  rounded-xl border border-[#BFDBFE]
                  bg-white/70 px-3 py-2 shadow-sm
                "
              >
                <Search size={16} className="text-slate-500" />
                <input
                  value={searchInteracoes}
                  onChange={(e) => setSearchInteracoes(e.target.value)}
                  placeholder="Buscar interações..."
                  className="
                    bg-transparent outline-none
                    text-sm text-slate-700
                    placeholder:text-slate-400
                    w-full sm:w-[260px]
                  "
                />
              </div>

              <button
                onClick={() => setOpenNovaInteracaoModal(true)}
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  bg-slate-900 text-white
                  px-4 py-2
                  font-semibold text-sm
                  hover:bg-slate-800
                  shadow-sm hover:shadow
                  transition
                "
              >
                <Plus size={16} />
                Nova interação
              </button>
            </div>
          </div>

          <InteracoesSection
            interacoes={interacoesSearched}
            onSelect={abrirInteracao}
          />
        </>
      )}

      {/* ===================== MODAIS ===================== */}
      <EmpresaModal
        open={openEmpresaModal}
        onClose={() => setOpenEmpresaModal(false)}
        empresa={empresaSelecionada}
      />

      <LeadModal
        open={openLeadModal}
        lead={leadSelecionado}
        onClose={() => {
          setOpenLeadModal(false);
          void loadData();
        }}
        onUpdated={() => {
          void loadData();
        }}
      />

      {/* ✅ Modal de interação agora precisa ser "operacional" */}
      <InteracaoModal
        open={openInteracaoModal}
        onClose={() => setOpenInteracaoModal(false)}
        interacao={interacaoSelecionada}
        onUpdated={() => void loadData()}
        onOpenLead={(leadId) => {
          const found = leads.find((l) => l.id === leadId) || null;
          setLeadSelecionado(found);
          setOpenLeadModal(true);
        }}
        onCreateNew={() => setOpenNovaInteracaoModal(true)}
      />

      <EmailTemplateModal
        open={openEmailModal}
        onClose={() => setOpenEmailModal(false)}
      />

      <InteracaoCreateModal
        open={openNovaInteracaoModal}
        onClose={() => setOpenNovaInteracaoModal(false)}
        leads={leads}
        onCreated={loadData}
      />
    </div>
  );
}

/* ===================== COMPONENTS ===================== */

function Card({
  title,
  subtitle,
  value,
  onClick,
  icon: Icon,
  highlight,
}: {
  title: string;
  subtitle?: string;
  value: number;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        group
        bg-gradient-to-br from-white to-[#E0F2FE]
        border border-[#BFDBFE]
        rounded-2xl shadow-md
        hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
        hover:-translate-y-[2px]
        transition-all duration-300
        p-5 text-left
        text-[#1E293B]
        ${highlight ? "ring-2 ring-slate-900/10" : ""}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
          {subtitle ? (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
              {subtitle}
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
              &nbsp;
            </p>
          )}
        </div>

        <span
          className="
            w-11 h-11 rounded-2xl
            bg-white/70 border border-[#BFDBFE]
            flex items-center justify-center
            shadow-sm
            group-hover:shadow
            transition
          "
        >
          <Icon size={18} className="text-[#0A2A5F]" />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <span className="text-xs font-semibold text-[#0A2A5F] opacity-0 group-hover:opacity-100 transition">
          Abrir
        </span>
      </div>
    </button>
  );
}

/* ===================== EMPRESAS ===================== */

function EmpresasSection({
  empresas,
  onSelect,
  searchValue,
  onSearchChange,
}: {
  empresas: Empresa[];
  onSelect: (e: Empresa) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div
        className="
          bg-gradient-to-br from-white to-[#E0F2FE]
          border border-[#BFDBFE]
          rounded-2xl shadow-md
          hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
          transition-all duration-300
          p-6
        "
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-[#0A2A5F]">
              Empresas registradas
            </h2>
            <p className="text-xs text-slate-500">
              Clique em uma empresa para abrir detalhes e editar. Busca por
              nome, cidade, site ou LinkedIn.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div
              className="
                flex items-center gap-2
                rounded-xl border border-[#BFDBFE]
                bg-white/70 px-3 py-2 shadow-sm
              "
            >
              <Search size={16} className="text-slate-500" />
              <input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar empresas..."
                className="
                  bg-transparent outline-none
                  text-sm text-slate-700
                  placeholder:text-slate-400
                  w-full sm:w-[260px]
                "
              />
            </div>

            <span
              className="
                inline-flex items-center gap-2
                rounded-xl border border-[#BFDBFE]
                bg-white/70 px-4 py-2
                text-xs font-semibold text-slate-700
                shadow-sm
              "
              title="Total de empresas"
            >
              <Building2 size={14} className="text-[#0A2A5F]" />
              Total: {empresas.length}
            </span>
          </div>
        </div>
      </div>

      {empresas.length === 0 && (
        <div
          className="
            bg-white/70 border border-[#BFDBFE]
            rounded-2xl p-6
          "
        >
          <p className="text-slate-500 text-sm">
            Nenhuma empresa cadastrada ainda.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {empresas.map((emp) => (
          <button
            key={emp.id}
            onClick={() => onSelect(emp)}
            className="
              group
              bg-gradient-to-br from-white to-[#E0F2FE]
              border border-[#BFDBFE]
              rounded-2xl shadow-sm
              hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
              hover:-translate-y-[2px]
              transition-all duration-300
              p-5 text-left text-[#1E293B]
            "
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 truncate">
                  {emp.nome}
                </h3>

                <p className="text-xs text-slate-500 mt-1 truncate">
                  {emp.cidade || "Cidade não informada"}
                </p>
              </div>

              <span
                className="
                  w-10 h-10 rounded-2xl
                  bg-white/70 border border-[#BFDBFE]
                  flex items-center justify-center
                  shadow-sm
                  group-hover:shadow transition
                "
              >
                <Building2 size={16} className="text-[#0A2A5F]" />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <span
                className="
                  text-[11px] px-2.5 py-1 rounded-full
                  bg-white/70 border border-[#BFDBFE]
                  text-slate-700
                "
              >
                Tamanho: <strong>{formatEmpresaTamanho(emp.tamanho)}</strong>
              </span>

              <span className="text-[10px] text-slate-500">
                {formatDateBR(emp.criado_em)}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {emp.site && (
                <a
                  href={emp.site.startsWith("http") ? emp.site : `https://${emp.site}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="
                    inline-flex items-center gap-2
                    text-[11px] font-semibold
                    px-3 py-1.5 rounded-xl
                    bg-slate-900 text-white
                    shadow-sm
                    hover:bg-slate-800
                    transition
                  "
                  title={emp.site}
                >
                  <Globe size={14} />
                  Site
                </a>
              )}

              {emp.linkedin_url && (
                <a
                  href={emp.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="
                    inline-flex items-center gap-2
                    text-[11px] font-semibold
                    px-3 py-1.5 rounded-xl
                    border border-[#BFDBFE]
                    bg-white/70 text-[#0A2A5F]
                    shadow-sm
                    hover:bg-white
                    transition
                  "
                  title={emp.linkedin_url}
                >
                  <Linkedin size={14} />
                  LinkedIn
                </a>
              )}

              <span
                className="
                  ml-auto
                  opacity-0 group-hover:opacity-100
                  transition text-[#0A2A5F]
                "
                title="Abrir detalhes"
              >
                <ArrowUpRight size={16} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== LEADS ===================== */

function LeadsSection({
  leads,
  onSelect,
  totalAll,
  searchValue,
  pipelineStatus,
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  totalAll: number;
  searchValue: string;
  pipelineStatus: string;
}) {
  const list = useMemo(() => {
    const normalized = leads.map((l) => ({
      ...l,
      status: normalizeStatus(l.status),
    }));
    if (pipelineStatus === "todos") return normalized;
    return normalized.filter((l) => l.status === pipelineStatus);
  }, [leads, pipelineStatus]);

  return (
    <div className="space-y-4 pt-6">
      <div
        className="
          bg-gradient-to-br from-white to-[#E0F2FE]
          border border-[#BFDBFE]
          rounded-2xl shadow-md
          hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
          transition-all duration-300
          p-6
        "
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#0A2A5F]">
              Lista completa (detalhada)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Visual corporativo: hierarquia + badges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
            <span
              className="
                inline-flex items-center gap-2
                rounded-xl border border-[#BFDBFE]
                bg-white/70 px-4 py-2
                text-xs font-semibold text-slate-700
                shadow-sm
              "
            >
              <Users size={14} className="text-[#0A2A5F]" />
              Total: {totalAll}
            </span>

            <span
              className="
                inline-flex items-center gap-2
                rounded-xl border border-[#BFDBFE]
                bg-white/70 px-4 py-2
                text-xs font-semibold text-slate-700
                shadow-sm
              "
            >
              <Filter size={14} className="text-[#0A2A5F]" />
              Exibidos: {list.length}
            </span>

            {searchValue.trim() ? (
              <span
                className="
                  inline-flex items-center gap-2
                  rounded-xl border border-[#BFDBFE]
                  bg-white/70 px-4 py-2
                  text-xs font-semibold text-slate-700
                  shadow-sm
                "
              >
                <Search size={14} className="text-[#0A2A5F]" />
                Busca ativa
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {list.length === 0 && (
        <div className="bg-white/70 border border-[#BFDBFE] rounded-2xl p-6">
          <p className="text-slate-500 text-sm">
            Nenhum lead encontrado com os filtros atuais.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {list.map((lead) => {
          const st = normalizeStatus(lead.status);
          const stLabel = statusLabel(st);
          const StatusIco = statusIconByKey(st);

          return (
            <button
              key={lead.id}
              onClick={() => onSelect(lead)}
              className="
                group
                relative
                overflow-hidden
                bg-gradient-to-br from-white to-[#E0F2FE]
                border border-[#BFDBFE]
                rounded-2xl shadow-sm
                hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
                hover:-translate-y-[2px]
                transition-all duration-300
                p-5 text-left
              "
            >
              <div className="mt-4 flex flex-wrap items-center gap-2 leading-none">
                <div className="min-w-0 space-y-0.5">
                  <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                    {lead.nome}
                  </h3>

                  <p className="text-xs text-slate-500 truncate">
                    {lead.cargo || "Cargo não informado"}
                  </p>
                </div>

                <span
                  className="
                    w-10 h-10 rounded-2xl
                    bg-white/70 border border-[#BFDBFE]
                    flex items-center justify-center
                    shadow-sm
                    group-hover:shadow transition
                  "
                >
                  <StatusIco size={16} className="text-[#0A2A5F]" />
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 leading-none">
                <span
                  className="
                    text-[11px] px-2.5 py-1 rounded-full
                    bg-white/70 border border-[#BFDBFE]
                    text-slate-700
                  "
                >
                  Perfil: <strong className="uppercase">{lead.perfil}</strong>
                </span>

                <span
                  className={`
                    text-[11px] px-2.5 py-1 rounded-full border
                    ${
                      STATUS_COLORS[st] ??
                      "bg-slate-100 text-slate-700 border-slate-300"
                    }
                  `}
                >
                  Status: <strong>{stLabel}</strong>
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span
                  className="
                    inline-flex items-center gap-2
                    text-[11px] font-semibold
                    px-3 py-1.5 rounded-xl
                    border border-[#BFDBFE]
                    bg-white/70 text-[#0A2A5F]
                    shadow-sm
                    max-w-[65%]
                  "
                  title={lead.linkedin_url ?? undefined}
                >
                  <Linkedin size={14} />
                  <span className="truncate">LinkedIn</span>
                </span>

                <span className="text-[10px] text-slate-500">
                  Criado em {formatDateBR(lead.criado_em)}
                </span>
              </div>

              <div className="mt-3 flex justify-end">
                <span
                  className="
                    opacity-0 group-hover:opacity-100
                    transition text-[#0A2A5F]
                  "
                >
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== INTERAÇÕES ===================== */

function InteracoesSection({
  interacoes,
  onSelect,
}: {
  interacoes: Interacao[];
  onSelect: (i: Interacao) => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      {interacoes.length === 0 && (
        <div className="bg-white/70 border border-[#BFDBFE] rounded-2xl p-6">
          <p className="text-slate-500 text-sm">
            Nenhuma interação registrada ainda.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {interacoes.map((it) => {
          const st = (it.status || "").trim().toLowerCase();
          const statusKey = normalizeStatus(st);
          const statusText = statusLabel(statusKey);
          const StatusIco = statusIconByKey(statusKey);

          return (
            <button
              key={it.id}
              onClick={() => onSelect(it)}
              className="
                group
                bg-gradient-to-br from-white to-[#E0F2FE]
                border border-[#BFDBFE]
                rounded-2xl shadow-md
                hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
                hover:-translate-y-[2px]
                transition-all duration-300
                p-5 text-left
                text-[#1E293B]
              "
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Lead</p>
                  <p className="text-base font-extrabold text-slate-900 truncate">
                    {it.lead?.nome || "Não informado"}
                  </p>
                </div>

                <span
                  className="
                    w-10 h-10 rounded-2xl
                    bg-white/70 border border-[#BFDBFE]
                    flex items-center justify-center
                    shadow-sm
                    group-hover:shadow transition
                  "
                >
                  <StatusIco size={16} className="text-[#0A2A5F]" />
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span
                  className={`
                    text-[11px] px-2.5 py-1 rounded-full border
                    ${
                      STATUS_COLORS[statusKey] ??
                      "bg-slate-100 text-slate-700 border-slate-300"
                    }
                  `}
                >
                  Status: <strong>{statusText}</strong>
                </span>

                <span
                  className="
                    text-[11px] px-2.5 py-1 rounded-full
                    bg-white/70 border border-[#BFDBFE]
                    text-slate-700
                  "
                >
                  Canal: <strong>{canalLabel(it.canal)}</strong>
                </span>
              </div>

              {it.observacao && (
                <div
                  className="
                    mt-4
                    rounded-xl
                    border border-[#BFDBFE]
                    bg-white/60
                    p-3
                  "
                >
                  <p className="text-xs text-slate-500">Observação</p>
                  <p className="text-sm text-slate-700 line-clamp-3 mt-1">
                    {it.observacao}
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {formatDateBR(it.criado_em)}
                </span>

                <span
                  className="
                    opacity-0 group-hover:opacity-100
                    transition text-[#0A2A5F]
                  "
                  title="Abrir detalhes"
                >
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}