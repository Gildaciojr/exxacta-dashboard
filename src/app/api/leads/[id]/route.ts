import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type LeadUpdateBody = {
  nome?: string;
  cargo?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  telefone?: string | null;
  perfil?: string;
  empresa_id?: string | null;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/* =========================================================
   PUT — ATUALIZAR LEAD
========================================================= */
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (!id || !isUuid(id)) {
    return NextResponse.json(
      { error: "ID do lead inválido ou não informado" },
      { status: 400 }
    );
  }

  let body: LeadUpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.nome || body.nome.trim().length < 2) {
    return NextResponse.json(
      { error: "Nome é obrigatório e precisa ter pelo menos 2 caracteres" },
      { status: 400 }
    );
  }

  if (body.perfil !== undefined && body.perfil.trim() === "") {
    return NextResponse.json(
      { error: "Perfil não pode ser vazio (quando enviado)" },
      { status: 400 }
    );
  }

  if (body.empresa_id && !isUuid(body.empresa_id)) {
    return NextResponse.json(
      { error: "empresa_id inválido (precisa ser UUID ou null)" },
      { status: 400 }
    );
  }

  if (body.empresa_id) {
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .select("id")
      .eq("id", body.empresa_id)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        {
          error: "empresa_id inválido",
          details: "Empresa não encontrada no banco.",
        },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabaseAdmin
    .from("leads")
    .update({
      nome: body.nome,
      cargo: body.cargo ?? null,
      linkedin_url: body.linkedin_url ?? null,
      email: body.email ?? null,
      telefone: body.telefone ?? null,
      perfil: body.perfil,
      empresa_id: body.empresa_id ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lead", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Lead atualizado com sucesso", lead: data },
    { status: 200 }
  );
}

/* =========================================================
   DELETE — EXCLUIR LEAD
========================================================= */
export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (!id || !isUuid(id)) {
    return NextResponse.json(
      { error: "ID do lead inválido ou não informado" },
      { status: 400 }
    );
  }

  const { count, error: countError } = await supabaseAdmin
    .from("interacoes")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", id);

  if (countError) {
    return NextResponse.json(
      { error: "Erro ao validar lead", details: countError.message },
      { status: 500 }
    );
  }

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: "Lead possui interações vinculadas",
        details: "Remova/desvincule as interações antes de excluir.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao excluir lead", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Lead excluído com sucesso" },
    { status: 200 }
  );
}
