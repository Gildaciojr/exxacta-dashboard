import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ======================================================
   SCHEMA
====================================================== */

const updateSchema = z.object({
  status: z.enum([
    "contatado",
    "respondeu",
    "follow_up",
    "negociacao",
    "fechado",
    "perdido",
  ]),
  canal: z
    .enum(["linkedin", "email", "telefone", "reuniao", "automacao_n8n"])
    .optional()
    .nullable(),
  observacao: z.string().optional().nullable(),
});

/* ======================================================
   PUT /api/interacoes/:id
====================================================== */

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, canal, observacao } = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("interacoes")
      .update({
        status,
        canal: canal ?? null,
        observacao: observacao ?? null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Interação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Interação atualizada com sucesso",
        interacao: data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro interno:", err);
    return NextResponse.json(
      { error: "Erro interno ao atualizar interação" },
      { status: 500 }
    );
  }
}

/* ======================================================
   DELETE /api/interacoes/:id
   🔥 NOVO — LIBERA EXCLUSÃO DE LEAD / EMPRESA
====================================================== */

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID da interação não informado" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("interacoes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir interação:", error);
      return NextResponse.json(
        { error: "Erro ao excluir interação" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Interação excluída com sucesso" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro interno ao excluir interação:", err);
    return NextResponse.json(
      { error: "Erro interno ao excluir interação" },
      { status: 500 }
    );
  }
}
