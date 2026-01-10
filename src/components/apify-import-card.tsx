"use client";

import { useState } from "react";
import { Loader2, Link as LinkIcon, AlertTriangle } from "lucide-react";

type ApifyResult =
  | {
      ok: true;
      imported: number;
      skipped: number;
      total: number;
      mode?: string;
      details?: {
        createdCompanies?: number;
        skippedDuplicateLeads?: number;
        skippedMissingEmail?: number;
        skippedOutOfFilter?: number;
      };
    }
  | {
      ok: false;
      needsConfirmation: true;
      message: string;
      total: number;
      valid_by_filter: number;
      out_of_filter: number;
    };

export function ApifyImportCard() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runImport(forceImport = false) {
    const res = await fetch("/api/apify/import-by-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, forceImport }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Erro ao importar");

    setResult(data);
  }

  async function handleImport() {
    if (!url.trim()) {
      setError("Informe a URL da Apify");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      await runImport(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-[#C7D2FE] bg-white/70 backdrop-blur p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="text-[#4F46E5]" size={18} />
        <h2 className="text-lg font-extrabold text-[#312E81]">
          Importar leads da Apify
        </h2>
      </div>

      <input
        type="url"
        placeholder="https://api.apify.com/v2/datasets/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full rounded-xl border border-[#C7D2FE] px-4 py-2 text-sm bg-white mb-3"
      />

      <button
        onClick={handleImport}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4338CA] disabled:opacity-60"
      >
        {loading && <Loader2 className="animate-spin" size={16} />}
        Importar
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {/* ⚠️ AVISO DE FILTRO */}
      {result && !result.ok && "needsConfirmation" in result && (
        <div className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-center gap-2 text-yellow-800 font-semibold">
            <AlertTriangle size={16} />
            Atenção
          </div>

          <p className="text-sm mt-2">{result.message}</p>

          <p className="text-xs mt-2 text-slate-600">
            Válidas: <strong>{result.valid_by_filter}</strong> • Fora do filtro:{" "}
            <strong>{result.out_of_filter}</strong>
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => runImport(false)}
              className="px-4 py-2 text-sm rounded-lg border border-[#C7D2FE] bg-white"
            >
              Importar somente válidas
            </button>

            <button
              onClick={() => runImport(true)}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white"
            >
              Importar tudo
            </button>
          </div>
        </div>
      )}

      {/* ✅ RESULTADO FINAL */}
      {result && result.ok && (
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm">
          <p>✅ Importados: <strong>{result.imported}</strong></p>
          <p>⏭️ Ignorados: <strong>{result.skipped}</strong></p>
          <p>📦 Total: <strong>{result.total}</strong></p>
        </div>
      )}
    </div>
  );
}
