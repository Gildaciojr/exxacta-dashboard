import { NextResponse } from "next/server";
import { validateN8nSignature } from "@/lib/validateN8nSignature";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadLostPayload = {
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
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value
  );
}

export async function POST(req: Request) {
  if (!validateN8nSignature(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: LeadLostPayload;
  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ JSON inválido no webhook lead-lost:", err);
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
  // 1️⃣ Atualiza o lead como "perdido"
  // ==========================================================
  const { error: updateError } = await supabaseAdmin
    .from("leads")
    .update({ status: "perdido", atualizado_em: nowIso })
    .eq("id", leadId);

  if (updateError) {
    console.error("❌ Erro ao atualizar lead → perdido:", updateError);
    return NextResponse.json(
      { error: "Erro ao atualizar lead", details: updateError.message },
      { status: 500 }
    );
  }

  // ==========================================================
  // 2️⃣ Cria a interação automática registrando a origem
  // ==========================================================
  const { error: interacaoError } = await supabaseAdmin
    .from("interacoes")
    .insert({
      lead_id: leadId,
      status: "perdido",
      canal: "automacao_n8n",
      observacao: "Marcado como perdido automaticamente pelo fluxo (n8n).",
      criado_em: nowIso,
    });

  if (interacaoError) {
    console.error("⚠️ Falha ao registrar interação (perdido):", interacaoError);
    // NUNCA quebrar o fluxo — registrar e seguir
  }

  // ==========================================================
  // 3️⃣ Resposta OK
  // ==========================================================
  return NextResponse.json(
    {
      ok: true,
      lead_id: leadId,
      status: "perdido",
      exibidoNoDashboard: "Perdido",
      message: "Lead marcado como perdido com sucesso.",
    },
    { status: 200 }
  );
}
