import {
  EspeciesAtendidas,
  PacoteRemarcacao,
  PorteAnimal,
  TipoServico,
} from "../config/consts";

export interface Pet {
  id?: number;
  nome: string;
  especie: EspeciesAtendidas;
  porte: PorteAnimal;
  raca?: string | null;
  observacoes?: string | null;
  dono_id: number;
  servico_padrao: TipoServico;
  remarcacao_ativa: number; // 0 ou 1
  pacote_remarcacao?: PacoteRemarcacao | null; // 2 ou 4 conforme o SQL
  data_inicio_pacote?: number | null; //formato YYYYMMDD
  current_ultima_visita_data?: number | null; //formato YYYYMMDD
  ultimo_visita_data_auto?: number | null; //formato YYYYMMDD
  is_ativo: number; // 0 ou 1
  criado_em?: number;
}
