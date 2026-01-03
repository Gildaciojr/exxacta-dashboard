import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Body = {
  lead_id: string;
  status: string;
};

// valida UUID
function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function POST(req: Request) {
  let body: Body;

  // 🔥 Garantindo JSON válido
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { lead_id, status } = body;

  // 🔥 Validações obrigatórias
  if (!lead_id || !status) {
    return NextResponse.json(
      { error: "lead_id e status são obrigatórios" },
      { status: 400 }
    );
  }

  // 🔥 UUID precisa ser válido
  if (!isUuid(lead_id)) {
    return NextResponse.json(
      { error: "lead_id inválido (precisa ser UUID válido)" },
      { status: 400 }
    );
  }

  // 🔥 Verifica se o lead existe antes de atualizar
  const { data: lead } = await supabaseAdmin
    .from("leads")
    .select("id")
    .eq("id", lead_id)
    .single();

  if (!lead) {
    return NextResponse.json(
      { error: "Lead não encontrado no banco" },
      { status: 404 }
    );
  }

  // 🔥 Atualiza e retorna o lead atualizado
  const { data, error } = await supabaseAdmin
    .from("leads")
    .update({ status })
    .eq("id", lead_id)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status", details: error.message },
      { status: 500 }
    );
  }

  // 🔥 Resposta final
  return NextResponse.json(
    {
      message: "Status atualizado com sucesso",
      lead: data,
    },
    { status: 200 }
  );
}
