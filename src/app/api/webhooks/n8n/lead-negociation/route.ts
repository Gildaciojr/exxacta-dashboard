import { NextResponse } from "next/server";
import { validateN8nSignature } from "@/lib/validateN8nSignature";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadNegociationPayload = {
  lead?: {
    id?: string | null;
    nome?: string | null;
    email?: string | null;
    telefone?: string | null;
  };
  event?: string;
  received_at?: string;
};

function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
}

export async function POST(req: Request) {
  if (!validateN8nSignature(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: LeadNegociationPayload;
  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ Erro ao interpretar JSON do webhook lead-negociation:", err);
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
  // 1️⃣ Atualiza status → negociacao
  // ==========================================================
  const { error: updateError } = await supabaseAdmin
    .from("leads")
    .update({ status: "negociacao", atualizado_em: nowIso })
    .eq("id", leadId);

  if (updateError) {
    console.error("❌ Erro ao atualizar lead → negociacao:", updateError);
    return NextResponse.json(
      { error: "Erro ao atualizar lead", details: updateError.message },
      { status: 500 }
    );
  }

  // ==========================================================
  // 2️⃣ Registra a interação de Negociação iniciada
  // ==========================================================
  const { error: interacaoError } = await supabaseAdmin
    .from("interacoes")
    .insert({
      lead_id: leadId,
      status: "negociacao",
      canal: "automacao_n8n",
      observacao: "Negociação iniciada automaticamente (lead em possível fechamento).",
      criado_em: nowIso,
    });

  if (interacaoError) {
    console.error("⚠️ Interação não registrada (negociacao):", interacaoError);
  }

  // ==========================================================
  // 3️⃣ Retorno final
  // ==========================================================
  return NextResponse.json(
    {
      ok: true,
      lead_id: leadId,
      status: "negociacao",
      exibidoNoDashboard: "Qualificado",
      message: "Negociação registrada e lead marcado como qualificado.",
    },
    { status: 200 }
  );
}
