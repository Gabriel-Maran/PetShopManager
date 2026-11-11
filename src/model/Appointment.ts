import type { IsoDate } from "../utils/dates";
import type { Cents } from "../utils/money";

export interface Appointment {
  id?: number;
  pet_id: number;
  /** O nome do serviço. Desde a versão 6 do esquema, o banco guarda o id, e o repository traduz. */
  service: string;
  time: string;
  date: IsoDate;
  deliver_pet: number; // 0 ou 1
  completed: number; // 0 ou 1
  notes?: string | null;
  is_auto: number; // 0 ou 1
  price: Cents;
  /** O nome da forma de pagamento, ou vazio se não foi informada. O banco guarda o id, como o serviço. */
  payment_method: string;
  is_paid: number;
  created_at?: IsoDate;
}

export type AppointmentsWithOwnerAndPet = Appointment & {
  id: number;
  pet_name: string;
  owner_name: string;
  species_name: string;
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
      service: "",
      time: "00:00",
      date: "",
      deliver_pet: 0,
      completed: 0,
      is_auto: 0,
      price: 0,
      payment_method: "",
      is_paid: 0,
    };
  }

  public withPetId(pet_id: number): this {
    this.props.pet_id = pet_id;
    return this;
  }

  public withService(service: string): this {
    this.props.service = service;
    return this;
  }

  public withTime(time: string): this {
    this.props.time = time;
    return this;
  }

  public withDate(date: IsoDate): this {
    this.props.date = date;
    return this;
  }

  public withDeliverPet(num: number): this {
    this.props.deliver_pet = num !== 0 ? 1 : 0;
    return this;
  }

  public withCompleted(num: number): this {
    this.props.completed = num !== 0 ? 1 : 0;
    return this;
  }

  public withNotes(notes: string | null): this {
    this.props.notes = notes;
    return this;
  }

  public withAuto(num: number): this {
    this.props.is_auto = num !== 0 ? 1 : 0;
    return this;
  }

  public withPrice(price: Cents): this {
    this.props.price = price;
    return this;
  }

  public withPaymentMethod(payment_method: string): this {
    this.props.payment_method = payment_method;
    return this; 
  }

  public withPaid(is_paid: number): this {
    this.props.is_paid = is_paid;
    return this;
  }

  public withCreatedAt(date: IsoDate): this {
    this.props.created_at = date;
    return this;
  }

  public build(): Appointment {
    return { ...this.props } as Appointment;
  }
}
