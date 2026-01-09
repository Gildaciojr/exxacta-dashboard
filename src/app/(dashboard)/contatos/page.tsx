"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  Mail,
  Phone,
  User,
  Filter,
} from "lucide-react";

type Lead = {
  id: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  perfil: string;
  status: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800 border-blue-200",
  contato_realizado: "bg-indigo-100 text-indigo-800 border-indigo-200",
  em_contato: "bg-yellow-100 text-yellow-800 border-yellow-200",
  interessado: "bg-emerald-100 text-emerald-800 border-emerald-200",
  qualificado: "bg-green-100 text-green-800 border-green-200",
  frio: "bg-slate-100 text-slate-700 border-slate-200",
  fechado: "bg-purple-100 text-purple-800 border-purple-200",
  perdido: "bg-red-100 text-red-800 border-red-200",
};

export default function ContatosPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("leads")
        .select("id,nome,cargo,email,telefone,perfil,status")
        .order("criado_em", { ascending: false });

      setLeads(data || []);
      setLoading(false);
    }

    load();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch =
        l.nome.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.telefone?.includes(search);

      const matchesStatus =
        statusFilter === "all" || l.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* ===== HEADER ===== */}
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold text-[#0A2A5F]">
          Contatos
        </h1>
        <p className="text-sm text-slate-500">
          Lista geral de contatos cadastrados no sistema.
        </p>
      </header>

      {/* ===== CONTROLES ===== */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white/70 px-3 py-2 shadow-sm">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, email ou telefone..."
              className="bg-transparent outline-none text-sm w-[260px]"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white/70 px-3 py-2 shadow-sm">
            <Filter size={16} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="contato_realizado">Contato realizado</option>
              <option value="em_contato">Em contato</option>
              <option value="interessado">Interessado</option>
              <option value="qualificado">Qualificado</option>
              <option value="frio">Frio</option>
              <option value="fechado">Fechado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>

        <span className="text-sm text-slate-500">
          {filteredLeads.length} contato(s)
        </span>
      </div>

      {/* ===== TABELA ===== */}
      <div className="rounded-2xl border border-[#BFDBFE] bg-white/70 backdrop-blur-sm shadow-xl overflow-hidden">
        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE] text-[#0A2A5F]">
              <tr>
                <th className="text-left px-4 py-3">Contato</th>
                <th className="text-left px-4 py-3">Perfil</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Carregando contatos...
                  </td>
                </tr>
              )}

              {!loading && filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Nenhum contato encontrado.
                  </td>
                </tr>
              )}

              {filteredLeads.map((l) => (
                <tr
                  key={l.id}
                  className="border-t hover:bg-[#EFF6FF]/50 transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center">
                        <User size={16} />
                      </span>
                      <div>
                        <p className="font-semibold">{l.nome}</p>
                        <p className="text-xs text-slate-500">
                          {l.cargo || "Cargo não informado"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {l.perfil}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full border ${
                        STATUS_COLORS[l.status || "novo"]
                      }`}
                    >
                      {l.status || "novo"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {l.email && (
                        <a
                          href={`mailto:${l.email}`}
                          className="p-2 rounded-lg border border-[#BFDBFE] hover:bg-[#EFF6FF]"
                          title="Enviar e-mail"
                        >
                          <Mail size={14} />
                        </a>
                      )}
                      {l.telefone && (
                        <a
                          href={`tel:${l.telefone}`}
                          className="p-2 rounded-lg border border-[#BFDBFE] hover:bg-[#EFF6FF]"
                          title="Ligar"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
