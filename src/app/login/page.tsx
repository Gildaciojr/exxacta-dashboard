"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  px-4
  relative
  before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.25),transparent_60%)]
"
    >
      <form
        onSubmit={handleLogin}
        className="
          w-full max-w-md p-8
          bg-white/80 backdrop-blur-xl
          rounded-2xl border border-[#BFDBFE]
          shadow-[0_8px_30px_rgba(191,219,254,0.7)]
          hover:shadow-[0_10px_40px_rgba(29,78,216,0.45)]
          hover:-translate-y-1
          transition-all duration-300
        "
      >
        <div className="flex justify-center mb-8">
          <Image
            src="/images/logo.png"
            alt="Exxacta"
            width={200}
            height={70}
            className="
              drop-shadow-[0_10px_20px_rgba(29,78,216,0.35)]
              hover:drop-shadow-[0_10px_15px_rgba(29,78,216,0.65)]
              transition-all
            "
          />
        </div>

        <h1
          className="
         drop-shadow-[0_50px_50px_rgba(29,78,216,0.35)]
              hover:drop-shadow-[0_10px_25px_rgba(29,78,216,0.65)]
              transition-all
          text-center text-[#0A2A5F]
          text-3xl font-bold mb-6
          bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]
          bg-clip-text text-transparent
        "
        >
          Bem-vindo de volta
        </h1>

        <input
          type="text"
          placeholder="Usuário"
          className="
            w-full mb-4 px-4 py-3 rounded-lg
            bg-white border border-[#BFDBFE]
            focus:ring-2 focus:ring-[#3B82F6]
            outline-none transition
            text-[#0A2A5F]
          "
          onChange={(e) => setForm({ ...form, usuario: e.target.value })}
        />

        <input
          type="password"
          placeholder="Senha"
          className="
            w-full mb-6 px-4 py-3 rounded-lg
            bg-white border border-[#BFDBFE]
            focus:ring-2 focus:ring-[#3B82F6]
            outline-none transition
            text-[#0A2A5F]
          "
          onChange={(e) => setForm({ ...form, senha: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="
            w-full py-3 rounded-lg font-bold
            text-white bg-gradient-to-r from-[#1D4ED8] to-[#3B82F6]
            shadow-lg hover:shadow-[#3B82F6]/50
            hover:-translate-y-[2px]
            transition-all duration-300
          "
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
