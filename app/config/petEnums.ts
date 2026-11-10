// Os valores fixos do pet: serviço, pacote, espécie e porte. Sem depender do React Native, para os
// schemas e os testes rodarem no Node, que só apaga os tipos do TypeScript e não executa `enum`; por
// isso são objetos `as const`, cada um com o tipo do mesmo nome. O consts.ts reexporta tudo.

type ValueOf<T> = T[keyof T];

export const TipoServico = {
  Banho: "Banho",
  BanhoETosa: "Banho e Tosa",
  BanhoEHigienica: "Banho e Higiênica",
} as const;
export type TipoServico = ValueOf<typeof TipoServico>;

/** Os pacotes de remarcação, pelas semanas entre os agendamentos automáticos: o número que o banco guarda. */
export const PACOTES_REMARCACAO = {
  Mensal: 4,
  Quinzenal: 2,
} as const;
export type PacoteRemarcacao = ValueOf<typeof PACOTES_REMARCACAO>;

/**
 * Os pacotes com o caminho de volta, do número para o nome, como o enum numérico gerava: o formulário
 * do pet confere o pacote salvo com `valor in PacoteRemarcacao`. Os schemas usam o PACOTES_REMARCACAO.
 */
export const PacoteRemarcacao = {
  ...PACOTES_REMARCACAO,
  4: "Mensal",
  2: "Quinzenal",
} as const;

export const EspeciesAtendidas = {
  CAO: "CAO",
  GATO: "GATO",
  OUTRO: "OUTRO",
} as const;
export type EspeciesAtendidas = ValueOf<typeof EspeciesAtendidas>;

export const EspeciesAtendidasLabel: Record<EspeciesAtendidas, string> = {
  [EspeciesAtendidas.CAO]: "Cão",
  [EspeciesAtendidas.GATO]: "Gato",
  [EspeciesAtendidas.OUTRO]: "Outro",
};

export const PorteAnimal = {
  PEQUENO: "PEQUENO",
  MEDIO: "MEDIO",
  GRANDE: "GRANDE",
  GRANDAO: "GRANDAO",
} as const;
export type PorteAnimal = ValueOf<typeof PorteAnimal>;

export const PorteAnimalLabel: Record<PorteAnimal, string> = {
  PEQUENO: "Pequeno",
  MEDIO: "Médio",
  GRANDE: "Grande",
  GRANDAO: "Grandão",
};
