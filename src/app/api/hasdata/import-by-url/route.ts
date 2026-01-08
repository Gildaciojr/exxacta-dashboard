import { NextRequest, NextResponse } from "next/server";

type ImportByUrlBody = {
  url?: string;
  options?: {
    allowMissingEmployees?: boolean;
    requireEmployees?: boolean;
  };
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
      body: JSON.stringify({
        url,
        options: isRecord(body.options) ? body.options : undefined,
      }),
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Falha ao importar (backend)" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
