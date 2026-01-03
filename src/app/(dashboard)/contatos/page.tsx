"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Lead = {
  id: string;
  nome: string;
  cargo: string | null;
  email: string | null;
  telefone: string | null;
  perfil: string;
  status: string | null;
};

export default function ContatosPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="border-t border-[#E5E7EB]/10 text-4xl font-bold">Contatos</h1>
        <p className="border-t border-[#E5E7EB]/20 text-0xl font-bold tracking-tight text-[#0e2d5e]">
          Lista geral de contatos cadastrados.
        </p>
      </header>

      {loading && <p className="text-sm text-slate-500">Carregando...</p>}

      {!loading && leads.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhum contato cadastrado ainda.
        </p>
      )}

      {!loading && leads.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-xl bg-white/70 backdrop-blur-sm">
          <table className="w-full text-sm text-[#0A2A5F]">
            <thead className="
                  bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]
                  text-[#0A2A5F] font-semibold shadow-inner
                ">
              <tr>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-left px-3 py-2">Cargo</th>
                <th className="text-left px-3 py-2">Perfil</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Contato</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{l.nome}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {l.cargo || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{l.perfil}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {l.status || "novo"}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {l.email || l.telefone || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
