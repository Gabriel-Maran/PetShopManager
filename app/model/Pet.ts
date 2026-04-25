export interface Pet {
  id?: number;
  nome: string;
  especie: string;
  raca?: string;
  observacoes?: string;
  owner_id: number;
  criado_em?: string;
}