export interface Appointment {
  id?: number;
  pet_id: number;
  servico: string;
  data: number;
  hora: string;
  entregar_pet: number; // 0 ou 1
  concluido: number; // 0 ou 1
  observacao?: string | null;
  is_auto_agen: number; // 0 ou 1
  criado_em?: number;
}
