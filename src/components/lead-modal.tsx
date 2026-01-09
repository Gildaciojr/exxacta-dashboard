// src\components\lead-modal.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Lead, LeadStatus } from "@/types/lead";
import { Empresa } from "@/types/empresa";
import { Interacao } from "@/types/interacao";

import {
  Mail,
  Phone,
  Linkedin,
  Building2,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarClock,
  BadgeCheck,
  BadgeAlert,
  BadgeHelp,
} from "lucide-react";
import { InteracaoCreateModal } from "@/components/interacao-create-modal";

/* ===================== PIPELINE (mesmo padrão do card) ===================== */
/**
 * ✅ Importante:
 * - No modal, o status também é LeadStatus (domínio)
 * - Labels seguem o padrão do pipeline no dashboard
 */
const LEAD_STATUS_OPTIONS: ReadonlyArray<{ key: LeadStatus; label: string }> = [
  { key: "novo", label: "Novo" },
  { key: "email_enviado", label: "Contato realizado" },
  { key: "contatado", label: "Em contato" },
  { key: "interessado", label: "Interessado" },
  { key: "qualificado", label: "Qualificado" },
  { key: "frio", label: "Frio" },
  { key: "fechado", label: "Fechado" },
  { key: "perdido", label: "Perdido" },
];

const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: "bg-blue-100 text-blue-700 border-blue-300",
  email_enviado: "bg-sky-100 text-sky-700 border-sky-300",
  contatado: "bg-indigo-100 text-indigo-700 border-indigo-300",
  follow_up: "bg-indigo-100 text-indigo-700 border-indigo-300",
  respondeu: "bg-purple-100 text-purple-700 border-purple-300",
  interessado: "bg-purple-100 text-purple-700 border-purple-300",
  negociacao: "bg-green-100 text-green-700 border-green-300",
  qualificado: "bg-green-100 text-green-700 border-green-300",
  frio: "bg-gray-200 text-gray-700 border-gray-400",
  fechado: "bg-emerald-200 text-emerald-700 border-emerald-500",
  perdido: "bg-red-200 text-red-700 border-red-500",
};

function statusIcon(status: LeadStatus) {
  if (status === "fechado") return BadgeCheck;
  if (status === "perdido") return BadgeAlert;
  if (status === "frio") return BadgeHelp;
  return CalendarClock;
}

