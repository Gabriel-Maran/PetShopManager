// Apoio dos testes do banco: cria o esquema real do app num SQLite em memória e grava com os mesmos
// comandos SQL dos repositories (src/repository/sql). Nada é gravado em disco.
//
// Os triggers comparam datas com o relógio do SQLite ('now', no fuso local), que não dá para fixar. Por
// isso as datas dos testes são relativas ao dia de verdade e ficam longe da virada do dia. A remarcação
// (PackageScheduleService) recebe o "agora" de quem chama; aqui, o relógio de verdade, como no app.
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, SQL_CONNECTION_PRAGMAS } from "../../src/config/schema.ts";
import { migrateDatabase } from "../../src/config/migrator.ts";
import { normalizeForSearch } from "../../src/utils/formatadores/normalizaNome.ts";
import { todayIso } from "../../src/utils/datas.ts";
import { INSERT_OWNER_SQL } from "../../src/repository/sql/ownersSql.ts";
import { INSERT_PET_SQL, UPDATE_PET_SQL } from "../../src/repository/sql/petsSql.ts";
import {
  APPOINTMENT_COLUMNS,
  APPOINTMENTS_TABLE,
  FIND_APPOINTMENT_SQL,
  INSERT_APPOINTMENT_SQL,
  insertAppointmentParams,
} from "../../src/repository/sql/appointmentsSql.ts";
import { FIND_PET_SQL } from "../../src/repository/sql/petsSql.ts";
import { LIST_PAYMENT_METHODS_SQL, LIST_SERVICE_TYPES_SQL } from "../../src/repository/sql/listsSql.ts";
import { PackageScheduleService } from "../../src/service/PackageScheduleService.ts";
import { assertAppointmentChoices, storedChoicesOf } from "../../src/service/appointmentRules.ts";
import { appointmentSchemaFor } from "../../src/validation/appointmentSchema.ts";
import { petSchemaFor } from "../../src/validation/petSchema.ts";
import { parseInput } from "../../src/validation/parseInput.ts";

/** Conexão aberta como o getDatabase do app abre, ainda sem as migrações. */
export function openConnection(path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec(SQL_CONNECTION_PRAGMAS);
  return db;
}

/**
 * O DatabaseSync com a interface assíncrona do expo-sqlite que as migrações, a restauração e a
 * remarcação usam, com os parâmetros um a um.
 */
export function asMigrationDatabase(db) {
  return {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    getFirstAsync: async (sql, ...params) => db.prepare(sql).get(...params) ?? null,
    getAllAsync: async (sql, ...params) => db.prepare(sql).all(...params),
    runAsync: async (sql, ...params) => {
      const { changes, lastInsertRowid } = db.prepare(sql).run(...params);
      return { changes: Number(changes), lastInsertRowId: Number(lastInsertRowid) };
    },
  };
}

/** A remarcação do app sobre o banco do teste. `connection` troca a conexão, para simular falhas. */
export const packageScheduleOf = (db, connection = asMigrationDatabase(db)) =>
  new PackageScheduleService(async () => connection);

/**
 * Banco novo levado só até a versão pedida, como um aparelho com o app daquela época. O caminho pode
 * ser uma memória compartilhada, para outra conexão anexar o banco como um backup.
 */
export async function databaseAt(version, path = ":memory:") {
  const db = openConnection(path);
  await migrateDatabase(asMigrationDatabase(db), MIGRATIONS.slice(0, version));
  return db;
}

/** Banco novo, igual ao da primeira abertura do app: as mesmas migrações, pelo mesmo código. */
export const createDatabase = (path = ":memory:") => databaseAt(MIGRATIONS.length, path);

/** A versão do esquema gravada no banco. */
export const schemaVersion = (db) => db.prepare("PRAGMA user_version").get().user_version;

/** A versão em que o serviço e a forma de pagamento passaram a ser gravados pelo id (DADOS-4). */
const LIST_IDS_VERSION = 6;

