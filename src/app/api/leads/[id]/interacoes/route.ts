import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !isUuid(id)) {
    return NextResponse.json(
      { error: "ID do lead inválido" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("interacoes")
    .select(`
      id,
      status,
      canal,
      observacao,
      criado_em
    `)
    .eq("lead_id", id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao buscar interações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar interações", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data || [], { status: 200 });
}
