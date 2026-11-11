import type { PackageFrequency, PetSize, ServiceName } from "../../../config/petEnums";
import type { IsoDate } from "../../../utils/dates";

/** O formulário do pet, que as duas abas editam: os valores como os campos mostram, antes de salvar. */
export interface PetForm {
  name: string;
  speciesId: number;
  ownerId: number;
  ownerName: string;
  breedId: number;
  breedName: string;
  notes: string;
  size: PetSize;
  defaultService: ServiceName;
  rescheduleActive: boolean;
  packageFrequency: PackageFrequency | undefined;
  packagePrice: string;
  packageStartDate: IsoDate;
  defaultTime: string;
}
