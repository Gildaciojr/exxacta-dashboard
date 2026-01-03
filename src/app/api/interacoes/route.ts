import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ======================================================
   SCHEMA
====================================================== */

const interacaoSchema = z.object({
  lead_id: z.string().uuid(),
  status: z.enum([
    "contatado",
    "respondeu",
    "follow_up",
    "negociacao",
    "fechado",
    "perdido",
  ]),
  canal: z.enum([
    "linkedin",
    "email",
    "telefone",
    "reuniao",
  ]).optional().nullable(),
  observacao: z.string().optional().nullable(),
});

/* ======================================================
   MAPA: INTERAÇÃO → STATUS DO LEAD (PIPELINE OFICIAL)
====================================================== */

function mapInteracaoParaStatusLead(
  statusInteracao: string
): string | null {
  const map: Record<string, string> = {
    contatado: "em_contato",
    respondeu: "interessado",
    follow_up: "em_contato",
    negociacao: "qualificado",
    fechado: "fechado",
    perdido: "perdido",
  };

  return map[statusInteracao] ?? null;
}

/* ======================================================
   POST /api/interacoes
====================================================== */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = interacaoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lead_id, status, canal, observacao } = parsed.data;

    /* 1. Verifica se o lead existe */
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    /* 2. Cria a interação */
    const { data: interacao, error: interacaoError } =
      await supabaseAdmin
        .from("interacoes")
        .insert({
          lead_id,
          status,
          canal: canal ?? null,
          observacao: observacao ?? null,
        })
        .select("*")
        .single();

    if (interacaoError) {
      console.error("Erro ao criar interação:", interacaoError);
      return NextResponse.json(
        { error: "Erro ao criar interação" },
        { status: 500 }
      );
    }

    /* 3. Atualiza status do lead automaticamente */
    const novoStatusLead = mapInteracaoParaStatusLead(status);

    if (novoStatusLead) {
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update({ status: novoStatusLead })
        .eq("id", lead_id);

      if (updateError) {
        console.error(
          "Erro ao atualizar status do lead:",
          updateError
        );
        // não quebra o fluxo
      }
    }

    /* 4. Retorno */
    return NextResponse.json(
      {
        message: "Interação criada com sucesso",
        interacao,
        lead_status_atualizado: novoStatusLead,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição" },
      { status: 500 }
    );
  }
}
