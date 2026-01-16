import { NextResponse } from "next/server";

type Body = {
  lead_id: string;
  status: string;
};

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { lead_id, status } = body;

  if (!lead_id || !status) {
    return NextResponse.json(
      { error: "lead_id e status são obrigatórios" },
      { status: 400 }
    );
  }

  // 🔥 O frontend NÃO decide regra de negócio
  // 🔥 Apenas repassa para o backend oficial
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { error: "Backend não configurado" },
      { status: 500 }
    );
  }

  const response = await fetch(`${backendUrl}/api/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lead_id, status }),
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
