import { NextResponse } from "next/server";
import { validateN8nSignature } from "@/lib/validateN8nSignature";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadBase = {
  id?: string | null;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
};

type FollowUpWebhook = {
  lead?: LeadBase;
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

  let body: FollowUpWebhook;
  try {
    body = await req.json();
  } catch (err) {
    console.error("❌ Erro ao interpretar JSON (lead-followup):", err);
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
  // 1️⃣ Atualiza o lead como "email_enviado"  (dia 03 / 1ª automação)
  // ==========================================================
  const { error: updateError } = await supabaseAdmin
    .from("leads")
    .update({
      status: "email_enviado",
      atualizado_em: nowIso,
    })
    .eq("id", leadId);

  if (updateError) {
    console.error("❌ Erro ao atualizar lead (email_enviado):", updateError);
    return NextResponse.json(
      { error: "Erro ao atualizar lead", details: updateError.message },
      { status: 500 }
    );
  }

  // ==========================================================
  // 2️⃣ Criar interação automática no histórico
  // ==========================================================
  const { error: interacaoError } = await supabaseAdmin
    .from("interacoes")
    .insert({
      lead_id: leadId,
      status: "email_enviado",
      canal: "email",
      observacao: "Follow-up automático inicial via n8n (Dia 01)",
      criado_em: nowIso,
    });

  if (interacaoError) {
    console.error("⚠️ Não foi possível registrar interação:", interacaoError);
   
  }

  // ==========================================================
  // 3️⃣ Retorno ao n8n
  // ==========================================================
  return NextResponse.json(
    {
      ok: true,
      lead_id: leadId,
      status: "email_enviado",
      exibidoNoDashboard: "Contato realizado",
      message: "Follow-up registrado com sucesso.",
    },
    { status: 200 }
  );
}
