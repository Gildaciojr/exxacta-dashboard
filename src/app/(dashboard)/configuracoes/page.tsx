"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
  Building2,
  Palette,
  UserCog,
  Bell,
  Globe,
} from "lucide-react";

/* ===========================================================
   COMPONENTE SECTION (fora do render)
=========================================================== */
/* ===========================================================
   COMPONENTE SECTION (AGORA FLUTUANTE & INTERATIVO)
=========================================================== */
type SectionProps = {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
};

function Section({ icon: Icon, title, children }: SectionProps) {
  return (
    <div
      className="
      bg-white/90 backdrop-blur
      border border-slate-200 
      rounded-2xl p-6 space-y-5
      shadow-[0_0_20px_rgba(49,130,206,0.1)]
      transition-all duration-300

      hover:shadow-[0_0_30px_8px_rgba(59,130,246,0.25)]
      hover:scale-[1.01] hover:-translate-y-[3px]
      hover:bg-gradient-to-br hover:from-[#f8fbff] hover:to-[#eaf2ff]
      "
    >
      <h2
        className="
        flex items-center gap-3
        text-lg font-bold text-[#0A2A5F]
        px-4 py-2 rounded-xl

        bg-gradient-to-r from-[#E0F2FE] to-[#BAE6FD]
        border border-[#93C5FD]
        shadow-[0_0_12px_rgba(59,130,246,0.3)]

        hover:shadow-[0_0_18px_rgba(59,130,246,0.5)]
        hover:from-[#BAE6FD] hover:to-[#93C5FD]
        transition-all duration-300 ease-in-out
        "
      >
        <Icon className="w-6 h-6 text-[#2563EB]" />
        {title}-
      </h2>

      <div className="grid gap-4">{children}</div>
    </div>
  );
}

/* ===========================================================
   PÁGINA PRINCIPAL
=========================================================== */
export default function ConfiguracoesPage() {
  const [data, setData] = useState({
    empresa_nome: "",
    empresa_email: "",
    tema_primario: "#0A2A5F",
    usuario: "",
    senha: "",
    notificacoes_email: false,
    idioma: "",
    fuso: "",
  });

  return (
    <div className="p-8 space-y-10 max-w-4xl mx-auto">

      {/* =========================================================
         🏷️ TÍTULO PRINCIPAL (AGORA NO MESMO PADRÃO)
      ========================================================= */}
      <header
        className="
        bg-white/90 backdrop-blur border border-slate-200
        rounded-2xl p-6 shadow-[0_0_20px_rgba(59,130,246,0.15)]
        transition-all duration-300 hover:shadow-[0_0_35px_rgba(59,130,246,0.35)]
        hover:-translate-y-[3px]
        "
      >
        <h1
          className="
          flex items-center gap-3 text-2xl font-bold text-[#0A2A5F]
          bg-gradient-to-r from-[#E0F2FE] to-[#BAE6FD]
          px-6 py-3 rounded-xl inline-flex border border-[#93C5FD]
          shadow-[0_0_15px_rgba(59,130,246,0.4)]
          hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]
          transition-all
        "
        >
          ⚙️ Configurações Gerais
        </h1>
                <p className="mt-3 ml-2 text-slate-500 text-sm">
          Ajuste informações gerais da empresa, identidade visual e preferências globais.
        </p>
      </header>

      {/* 📦 EMPRESA */}
      <Section icon={Building2} title="Perfil da Empresa">
        <Input
          placeholder="Nome da empresa"
          value={data.empresa_nome}
          onChange={(e) => setData({ ...data, empresa_nome: e.target.value })}
        />
        <Input
          placeholder="E-mail"
          value={data.empresa_email}
          onChange={(e) => setData({ ...data, empresa_email: e.target.value })}
        />
      </Section>

      {/* 🎨 VISUAL */}
      <Section icon={Palette} title="Identidade Visual">
        <div className="flex items-center gap-4">
          <label className="font-medium w-40">Cor primária:</label>
          <input
            type="color"
            value={data.tema_primario}
            onChange={(e) => setData({ ...data, tema_primario: e.target.value })}
            className="w-12 h-12 rounded-md shadow border"
          />
        </div>
      </Section>

      {/* 👤 USER */}
      <Section icon={UserCog} title="Conta e Login">
        <Input
          placeholder="Usuário"
          value={data.usuario}
          onChange={(e) => setData({ ...data, usuario: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Nova senha"
          value={data.senha}
          onChange={(e) => setData({ ...data, senha: e.target.value })}
        />
      </Section>

      {/* 🔔 NOTIFICAÇÕES */}
      <Section icon={Bell} title="Notificações">
        <div className="flex items-center justify-between">
          <span>Enviar e-mail ao receber novos leads</span>
          <Switch
            checked={data.notificacoes_email}
            onCheckedChange={(v: boolean) =>
              setData({ ...data, notificacoes_email: v })
            }
          />
        </div>
      </Section>

      {/* 🌍 PREFERÊNCIAS */}
      <Section icon={Globe} title="Preferências Globais">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder="Idioma"
            value={data.idioma}
            onChange={(e) => setData({ ...data, idioma: e.target.value })}
          />
          <Input
            placeholder="Fuso horário"
            value={data.fuso}
            onChange={(e) => setData({ ...data, fuso: e.target.value })}
          />
        </div>
      </Section>

      {/* 💾 SALVAR */}
      <div className="flex justify-end">
        <Button className="bg-[#0A2A5F] hover:bg-[#0a2350]">
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
