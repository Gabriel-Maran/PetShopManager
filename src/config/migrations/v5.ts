// Versão 5 do esquema: o horário padrão vazio vira "00:00". Não mude este arquivo: uma versão
// publicada não muda mais.
//
// A coluna sempre teve o DEFAULT '00:00', e o formulário grava o vazio como "00:00" desde o VALID-1,
// mas um pet salvo por uma versão antiga do app pode ter o horário nulo. Com o pacote ligado, esse
// nulo quebrava a agenda: o atendimento gerado leva o horário do pet, e a coluna `hora` do
// agendamento é NOT NULL. Concluir um automático desse pet falhava. A correção segue a regra que o
// app já usa para o horário vazio. Um backup antigo passa por esta mesma migração.
import type { Migration } from "../migrator";

export const SQL_DEFAULT_TIME_V5 = `
  UPDATE pets SET horario_padrao = '00:00' WHERE horario_padrao IS NULL;
`;

export const V5: Migration = {
  version: 5,
  statements: [SQL_DEFAULT_TIME_V5],
};
