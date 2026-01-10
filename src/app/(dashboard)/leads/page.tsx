"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lead } from "@/types/lead";
import { LeadModal } from "@/components/lead-modal";
import { Search, Users, Linkedin, Mail } from "lucide-react";

/* =========================================================
   TIPOS
   ⚠️ Supabase SEMPRE retorna relação como ARRAY
========================================================= */
type LeadWithEmpresa = Lead & {
  empresa: {
    id: string;
    nome: string;
    tamanho: string | null;
    site: string | null;
    linkedin_url: string | null;
  }[];
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithEmpresa[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadWithEmpresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* =========================================================
     LOAD LEADS (JOIN CORRETO COM EMPRESAS)
  ========================================================= */
  async function loadLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select(`
        id,
        nome,
        cargo,
        email,
        telefone,
        linkedin_url,
        perfil,
        status,
        empresa_id,
        criado_em,
        empresa:empresas (
          id,
          nome,
          tamanho,
          site,
          linkedin_url
        )
      `)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao carregar leads:", error);
      setLeads([]);
      return;
    }

    setLeads((data as LeadWithEmpresa[]) ?? []);
  }

  /* =========================================================
     EFFECT
  ========================================================= */
  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      await loadLeads();
      if (active) setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================================
     FILTRO
  ========================================================= */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => l.nome.toLowerCase().includes(q));
  }, [leads, search]);

  /* =========================================================
     FORMATAR TAMANHO (FAIXA)
  ========================================================= */
  function formatTamanho(tamanho?: string | null) {
    const t = (tamanho || "").trim();
    if (!t) return "Não informado";

    return t
      .replaceAll("_ate_", " até ")
      .replaceAll("_", " ");
  }

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-[#0A2A5F]">
            Leads coletados
          </h1>
          <p className="text-sm text-slate-500">
            Visualização completa dos leads importados
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl border px-4 py-2 bg-white/70">
            <Users size={16} />
            <span className="font-semibold">{filtered.length}</span>
            <span className="text-xs text-slate-500">leads</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border px-4 py-2 bg-white/70">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar lead..."
              className="bg-transparent outline-none text-sm w-56"
            />
          </div>
        </div>
      </div>

      {/* ================= STATES ================= */}
      {loading && <p className="text-sm">Carregando leads...</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-slate-500">Nenhum lead encontrado.</p>
      )}

      {/* ================= TABELA ================= */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-2xl border bg-white/70 shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-4 text-left">Nome</th>
                <th className="p-4 text-left">Cargo</th>
                <th className="p-4 text-left">Empresa</th>
                <th className="p-4 text-left">Tamanho</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">LinkedIn</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((lead) => {
                const empresa =
                  lead.empresa && lead.empresa.length > 0
                    ? lead.empresa[0]
                    : null;

                return (
                  <tr key={lead.id} className="border-t">
                    <td className="p-4 font-semibold">{lead.nome}</td>

                    <td className="p-4">{lead.cargo || "-"}</td>

                    <td className="p-4">
                      {empresa?.nome ?? "-"}
                    </td>

                    <td className="p-4">
                      {formatTamanho(empresa?.tamanho)}
                    </td>

                    <td className="p-4">
                      {lead.email ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Mail size={14} />
                          {lead.email}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-4">
                      {lead.linkedin_url ? (
                        <a
                          href={lead.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Linkedin size={14} />
                          Ver perfil
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="text-blue-600 hover:underline"
                      >
                        Ver detalhes →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= MODAL ================= */}
      {selectedLead && (
        <LeadModal
          open
          lead={selectedLead}
          onClose={() => {
            setSelectedLead(null);
            loadLeads();
          }}
          onUpdated={loadLeads}
        />
      )}
    </div>
  );
}