function normalizeStatus(value: LeadStatus | string | null | undefined): LeadStatus {
  const v = (value || "").trim().toLowerCase();

  const map: Record<string, LeadStatus> = {
    email_enviado: "email_enviado",
    follow_up: "contatado",
    respondeu: "interessado",
    negociacao: "qualificado",
  };

  if (v in map) return map[v];

  if (
    [
      "novo",
      "email_enviado",
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

async function updateLeadStatus(leadId: string, status: LeadStatus) {
  await fetch("/api/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_id: leadId, status }),
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  onUpdated?: () => void; // opcional: atualizar lista no dashboard
};

export function LeadModal({ open, onClose, lead, onUpdated }: Props) {
  /* =========================================================
     GUARDA BÁSICA / VALORES DERIVADOS
  ========================================================= */
  const leadId = lead?.id ?? "";

  /* =========================================================
      ESTADOS PRINCIPAIS
  ========================================================= */
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [form, setForm] = useState({
    nome: lead?.nome ?? "",
    cargo: lead?.cargo ?? "",
    email: lead?.email ?? "",
    telefone: lead?.telefone ?? "",
    linkedin_url: lead?.linkedin_url ?? "",
    perfil: lead?.perfil ?? "",
    empresa_id: lead?.empresa_id ?? "",
  });

  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [loadingInteracoes, setLoadingInteracoes] = useState(false);

  const [openNovaInteracaoModal, setOpenNovaInteracaoModal] = useState(false);

  // ✅ status (modal) — sincronizado com o lead e com o pipeline
  const [statusLocal, setStatusLocal] = useState<LeadStatus>("novo");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const leadsForCreateModal = useMemo(
    () => (lead ? [{ id: lead.id, nome: lead.nome }] : []),
    [lead]
  );

  /* =========================================================
      SINCRONIZAR FORM + STATUS QUANDO O LEAD MUDAR
  ========================================================= */
  useEffect(() => {
    if (!lead) return;

    setForm({
      nome: lead.nome,
      cargo: lead.cargo ?? "",
      email: lead.email ?? "",
      telefone: lead.telefone ?? "",
      linkedin_url: lead.linkedin_url ?? "",
      perfil: lead.perfil,
      empresa_id: lead.empresa_id ?? "",
    });

    setStatusLocal(normalizeStatus(lead.status));
  }, [lead]);

  /* =========================================================
      LOAD EMPRESA
  ========================================================= */
  const loadEmpresa = useCallback(async () => {
    if (!form.empresa_id) {
      setEmpresa(null);
      return;
    }

    try {
      const res = await fetch(`/api/empresas?id=${form.empresa_id}`);
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setEmpresa(data[0] as Empresa);
      } else {
        setEmpresa(null);
      }
    } catch (error) {
      console.error("Erro ao carregar empresa do lead:", error);
      setEmpresa(null);
    }
  }, [form.empresa_id]);

  /* =========================================================
      LOAD INTERAÇÕES
  ========================================================= */
  const loadInteracoesDoLead = useCallback(async () => {
    if (!leadId) return;

    try {
      setLoadingInteracoes(true);
      const res = await fetch(`/api/leads/${leadId}/interacoes`);
      const data = await res.json();
      setInteracoes(Array.isArray(data) ? (data as Interacao[]) : []);
    } catch (error) {
      console.error("Erro ao carregar interações do lead:", error);
      setInteracoes([]);
    } finally {
      setLoadingInteracoes(false);
    }
  }, [leadId]);

  /* =========================================================
      EFEITOS
  ========================================================= */
  useEffect(() => {
    if (!open || !leadId) return;

    void loadEmpresa();
    void loadInteracoesDoLead();
  }, [open, leadId, loadEmpresa, loadInteracoesDoLead]);

  /* =========================================================
      HANDLERS
  ========================================================= */
  const handleEditToggle = () => setIsEditing((prev) => !prev);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!lead?.id) {
      alert("❌ Lead inválido (sem ID).");
      return;
    }

    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Erro ao salvar lead:", data);
        alert(`❌ Erro ao salvar: ${data.error || "Falha desconhecida"}`);
        return;
      }

      alert("✅ Lead atualizado com sucesso!");
      setIsEditing(false);

      void loadEmpresa();
      void loadInteracoesDoLead();

      onUpdated?.();
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
      alert("❌ Erro ao salvar alterações.");
    }
  };

  const handleDelete = async () => {
    if (!leadId) return;

    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });

      if (!res.ok) {
        console.error("Erro ao excluir lead:", await res.text());
        alert(
          "❌ Não foi possível excluir. Verifique se há interações vinculadas."
        );
        return;
      }

      alert("Lead excluído com sucesso!");
      onClose();
      onUpdated?.();
    } catch (error) {
      console.error("Erro ao excluir lead:", error);
      alert(
        "❌ Não foi possível excluir. Verifique se há interações vinculadas."
      );
    }
  };

  // ✅ Dropdown de status no MODAL (mesmo padrão do card)
  const handleStatusChange = async (next: LeadStatus) => {
    if (!lead?.id) return;

    const current = normalizeStatus(lead.status);
    if (next === current) return;

    try {
      setUpdatingStatus(true);
      setStatusLocal(next);

      await updateLeadStatus(lead.id, next);

      // 🔥 garante sincronização modal ↔ pipeline (recarrega lista no dashboard)
      onUpdated?.();

      // 🔥 recarrega interações do lead (se a API /api/status gerar interação)
      void loadInteracoesDoLead();
    } catch (error) {
      console.error("Erro ao atualizar status do lead:", error);
      alert("❌ Erro ao atualizar status.");
      // volta para o status atual
      setStatusLocal(current);
    } finally {
      setUpdatingStatus(false);
    }
  };

  /* =========================================================
      BLOQUEIO SE NÃO HOUVER LEAD
  ========================================================= */
  if (!lead) return null;

  const StatusIco = statusIcon(statusLocal);

  /* =========================================================
      JSX
  ========================================================= */
  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="
            max-w-5xl h-[90vh]
            overflow-hidden
            border border-[#BFDBFE]
            shadow-xl
            bg-white/90 backdrop-blur-xl
            p-6
            overflow-y-auto max-h-[85vh]
          "
        >
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0A2A5F] flex items-center justify-between gap-3">
              <span className="truncate">{isEditing ? "✏️ Editar Lead" : lead.nome}</span>

              {/* ✅ Status no cabeçalho do modal (enterprise) */}
              <span className="shrink-0 inline-flex items-center gap-2">
                <span
                  className="
                    w-9 h-9 rounded-xl
                    bg-white/70 border border-[#BFDBFE]
                    flex items-center justify-center
                    shadow-sm
                  "
                  title="Status do lead"
                >
                  <StatusIco size={16} className="text-[#0A2A5F]" />
                </span>

                <select
                  value={statusLocal}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                  className={`
                    text-[12px] px-3 py-2 rounded-xl border
                    bg-white/80
                    focus:outline-none focus:ring-2 focus:ring-slate-900/10
                    ${STATUS_COLORS[statusLocal]}
                  `}
                  title="Alterar status do lead"
                >
                  {LEAD_STATUS_OPTIONS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </span>
            </DialogTitle>

            <DialogDescription>
              {isEditing
                ? "Atualize os dados e salve"
                : "Informações completas do lead (padrão corporativo)."}
            </DialogDescription>
          </DialogHeader>

          {/* =========================================================
              CAMPOS DE EDIÇÃO OU VISUALIZAÇÃO
          ========================================================= */}
          <div className="bg-white/50 p-5 rounded-xl border space-y-3">
            {/* Nome */}
            <label className="block text-sm text-slate-700 font-medium">
              Nome
            </label>
            <input
              disabled={!isEditing}
              name="nome"
              value={form.nome}
              onChange={handleChange}
              className="w-full p-2 rounded-lg border"
            />

            {/* Cargo */}
            <label className="block text-sm text-slate-700 font-medium">
              Cargo
            </label>

            <select
              disabled={!isEditing}
              name="cargo"
              value={form.cargo}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, cargo: v }));

                if (v === "__OUTRO__") {
                  setTimeout(() => {
                    const inputOutro = document.getElementById("cargo-outro");
                    inputOutro?.focus();
                  }, 50);
                }
              }}
              className="w-full p-2 rounded-lg border bg-white"
            >
              <option value="">Selecione...</option>
              <option value="CEO">CEO</option>
              <option value="Diretor Financeiro">Diretor Financeiro</option>
              {form.cargo &&
                !["CEO", "Diretor Financeiro"].includes(form.cargo) && (
                  <option value={form.cargo}>{form.cargo}</option>
                )}
              <option value="__OUTRO__">Outro...</option>
            </select>

            {form.cargo === "__OUTRO__" && (
              <input
                id="cargo-outro"
                name="cargo"
                placeholder="Digite um novo cargo"
                onChange={(e) =>
                  setForm((f) => ({ ...f, cargo: e.target.value }))
                }
                className="mt-2 w-full p-2 rounded-lg border"
              />
            )}

            {/* Email */}
            <label className="block text-sm text-slate-700 font-medium flex items-center gap-2">
              <Mail size={16} />
              Email
            </label>
            <input
              disabled={!isEditing}
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2 rounded-lg border"
            />

            {/* Telefone */}
            <label className="block text-sm text-slate-700 font-medium flex items-center gap-2">
              <Phone size={16} />
              Telefone
            </label>
            <input
              disabled={!isEditing}
              name="telefone"
              value={form.telefone}
              onChange={handleChange}
              className="w-full p-2 rounded-lg border"
            />

            {/* LinkedIn */}
            <label className="block text-sm text-slate-700 font-medium flex items-center gap-2">
              <Linkedin size={16} />
              LinkedIn
            </label>
            <input
              disabled={!isEditing}
              name="linkedin_url"
              value={form.linkedin_url}
              onChange={handleChange}
              className="w-full p-2 rounded-lg border"
            />

            {/* Empresa */}
            <label className="block text-sm text-slate-700 font-medium flex items-center gap-2">
              <Building2 size={16} />
              Empresa vinculada
            </label>
            <p className="text-sm">
              {empresa?.nome ?? "Sem empresa vinculada"}
            </p>
          </div>

          {/* =========================================================
              BOTÕES DE AÇÃO
          ========================================================= */}
          <div className="flex items-center justify-between pt-6 border-t mt-6 pt-4">
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditToggle}
                  className="
                    px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold
                    bg-blue-600 text-white
                    hover:bg-blue-700 transition shadow-sm hover:shadow
                  "
                >
                  <Pencil size={16} /> Editar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="
                      px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold
                      bg-green-600 text-white
                      hover:bg-green-700 transition shadow-sm hover:shadow
                    "
                  >
                    <Check size={16} /> Salvar
                  </button>

                  <button
                    type="button"
                    onClick={handleEditToggle}
                    className="
                      px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold
                      bg-gray-500 text-white
                      hover:bg-gray-600 transition shadow-sm hover:shadow
                    "
                  >
                    <X size={16} /> Cancelar
                  </button>
                </>
              )}
            </div>

            <div className="flex gap-3">
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="
                    px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold
                    bg-red-600 text-white
                    hover:bg-red-700 transition shadow-sm hover:shadow
                  "
                >
                  <Trash2 size={16} /> Excluir
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="
                  px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold
                  bg-slate-900 text-white
                  hover:bg-slate-800 transition shadow-sm hover:shadow
                "
              >
                Fechar
              </button>
            </div>
          </div>

          {/* =========================================================
              CONFIRMAÇÃO DE EXCLUSÃO
          ========================================================= */}
          {confirmDelete && (
            <div className="mt-5 p-4 border border-red-300 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 font-semibold mb-3">
                ⚠️ Tem certeza que deseja excluir este lead?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700"
                >
                  Sim, excluir
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              INTERAÇÕES (LISTAGEM RÁPIDA)
          ========================================================= */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Interações do lead
              </p>

              <button
                type="button"
                onClick={() => setOpenNovaInteracaoModal(true)}
                className="
                  text-xs font-semibold
                  px-3 py-2 rounded-xl
                  bg-slate-900 text-white
                  hover:bg-slate-800 transition
                "
              >
                Nova interação
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {loadingInteracoes ? (
                <div className="text-xs text-slate-500">Carregando...</div>
              ) : interacoes.length === 0 ? (
                <div className="text-xs text-slate-500">
                  Nenhuma interação registrada.
                </div>
              ) : (
                interacoes.slice(0, 6).map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl border border-[#BFDBFE] bg-white/60 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">
                        {it.status}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(it.criado_em).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {it.observacao ? (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {it.observacao}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Interação */}
      <InteracaoCreateModal
        open={openNovaInteracaoModal}
        onClose={() => setOpenNovaInteracaoModal(false)}
        leads={leadsForCreateModal}
        onCreated={loadInteracoesDoLead}
      />
    </>
  );
}
