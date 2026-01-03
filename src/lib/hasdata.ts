// src/lib/hasdata.ts
const HASDATA_API_KEY = process.env.HASDATA_API_KEY;

if (!HASDATA_API_KEY) {
  throw new Error("🚨 Variável HASDATA_API_KEY não configurada no .env");
}

export async function hasdataSearch(params: {
  q: string;
  start?: number;
  ll?: string;
  dominio?: string;
  hl?: string;
}) {
  const searchParams = new URLSearchParams({
    q: params.q,
    start: String(params.start ?? 0),
    ll: params.ll ?? "",
    dominio: params.dominio ?? "google.com.br",
    hl: params.hl ?? "pt-BR",
  });

  const url = `https://api.hasdata.com/maps/search?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${HASDATA_API_KEY}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error("Erro na HasData: " + err);
  }

  return response.json();
}
