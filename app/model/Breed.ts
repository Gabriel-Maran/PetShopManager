/** Uma raça na lista do seletor de raça do pet: o id e o nome. */
export interface Breed {
  id: number;
  nome: string;
}

/** Uma raça com a espécie dela, para mostrar o nome no pet e conferir a espécie ao salvar. */
export interface BreedRecord {
  id: number;
  especie_id: number;
  nome_raca: string;
}
