// Os valores fixos do pet: serviço, pacote, espécie e porte. Sem depender do React Native, para os
// schemas e os testes rodarem no Node, que só apaga os tipos do TypeScript e não executa `enum`; por
// isso são objetos `as const`, cada um com o tipo do mesmo nome. O consts.ts reexporta tudo.

type ValueOf<T> = T[keyof T];

export const ServiceName = {
  Bath: "Banho",
  BathAndGrooming: "Banho e Tosa",
  BathAndHygienicTrim: "Banho e Higiênica",
} as const;
export type ServiceName = ValueOf<typeof ServiceName>;

/** Os pacotes de remarcação, pelas visitas por mês, o número que o banco guarda: 4 é semanal, e 2, quinzenal. */
export const PackageFrequency = {
  Weekly: 4,
  Biweekly: 2,
} as const;
export type PackageFrequency = ValueOf<typeof PackageFrequency>;

/** Se o valor é um dos pacotes, como o pet salvo traz do banco. */
export function isPackageFrequency(value: unknown): value is PackageFrequency {
  return Object.values(PackageFrequency).some((frequency) => frequency === value);
}

export const SpeciesCode = {
  Dog: "DOG",
  Cat: "CAT",
  Other: "OTHER",
} as const;
export type SpeciesCode = ValueOf<typeof SpeciesCode>;

export const SpeciesLabel: Record<SpeciesCode, string> = {
  [SpeciesCode.Dog]: "Cão",
  [SpeciesCode.Cat]: "Gato",
  [SpeciesCode.Other]: "Outro",
};

export const PetSize = {
  Small: "SMALL",
  Medium: "MEDIUM",
  Large: "LARGE",
  ExtraLarge: "EXTRA_LARGE",
} as const;
export type PetSize = ValueOf<typeof PetSize>;

export const PetSizeLabel: Record<PetSize, string> = {
  [PetSize.Small]: "Pequeno",
  [PetSize.Medium]: "Médio",
  [PetSize.Large]: "Grande",
  [PetSize.ExtraLarge]: "Grandão",
};
