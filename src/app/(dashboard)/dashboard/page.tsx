"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { EmpresaModal } from "@/components/empresa-modal";
import { LeadModal } from "@/components/lead-modal";
import { InteracaoModal } from "@/components/interacao-modal";
import { InteracaoCreateModal } from "@/components/interacao-create-modal";
import { useRealtimeLeadsInteracoes } from "@/hooks/useRealtimeLeadsInteracoes";
import { EmailTemplateModal } from "@/components/EmailTemplateModal";
import { AddEntityModal } from "@/components/add-entity-modal";
import { LogoutButton } from "@/components/LogoutButton";

/* ===================== TYPES ===================== */

type Empresa = {
  id: string;
  nome: string;
  cidade: string | null;
  tamanho: string;
  criado_em: string;
  site: string | null;
  linkedin_url: string | null;
};

type Lead = {
  id: string;
  nome: string;
  cargo: string | null;
  linkedin_url: string;
  email: string | null;
  telefone: string | null;
  perfil: string;
  empresa_id: string | null;
  criado_em: string;

  // ✅ status do LEAD no banco (usado no pipeline visual)
  status?: string | null;
};

type Interacao = {
  id: string;
  lead_id: string;
  status: string; // status da INTERAÇÃO (não confundir com status do lead)
  observacao: string | null;
  canal: string | null;
  criado_em: string;

  // ✅ vem do select com join: lead:leads(nome)
  lead?: {
    nome: string;
  } | null;
};

/**
 * Tipos mínimos para eventos realtime
 * - payload pode vir parcial, então validamos com type guards
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
  return isObject(value) && typeof value.id === "string";
}

function isRealtimeInteracaoRow(value: unknown): value is RealtimeInteracaoRow {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.lead_id === "string" &&
    typeof value.status === "string"
  );
}

/* ===================== PIPELINE CONFIG (STATUS DO LEAD) ===================== */

const PIPELINE_STATUSES = [
  { key: "novo", label: "Novo" },

  // intermediários (status do lead)
  { key: "contato_realizado", label: "Contato realizado" },
  { key: "em_contato", label: "Em contato" },
  { key: "interessado", label: "Interessado" },
  { key: "qualificado", label: "Qualificado" },

  // temperaturas / finais
  { key: "frio", label: "Frio" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
] as const;

function normalizeStatus(value?: string | null) {
  const v = (value || "").trim().toLowerCase();
  if (!v) return "novo";

  // Mapa visual — não altera o banco
  const map: Record<string, string> = {
    email_enviado: "contato_realizado", // Dia 1
    email_enviado_3dias: "contato_realizado", // Dia 3
    email_enviado_7dias: "contato_realizado", // Dia 7
    followup: "em_contato",
    respondido: "interessado",
    negociacao: "qualificado",
  };

  return map[v] ?? v;
}

function statusLabel(status: string) {
  const found = PIPELINE_STATUSES.find((s) => s.key === status);
  return found?.label ?? status;
}

// 🎨 Cores do pipeline por status
const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700 border-blue-300",
  contato_realizado: "bg-sky-100 text-sky-700 border-sky-300",
  em_contato: "bg-indigo-100 text-indigo-700 border-indigo-300",
  interessado: "bg-purple-100 text-purple-700 border-purple-300",
  qualificado: "bg-green-100 text-green-700 border-green-300",
  frio: "bg-gray-200 text-gray-700 border-gray-400",
  fechado: "bg-emerald-200 text-emerald-700 border-emerald-500",
  perdido: "bg-red-200 text-red-700 border-red-500",
};

/* ===================== PAGE ===================== */

