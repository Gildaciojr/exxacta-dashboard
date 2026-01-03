import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("leads")
    .select("cargo")
    .neq("cargo", "")     // ignora vazios
    .not("cargo", "is", null)
    .order("cargo", { ascending: true });

  if (error) {
    console.error("Erro ao buscar cargos:", error);
    return NextResponse.json({ error: "Erro ao buscar cargos" }, { status: 500 });
  }

  const cargosUnicos = Array.from(new Set(data.map((c) => c.cargo)));
  return NextResponse.json(cargosUnicos, { status: 200 });
}
