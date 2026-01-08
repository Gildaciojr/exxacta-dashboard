"use client";

import { useState } from "react";
import { Loader2, Link as LinkIcon } from "lucide-react";

type HasdataImportResult = {
  imported: number;
  skipped: number;
  total: number;
};

type HasdataApiResponse =
  | ({ ok: true } & HasdataImportResult)
  | { error: string };

export function HasdataImportCard() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<HasdataImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(): Promise<void> {
    if (!url.trim()) {
      setError("Informe a URL do HasData");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const res = await fetch("/api/hasdata/import-by-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data: HasdataApiResponse = await res.json();

      if (!res.ok) {
        throw new Error("Falha ao comunicar com o servidor");
      }

      if ("error" in data) {
        throw new Error(data.error);
      }

      setResult({
        imported: data.imported,
        skipped: data.skipped,
        total: data.total,
      });

      setUrl("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao importar HasData");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-[#BFDBFE] bg-white/70 backdrop-blur p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="text-[#2563EB]" size={18} />
        <h2 className="text-lg font-extrabold text-[#0A2A5F]">
          Importar leads do HasData
        </h2>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Cole a URL pública do resultado do HasData.  
        O sistema criará automaticamente empresas e leads no pipeline.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          placeholder="https://hasdata.com/resultado.json"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="
            flex-1 rounded-xl border border-[#BFDBFE]
            px-4 py-2 text-sm
            bg-white
            focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30
          "
        />

        <button
          onClick={handleImport}
          disabled={loading}
          className="
            inline-flex items-center justify-center gap-2
            rounded-xl
            bg-[#2563EB]
            px-5 py-2
            text-sm font-semibold text-white
            hover:bg-[#1D4ED8]
            disabled:opacity-60
            transition
          "
        >
          {loading && <Loader2 className="animate-spin" size={16} />}
          Importar
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {result && (
        <div className="mt-4 rounded-xl bg-[#EFF6FF] p-4 text-sm text-slate-700">
          <p>✅ Importados: <strong>{result.imported}</strong></p>
          <p>⏭️ Ignorados: <strong>{result.skipped}</strong></p>
          <p>📦 Total processado: <strong>{result.total}</strong></p>
        </div>
      )}
    </div>
  );
}