/** Banco como o app criava antes das migrações: o mesmo SQL da versão 1, sem marcar a versão. */
export function createLegacyDatabase(path = ":memory:") {
  const db = openConnection(path);
  for (const sql of MIGRATIONS[0].statements) db.exec(sql);
  return db;
}

/** Data a tantos dias de hoje, pelo calendário local. */
function daysFromToday(offsetDays) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
}

/** Data no formato do banco desde a versão 3 ("AAAA-MM-DD"), a tantos dias de hoje. */
export const isoDate = (offsetDays = 0) => todayIso(daysFromToday(offsetDays));

/** Data no formato das versões 1 e 2 (o número AAAAMMDD), para montar um banco antigo. */
export const legacyDateInt = (offsetDays = 0) => Number(isoDate(offsetDays).replaceAll("-", ""));

/** "AAAA-MM-DD" → Date local, para comparar dias da semana e intervalos. */
export function toDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** "AAAA-MM-DD" → "AAAA-MM" */
export const monthOf = (iso) => iso.slice(0, 7);

export const daysBetween = (from, to) => Math.round((toDate(to) - toDate(from)) / 86_400_000);

export function insertOwner(db, { nome = "Dono Teste", telefone = "(44) 90000-0000" } = {}) {
  const result = db.prepare(INSERT_OWNER_SQL).run(nome, normalizeForSearch(nome), telefone, null, null);
  return Number(result.lastInsertRowid);
}

const DEFAULT_PET = {
  nome: "Rex",
  especie: 1, // CAO, da carga inicial do esquema
  porte: "MEDIO",
  raca: 1, // Vira-lata (SRD), da carga inicial do esquema
  observacoes: null,
  servico_padrao: "Banho",
  remarcacao_ativa: 0,
  pacote_remarcacao: null,
  data_inicio_pacote: null,
  horario_padrao: "10:00",
  valor_pacote: 0, // centavos
};