export default function DashboardPage() {
  const [view, setView] = useState<
    "home" | "empresas" | "leads" | "interacoes"
  >("home");

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [openAdd, setOpenAdd] = useState(false);

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

  // ===== INTERAÇÃO MODAL (VISUALIZAR) =====
  const [interacaoSelecionada, setInteracaoSelecionada] =
    useState<Interacao | null>(null);
  const [openInteracaoModal, setOpenInteracaoModal] = useState(false);

  // ===== EMAIL TEMPLATE MODAL =====
  const [openEmailModal, setOpenEmailModal] = useState(false);

  // ===== INTERAÇÃO MODAL (CRIAR) =====
  const [openNovaInteracaoModal, setOpenNovaInteracaoModal] = useState(false);

  // ===== PIPELINE: FILTRO POR STATUS DO LEAD =====
  const [pipelineStatus, setPipelineStatus] = useState<string>("todos");

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

  // ===== LOAD DATA (usado no mount + onCreated do modal de interação) =====
  async function loadData() {
    const { data: empresasData } = await supabase.from("empresas").select("*");

    // ✅ aqui esperamos o campo status existir no banco (ou vir null)
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

  // ✅ load inicial sem “cascading renders”
  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(t);
  }, []);

  /* =========================================================
     ✅ REALTIME (SEM REFRESH) — PREMIUM (B)
     - Interação insert: busca a interação completa + join do lead (nome) e injeta no estado
     - Lead insert/update: busca/mescla mantendo Lead[] consistente
  ========================================================= */

  useRealtimeLeadsInteracoes({
    onInteracaoInsert: async (rowUnknown: unknown) => {
      if (!isRealtimeInteracaoRow(rowUnknown)) return;
      const row = rowUnknown;

      // evita duplicar (ref atual, sem depender de closure)
      if (interacoesIdsRef.current.has(row.id)) return;

      // Busca interação completa + join do nome do lead
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

      // fallback (raro): injeta com o que veio do realtime
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

      // 1) mescla rápido (UX) + normaliza o status (move de coluna)
      setLeads((prev) =>
        prev.map((l) =>
          l.id === row.id
            ? { ...l, ...row, status: normalizeStatus(row.status) }
            : l
        )
      );

      // 2) garante consistência (payload pode vir parcial)
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

      // evita duplicar (ref atual)
      if (leadsIdsRef.current.has(row.id)) return;

      // Busca lead completo (garante Lead válido)
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

      // fallback (raro): só insere se tiver mínimos essenciais
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
          status: row.status ?? "novo",
        };

        setLeads((prev) => {
          if (prev.some((l) => l.id === fallback.id)) return prev;
          return [fallback, ...prev];
        });
      }
    },
  });

  // ===== DERIVADOS DO PIPELINE (STATUS DO LEAD) =====

  // Normaliza status, assumindo "novo" como fallback
  const leadsNormalized = leads.map((l) => {
    const s = typeof l.status === "string" ? l.status.trim().toLowerCase() : "";
    return {
      ...l,
      status: s.length ? s : "novo",
    };
  });

  // Aplica filtro ativo do pipeline
  const leadsFiltrados =
    pipelineStatus === "todos"
      ? leadsNormalized
      : leadsNormalized.filter((l) => l.status === pipelineStatus);

  // Monta colunas com base nos status oficiais
  const pipelineColumns = PIPELINE_STATUSES.map((col) => ({
    ...col,
    leads: leadsFiltrados.filter((l) => l.status === col.key),
  }));

  return (
    <div className="space-y-6">
      <div
  className="
    exx-card flex items-center justify-between gap-2
    bg-gradient-to-br from-white to-[#E0F2FE]
    border border-[#BFDBFE]
    rounded-x20 shadow-md
    hover:shadow-[0_0_20px_50px_rgba(191,219,254,0.65)]
    hover:-translate-y-1 hover:scale-[1.00]
    transition-all duration-300
    px-6 py-4
  "
>
  <span className="text-xl font-bold text-[#0A2A5F] tracking-wide">
    Dashboard
  </span>

  <LogoutButton />
</div>


      {/* ===================== CARDS ===================== */}

      <div className="grid grid-cols-3 gap-3">
        <Card
          title="Empresas registradas"
          value={empresas.length}
          onClick={() => setView("empresas")}
        />

        <Card
          title="Leads coletados"
          value={leads.length}
          onClick={() => setView("leads")}
        />

        <Card
          title="Interações registradas"
          value={interacoes.length}
          onClick={() => setView("interacoes")}
        />
      </div>
      <Card
        title="E-mail Automático"
        value={0}
        onClick={() => setOpenEmailModal(true)}
      />

      <div className="flex justify-end mt-4">
        <button
          onClick={() => setOpenAdd(true)}
          className="
      flex items-center gap-2
      bg-gradient-to-br from-white to-[#E0F2FE]
      border border-[#BFDBFE]
      rounded-xl shadow-md
      hover:shadow-lg hover:translate-y-[-2px] hover:scale-[1.02]
      transition-all duration-300
      px-5 py-3
      text-[#0A2A5F] font-semibold
    "
        >
          ➕ Adicionar Cliente / Empresa
        </button>
      </div>

      <AddEntityModal open={openAdd} onClose={() => setOpenAdd(false)} />

      {/* ===================== CONTENT ===================== */}
      {view === "home" && (
        <p className="text-slate-500 text-sm">
          Selecione um card para visualizar os dados.
        </p>
      )}
      {view === "empresas" && (
        <EmpresasSection empresas={empresas} onSelect={abrirEmpresa} />
      )}
      {view === "leads" && (
        <>
          {/* ======= PIPELINE HEADER / FILTRO ======= */}
          <div
            className="
  bg-gradient-to-br from-white to-[#E0F2FE]
  border border-[#BFDBFE]
  rounded-xl shadow-md
  hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
  hover:-translate-y-1 hover:scale-[1.02]
  transition-all duration-300
  p-6 text-left space-y-1
  text-[#1E293B]
"
          >
            <div className="space-y-1">
              <h2 className="exx-card">Pipeline de Leads</h2>
              <p className="text-xs text-slate-500">
                Clique em um lead para ver detalhes. Filtre por status e
                visualize em colunas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">
                Filtrar:
              </label>
              <select
                value={pipelineStatus}
                onChange={(e) => setPipelineStatus(e.target.value)}
                className="
                  rounded-lg border px-3 py-2 text-sm bg-white
                  focus:outline-none focus:ring-2 focus:ring-slate-900/40
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

          {/* ======= PIPELINE COLUNAS ======= */}
          <div className="w-full overflow-x-auto pt-2">
            <div className="min-w-245 grid grid-cols-7 gap-3">
              {pipelineColumns.map((col) => (
                <div
                  key={col.key}
                  className="
          rounded-xl border
          bg-gradient-to-br from-white to-[#E0F2FE]
          border-[#BFDBFE]
          shadow-sm
          hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
          hover:-translate-y-1 hover:scale-[1.01]
          transition-all duration-300
        "
                >
                  {/* Cabeçalho da coluna */}
                  <div className="px-3 py-3 border-b border-[#BFDBFE]/60 flex items-center justify-between">
                    <p className="text-sm font-semibold text-[#0A2A5F]">
                      {col.label}
                    </p>

                    {/* Badge de quantidade com cor por status */}
                    <span
                      className={`
              text-[11px] px-2 py-1 rounded-full border
              ${
                STATUS_COLORS[col.key] ??
                "bg-slate-100 text-slate-700 border-slate-300"
              }
            `}
                    >
                      {col.leads.length}
                    </span>
                  </div>

                  {/* Conteúdo da coluna */}
                  <div className="p-3 space-y-2">
                    {col.leads.length === 0 && (
                      <p className="text-xs text-slate-400">Sem leads aqui.</p>
                    )}

                    {col.leads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => abrirLead(lead)}
                        className="
                w-full text-left
                rounded-lg
                bg-gradient-to-br from-white/90 to-[#E0F2FE]
                border border-[#BFDBFE]
                hover:shadow-[0_0_12px_3px_rgba(191,219,254,0.75)]
                hover:-translate-y-1 hover:scale-[1.01]
                transition-all duration-300
                px-3 py-2
              "
                      >
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">
                          {lead.nome}
                        </p>

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {lead.cargo || "Cargo não informado"}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[10px] uppercase text-slate-500">
                            {lead.perfil}
                          </span>

                          <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                            {statusLabel(normalizeStatus(lead.status))}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ======= SUA LISTA ORIGINAL (mantida) ======= */}
          <LeadsSection leads={leadsNormalized} onSelect={abrirLead} />
        </>
      )}
      {view === "interacoes" && (
        <>
          <div className="flex items-center justify-between pt-4">
            <h2 className="exx-card w-full">Interações registradas</h2>

            <button
              onClick={() => setOpenNovaInteracaoModal(true)}
              className="
  bg-gradient-to-br from-white to-[#E0F2FE]
  border border-[#BFDBFE]
  rounded-xl shadow-md
  hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
  hover:-translate-y-1 hover:scale-[1.02]
  transition-all duration-300
  p-6 text-left space-y-1
  text-[#1E293B]
"
            >
              Nova interação
            </button>
          </div>

          <InteracoesSection
            interacoes={interacoes}
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
          // 🔥 força recarregar os dados ao fechar
          void loadData();
        }}
        onUpdated={() => {
          // 🔥 garante atualização na tela imediatamente
          void loadData();
        }}
      />
      <InteracaoModal
        open={openInteracaoModal}
        onClose={() => setOpenInteracaoModal(false)}
        interacao={interacaoSelecionada}
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
  value,
  onClick,
}: {
  title: string;
  value: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
  bg-gradient-to-br from-white to-[#E0F2FE]
  border border-[#BFDBFE]
  rounded-xl shadow-md
  hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
  hover:-translate-y-1 hover:scale-[1.02]
  transition-all duration-300
  p-6 text-left space-y-1
  text-[#1E293B]
"
    >
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </button>
  );
}

/* ===================== EMPRESAS ===================== */

function EmpresasSection({
  empresas,
  onSelect,
}: {
  empresas: Empresa[];
  onSelect: (e: Empresa) => void;
}) {
  return (
    <div className="space-y-4 pt-4">
      <h2 className="text-xl font-semibold text-[#0A2A5F]">
        Empresas registradas
      </h2>

      {empresas.length === 0 && (
        <p className="text-slate-500 text-sm">
          Nenhuma empresa cadastrada ainda.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {empresas.map((emp) => (
          <button
            key={emp.id}
            onClick={() => onSelect(emp)}
            className="
bg-gradient-to-br from-white to-[#E0F2FE]
border border-[#BFDBFE]
rounded-lg shadow-sm
hover:shadow-[0_0_10px_3px_rgba(191,219,254,0.75)]
hover:-translate-y-1 hover:scale-[1.02]
transition-all duration-300
p-4 text-left text-[#1E293B]
"
          >
            <h3 className="font-medium">{emp.nome}</h3>
            <p className="text-xs text-slate-500">
              {emp.cidade || "Sem cidade"}
            </p>
            <p className="text-xs text-slate-500">
              Tamanho: {emp.tamanho.replace("_", " até ")}
            </p>
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
}: {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
}) {
  return (
    <div className="space-y-4 pt-6">
      <h2 className="text-xl font-semibold">Leads coletados</h2>

      {leads.length === 0 && (
        <p className="text-slate-500 text-sm">Nenhum lead cadastrado ainda.</p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => onSelect(lead)}
            className="
  bg-gradient-to-br from-white to-[#E0F2FE]
  border border-[#BFDBFE]
  rounded-xl shadow-sm
  hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
  hover:-translate-y-1 hover:scale-[1.02]
  transition-all duration-300
  p-6 text-left space-y-1
  text-[#1E293B]
"
          >
            <h3 className="font-medium">{lead.nome}</h3>

            <p className="text-xs text-slate-500">
              {lead.cargo || "Cargo não informado"}
            </p>

            <p className="text-xs text-slate-500 mt-1">Perfil: {lead.perfil}</p>

            <p className="text-xs text-slate-500 mt-1">
              Status:{" "}
              <span className="font-medium">
                {statusLabel(normalizeStatus(lead.status))}
              </span>
            </p>

            <p className="text-[11px] text-blue-600 mt-2 break-all">
              {lead.linkedin_url}
            </p>

            <p className="text-[10px] text-slate-400 mt-2">
              Criado em {new Date(lead.criado_em).toLocaleDateString("pt-BR")}
            </p>
          </div>
        ))}
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
    <div className="space-y-4 pt-4">
      {interacoes.length === 0 && (
        <p className="text-slate-500 text-sm">
          Nenhuma interação registrada ainda.
        </p>
      )}

      <div className="grid grid-cols-3 gap-4">
        {interacoes.map((it) => (
          <button
            key={it.id}
            onClick={() => onSelect(it)}
            className="
  bg-gradient-to-br from-white to-[#E0F2FE]
  border border-[#BFDBFE]
  rounded-xl shadow-md
  hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
  hover:-translate-y-1 hover:scale-[1.02]
  transition-all duration-300
  p-6 text-left space-y-1
  text-[#1E293B]
"
          >
            <p className="text-xs font-medium text-slate-700">
              Lead: {it.lead?.nome || "Não informado"}
            </p>

            <p className="text-xs font-medium text-slate-700 mt-1">
              Status: {it.status}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Canal: {it.canal || "Não informado"}
            </p>

            {it.observacao && (
              <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                {it.observacao}
              </p>
            )}

            <p className="text-[10px] text-slate-400 mt-2">
              Registrado em {new Date(it.criado_em).toLocaleDateString("pt-BR")}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
