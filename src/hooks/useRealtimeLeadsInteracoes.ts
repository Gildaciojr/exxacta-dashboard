"use client";

import { useEffect } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

/* ============================
   TIPOS DE DADOS
============================ */

export type Lead = {
  id: string;
  status?: string;
  perfil?: string;
  email?: string | null;
  telefone?: string | null;
  empresa_id?: string | null;
};

export type Interacao = {
  id: string;
  lead_id: string;
  status: string;
  canal?: string | null;
  observacao?: string | null;
  criado_em?: string;
};

/* ============================
   TYPE GUARDS
============================ */

function isLead(value: unknown): value is Lead {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as Lead).id === "string"
  );
}

function isInteracao(value: unknown): value is Interacao {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "lead_id" in value &&
    "status" in value
  );
}

/* ============================
   PARÂMETROS DO HOOK
============================ */

type Params = {
  onInteracaoInsert?: (row: Interacao) => void;
  onInteracaoUpdate?: (row: Interacao) => void;
  onInteracaoDelete?: (id: string) => void; // 
  onLeadInsert?: (row: Lead) => void;
  onLeadUpdate?: (row: Lead) => void;
};

/* ============================
   HOOK REALTIME
============================ */

export function useRealtimeLeadsInteracoes({
  onInteracaoInsert,
  onInteracaoUpdate,
  onInteracaoDelete,
  onLeadInsert,
  onLeadUpdate,
}: Params) {
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    channel = supabase
      .channel("realtime-leads-interacoes")

      // ============================
      // INTERAÇÕES - INSERT
      // ============================
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "interacoes" },
        (payload: RealtimePostgresChangesPayload<Interacao>) => {
          if (isInteracao(payload.new)) {
            onInteracaoInsert?.(payload.new);
          }
        },
      )

      // ============================
      // INTERAÇÕES - UPDATE
      // ============================
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "interacoes" },
        (payload: RealtimePostgresChangesPayload<Interacao>) => {
          if (isInteracao(payload.new)) {
            onInteracaoUpdate?.(payload.new);
          }
        },
      )

      // ============================
      // 🔥 INTERAÇÕES - DELETE 
      // ============================
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "interacoes" },
        (payload: RealtimePostgresChangesPayload<Interacao>) => {
          const oldRow = payload.old;

          if (
            oldRow &&
            typeof oldRow === "object" &&
            "id" in oldRow &&
            typeof (oldRow as { id: unknown }).id === "string"
          ) {
            onInteracaoDelete?.((oldRow as { id: string }).id);
          }
        },
      )

      // ============================
      // LEADS - INSERT
      // ============================
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload: RealtimePostgresChangesPayload<Lead>) => {
          if (isLead(payload.new)) {
            onLeadInsert?.(payload.new);
          }
        },
      )

      // ============================
      // LEADS - UPDATE
      // ============================
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload: RealtimePostgresChangesPayload<Lead>) => {
          if (isLead(payload.new)) {
            onLeadUpdate?.(payload.new);
          }
        },
      )

      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [
    onInteracaoInsert,
    onInteracaoUpdate,
    onInteracaoDelete,
    onLeadInsert,
    onLeadUpdate,
  ]);
}
