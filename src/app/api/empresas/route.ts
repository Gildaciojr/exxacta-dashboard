import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ============================
   SCHEMA DE CRIAÇÃO
============================ */
const createEmpresaSchema = z.object({
  nome: z.string().min(2),
  cidade: z.string().optional().nullable(),
  tamanho: z.string().min(1),
  site: z.string().url().optional().nullable(),
  linkedin_url: z.string().url().optional().nullable(),
});

/* ============================
   GET — LISTAR EMPRESAS
   /api/empresas
============================ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const nome = searchParams.get("nome");
    const tamanho = searchParams.get("tamanho");

    let query = supabaseAdmin
      .from("empresas")
      .select("*")
      .order("criado_em", { ascending: false });

    if (nome) {
      query = query.ilike("nome", `%${nome}%`);
    }

    if (tamanho) {
      query = query.eq("tamanho", tamanho);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao listar empresas:", error);
      return NextResponse.json(
        { error: "Erro ao listar empresas", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Erro inesperado no GET /empresas:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar empresas" },
      { status: 500 }
    );
  }
}

/* ============================
   POST — CRIAR EMPRESA
   + CRIAR LEAD AUTOMÁTICO
============================ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = createEmpresaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const empresaInput = parsed.data;

    /* ============================
       1️⃣ CRIA EMPRESA
    ============================ */
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from("empresas")
      .insert({
        nome: empresaInput.nome,
        cidade: empresaInput.cidade ?? null,
        tamanho: empresaInput.tamanho,
        site: empresaInput.site ?? null,
        linkedin_url: empresaInput.linkedin_url ?? null,
      })
      .select("*")
      .single();

    if (empresaError || !empresa) {
      console.error("Erro ao criar empresa:", empresaError);
      return NextResponse.json(
        { error: "Erro ao criar empresa" },
        { status: 500 }
      );
    }

    /* ============================
       2️⃣ CRIA LEAD AUTOMÁTICO
       (pipeline / status novo)
       ⚠️ NÃO dispara n8n
    ============================ */
    const { error: leadError } = await supabaseAdmin
      .from("leads")
      .insert({
        nome: empresa.nome,
        perfil: "empresa",
        empresa_id: empresa.id,
        status: "novo",
        cargo: null,
        email: null,
        telefone: null,
        linkedin_url: empresa.linkedin_url ?? null,
      });

    if (leadError) {
      // ⚠️ Importante: NÃO quebra a criação da empresa
      console.error(
        "⚠️ Empresa criada, mas erro ao criar lead automático:",
        leadError
      );
    }

    return NextResponse.json(
      {
        message: "Empresa criada com sucesso",
        empresa,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro interno ao criar empresa:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição" },
      { status: 500 }
    );
  }
}
