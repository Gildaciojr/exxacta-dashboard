"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  CheckCircle,
  CalendarDays,
  Mail,
  ChevronDown,
} from "lucide-react";

/* ======================================================
   TIPOS
====================================================== */

type Etapa = "day01" | "day03" | "day07";

type TemplateForm = {
  id: string; // chave fixa (ex: config-default)
  etapa: Etapa;
  assunto: string;
  email_template: string;
  assinatura: string;
  ativo: boolean;
};

/** ✅ TIPO CORRETO DO RETORNO DA API (SEM any) */
type EmailTemplateRow = {
  id: string;
  etapa: Etapa;
  assunto: string | null;
  email_template: string | null;
  assinatura: string | null;
  ativo: boolean | null;
};

/* ======================================================
   CONSTANTES
====================================================== */

const ETAPAS: ReadonlyArray<{ key: Etapa; label: string; hint: string }> = [
  { key: "day01", label: "Dia 01", hint: "Primeiro contato (imediato)" },
  { key: "day03", label: "Dia 03", hint: "Follow-up após 3 dias" },
  { key: "day07", label: "Dia 07", hint: "Último follow-up após 7 dias" },
];

const DEFAULT_ID = "config-default";

function prettyEtapa(etapa: Etapa) {
  const found = ETAPAS.find((e) => e.key === etapa);
  return found?.label ?? etapa;
}

/* ======================================================
   COMPONENT
====================================================== */

export function EmailTemplateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // etapa atual no select
  const [etapa, setEtapa] = useState<Etapa>("day01");

  // cache local por etapa (SaaS real)
  const [drafts, setDrafts] = useState<Record<Etapa, TemplateForm>>({
    day01: {
      id: DEFAULT_ID,
      etapa: "day01",
      assunto: "",
      email_template: "",
      assinatura: "Atenciosamente,\n{{remetente}}\nExxacta",
      ativo: true,
    },
    day03: {
      id: DEFAULT_ID,
      etapa: "day03",
      assunto: "",
      email_template: "",
      assinatura: "Atenciosamente,\n{{remetente}}\nExxacta",
      ativo: true,
    },
    day07: {
      id: DEFAULT_ID,
      etapa: "day07",
      assunto: "",
      email_template: "",
      assinatura: "Atenciosamente,\n{{remetente}}\nExxacta",
      ativo: true,
    },
  });

  const current = useMemo(() => drafts[etapa], [drafts, etapa]);

  // atualiza apenas a etapa atual
  function patchCurrent(patch: Partial<TemplateForm>) {
    setDrafts((prev) => ({
      ...prev,
      [etapa]: {
        ...prev[etapa],
        ...patch,
      },
    }));
  }

  /* ===========================
     LOAD INITIAL DATA
  ============================*/
  useEffect(() => {
    if (!open) return;

    async function carregar() {
      setLoading(true);

      try {
        const res = await fetch("/api/email-templates");
        const data: EmailTemplateRow[] | unknown = await res.json();

        if (Array.isArray(data)) {
          const byEtapa = new Map<Etapa, EmailTemplateRow>();

          for (const row of data) {
            if (
              row.etapa === "day01" ||
              row.etapa === "day03" ||
              row.etapa === "day07"
            ) {
              byEtapa.set(row.etapa, row);
            }
          }

          setDrafts((prev) => {
            const next = { ...prev };

            (["day01", "day03", "day07"] as Etapa[]).forEach((k) => {
              const row = byEtapa.get(k);

              next[k] = {
                id: row?.id ?? DEFAULT_ID,
                etapa: k,
                assunto: row?.assunto ?? prev[k].assunto,
                email_template:
                  row?.email_template ?? prev[k].email_template,
                assinatura: row?.assinatura ?? prev[k].assinatura,
                ativo:
                  typeof row?.ativo === "boolean"
                    ? row.ativo
                    : prev[k].ativo,
              };
            });

            return next;
          });

          return;
        }
      } catch (err) {
        console.error("Erro ao carregar templates:", err);
        alert("❌ Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    }

    void carregar();
  }, [open]);

  /* ===========================
     SAVE ETAPA ATUAL
  ============================*/
  async function salvarEtapaAtual() {
    setSaving(true);

    try {
      const payload = {
        id: current.id || DEFAULT_ID,
        etapa: current.etapa,
        assunto: current.assunto,
        email_template: current.email_template,
        assinatura: current.assinatura,
        ativo: current.ativo,
      };

      const res = await fetch("/api/email-templates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-exxacta-signature":
            process.env.NEXT_PUBLIC_EXXACTA_N8N_SECRET!,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        alert("❌ Erro ao salvar: " + (result?.error || "Erro desconhecido"));
        return;
      }

      alert(`✅ ${prettyEtapa(etapa)} salvo com sucesso!`);
    } finally {
      setSaving(false);
    }
  }

  function close() {
    if (!saving) onClose();
  }

  if (!open) return null;

  const etapaHint = ETAPAS.find((e) => e.key === etapa)?.hint ?? "";

  /* ===========================
     JSX
  ============================*/
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)] border border-slate-200 bg-white animate-in fade-in zoom-in duration-300">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#001f54] to-[#054e97] text-white px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configurar E-mails Automáticos
              </h2>
              <p className="text-white/70 text-sm mt-1">
                Conteúdo independente por etapa (Dia 01 / 03 / 07)
              </p>
            </div>

            {/* SELECT ETAPA */}
            <div>
              <label className="text-[11px] text-white/70 mb-1 block">
                Etapa
              </label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80" />
                <select
                  value={etapa}
                  onChange={(e) => setEtapa(e.target.value as Etapa)}
                  className="pl-9 pr-10 py-2 rounded-xl bg-white/15 border border-white/25 text-sm font-semibold outline-none focus:ring-2 focus:ring-white/30"
                >
                  {ETAPAS.map((e) => (
                    <option
                      key={e.key}
                      value={e.key}
                      className="text-slate-900"
                    >
                      {e.label} — {e.hint}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/80 pointer-events-none" />
              </div>
              <p className="text-[11px] text-white/60 mt-1">{etapaHint}</p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : (
            <>
              <Input
                value={current.assunto}
                onChange={(e) => patchCurrent({ assunto: e.target.value })}
                placeholder="Assunto do e-mail"
              />

              <Textarea
                rows={10}
                value={current.email_template}
                onChange={(e) =>
                  patchCurrent({ email_template: e.target.value })
                }
              />

              <Textarea
                rows={3}
                value={current.assinatura}
                onChange={(e) =>
                  patchCurrent({ assinatura: e.target.value })
                }
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">
                    Ativar envio automático
                  </p>
                  <p className="text-xs text-slate-500">
                    Backend / n8n respeitará este status
                  </p>
                </div>
                <Switch
                  checked={current.ativo}
                  onCheckedChange={(v) => patchCurrent({ ativo: v })}
                />
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t bg-slate-50 px-6 py-4 flex justify-between">
          <Button variant="ghost" onClick={close} disabled={saving}>
            Fechar
          </Button>

          <Button
            onClick={salvarEtapaAtual}
            disabled={saving || loading}
            className="bg-blue-600 text-white"
          >
            {saving ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Salvar {prettyEtapa(etapa)}
          </Button>
        </div>
      </div>
    </div>
  );
}
