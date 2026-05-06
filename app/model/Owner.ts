export interface Owner {
  id?: number;
  nome: string;
  telefone: string;
  email?: string | null;
  endereco?: string | null;
  is_ativo: number; // 0 ou 1
  criado_em?: number;
}
