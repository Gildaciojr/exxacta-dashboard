import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("email_template")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Erro ao buscar template:", error);
      return NextResponse.json(
        { error: "Erro ao buscar template", details: error.message },
        { status: 500 }
      );
    }

    // se não existir ainda, retorna formato padrão
    if (!data) {
      return NextResponse.json(
        {
          id: "default",
          assunto: "",
          email_template: "",
          assinatura: "",
          ativo: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Erro interno GET /email-template:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, assunto, email_template, assinatura, ativo } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID inválido ou ausente" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("email_template")
      .upsert({
        id,
        assunto: assunto ?? "",
        email_template: email_template ?? "",
        assinatura: assinatura ?? "",
        ativo: ativo ?? true,
        atualizado_em: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar template:", error);
      return NextResponse.json(
        { error: "Erro ao salvar template", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Template salvo com sucesso", data },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro interno PUT /email-template:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar" },
      { status: 500 }
    );
  }
}
