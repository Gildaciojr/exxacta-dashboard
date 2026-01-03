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

type Empresa = {
  id: string;
  nome: string;
  cidade: string | null;
  tamanho: string;
  site: string | null;
  linkedin_url: string | null;
  criado_em: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  empresa: Empresa | null;
};

export function EmpresaModal({ open, onClose, empresa }: Props) {
  // 🔹 HOOKS SEMPRE NO TOPO (regra do React)
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [tamanho, setTamanho] = useState("10_ate_20");
  const [site, setSite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // sincroniza dados quando empresa muda
  useEffect(() => {
    if (!empresa) return;

    setNome(empresa.nome || "");
    setCidade(empresa.cidade || "");
    setTamanho(empresa.tamanho || "10_ate_20");
    setSite(empresa.site || "");
    setLinkedinUrl(empresa.linkedin_url || "");
    setError(null);
  }, [empresa]);

  // 🔒 AGORA SIM podemos sair cedo
  if (!empresa) {
    return null;
  }

  // 🔐 empresa garantida a partir daqui
  const empresaSafe: Empresa = empresa;

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);

      const res = await fetch(`/api/empresas/${empresaSafe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cidade: cidade || null,
          tamanho,
          site: site || null,
          linkedin_url: linkedinUrl || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.details || data?.error || "Erro ao salvar alterações.");
        return;
      }

      window.location.reload();
    } catch (e) {
      console.error(e);
      setError("Erro inesperado ao salvar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta empresa?\nEsta ação não pode ser desfeita."
    );
    if (!confirmar) return;

    try {
      setRemoving(true);
      setError(null);

      const res = await fetch(`/api/empresas/${empresaSafe.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          data?.details ||
            data?.error ||
            "Erro ao excluir a empresa. Verifique se ela possui leads vinculados."
        );
        return;
      }

      window.location.reload();
    } catch (e) {
      console.error(e);
      setError("Erro inesperado ao excluir a empresa.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {empresaSafe.nome}
          </DialogTitle>
          <DialogDescription>
            Detalhes e edição da empresa cadastrada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome da empresa</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Cidade</label>
            <input
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Tamanho</label>
            <select
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="10_ate_20">10 até 20</option>
              <option value="21_ate_50">21 até 50</option>
              <option value="51_ate_100">51 até 100</option>
            </select>
          </div>

          <p className="text-xs text-slate-400">
            Criada em{" "}
            {new Date(empresaSafe.criado_em).toLocaleDateString("pt-BR")}
          </p>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex justify-between mt-6">
          {/* ❌ Excluir Empresa */}
          <button
            onClick={handleDelete}
            disabled={saving || removing}
            className="
      px-4 py-2 text-sm font-medium rounded-lg
      bg-gradient-to-r from-red-500 to-red-700 text-white
      shadow-lg shadow-red-500/30
      hover:scale-[1.03] hover:shadow-red-500/50
      active:scale-95 transition-all
      disabled:opacity-50 disabled:cursor-not-allowed
    "
          >
            {removing ? "Excluindo..." : "Excluir Empresa"}
          </button>

          <div className="flex gap-3">
            {/* 🚫 Cancelar */}
            <button
              onClick={onClose}
              className="
        px-4 py-2 text-sm rounded-lg
        bg-slate-200 text-slate-700
        hover:bg-slate-300 hover:scale-[1.03]
        active:scale-95 transition-all
      "
            >
              Cancelar
            </button>

            {/* 💾 Salvar Alterações */}
            <button
              onClick={handleSave}
              disabled={saving || !nome.trim()}
              className="
        px-5 py-2 text-sm font-semibold rounded-lg
        bg-gradient-to-r from-blue-500 to-blue-700 text-white
        shadow-lg shadow-blue-500/30
        hover:scale-[1.05] hover:shadow-blue-500/50
        active:scale-95 transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      "
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
