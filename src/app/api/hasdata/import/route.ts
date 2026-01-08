
// ⚠️ ROTA LEGADA — NÃO UTILIZADA EM PRODUÇÃO
// Importação HasData agora é feita via backend NestJS
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      company_name,
      phone,
      website,
      address,
      city,
      state,
      country,
      employees,
      linkedin,
      owner_name,
      owner_linkedin
    } = body;

    // 🔍 Validar campos mínimos
    if (!company_name) {
      return NextResponse.json(
        { error: "Nome da empresa é obrigatório" },
        { status: 400 }
      );
    }

    // 🎯 FILTRO DE QUALIFICAÇÃO
    if (employees < 10 || employees > 100) {
      return NextResponse.json(
        { skipped: true, reason: "Tamanho da empresa fora do filtro (10 a 100)" },
        { status: 200 }
      );
    }

    const NAO_CONTABILIDADE = ["restaurante", "mercado", "cafeteria"];
    const texto = company_name.toLowerCase();

    if (!texto.includes("cont")) {
      return NextResponse.json(
        { skipped: true, reason: "Empresa fora do nicho contábil" },
        { status: 200 }
      );
    }

    // 🏢 VERIFICA ou CRIA EMPRESA
    const { data: empresaExistente } = await supabaseAdmin
      .from("empresas")
      .select("id")
      .eq("nome", company_name)
      .maybeSingle();

    let empresaId = empresaExistente?.id;

    if (!empresaId) {
      const { data: empresaNova, error } = await supabaseAdmin
        .from("empresas")
        .insert({
          nome: company_name,
          site: website ?? null,
          telefone: phone ?? null,
          cidade: city ?? null,
          estado: state ?? null,
          pais: country ?? "Brasil",
          linkedin_url: linkedin ?? null,
          tamanho: "10_ate_20",
        })
        .select("id")
        .single();

      if (error) throw error;
      empresaId = empresaNova.id;
    }

    // 👤 CRIAR LEAD
    const leadNome = owner_name || company_name;
    const leadLinkedin = owner_linkedin || linkedin || null;

    const { data: leadCriado, error: errLead } = await supabaseAdmin
      .from("leads")
      .insert({
        nome: leadNome,
        cargo: owner_name ? "diretor" : "outro",
        linkedin_url: leadLinkedin,
        email: null,
        telefone: phone ?? null,
        perfil: "decisor",
        empresa_id: empresaId,
        status: "novo",
      })
      .select("*")
      .single();

    if (errLead) throw errLead;

    return NextResponse.json(
      {
        message: "Empresa e lead registrados com sucesso",
        empresaId,
        lead: leadCriado
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
