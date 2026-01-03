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

type Lead = {
  id: string;
  nome: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  onCreated: () => void;
};

export function InteracaoCreateModal({
  open,
  onClose,
  leads,
  onCreated,
}: Props) {
  const [leadId, setLeadId] = useState("");
  const [status, setStatus] = useState("contatado");
  const [canal, setCanal] = useState("linkedin");
  const [observacao, setObservacao] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLeadId("");
      setStatus("contatado");
      setCanal("linkedin");
      setObservacao("");
      setError(null);
    }
  }, [open]);

  async function handleSave() {
    if (!leadId) {
      setError("Selecione um lead.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const res = await fetch("/api/interacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          status,
          canal,
          observacao: observacao || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.details ||
            data?.error ||
            "Erro ao registrar a interação."
        );
        setSaving(false);
        return;
      }

      onCreated();
      onClose();
    } catch (e) {
      console.error(e);
      setError("Erro inesperado ao salvar a interação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Nova interação
          </DialogTitle>

          <DialogDescription>
            Registre manualmente um contato realizado com o lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Lead */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Lead
            </label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="
                w-full rounded-lg border px-3 py-2 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-slate-900/40
              "
            >
              <option value="">Selecione um lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="
                w-full rounded-lg border px-3 py-2 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-slate-900/40
              "
            >
              <option value="contatado">Contatado</option>
              <option value="respondeu">Respondeu</option>
              <option value="follow_up">Follow-up</option>
              <option value="negociacao">Negociação</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>

          {/* Canal */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Canal
            </label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="
                w-full rounded-lg border px-3 py-2 text-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-slate-900/40
              "
            >
              <option value="linkedin">LinkedIn</option>
              <option value="email">Email</option>
              <option value="telefone">Telefone</option>
              <option value="reuniao">Reunião</option>
            </select>
          </div>

          {/* Observação */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={4}
              className="
                w-full rounded-lg border px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-slate-900/40
              "
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              px-4 py-2 rounded-lg border text-sm font-medium
              border-slate-300 text-slate-700
              hover:bg-slate-50
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="
              px-4 py-2 rounded-lg text-sm font-medium
              bg-slate-900 text-white
              hover:bg-slate-800
            "
          >
            {saving ? "Salvando..." : "Salvar interação"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
