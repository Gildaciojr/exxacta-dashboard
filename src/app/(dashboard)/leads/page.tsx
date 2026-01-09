"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/types/lead";
import { LeadModal } from "@/components/lead-modal";
import { Search, Users } from "lucide-react";

type LeadWithEmpresa = Lead & {
  empresa: { nome: string }[] | null;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithEmpresa[]>([]);
  const [selectedLead, setSelectedLead] =
    useState<LeadWithEmpresa | null>(null);
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
    async function init() {
      await loadLeads();
      setLoading(false);
    }
    init();
  }, []);

  const filtered = useMemo(
    () =>
      leads.filter((l) =>
        l.nome.toLowerCase().includes(search.toLowerCase())
      ),
    [leads, search]
  );

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#0A2A5F]">
            Leads coletados
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualização completa e gerenciamento dos leads captados
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white/70 px-4 py-2 shadow-sm">
            <Users size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-[#0A2A5F]">
              {filtered.length}
            </span>
            <span className="text-xs text-slate-500">leads</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#BFDBFE] bg-white/70 px-4 py-2 shadow-sm">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Buscar lead por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-[220px]"
            />
          </div>
        </div>
      </div>

      {/* ================= STATES ================= */}
      {loading && (
        <p className="text-sm text-slate-500">Carregando leads...</p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#BFDBFE] bg-white/50 p-6">
          <p className="text-sm text-slate-500">
            Nenhum lead encontrado com os filtros atuais.
          </p>
        </div>
      )}

      {/* ================= TABLE ================= */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-xl bg-white/70 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#0A2A5F]">
              <thead className="sticky top-0 z-10">
                <tr
                  className="
                    bg-gradient-to-r from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]
                    font-semibold shadow-inner
                  "
                >
                  <th className="p-4 text-left">Nome</th>
                  <th className="p-4 text-left">Cargo</th>
                  <th className="p-4 text-left">Perfil</th>
                  <th className="p-4 text-left">Empresa</th>
                  <th className="p-4 text-left">LinkedIn</th>
                  <th className="p-4 text-left">Contato</th>
                  <th className="p-4 text-right">Ações</th>
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
                    <td className="p-4 font-semibold">{lead.nome}</td>

                    <td className="p-4 text-slate-600">
                      {lead.cargo || "-"}
                    </td>

                    <td className="p-4">
                      <span
                        className="
                          inline-flex items-center px-2.5 py-1 rounded-full
                          text-[11px] font-bold uppercase tracking-wide
                          bg-[#DBEAFE] text-[#1E3A8A]
                        "
                      >
                        {lead.perfil}
                      </span>
                    </td>

                    <td className="p-4 font-medium text-[#1E3A8A]">
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
                          className="text-[#3B82F6] font-medium hover:underline"
                        >
                          Abrir perfil ↗
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-4 text-slate-600">
                      {lead.email || lead.telefone || "-"}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLead(lead)}
                        className="
                          inline-flex items-center gap-1
                          text-xs font-bold
                          text-[#1E3A8A]
                          hover:text-[#3B82F6]
                          hover:underline
                          transition
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
        </div>
      )}

      {/* ================= MODAL ================= */}
      {selectedLead && (
        <LeadModal
          open={!!selectedLead}
          onClose={() => {
            setSelectedLead(null);
            loadLeads();
          }}
          lead={selectedLead}
          onUpdated={loadLeads}
        />
      )}
    </div>
  );
}
