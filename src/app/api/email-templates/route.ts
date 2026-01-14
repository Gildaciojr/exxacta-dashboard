import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Etapa = "day01" | "day03" | "day07";

function isEtapa(v: unknown): v is Etapa {
  return v === "day01" || v === "day03" || v === "day07";
}

export async function GET() {
  try {
    // retorna as 3 etapas (SaaS)
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .in("etapa", ["day01", "day03", "day07"])
      .order("etapa", { ascending: true });

    if (error) {
      console.error("Erro ao buscar email_templates:", error);
      return NextResponse.json(
        { error: "Erro ao buscar templates", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err) {
    console.error("Erro interno GET /email-templates:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, etapa, assunto, email_template, assinatura, ativo } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    if (!isEtapa(etapa)) {
      return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .upsert({
        id,
        etapa,
        assunto: assunto ?? "",
        email_template: email_template ?? "",
        assinatura: assinatura ?? "",
        ativo: typeof ativo === "boolean" ? ativo : true,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao salvar email_templates:", error);
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
    console.error("Erro interno PUT /email-templates:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar" },
      { status: 500 }
    );
  }
}
