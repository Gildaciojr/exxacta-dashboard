import { NextRequest, NextResponse } from "next/server";

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body?.url;
    const forceImport = body?.forceImport === true;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL da Apify é obrigatória" },
        { status: 400 }
      );
    }

    const backend = readEnv("NEXT_PUBLIC_BACKEND_URL");
    const secret = readEnv("EXXACTA_N8N_SECRET");

    const res = await fetch(`${backend}/api/apify/import-by-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-exxacta-signature": secret,
      },
      body: JSON.stringify({ url, forceImport }),
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro inesperado" },
      { status: 500 }
    );
  }
}
