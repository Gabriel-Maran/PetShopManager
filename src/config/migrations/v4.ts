// Versão 4 do esquema: a remarcação sai dos triggers (ARQ-2). Não mude este arquivo: uma versão
// publicada não muda mais.
//
// A agenda do pacote passa a ser calculada em TypeScript (domain/packageSchedule.ts) e gravada pelo
// PackageScheduleService, na mesma transação do pet ou do agendamento. Saem os três triggers que
// faziam a conta de calendário. Ficam os de integridade e cascata: a última visita
// (trg_ultima_visita), a desativação do dono e do pet, a reativação do dono e a limpeza dos
// automáticos ao desligar o pacote. Nenhum dado muda: a agenda já gravada continua como está.
import type { Migration } from "../migrator";

export const SQL_DROP_SCHEDULE_TRIGGERS_V4 = `
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
  DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
`;

export const V4: Migration = {
  version: 4,
  statements: [SQL_DROP_SCHEDULE_TRIGGERS_V4],
};
