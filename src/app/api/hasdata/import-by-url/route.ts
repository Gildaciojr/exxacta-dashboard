import { NextRequest, NextResponse } from "next/server";

type ImportByUrlBody = {
  url?: string;
};

type BackendOk = {
  imported: number;
  skipped: number;
  total: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return v.trim();
}

export async function POST(req: NextRequest) {
  try {
    const bodyUnknown: unknown = await req.json();
    const body: ImportByUrlBody = isRecord(bodyUnknown)
      ? (bodyUnknown as ImportByUrlBody)
      : {};

    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url) {
      return NextResponse.json(
        { error: "URL do HasData é obrigatória" },
        { status: 400 }
      );
    }

    const backendBase = readEnv("NEXT_PUBLIC_BACKEND_URL");
    const secret = readEnv("EXXACTA_N8N_SECRET");

    const backendUrl = `${backendBase.replace(/\/$/, "")}/api/hasdata/import-by-url`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-exxacta-signature": secret,
      },
      body: JSON.stringify({ url }),
      cache: "no-store",
    });

    const dataUnknown: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        isRecord(dataUnknown) && typeof dataUnknown.error === "string"
          ? dataUnknown.error
          : "Falha ao importar (backend)";
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    if (
      isRecord(dataUnknown) &&
      typeof dataUnknown.error === "string"
    ) {
      return NextResponse.json(
        { error: dataUnknown.error },
        { status: 400 }
      );
    }

    if (
      isRecord(dataUnknown) &&
      typeof dataUnknown.imported === "number" &&
      typeof dataUnknown.skipped === "number" &&
      typeof dataUnknown.total === "number"
    ) {
      const okData: BackendOk = {
        imported: dataUnknown.imported,
        skipped: dataUnknown.skipped,
        total: dataUnknown.total,
      };

      return NextResponse.json(okData, { status: 200 });
    }

    return NextResponse.json(
      { error: "Resposta inválida do backend" },
      { status: 500 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
