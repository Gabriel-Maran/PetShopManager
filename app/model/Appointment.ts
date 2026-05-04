export interface Appointment {
  id?: number;
  pet_id: number;
  servico: string;
  data: number;
  hora: string;
  entregar_pet: number; // 0 para falso, 1 para verdadeiro
  observacao?: string;
  criado_em?: number;
}
