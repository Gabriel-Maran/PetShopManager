import {
  PacoteRemarcacao,
  PorteAnimal,
  TipoServico,
} from "../config/consts";

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
  remarcacao_ativa: number; // 0 ou 1
  pacote_remarcacao?: PacoteRemarcacao | null; // 2 ou 4 conforme o SQL
  data_inicio_pacote?: number | null; //formato YYYYMMDD
  current_ultima_visita_data?: number | null; //formato YYYYMMDD
  ultimo_visita_data_auto?: number | null; //formato YYYYMMDD
  is_ativo: number; // 0 ou 1
  criado_em?: number;
}

export type PetWithSpecie = Pet & {
  nome_especie: string;
}

export class PetBuilder {
  private props: Partial<Pet>;

  constructor() {
    this.props = {
      nome: "",
      especie: 0 ,
      porte: PorteAnimal.MEDIO,
      dono_id: 0,
      servico_padrao: TipoServico.BanhoETosa,
      remarcacao_ativa: 0,
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

  public withPacote(tipo: PacoteRemarcacao | undefined): this {
    this.props.pacote_remarcacao = tipo;
    return this;
  }

  public withInicioPacote(dataInicio: number | undefined): this {
    this.props.data_inicio_pacote = dataInicio;
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