// Até a versão 5, o pet gravava o nome do serviço padrão. São os comandos do app daquela época, com os
// mesmos parâmetros do INSERT_PET_SQL e do UPDATE_PET_SQL de hoje, para montar um banco antigo.
const LEGACY_INSERT_PET_SQL = `INSERT INTO pets (nome, nome_normalizado, especie, porte, raca, observacoes,
  dono_id, servico_padrao, remarcacao_ativa, pacote_remarcacao, data_inicio_pacote, horario_padrao, valor_pacote)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const LEGACY_UPDATE_PET_SQL = `UPDATE pets SET nome = ?, nome_normalizado = ?, especie = ?, porte = ?,
  raca = ?, observacoes = ?, dono_id = ?, servico_padrao = ?, remarcacao_ativa = ?, pacote_remarcacao = ?,
  data_inicio_pacote = ?, horario_padrao = ?, valor_pacote = ?
  WHERE id = ?`;

const isLegacy = (db) => schemaVersion(db) < LIST_IDS_VERSION;

// Os parâmetros na ordem do INSERT_PET_SQL e do UPDATE_PET_SQL, como o PetRepository monta.
const petParams = (pet) => [
  pet.nome,
  normalizeForSearch(pet.nome),
  pet.especie,
  pet.porte,
  pet.raca,
  pet.observacoes,
  pet.dono_id,
  pet.servico_padrao,
  pet.remarcacao_ativa,
  pet.pacote_remarcacao,
  pet.data_inicio_pacote,
  pet.horario_padrao,
  pet.valor_pacote,
];

/** O formulário de um pet com os campos padrão, mais os passados. */
export const newPet = (fields) => ({ ...DEFAULT_PET, ...fields });

/**
 * Só o INSERT do pet, sem passar pela remarcação. Serve para quem não olha a agenda e para os bancos
 * das versões 1 a 3, em que os triggers ainda geravam a agenda. Num banco até a versão 5, usa o comando
 * da época. Devolve o pet completo.
 */
export function insertPet(db, fields) {
  const pet = newPet(fields);
  const result = db.prepare(isLegacy(db) ? LEGACY_INSERT_PET_SQL : INSERT_PET_SQL).run(...petParams(pet));
  return { ...pet, id: Number(result.lastInsertRowid) };
}

/** Só o UPDATE do formulário do pet, sem passar pela remarcação, como o insertPet. */
export function updatePet(db, pet) {
  db.prepare(isLegacy(db) ? LEGACY_UPDATE_PET_SQL : UPDATE_PET_SQL).run(...petParams(pet), pet.id);
}

/** Cadastra um pet como o app faz, pela remarcação. Devolve o pet completo, para editar com savePet. */
export async function createPet(db, fields, now = new Date()) {
  const pet = newPet(fields);
  const id = await packageScheduleOf(db).createPet(pet, now);
  return { ...pet, id };
}

/** Salva o formulário de edição do pet como o app faz: regrava todos os campos, pela remarcação. */
export const savePet = (db, pet, now = new Date()) => packageScheduleOf(db).updatePet(pet.id, pet, now);

const DEFAULT_APPOINTMENT = {
  servico: "Banho", data: null, hora: "10:00", entregar_pet: 0, concluido: 0, observacao: null,
  is_auto_agen: 0, valor: 6000, tipo_pgto: "", ta_pago: 0,
};

/**
 * Cria um agendamento pelo comando do app (INSERT_APPOINTMENT_SQL), com o serviço e a forma de pagamento
 * pelo nome. Só vale num banco da versão 6 em diante. Devolve o id.
 */
export function insertAppointment(db, petId, fields = {}) {
  const appointment = { ...DEFAULT_APPOINTMENT, data: isoDate(2), ...fields, pet_id: petId };
  const result = db.prepare(INSERT_APPOINTMENT_SQL).run(...insertAppointmentParams(appointment));
  return Number(result.lastInsertRowid);
}

/**
 * Salva a edição de um agendamento pelo caminho do app: o controller confere o schema com o que está
 * gravado, o service confere as listas com o que está gravado, e a remarcação grava. Devolve nada; um
 * valor recusado lança o AppError.
 */
export async function editAppointmentLikeTheApp(db, id, fields) {
  const stored = db.prepare(FIND_APPOINTMENT_SQL).get(id);
  const appointment = parseInput(appointmentSchemaFor(stored), { ...stored, ...fields });
  assertAppointmentChoices(
    appointment,
    { services: db.prepare(LIST_SERVICE_TYPES_SQL).all(), paymentMethods: db.prepare(LIST_PAYMENT_METHODS_SQL).all() },
    storedChoicesOf(stored),
  );
  await packageScheduleOf(db).updateAppointment(id, appointment);
}

/** Salva a edição de um pet pelo caminho do app (schema com o gravado, depois a remarcação). */
export async function editPetLikeTheApp(db, id, fields, now = new Date()) {
  const stored = db.prepare(FIND_PET_SQL).get(id);
  const pet = parseInput(petSchemaFor(stored), { ...stored, ...fields });
  await packageScheduleOf(db).updatePet(id, pet, now);
}

export const petRow = (db, id) => db.prepare("SELECT * FROM pets WHERE id = ?").get(id);

/**
 * Os agendamentos do pet. Desde a versão 6, com as colunas que as telas leem (o serviço e a forma de
 * pagamento pelo nome), prontos para salvar de novo pela remarcação; antes, a linha como está no banco.
 */
export const appointmentsOf = (db, petId) =>
  isLegacy(db)
    ? db.prepare("SELECT * FROM appointments WHERE pet_id = ? ORDER BY data, id").all(petId)
    : db
        .prepare(`SELECT ${APPOINTMENT_COLUMNS} FROM ${APPOINTMENTS_TABLE} WHERE AP.pet_id = ? ORDER BY AP.data, AP.id`)
        .all(petId);

export const pendingAutoOf = (db, petId) =>
  appointmentsOf(db, petId).filter((a) => a.is_auto_agen === 1 && a.concluido === 0);
