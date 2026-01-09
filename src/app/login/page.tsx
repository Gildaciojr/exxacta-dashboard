"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [form, setForm] = useState({ usuario: "", senha: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    setLoading(false);

    if (res.ok && result.ok) {
      localStorage.setItem("session_user", result.user);
      router.push("/dashboard");
    } else {
      alert("❌ Usuário ou senha incorretos");
    }
  }

  return (
    <main
      className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE]
        relative overflow-hidden px-4
      "
    >
      {/* brilho ambiente */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-blue-300/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-120px] right-[-120px] w-[480px] h-[480px] bg-blue-500/20 rounded-full blur-[140px]" />
      </div>

      <form
        onSubmit={handleLogin}
        className="
          relative w-full max-w-md
          rounded-3xl
          bg-white/80 backdrop-blur-xl
          border border-[#BFDBFE]
          shadow-[0_20px_60px_rgba(29,78,216,0.35)]
          hover:shadow-[0_30px_90px_rgba(29,78,216,0.45)]
          hover:-translate-y-1
          transition-all duration-500
          p-8
        "
      >
        {/* camada interna */}
        <div
          className="
            absolute inset-0 rounded-3xl
            bg-gradient-to-br from-white/60 to-transparent
            pointer-events-none
          "
        />

        {/* LOGO */}
        <div className="relative flex justify-center mb-8">
          <div
            className="
              flex items-center justify-center
              rounded-2xl
              bg-white/70
              border border-[#BFDBFE]
              px-6 py-4
              shadow-md
              hover:shadow-lg
              transition
            "
          >
            <Image
              src="/images/logo.png"
              alt="Exxacta"
              width={180}
              height={60}
              className="
                drop-shadow-[0_8px_18px_rgba(29,78,216,0.35)]
                hover:drop-shadow-[0_10px_22px_rgba(29,78,216,0.6)]
                transition
              "
            />
          </div>
        </div>

        {/* TÍTULO */}
        <h1
          className="
            text-center text-3xl font-extrabold mb-2
            bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]
            bg-clip-text text-transparent
            drop-shadow-[0_10px_20px_rgba(29,78,216,0.35)]
          "
        >
          Bem-vindo de volta
        </h1>

        <p className="text-center text-sm text-slate-500 mb-8">
          Acesse o painel Exxacta para continuar
        </p>

        {/* INPUT USUÁRIO */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Usuário"
            className="
              w-full px-4 py-3 rounded-xl
              bg-white
              border border-[#BFDBFE]
              text-[#0A2A5F]
              shadow-sm
              focus:outline-none
              focus:ring-2 focus:ring-[#3B82F6]
              hover:shadow-md
              transition
            "
            onChange={(e) =>
              setForm({ ...form, usuario: e.target.value })
            }
          />
        </div>

        {/* INPUT SENHA */}
        <div className="mb-6">
          <input
            type="password"
            placeholder="Senha"
            className="
              w-full px-4 py-3 rounded-xl
              bg-white
              border border-[#BFDBFE]
              text-[#0A2A5F]
              shadow-sm
              focus:outline-none
              focus:ring-2 focus:ring-[#3B82F6]
              hover:shadow-md
              transition
            "
            onChange={(e) =>
              setForm({ ...form, senha: e.target.value })
            }
          />
        </div>

        {/* BOTÃO */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-xl
            font-extrabold text-white
            bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]
            shadow-[0_12px_30px_rgba(59,130,246,0.45)]
            hover:shadow-[0_18px_45px_rgba(59,130,246,0.6)]
            hover:-translate-y-[2px]
            active:translate-y-0
            transition-all duration-300
            disabled:opacity-70
          "
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
