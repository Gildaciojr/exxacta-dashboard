"use client";

import { useState } from "react";
import { Loader2, Link as LinkIcon, AlertTriangle } from "lucide-react";

/* ============================
   TIPOS
============================ */

type HasdataImportResult = {
  imported: number;
  skipped: number;
  total: number;
};

type HasdataFinalResponse = {
  ok: true;
} & HasdataImportResult;

type HasdataWarningResponse = {
  ok: true;
  needsConfirmation: true;
  message: string;
  total: number;
  missingEmployees: number;
};

type HasdataErrorResponse = {
  error: string;
};

type HasdataApiResponse = HasdataFinalResponse | HasdataWarningResponse | HasdataErrorResponse;

/* ============================
   TYPE GUARDS (NARROWING)
============================ */

function isErrorResponse(data: HasdataApiResponse): data is HasdataErrorResponse {
  return typeof (data as HasdataErrorResponse).error === "string";
}

function isWarningResponse(data: HasdataApiResponse): data is HasdataWarningResponse {
  return (data as HasdataWarningResponse).needsConfirmation === true;
}

function isFinalResponse(data: HasdataApiResponse): data is HasdataFinalResponse {
  return (
    (data as HasdataFinalResponse).ok === true &&
    typeof (data as HasdataFinalResponse).imported === "number" &&
    typeof (data as HasdataFinalResponse).skipped === "number" &&
    typeof (data as HasdataFinalResponse).total === "number"
  );
}

/* ============================
   COMPONENTE
============================ */

export function HasdataImportCard() {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<HasdataImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔔 Controle de confirmação
  const [needsConfirmation, setNeedsConfirmation] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  /* ============================
     IMPORTAÇÃO INICIAL
  ============================ */

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data: HasdataApiResponse = await res.json();

      if (!res.ok) {
        throw new Error("Falha ao comunicar com o servidor");
      }

      if (isErrorResponse(data)) {
        throw new Error(data.error);
      }

      // ⚠️ Backend pediu confirmação
      if (isWarningResponse(data)) {
        setNeedsConfirmation(true);
        setWarningMessage(data.message);
        setPendingUrl(url);
        return;
      }

      // ✅ Importação direta
      if (isFinalResponse(data)) {
        setResult({
          imported: data.imported,
          skipped: data.skipped,
          total: data.total,
        });
        setUrl("");
        return;
      }

      // Se cair aqui, veio algo inesperado do backend
      throw new Error("Resposta inesperada do servidor");
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

  /* ============================
     CONFIRMAÇÃO DO USUÁRIO
  ============================ */

  async function confirmImport(allowMissingEmployees: boolean): Promise<void> {
    if (!pendingUrl) return;

    try {
      setLoading(true);
      setNeedsConfirmation(false);
      setError(null);

      const res = await fetch("/api/hasdata/import-by-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: pendingUrl,
          options: { allowMissingEmployees },
        }),
      });

      const data: HasdataApiResponse = await res.json();

      if (!res.ok) {
        throw new Error("Falha ao comunicar com o servidor");
      }

      if (isErrorResponse(data)) {
        throw new Error(data.error);
      }

      if (isWarningResponse(data)) {
        // Não deveria voltar warning aqui (já estamos confirmando), mas tratamos
        setNeedsConfirmation(true);
        setWarningMessage(data.message);
        setPendingUrl(pendingUrl);
        return;
      }

      if (isFinalResponse(data)) {
        setResult({
          imported: data.imported,
          skipped: data.skipped,
          total: data.total,
        });
        setUrl("");
        setPendingUrl(null);
        return;
      }

      throw new Error("Resposta inesperada do servidor");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro inesperado ao confirmar importação");
      }
    } finally {
      setLoading(false);
    }
  }

  /* ============================
     JSX
  ============================ */

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
        <br />
        O sistema criará automaticamente empresas e leads no pipeline.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="url"
          placeholder="https://f005.backblazeb2.com/file/hasdata-marketplace/arquivo.json"
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

      {/* ERRO */}
      {error && (
        <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
      )}

      {/* CONFIRMAÇÃO */}
      {needsConfirmation && (
        <div className="mt-5 rounded-xl border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="text-yellow-600 mt-0.5" size={18} />
            <p className="text-sm font-semibold text-yellow-800">Atenção</p>
          </div>

          <p className="text-sm text-yellow-700 mb-4">{warningMessage}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => confirmImport(true)}
              disabled={loading}
              className="rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              Continuar mesmo assim
            </button>

            <button
              onClick={() => confirmImport(false)}
              disabled={loading}
              className="rounded-lg border border-yellow-400 px-4 py-2 text-sm font-semibold text-yellow-800 hover:bg-yellow-100 disabled:opacity-60"
            >
              Importar somente empresas com funcionários
            </button>
          </div>
        </div>
      )}

      {/* RESULTADO */}
      {result && (
        <div className="mt-4 rounded-xl bg-[#EFF6FF] p-4 text-sm text-slate-700">
          <p>
            ✅ Importados: <strong>{result.imported}</strong>
          </p>
          <p>
            ⏭️ Ignorados: <strong>{result.skipped}</strong>
          </p>
          <p>
            📦 Total processado: <strong>{result.total}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
