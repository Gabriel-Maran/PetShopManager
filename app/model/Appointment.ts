export interface Appointment {
  id?: number;
  pet_id: number;
  servico: string;
  hora: string;
  data: number;
  entregar_pet: number; // 0 ou 1
  concluido: number; // 0 ou 1
  observacao?: string | null;
  is_auto_agen: number; // 0 ou 1
  criado_em?: number;
}

export type AppointmentsWithOwnerAndPet = Appointment & {
  id: number;
  nome_pet: string;
  nome_dono: string;
  especie: string;
};

export type NewOrEditAppointmentParams = {
  appointment?: AppointmentsWithOwnerAndPet;
  dateSelected?: string;
};


export class AppointmentBuilder {
  private props: Partial<Appointment>;

  constructor() {
    this.props = {
      pet_id: 0,
      servico: "",
      hora: "00:00",
      data: 0,
      entregar_pet: 0,
      concluido: 0,
      is_auto_agen: 0,
    };
  }

  public withPetId(pet_id: number): this {
    this.props.pet_id = pet_id;
    return this;
  }

  public withServico(servico: string): this {
    this.props.servico = servico;
    return this;
  }

  public withHora(hora: string): this {
    this.props.hora = hora;
    return this;
  }

  public withData(data: number): this {
    this.props.data = data;
    return this;
  }

  public withEntregarPet(num: number): this {
    this.props.entregar_pet = num !== 0 ? 1 : 0;
    return this;
  }

  public isConcluido(num: number): this {
    this.props.concluido = num !== 0 ? 1 : 0;
    return this;
  }

  public withObservacao(obs: string | null): this {
    this.props.observacao = obs;
    return this;
  }

  public withIsAutoAgen(num: number): this {
    this.props.is_auto_agen = num !== 0 ? 1 : 0;
    return this;
  }

  public withCriadoEm(data: number): this {
    this.props.criado_em = data;
    return this;
  }

  public build(): Appointment {
    return { ...this.props } as Appointment;
  }
}
