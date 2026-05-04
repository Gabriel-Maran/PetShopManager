export interface Appointment {
  id?: number;
  pet_id: number;
  servico: string;
  data: number;
  entregar_pet: number;
  concluido: number;
  observacao?: string | null;
  criado_em?: number;
}
