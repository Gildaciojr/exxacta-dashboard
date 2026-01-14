"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Pencil, Plus, ExternalLink, Save } from "lucide-react";

type Interacao = {
  id: string;
  lead_id: string;
  status: string;
  canal: string | null;
  observacao: string | null;
  criado_em: string;
  lead?: {
    nome: string;
  } | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  interacao: Interacao | null;

  onUpdated: () => void;
  onOpenLead: (leadId: string) => void;
  onCreateNew: () => void;
};

export function InteracaoModal({
  open,
  onClose,
  interacao,
  onUpdated,
  onOpenLead,
  onCreateNew,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    status: "",
    canal: "",
    observacao: "",
  });

  // ======================================================
  // SINCRONIZAÇÃO
  // ======================================================
  useEffect(() => {
    if (!interacao) return;

    setForm({
      status: interacao.status,
      canal: interacao.canal || "",
      observacao: interacao.observacao || "",
    });

    setIsEditing(false);
    setError(null);
  }, [interacao]);

  // ======================================================
  // GUARDA ENTERPRISE (NÃO DESMONTA O MODAL)
  // ======================================================
  if (!interacao) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent />
      </Dialog>
    );
  }

  // 🔒 NARROWING DEFINITIVO (TIPAGEM ENTERPRISE)
  const interaction = interacao;

  // ======================================================
  // SAVE
  // ======================================================
  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/interacoes/${interaction.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          canal: form.canal || null,
          observacao: form.observacao || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Erro ao atualizar interação");
        return;
      }

      onUpdated();
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setError("Erro inesperado ao salvar");
    } finally {
      setSaving(false);
    }
  }

  // ======================================================
  // UI
  // ======================================================
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-extrabold text-[#0A2A5F]">
            Interação
          </DialogTitle>

          <DialogDescription>
            {isEditing
              ? "Edite os dados da interação registrada"
              : "Visualização completa da interação com o lead"}
          </DialogDescription>
        </DialogHeader>

        {/* LEAD */}
        <div className="flex items-center justify-between bg-slate-50 border rounded-xl p-4">
          <div>
            <p className="text-xs text-slate-500">Lead</p>
            <p className="text-base font-semibold text-slate-800">
              {interaction.lead?.nome || "Não informado"}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenLead(interaction.lead_id)}
            className="flex items-center gap-2"
          >
            <ExternalLink size={14} />
            Abrir Lead
          </Button>
        </div>

        {/* FORM */}
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              disabled={!isEditing}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
            >
              <option value="contatado">Contatado</option>
              <option value="respondeu">Respondeu</option>
              <option value="follow_up">Follow-up</option>
              <option value="negociacao">Negociação</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Canal</label>
            <select
              disabled={!isEditing}
              value={form.canal}
              onChange={(e) =>
                setForm((f) => ({ ...f, canal: e.target.value }))
              }
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
            >
              <option value="">Não informado</option>
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="telefone">Telefone</option>
              <option value="reuniao">Reunião</option>
              <option value="automacao_n8n">Automação n8n</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Observação
            </label>
            <textarea
              disabled={!isEditing}
              value={form.observacao}
              onChange={(e) =>
                setForm((f) => ({ ...f, observacao: e.target.value }))
              }
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Criado em{" "}
            {new Date(interaction.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* ACTIONS */}
        <DialogFooter className="flex justify-between pt-6">
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Pencil size={14} />
                Editar
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-blue-600 text-white"
              >
                {saving ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <Save size={14} />
                )}
                Salvar
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCreateNew}
              className="flex items-center gap-2"
            >
              <Plus size={14} />
              Nova interação
            </Button>

            <Button variant="ghost" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
