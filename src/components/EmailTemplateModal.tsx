"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, CheckCircle } from "lucide-react";

export function EmailTemplateModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    assunto: "",
    email_template: "",
    assinatura: "",
    ativo: true,
  });

  /* ===========================
     LOAD INITIAL DATA
  ============================*/
  useEffect(() => {
    if (!open) return;

    async function carregar() {
      setLoading(true);

      try {
        const res = await fetch("/api/email-template");
        const data = await res.json();

        setForm({
          assunto: data.assunto ?? "",
          email_template: data.email_template ?? "",
          assinatura: data.assinatura ?? "",
          ativo: data.ativo ?? true,
        });
      } catch (err) {
        console.error("Erro ao carregar template:", err);
        alert("❌ Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    }

    void carregar(); // 👈 dispara a função ASSÍNCRONA corretamente
  }, [open]);

  /* ===========================
     SALVAR NO BANCO
  ============================*/
  async function salvar() {
    setSaving(true);

    const res = await fetch("/api/email-template", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-exxacta-signature": process.env.NEXT_PUBLIC_EXXACTA_N8N_SECRET!,
      },
      body: JSON.stringify(form),
    });

    const result = await res.json();

    if (!res.ok) {
      alert("❌ Erro ao salvar: " + (result.error || "Erro desconhecido"));
      setSaving(false);
      return;
    }

    alert("✅ Configuração salva com sucesso!");
    setSaving(false);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div
        className="
          w-full max-w-2xl rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.4)]
          border border-slate-200 bg-white text-black
          animate-in fade-in zoom-in duration-300
        "
      >
        {/* HEADER */}
        <div className="bg-gradient-to-r from-[#001f54] to-[#054e97] text-white px-6 py-5">
          <h2 className="text-xl font-semibold tracking-wide flex items-center gap-2">
            ✉️ Configurar E-mails Automáticos
          </h2>
          <p className="text-white/70 text-sm mt-1">
            Edite a mensagem que será usada pelo N8N nos envios automáticos.
          </p>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            </div>
          ) : (
            <>
              {/* ASSUNTO */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Assunto do e-mail
                </label>
                <Input
                  value={form.assunto}
                  onChange={(e) =>
                    setForm({ ...form, assunto: e.target.value })
                  }
                  placeholder="Título do e-mail — Ex: Bem-vindo à Exxacta!"
                  className="shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* TEMPLATE */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Corpo da mensagem
                </label>
                <Textarea
                  rows={8}
                  value={form.email_template}
                  onChange={(e) =>
                    setForm({ ...form, email_template: e.target.value })
                  }
                  placeholder="Escreva o texto que será enviado automaticamente..."
                  className="shadow-sm resize-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs mt-1 text-slate-500">
                  Você poderá usar variáveis dinâmicas futuramente como:{" "}
                  <strong>{`{{nome}} {{email}} {{telefone}} {{empresa}}`}</strong>
                </p>
              </div>

              {/* ASSINATURA */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Assinatura do e-mail
                </label>
                <Input
                  value={form.assinatura}
                  onChange={(e) =>
                    setForm({ ...form, assinatura: e.target.value })
                  }
                  placeholder="Ex: Atenciosamente, Equipe Exxacta"
                  className="shadow-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* SWITCH */}
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                />
                <span className="text-sm text-slate-700">
                  Ativar envio automático
                </span>
              </div>
            </>
          )}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="hover:bg-slate-200 transition"
          >
            Fechar
          </Button>

          <Button
            onClick={salvar}
            disabled={saving}
            className="
              bg-blue-600 hover:bg-blue-700 text-white font-semibold
              shadow-lg hover:shadow-blue-300 transition flex items-center gap-2
            "
          >
            {saving ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Salvar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
}
