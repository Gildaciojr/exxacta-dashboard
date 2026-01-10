export type Empresa = {
  id: string;
  nome: string;
  cidade: string | null;

  /**
   * ✅ FAIXA (regra de negócio / UI)
   * Ex: "10_ate_20", "21_ate_50", "51_ate_100"
   */
  tamanho: string | null;

  /**
   * ✅ NÚMERO REAL (vem do backend / apify)
   * NÃO precisa ser exibido
   * Serve para compatibilidade e tipagem correta
   */
  tamanho_funcionarios?: number | null;

  criado_em: string;
  site: string | null;
  linkedin_url: string | null;
};
