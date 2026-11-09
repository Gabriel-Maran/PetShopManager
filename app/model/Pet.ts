import { PacoteRemarcacao, PorteAnimal, TipoServico } from "../config/consts";
import type { IsoDate } from "../utils/datas";
import type { Cents } from "../utils/dinheiro";

export interface Pet {
  id?: number;
  nome: string;
  especie: number;
  porte: PorteAnimal;
  raca?: number;
  raca_nome?: string;
  observacoes?: string | null;
  dono_id: number;
  servico_padrao: TipoServico;
  valor_pacote?: Cents | null;
  remarcacao_ativa: number; // 0 ou 1
  pacote_remarcacao?: PacoteRemarcacao | null; // 2 ou 4 conforme o SQL
  data_inicio_pacote?: IsoDate | null;
  horario_padrao?: string | null;
  current_ultima_visita_data?: IsoDate | null;
  ultimo_visita_data_auto?: IsoDate | null;
  is_ativo: number; // 0 ou 1
  criado_em?: IsoDate;
}

export type PetWithSpecieRaceAndOwner = Pet & {
  nome_especie: string;
  nome_raca: string;
  nome_dono: string;
};

export class PetBuilder {
  private props: Partial<Pet>;

  constructor() {
    this.props = {
      nome: "",
      especie: 0,
      porte: PorteAnimal.MEDIO,
      dono_id: 0,
      servico_padrao: TipoServico.BanhoETosa,
      remarcacao_ativa: 0,
      valor_pacote: null,
      is_ativo: 1,
    };
  }

  public withNome(nome: string): this {
    this.props.nome = nome;
    return this;
  }

  public forDono(donoId: number): this {
    this.props.dono_id = donoId;
    return this;
  }

  public withEspecie(especie: number): this {
    this.props.especie = especie;
    return this;
  }

  public withPorte(porte: PorteAnimal): this {
    this.props.porte = porte;
    return this;
  }

  public withRaca(raca: number): this {
    this.props.raca = raca;
    return this;
  }

  public withServicoPadrao(servicePadrao: TipoServico): this {
    this.props.servico_padrao = servicePadrao;
    return this;
  }

  public isRemarcacaoAtiva(num: number): this {
    this.props.remarcacao_ativa = num !== 0 ? 1 : 0;
    return this;
  }

  public withPacote(tipo: PacoteRemarcacao | null | undefined): this {
    this.props.pacote_remarcacao = tipo;
    return this;
  }

  public withInicioPacote(dataInicio: IsoDate | null | undefined): this {
    this.props.data_inicio_pacote = dataInicio;
    return this;
  }

  public withValorPacote(valor: Cents | null | undefined): this {
    this.props.valor_pacote = valor ?? null;
    return this;
  }

  public withHorarioPadrao(valor: string | null | undefined): this {
    this.props.horario_padrao = valor;
    return this;
  }

  public is_ativo(num: number): this {
    this.props.is_ativo = num !== 0 ? 1 : 0;
    return this;
  }

  public withObservacoes(obs: string | null): this {
    this.props.observacoes = obs;
    return this;
  }

  public build(): Pet {
    return { ...this.props } as Pet;
  }
}
