"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, Building2, MessageCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/* ===================== TYPES ===================== */

type Totais = {
  leads: number;
  empresas: number;
  interacoes: number;
};

type LeadStatusRow = {
  status: string | null;
};

type StatusCount = {
  status: string;
  total: number;
};

/* ===================== CONSTANTS ===================== */

const STATUS_COLORS: Record<string, string> = {
  novo: "#3B82F6",
  contato_realizado: "#6366F1",
  em_contato: "#F59E0B",
  interessado: "#10B981",
  qualificado: "#22C55E",
  frio: "#64748B",
  fechado: "#8B5CF6",
  perdido: "#EF4444",
};

/* ===================== PAGE ===================== */

export default function EstatisticasPage() {
  const [loading, setLoading] = useState(true);
  const [totais, setTotais] = useState<Totais>({
    leads: 0,
    empresas: 0,
    interacoes: 0,
  });
  const [statusData, setStatusData] = useState<StatusCount[]>([]);

  useEffect(() => {
    async function load() {
      const [
        { count: leads },
        { count: empresas },
        { count: interacoes },
        { data: leadStatuses },
      ] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("empresas").select("id", { count: "exact", head: true }),
        supabase
          .from("interacoes")
          .select("id", { count: "exact", head: true }),
        supabase.from("leads").select("status"),
      ]);

      setTotais({
        leads: leads ?? 0,
        empresas: empresas ?? 0,
        interacoes: interacoes ?? 0,
      });

      // Agrupamento seguro no frontend
      const map = new Map<string, number>();

      (leadStatuses as LeadStatusRow[] | null)?.forEach((row) => {
        const status = row.status ?? "novo";
        map.set(status, (map.get(status) ?? 0) + 1);
      });

      setStatusData(
        Array.from(map.entries()).map(([status, total]) => ({
          status,
          total,
        }))
      );

      setLoading(false);
    }

    load();
  }, []);

  const pieData = useMemo(
    () =>
      statusData.map((s) => ({
        name: s.status,
        value: s.total,
        color: STATUS_COLORS[s.status] ?? "#CBD5E1",
      })),
    [statusData]
  );

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <header>
        <h1 className="text-3xl font-extrabold text-[#0A2A5F]">
          Estatísticas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visão executiva e estratégica do CRM
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Leads cadastrados"
          value={totais.leads}
          icon={<Users size={22} />}
          highlight
        />
        <KpiCard
          title="Empresas cadastradas"
          value={totais.empresas}
          icon={<Building2 size={22} />}
        />
        <KpiCard
          title="Interações registradas"
          value={totais.interacoes}
          icon={<MessageCircle size={22} />}
        />
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="rounded-2xl border border-[#BFDBFE] bg-white/70 p-5 shadow-xl">
          <h3 className="font-bold text-[#0A2A5F] mb-1">
            Distribuição por status
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Funil atual de leads
          </p>

          {loading ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar */}
        <div className="rounded-2xl border border-[#BFDBFE] bg-white/70 p-5 shadow-xl">
          <h3 className="font-bold text-[#0A2A5F] mb-1">
            Volume por status
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Quantidade absoluta
          </p>

          {loading ? (
            <p className="text-sm text-slate-500">Carregando...</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== COMPONENTS ===================== */

function KpiCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl border
        ${
          highlight
            ? "bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border-[#BFDBFE]"
            : "bg-white/70 border-[#E5E7EB]"
        }
        p-5 shadow-xl
        hover:shadow-[0_0_15px_4px_rgba(191,219,254,0.75)]
        transition-all
      `}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold text-[#0A2A5F] mt-1">
            {value}
          </p>
        </div>
        <span className="w-11 h-11 rounded-xl bg-white/80 border border-[#BFDBFE] flex items-center justify-center">
          {icon}
        </span>
      </div>
    </div>
  );
}
