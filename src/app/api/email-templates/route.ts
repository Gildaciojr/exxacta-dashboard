import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Etapa = "day01" | "day03" | "day07";

function isEtapa(v: unknown): v is Etapa {
  return v === "day01" || v === "day03" || v === "day07";
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .select("*")
    .in("etapa", ["day01", "day03", "day07"])
    .order("etapa", { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar templates" },
      { status: 500 }
    );
  }

  return NextResponse.json(data ?? [], { status: 200 });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { etapa, assunto, corpo, ativo } = body;

    if (!isEtapa(etapa)) {
      return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .upsert(
        {
          etapa,
          assunto,
          corpo,
          ativo: typeof ativo === "boolean" ? ativo : true,
          atualizado_em: now,
        },
        { onConflict: "etapa" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("Erro Supabase:", error);
      return NextResponse.json(
        { error: "Erro ao salvar template", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}
