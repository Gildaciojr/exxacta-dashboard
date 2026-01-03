"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/types/lead";
import { LeadModal } from "@/components/lead-modal";

type LeadWithEmpresa = Lead & {
  empresa: { nome: string }[] | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithEmpresa[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadWithEmpresa | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select(
        `
      id,
      nome,
      cargo,
      email,
      telefone,
      linkedin_url,
      perfil,
      empresa_id,
      criado_em,
      empresa:empresas ( nome )
    `
      )
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar leads:", error);
      setLeads([]);
      return;
    }

    setLeads((data as LeadWithEmpresa[]) || []);
  }

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("leads")
        .select(
          `
        id,
        nome,
        cargo,
        email,
        telefone,
        linkedin_url,
        perfil,
        empresa_id,
        criado_em,
        empresa:empresas ( nome )
      `
        )
        .order("criado_em", { ascending: false });

      if (error) {
        console.error("Erro ao carregar leads:", error);
        setLeads([]);
        setLoading(true);
        return;
      }

      setLeads((data as LeadWithEmpresa[]) || []);
      loadLeads().finally(() => setLoading(false));
    }

    load();
  }, []);

  const filtered = leads.filter((l) =>
    l.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="border-t border-[#E5E7EB]/80 text-4xl font-bold tracking-tight text-[#0A2A5F]">
        Leads coletados
      </h1>

      {/* search bar */}
      <input
        type="text"
        placeholder="Buscar lead por nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="
          w-full max-w-md px-4 py-2 rounded-lg border border-[#BFDBFE]
          text-sm outline-none
          bg-white/80 backdrop-blur-sm
          focus:ring-2 focus:ring-[#3B82F6]
        "
      />

      {/* STATE: LOADING */}
      {loading && <p className="text-sm text-slate-600">Carregando leads...</p>}

      {/* STATE: EMPTY */}
      {!loading && filtered.length === 0 && (
        <p className="text-slate-500 text-sm">Nenhum lead encontrado.</p>
      )}

      {/* tabela */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-xl bg-white/70 backdrop-blur-sm">
          <table className="w-full text-sm text-[#0A2A5F]">
            <thead>
              <tr
                className="
                  bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]
                  text-[#0A2A5F] font-semibold shadow-inner
                "
              >
                <th className="p-4 text-left">Nome</th>
                <th className="p-4 text-left">Cargo</th>
                <th className="p-4 text-left">Perfil</th>
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">LinkedIn</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((lead) => (
                <tr
                  key={lead.id}
                  className="
                    border-t border-[#E5E7EB]/60
                    hover:bg-white
                    hover:shadow-[0_4px_18px_rgba(59,130,246,0.15)]
                    hover:-translate-y-[1px]
                    transition-all
                  "
                >
                  <td className="p-4 font-medium">{lead.nome}</td>
                  <td className="p-4">{lead.cargo || "-"}</td>
                  <td className="p-4">
                    <span
                      className="
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                        bg-[#DBEAFE] text-[#1E3A8A]
                      "
                    >
                      {lead.perfil.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-[#1E3A8A]">
                    {lead.empresa && lead.empresa.length > 0
                      ? lead.empresa[0].nome
                      : "-"}
                  </td>

                  <td className="p-4">
                    {lead.linkedin_url ? (
                      <a
                        href={lead.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3B82F6] hover:underline"
                      >
                        perfil ↗
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="p-4">{lead.email ?? "-"}</td>

                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="
                        inline-flex items-center gap-1
                        text-[#1E3A8A] font-semibold text-xs
                        hover:text-[#3B82F6] hover:underline
                        transition-all
                      "
                    >
                      Ver detalhes →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE DETALHES DO LEAD */}
      {selectedLead && (
        <LeadModal
          open={!!selectedLead}
          onClose={() => {
            setSelectedLead(null);
            loadLeads(); // 🔁 recarrega automaticamente ao fechar
          }}
          lead={selectedLead}
          onUpdated={loadLeads} // 🔥 atualiza ao salvar/excluir
        />
      )}
    </div>
  );
}
