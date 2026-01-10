import { NextRequest, NextResponse } from "next/server";

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
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

    // ✅ URL do backend (já existe no Vercel)
    const backendUrl = readEnv("NEXT_PUBLIC_BACKEND_URL");

    // ✅ ASSINATURA CORRETA (EXISTE no Vercel)
    const signature = readEnv("NEXT_PUBLIC_EXXACTA_SIGNATURE");

    const response = await fetch(
      `${backendUrl}/api/apify/import-by-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-exxacta-signature": signature,
        },
        body: JSON.stringify({
          url,
          forceImport,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado no import da Apify",
      },
      { status: 500 }
    );
  }
}
