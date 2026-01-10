// src/types/empresa.ts

export type Empresa = {
  id: string;
  nome: string;
  cidade: string | null;

  /**
   * Tamanho da empresa por FAIXA
   * Ex: "10_ate_20", "21_ate_50", "51_ate_100", "101_ate_150"
   * É isso que o dashboard e os filtros usam
   */
  tamanho: string | null;

  /**
   * Número exato de funcionários (OPCIONAL)
   * - Pode existir no banco
   * - NÃO é obrigatório no frontend
   * - NÃO quebra se não vier
   */
  tamanho_funcionarios?: number | null;

  criado_em: string;
  site: string | null;
  linkedin_url: string | null;
};
