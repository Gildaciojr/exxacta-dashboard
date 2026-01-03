"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EstatisticasPage() {
  const [stats, setStats] = useState({
    leads: 0,
    empresas: 0,
    interacoes: 0,
  });

  useEffect(() => {
    async function load() {
      const [{ count: leads }, { count: empresas }, { count: interacoes }] =
        await Promise.all([
          supabase.from("leads").select("id", { count: "exact", head: true }),
          supabase
            .from("empresas")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("interacoes")
            .select("id", { count: "exact", head: true }),
        ]);

      setStats({
        leads: leads || 0,
        empresas: empresas || 0,
        interacoes: interacoes || 0,
      });
    }

    load();
  }, []);

  return (
    <div className="p-6 space-y-4  ">
      <header>
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-sm text-slate-500">
          Visão geral dos dados do CRM.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Leads cadastrados" value={stats.leads} />
        <StatCard title="Empresas cadastradas" value={stats.empresas} />
        <StatCard title="Interações registradas" value={stats.interacoes} />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
