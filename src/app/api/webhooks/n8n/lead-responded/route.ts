import { NextResponse } from "next/server";
import { validateN8nSignature } from "@/lib/validateN8nSignature";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadWebhookPayload = {
  lead?: {
    id?: string | null;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
  };
  event?: string;
  timestamp?: string;
};

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
}

export async function POST(req: Request) {
  if (!validateN8nSignature(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: LeadWebhookPayload;
  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ Erro ao ler JSON do webhook lead-responded:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const leadId = body.lead?.id ?? null;

  if (!leadId || !isUuid(leadId)) {
    return NextResponse.json(
      { error: "Lead ID inválido ou ausente" },
      { status: 400 }
    );
  }

  const nowIso = new Date().toISOString();

  // ==========================================================
  // 1️⃣ Atualiza status do lead → "interessado"
  // ==========================================================
  const { error: updateError } = await supabaseAdmin
    .from("leads")
    .update({ status: "interessado", atualizado_em: nowIso })
    .eq("id", leadId);

  if (updateError) {
    console.error("❌ Erro ao atualizar lead:", updateError);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }

  // ==========================================================
  // 2️⃣ Registra a interação automaticamente
  // ==========================================================
  const { error: interacaoError } = await supabaseAdmin
    .from("interacoes")
    .insert({
      lead_id: leadId,
      status: "respondeu",
      canal: "email",
      observacao: "O lead respondeu ao contato automático (detectado via n8n).",
      criado_em: nowIso,
    });

  if (interacaoError) {
    console.error("⚠️ Interação não registrada:", interacaoError);
    // NÃO quebra o fluxo — apenas loga
  }

  return NextResponse.json(
    {
      ok: true,
      lead_id: leadId,
      status: "interessado",
      message: "Lead marcado como interessado com sucesso.",
    },
    { status: 200 }
  );
}
