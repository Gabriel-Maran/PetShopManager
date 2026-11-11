import type { IsoDate } from "../utils/dates";

export interface Owner {
  id?: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  is_active: number; // 0 ou 1
  created_at?: IsoDate;
}

export class OwnerBuilder {
  private props: Partial<Owner>;

  constructor() {
    this.props = {
      name: "",
      phone: "",
      is_active: 1,
    };
  }

  public withName(name: string): this {
    this.props.name = name;
    return this;
  }

  public withPhone(phone: string): this {
    this.props.phone = phone;
    return this;
  }

  public withEmail(email: string | null): this {
    this.props.email = email;
    return this;
  }

  public withAddress(address: string | null): this {
    this.props.address = address;
    return this;
  }

  public withActive(num: number): this {
    this.props.is_active = num !== 0 ? 1 : 0;
    return this;
  }

  public build(): Owner {
    return { ...this.props } as Owner;
  }
}
