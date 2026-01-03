import { NextResponse } from "next/server";
import { validateN8nSignature } from "@/lib/validateN8nSignature";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ----------------------------------------------------------
   TIPAGEM DO PAYLOAD
---------------------------------------------------------- */

type LeadPayload = {
  id?: string | null;
  nome?: string | null;
  cargo?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  telefone?: string | null;
  perfil?: string | null;
  empresa_id?: string | null;
};

/* ----------------------------------------------------------
   VALIDAÇÃO DE UUID
---------------------------------------------------------- */

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

/* ----------------------------------------------------------
   ENUM PERFIL — valores existentes no Supabase
---------------------------------------------------------- */

const PERFIS_VALIDOS = [
  "ceo",
  "diretor",
  "socio",
  "contador",
  "gerente",
  "outro",
  "decisor",
] as const;

function normalizarPerfil(perfil: string | null | undefined): string {
  if (!perfil) return "outro"; // B2 (escolha do usuário)
  const normalizado = perfil.trim().toLowerCase();
  return PERFIS_VALIDOS.includes(normalizado as (typeof PERFIS_VALIDOS)[number])
    ? normalizado
    : "outro";
}

/* ----------------------------------------------------------
   POST — RECEBE WEBHOOK DO N8N (lead.created)
---------------------------------------------------------- */

export async function POST(req: Request) {
  if (!validateN8nSignature(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    console.error("❌ JSON inválido no webhook lead-created");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Garante estrutura
  const leadPayload = (body as { lead?: LeadPayload })?.lead ?? {};

  /* -------------------------------
     CAMPOS OBRIGATÓRIOS
  -------------------------------- */

  if (!leadPayload.nome || !leadPayload.linkedin_url) {
    return NextResponse.json(
      { error: "Missing required fields (nome, linkedin_url)" },
      { status: 400 }
    );
  }

  /* -------------------------------
     TRATAMENTO DE ID
  -------------------------------- */

  const rawId = typeof leadPayload.id === "string" ? leadPayload.id : null;
  const hasValidId = rawId && isUuid(rawId);
  const perfilFinal = normalizarPerfil(leadPayload.perfil ?? null);

  /* -------------------------------
     PREPARO DO INSERT / UPDATE
  -------------------------------- */

  const nowIso = new Date().toISOString();

  const upsertPayload: {
    id?: string;
    nome: string;
    cargo: string | null;
    linkedin_url: string;
    email: string | null;
    telefone: string | null;
    perfil: string;
    empresa_id: string | null;
    status: string;
    atualizado_em: string;
  } = {
    nome: leadPayload.nome,
    cargo: leadPayload.cargo ?? null,
    linkedin_url: leadPayload.linkedin_url,
    email: leadPayload.email ?? null,
    telefone: leadPayload.telefone ?? null,
    perfil: perfilFinal,
    empresa_id: leadPayload.empresa_id ?? null,
    status: "novo",
    atualizado_em: nowIso,
  };

  if (hasValidId) {
    upsertPayload.id = rawId!;
  } else if (rawId) {
    console.warn(
      "⚠️ ID inválido recebido do webhook, deixando o Postgres gerar:",
      rawId
    );
  }

  /* -------------------------------
     UPSERT FINAL
  -------------------------------- */

  const { data, error } = await supabaseAdmin
    .from("leads")
    .upsert(upsertPayload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    console.error("❌ Erro ao upsert lead via webhook lead-created:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, lead: data }, { status: 200 });
}
