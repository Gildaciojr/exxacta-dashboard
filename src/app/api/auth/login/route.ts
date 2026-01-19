import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

interface LoginBody {
  usuario: string;
  senha: string;
}

/**
 * 🔐 POST /api/auth/login
 * Valida usuário e senha sem hash
 */
export async function POST(req: Request) {
  try {
    const body: LoginBody = await req.json();

    if (!body.usuario || !body.senha) {
      return NextResponse.json(
        { error: "Credenciais ausentes" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("usuario_acesso")
      .select("usuario")
      .eq("usuario", body.usuario)
      .eq("senha", body.senha)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Usuário ou senha inválidos" },
        { status: 401 }
      );
    }

    // Sessão simples — front salva localStorage
    return NextResponse.json(
      { ok: true, user: data.usuario },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro no login:", err);
    return NextResponse.json(
      { error: "Erro interno ao autenticar" },
      { status: 500 }
    );
  }
}
