import { PacoteRemarcacao, PorteAnimal, TipoServico } from "../config/consts";

export interface Pet {
  id?: number;
  nome: string;
  especie: string;
  porte: PorteAnimal;
  raca?: string;
  observacoes?: string;
  dono_id: number;
  servico_padrao: TipoServico;
  remarcacao_ativa: number; // 0 ou 1
  remarcacao_gap_dias?: number;
  current_ultimo_banho_data?: number;
  ultimo_banho_data_automatico?: number;
  criado_em?: number;
}
