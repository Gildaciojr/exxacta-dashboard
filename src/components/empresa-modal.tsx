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
import { Globe, Linkedin, Building2 } from "lucide-react";
import type { Empresa } from "@/types/empresa";

type Props = {
  open: boolean;
  onClose: () => void;
  empresa: Empresa | null;
};

export function EmpresaModal({ open, onClose, empresa }: Props) {
  // ===============================
  // 🔹 HOOKS (sempre no topo)
  // ===============================
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [tamanho, setTamanho] = useState("10_ate_20");
  const [site, setSite] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===============================
  // 🔹 SINCRONIZAÇÃO SEGURA
  // ===============================
  useEffect(() => {
    if (!empresa) return;

    setNome(empresa.nome || "");
    setCidade(empresa.cidade || "");
    setTamanho(empresa.tamanho || "10_ate_20");
    setSite(empresa.site || "");
    setLinkedinUrl(empresa.linkedin_url || "");
    setError(null);
  }, [empresa]);

  // ===============================
  // 🔹 GUARD (após hooks)
  // ===============================
  if (!empresa) return null;
  const empresaSafe = empresa;

  // ===============================
  // ACTIONS
  // ===============================
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

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erro ao salvar alterações.");
        return;
      }

      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta empresa?\nEssa ação não pode ser desfeita."
    );
    if (!confirmar) return;

    try {
      setRemoving(true);
      setError(null);

      const res = await fetch(`/api/empresas/${empresaSafe.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Erro ao excluir empresa.");
        return;
      }

      window.location.reload();
    } finally {
      setRemoving(false);
    }
  }

  // ===============================
  // UI
  // ===============================
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-gradient-to-br from-white to-[#E0F2FE] border border-[#BFDBFE] rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-extrabold text-[#0A2A5F]">
                {empresaSafe.nome}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 mt-1">
                Detalhes e edição da empresa cadastrada
              </DialogDescription>
            </div>

            <span className="w-11 h-11 rounded-2xl bg-white/70 border border-[#BFDBFE] flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-[#0A2A5F]" />
            </span>
          </div>
        </DialogHeader>

        {/* LINKS */}
        <div className="flex items-center gap-2 pt-4">
          {empresaSafe.site && (
            <a
              href={
                empresaSafe.site.startsWith("http")
                  ? empresaSafe.site
                  : `https://${empresaSafe.site}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              <Globe size={14} />
              Site
            </a>
          )}

          {empresaSafe.linkedin_url && (
            <a
              href={empresaSafe.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#BFDBFE] bg-white/70 text-[#0A2A5F]"
            >
              <Linkedin size={14} />
              LinkedIn
            </a>
          )}
        </div>

        {/* FORM */}
        <div className="space-y-4 pt-4">
          <Input label="Nome da empresa" value={nome} onChange={setNome} />
          <Input label="Cidade" value={cidade} onChange={setCidade} />

          <div>
            <label className="text-sm font-medium">Tamanho</label>
            <select
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
            >
              <option value="10_ate_20">10 até 20</option>
              <option value="21_ate_50">21 até 50</option>
              <option value="51_ate_100">51 até 100</option>
              <option value="101_ate_150">101 até 150</option>
            </select>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </p>
          )}

          <p className="text-xs text-slate-400">
            Criada em{" "}
            {new Date(empresaSafe.criado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>

        <DialogFooter className="flex justify-between pt-6">
          <button
            onClick={handleDelete}
            disabled={removing}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {removing ? "Excluindo..." : "Excluir Empresa"}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !nome.trim()}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}
