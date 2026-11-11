import { PackageFrequency, PetSize, ServiceName } from "../config/petEnums";
import type { IsoDate } from "../utils/dates";
import type { Cents } from "../utils/money";

export interface Pet {
  id?: number;
  name: string;
  species_id: number;
  size: PetSize;
  breed_id?: number;
  breed_name?: string;
  notes?: string | null;
  owner_id: number;
  /** O nome do serviço. Desde a versão 6 do esquema, o banco guarda o id, e o repository traduz. */
  default_service: ServiceName;
  package_price?: Cents | null;
  reschedule_active: number; // 0 ou 1
  package_frequency?: PackageFrequency | null; // 2 ou 4 conforme o SQL
  package_start_date?: IsoDate | null;
  default_time?: string | null;
  last_visit_date?: IsoDate | null;
  last_auto_visit_date?: IsoDate | null;
  is_active: number; // 0 ou 1
  created_at?: IsoDate;
}

export type PetWithSpeciesBreedAndOwner = Pet & {
  species_name: string;
  breed_name: string;
  owner_name: string;
};

export class PetBuilder {
  private props: Partial<Pet>;

  constructor() {
    this.props = {
      name: "",
      species_id: 0,
      size: PetSize.Medium,
      owner_id: 0,
      default_service: ServiceName.BathAndGrooming,
      reschedule_active: 0,
      package_price: null,
      is_active: 1,
    };
  }

  public withName(name: string): this {
    this.props.name = name;
    return this;
  }

  public forOwner(ownerId: number): this {
    this.props.owner_id = ownerId;
    return this;
  }

  public withSpecies(species_id: number): this {
    this.props.species_id = species_id;
    return this;
  }

  public withSize(size: PetSize): this {
    this.props.size = size;
    return this;
  }

  public withBreed(breed_id: number): this {
    this.props.breed_id = breed_id;
    return this;
  }

  public withDefaultService(service: ServiceName): this {
    this.props.default_service = service;
    return this;
  }

  public withRescheduleActive(num: number): this {
    this.props.reschedule_active = num !== 0 ? 1 : 0;
    return this;
  }

  public withPackage(frequency: PackageFrequency | null | undefined): this {
    this.props.package_frequency = frequency;
    return this;
  }

  public withPackageStart(start: IsoDate | null | undefined): this {
    this.props.package_start_date = start;
    return this;
  }

  public withPackagePrice(price: Cents | null | undefined): this {
    this.props.package_price = price ?? null;
    return this;
  }

  public withDefaultTime(price: string | null | undefined): this {
    this.props.default_time = price;
    return this;
  }

  public withActive(num: number): this {
    this.props.is_active = num !== 0 ? 1 : 0;
    return this;
  }

  public withNotes(notes: string | null): this {
    this.props.notes = notes;
    return this;
  }

  public build(): Pet {
    return { ...this.props } as Pet;
  }
}
