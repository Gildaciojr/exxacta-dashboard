export type LeadStatus =
  | "novo"
  | "email_enviado"
  | "aquecimento"   // ✅ NOVO STATUS REAL
  | "contatado"
  | "follow_up"
  | "respondeu"
  | "interessado"
  | "negociacao"
  | "qualificado"
  | "frio"
  | "fechado"
  | "perdido";

export type Lead = {
  id: string;
  nome: string;
  cargo: string | null;
  linkedin_url: string | null;
  email: string | null;
  telefone: string | null;
  perfil: string;
  empresa_id: string | null;
  criado_em: string;

  // domínio real do banco
  status: LeadStatus;
};
