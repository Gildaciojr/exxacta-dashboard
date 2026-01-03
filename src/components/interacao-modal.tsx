"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Interacao = {
  id: string;
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
};

export function InteracaoModal({ open, onClose, interacao }: Props) {
  if (!interacao) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Interação registrada
          </DialogTitle>

          <DialogDescription>
            Detalhes da interação com o lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600">
            Lead: <strong>{interacao.lead?.nome || "Não informado"}</strong>
          </p>

          <p className="text-sm text-slate-600">
            Status: <strong className="uppercase">{interacao.status}</strong>
          </p>

          <p className="text-sm text-slate-600">
            Canal: <strong>{interacao.canal || "Não informado"}</strong>
          </p>

          {interacao.observacao && (
            <p className="text-sm text-slate-600">
              Observação: {interacao.observacao}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Registrado em{" "}
            {new Date(interacao.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-lg 
              bg-slate-900 text-white text-sm font-medium
              hover:bg-slate-700 transition
            "
          >
            Fechar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
