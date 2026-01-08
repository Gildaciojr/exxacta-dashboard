// ⚠️ ROTA LEGADA — NÃO UTILIZADA EM PRODUÇÃO
// Importação HasData agora é feita via backend NestJS
import { NextRequest, NextResponse } from "next/server";
import { hasdataSearch } from "@/lib/hasdata";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const ll = searchParams.get("ll") ?? null;
  const start = Number(searchParams.get("start") ?? 0);

  if (!q) {
    return NextResponse.json(
      { error: "Parâmetro 'q' é obrigatório (consulta de busca)" },
      { status: 400 }
    );
  }

  try {
    const result = await hasdataSearch({
      q,
      ll: ll ?? undefined,
      start,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error("❌ Erro na busca HasData:", message);

    return NextResponse.json(
      { error: "Falha ao buscar dados", details: message },
      { status: 500 }
    );
  }
}
