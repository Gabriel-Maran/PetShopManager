import type { PacoteRemarcacao, PorteAnimal, TipoServico } from "../../../config/petEnums";
import type { IsoDate } from "../../../utils/datas";

/** O formulário do pet, que as duas abas editam: os valores como os campos mostram, antes de salvar. */
export interface PetForm {
  nome: string;
  especie: number;
  dono_id: number;
  dono_nome: string;
  raca: number;
  raca_nome: string;
  observacoes: string;
  porte: PorteAnimal;
  servicoPadrao: TipoServico;
  remarcAtiva: boolean;
  pacoteRemarcacao: PacoteRemarcacao | undefined;
  valorPacote: string;
  dataInicioPacote: IsoDate;
  horario_padrao: string;
}
