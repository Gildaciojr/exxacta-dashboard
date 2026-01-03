"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Building2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";

const TAMANHOS_EMPRESA = [
  { label: "10 a 20 funcionários", value: "10_ate_20" },
  { label: "21 a 50 funcionários", value: "21_ate_50" },
  { label: "51 a 100 funcionários", value: "51_ate_100" },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function AddEntityModal({ open, onClose }: Props) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"cliente" | "empresa" | "">("");

  /* CAMPOS */
  const [nome, setNome] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [cargo, setCargo] = useState("");
  const [perfil, setPerfil] = useState("");

  const [cnpj, setCnpj] = useState("");
  const [site, setSite] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [pais, setPais] = useState("Brasil");
  const [tamanho, setTamanho] = useState("");

  async function handleSave() {
    if (!nome) return alert("Nome é obrigatório");
    if (!linkedin) return alert("LinkedIn é obrigatório");

    if (tipo === "cliente") {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cargo: cargo || null,
          perfil,
          linkedin_url: linkedin,
          email: email || null,
          telefone: telefone || null,
          empresa_id: null,
        }),
      });

      if (!res.ok) return alert("Erro ao salvar cliente");
      alert("Cliente salvo com sucesso!");
    }

    if (tipo === "empresa") {
      if (!tamanho) return alert("Selecione o tamanho da empresa");
      const res = await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          cnpj: cnpj || null,
          site: site || null,
          linkedin_url: linkedin || null,
          cidade: cidade || null,
          estado: estado || null,
          pais,
          tamanho,
        }),
      });

      if (!res.ok) return alert("Erro ao salvar empresa");
      alert("Empresa salva com sucesso!");
    }

    router.refresh();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="
          w-[92%] max-w-[430px]
          bg-white/95 backdrop-blur-lg
          rounded-2xl shadow-xl
          border border-slate-200
          p-6
          animate-in fade-in zoom-in
        "
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#0A2A5F] text-center">
            Novo Registro
          </DialogTitle>
        </DialogHeader>

        {/* 🔘 SELETOR PREMIUM */}
        <div className="flex items-center justify-center gap-3 my-4">
          <button
            onClick={() => setTipo("cliente")}
            className={`
              flex flex-col items-center p-3 rounded-xl border w-32 cursor-pointer
              transition-all hover:scale-[1.04]
              text-sm
              ${tipo === "cliente"
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white border-slate-300 text-slate-700"}
            `}
          >
            <UserPlus size={24} />
            Cliente
          </button>

          <button
            onClick={() => setTipo("empresa")}
            className={`
              flex flex-col items-center p-3 rounded-xl border w-32 cursor-pointer
              transition-all hover:scale-[1.04]
              text-sm
              ${tipo === "empresa"
                ? "bg-green-600 text-white border-green-600 shadow-md"
                : "bg-white border-slate-300 text-slate-700"}
            `}
          >
            <Building2 size={24} />
            Empresa
          </button>
        </div>

        {/* FORMULARIOS */}
        {tipo && (
          <div className="grid gap-2">
            <input className="input" placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} />
            <input className="input" placeholder="LinkedIn *" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
            <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
            <input className="input" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)} />
          </div>
        )}

        {tipo === "cliente" && (
          <div className="grid gap-2 mt-4 border p-3 rounded-xl bg-white/60">
            <input className="input" placeholder="Cargo" value={cargo} onChange={e => setCargo(e.target.value)} />
            <input className="input" placeholder="Perfil / Nicho" value={perfil} onChange={e => setPerfil(e.target.value)} />
          </div>
        )}

        {tipo === "empresa" && (
          <div className="grid gap-2 mt-4 border p-3 rounded-xl bg-white/60 max-h-[220px] overflow-y-auto">
            <select className="input" value={tamanho} onChange={e => setTamanho(e.target.value)}>
              <option value="">Tamanho da empresa *</option>
              {TAMANHOS_EMPRESA.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <input className="input" placeholder="CNPJ" value={cnpj} onChange={e => setCnpj(e.target.value)} />
            <input className="input" placeholder="Site" value={site} onChange={e => setSite(e.target.value)} />
            <input className="input" placeholder="Cidade" value={cidade} onChange={e => setCidade(e.target.value)} />
            <input className="input" placeholder="Estado" value={estado} onChange={e => setEstado(e.target.value)} />
            <input className="input" placeholder="País" value={pais} onChange={e => setPais(e.target.value)} />
          </div>
        )}

        {/* BOTÕES 🔥 VIDA E IDENTIDADE */}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="
              flex items-center gap-2 px-4 py-2 rounded-xl
              border border-slate-300 text-slate-600
              hover:bg-slate-100 hover:shadow-md hover:border-slate-400
              transition-all
            "
          >
            <X size={16} />
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="
              flex items-center gap-2 px-5 py-2 rounded-xl
              bg-gradient-to-r from-[#0A2A5F] to-[#0F4C81]
              text-white font-semibold
              shadow-md hover:shadow-xl hover:scale-[1.03]
              transition-all
            "
          >
            <Check size={16} />
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
