import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ============================
   SCHEMA DE CRIAÇÃO DE LEAD
============================ */
const leadSchema = z.object({
  nome: z.string().min(2),
  cargo: z.string().optional().nullable(),
  linkedin_url: z.string().url(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  perfil: z.string().min(2),
  empresa_id: z.string().uuid().optional().nullable(),
});

/* ============================
   GET — LISTAR LEADS
   /api/leads
============================ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const perfil = searchParams.get("perfil");
    const empresa_id = searchParams.get("empresa_id");

    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .order("criado_em", { ascending: false });

    if (perfil) {
      query = query.eq("perfil", perfil);
    }

    if (empresa_id) {
      query = query.eq("empresa_id", empresa_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao listar leads:", error);
      return NextResponse.json(
        { error: "Erro ao listar leads", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Erro inesperado no GET /leads:", err);
    return NextResponse.json(
      { error: "Erro interno ao buscar leads" },
      { status: 500 }
    );
  }
}

/* ============================
   POST — CRIAR LEAD
   /api/leads
============================ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // valida empresa se empresa_id vier preenchido
    if (input.empresa_id) {
      const { data: empresa, error: empresaError } = await supabaseAdmin
        .from("empresas")
        .select("id")
        .eq("id", input.empresa_id)
        .single();

      if (empresaError || !empresa) {
        return NextResponse.json(
          {
            error: "empresa_id inválido",
            details: "Empresa não encontrada",
          },
          { status: 400 }
        );
      }
    }

    /* ============================
       1. CRIA O LEAD NO BANCO
    ============================ */
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert({
        nome: input.nome,
        cargo: input.cargo ?? null,
        linkedin_url: input.linkedin_url,
        email: input.email ?? null,
        telefone: input.telefone ?? null,
        perfil: input.perfil,
        empresa_id: input.empresa_id ?? null,
        status: "novo",
      })
      .select("*")
      .single();

    if (error || !lead) {
      console.error("Erro ao criar lead:", error);
      return NextResponse.json(
        { error: "Erro ao criar lead" },
        { status: 500 }
      );
    }

    /* ============================
       2. DISPARA EVENTO PARA O N8N
       (ASSÍNCRONO, NÃO BLOQUEIA)
    ============================ */
    fetch(process.env.N8N_WEBHOOK_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-exxacta-signature": process.env.EXXACTA_N8N_SECRET!,
      },
      body: JSON.stringify({
        event: "lead.created",
        lead: {
          id: lead.id,
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          perfil: lead.perfil,
          status: lead.status,
          empresa_id: lead.empresa_id,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      // falha silenciosa: nunca quebra o fluxo principal
      console.error("Falha ao disparar webhook n8n:", err);
    });

    /* ============================
       3. RETORNO NORMAL DA API
    ============================ */
    return NextResponse.json(
      {
        message: "Lead criado com sucesso",
        lead,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Erro interno ao criar lead:", err);
    return NextResponse.json(
      { error: "Erro interno ao processar requisição" },
      { status: 500 }
    );
  }
}
