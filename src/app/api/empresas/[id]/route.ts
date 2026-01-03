import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type EmpresaUpdateBody = {
  nome?: string;
  cidade?: string | null;
  tamanho?: string;
  site?: string | null;
  linkedin_url?: string | null;
};

export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "ID da empresa não informado" },
      { status: 400 }
    );
  }

  let body: EmpresaUpdateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.nome || !body.tamanho) {
    return NextResponse.json(
      {
        error: "Campos obrigatórios ausentes",
        details: "nome e tamanho são obrigatórios",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("empresas")
    .update({
      nome: body.nome,
      cidade: body.cidade ?? null,
      tamanho: body.tamanho,
      site: body.site ?? null,
      linkedin_url: body.linkedin_url ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao atualizar empresa:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar empresa", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Empresa atualizada com sucesso", empresa: data },
    { status: 200 }
  );
}

export async function DELETE(
  _req: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "ID da empresa não informado" },
      { status: 400 }
    );
  }

  const { count, error: countError } = await supabaseAdmin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("empresa_id", id);

  if (countError) {
    return NextResponse.json(
      { error: "Erro ao validar empresa", details: countError.message },
      { status: 500 }
    );
  }

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: "Empresa possui leads vinculados",
        details: "Desvincule ou remova os leads antes de excluir a empresa.",
      },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("empresas")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Erro ao excluir empresa", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: "Empresa excluída com sucesso" },
    { status: 200 }
  );
}
