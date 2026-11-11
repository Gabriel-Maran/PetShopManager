// Apoio dos testes do banco: cria o esquema real do app num SQLite em memória e grava com os mesmos
// comandos SQL dos repositories (src/repository/sql). Nada é gravado em disco.
//
// Os triggers comparam datas com o relógio do SQLite ('now', no fuso local), que não dá para fixar. Por
// isso as datas dos testes são relativas ao dia de verdade e ficam longe da virada do dia. A remarcação
// (PackageScheduleService) recebe o "agora" de quem chama; aqui, o relógio de verdade, como no app.
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, SQL_CONNECTION_PRAGMAS } from "../../src/config/schema.ts";
import { migrateDatabase } from "../../src/config/migrator.ts";
import { normalizeForSearch } from "../../src/utils/formatters/normalizeForSearch.ts";
import { todayIso } from "../../src/utils/dates.ts";
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

/** A versão em que tabelas, colunas e códigos passaram para o inglês (NOMES-1). */
const ENGLISH_VERSION = 7;

/** Banco de antes da versão 7: os comandos dos helpers usam os nomes em português da época. */
export const isBeforeEnglish = (db) => schemaVersion(db) < ENGLISH_VERSION;

/** Os códigos de porte de antes da versão 7, para gravar num banco antigo o que os testes passam. */
const LEGACY_SIZES = { SMALL: "PEQUENO", MEDIUM: "MEDIO", LARGE: "GRANDE", EXTRA_LARGE: "GRANDAO" };
const legacySize = (size) => LEGACY_SIZES[size] ?? size;

/** O nome de hoje de cada coluna de antes da versão 7, para ler um banco antigo com os nomes novos. */
const ENGLISH_COLUMNS = {
  nome: "name", nome_normalizado: "normalized_name", telefone: "phone", endereco: "address",
  is_ativo: "is_active", criado_em: "created_at", especie: "species_id", porte: "size", raca: "breed_id",
  observacoes: "notes", dono_id: "owner_id", servico_padrao: "default_service",
  servico_padrao_id: "default_service_id", remarcacao_ativa: "reschedule_active",
  pacote_remarcacao: "package_frequency", valor_pacote: "package_price",
  data_inicio_pacote: "package_start_date", horario_padrao: "default_time",
  current_ultima_visita_data: "last_visit_date", ultimo_visita_data_auto: "last_auto_visit_date",
  servico: "service", servico_id: "service_id", servico_nome: "service_name", data: "date", hora: "time",
  dia_semana: "weekday", entregar_pet: "deliver_pet", concluido: "completed", observacao: "notes",
  is_auto_agen: "is_auto", valor: "price", tipo_pgto: "payment_method", tipo_pgto_id: "payment_method_id",
  tipo_pgto_nome: "payment_method_name", ta_pago: "is_paid",
};

/** As colunas da tabela, as de antes da versão 7 com o nome de hoje (inclusive a gerada, dia_semana). */
function englishColumnsOf(db, table) {
  return db
    .prepare("SELECT name FROM pragma_table_xinfo(?)")
    .all(table)
    .map(({ name }) => (ENGLISH_COLUMNS[name] ? `${name} AS ${ENGLISH_COLUMNS[name]}` : name))
    .join(", ");
}

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

const LEGACY_INSERT_OWNER_SQL =
  "INSERT INTO owners (nome, nome_normalizado, telefone, email, endereco) VALUES (?, ?, ?, ?, ?)";

export function insertOwner(db, { name = "Dono Teste", phone = "(44) 90000-0000" } = {}) {
  const sql = isBeforeEnglish(db) ? LEGACY_INSERT_OWNER_SQL : INSERT_OWNER_SQL;
  const result = db.prepare(sql).run(name, normalizeForSearch(name), phone, null, null);
  return Number(result.lastInsertRowid);
}

const DEFAULT_PET = {
  name: "Rex",
  species_id: 1, // CAO, da carga inicial do esquema
  size: "MEDIUM",
  breed_id: 1, // Vira-lata (SRD), da carga inicial do esquema
  notes: null,
  default_service: "Banho",
  reschedule_active: 0,
  package_frequency: null,
  package_start_date: null,
  default_time: "10:00",
  package_price: 0, // centavos
};

// Os comandos do app de cada época, com os mesmos parâmetros do INSERT_PET_SQL e do UPDATE_PET_SQL de
// hoje, para montar um banco antigo. Até a versão 5, o pet gravava o nome do serviço padrão; na 6, o id.
const legacyServiceColumn = (version) =>
  version < LIST_IDS_VERSION ? "servico_padrao" : "servico_padrao_id";
const legacyServiceValue = (version) =>
  version < LIST_IDS_VERSION ? "?" : "(SELECT id FROM service_type WHERE servico = ?)";

const legacyInsertPetSql = (version) => `INSERT INTO pets (nome, nome_normalizado, especie, porte, raca,
  observacoes, dono_id, ${legacyServiceColumn(version)}, remarcacao_ativa,
  pacote_remarcacao, data_inicio_pacote, horario_padrao, valor_pacote)
  VALUES (?, ?, ?, ?, ?, ?, ?, ${legacyServiceValue(version)}, ?, ?, ?, ?, ?)`;

const legacyUpdatePetSql = (version) => `UPDATE pets SET nome = ?, nome_normalizado = ?, especie = ?,
  porte = ?, raca = ?, observacoes = ?, dono_id = ?,
  ${legacyServiceColumn(version)} = ${legacyServiceValue(version)},
  remarcacao_ativa = ?, pacote_remarcacao = ?, data_inicio_pacote = ?, horario_padrao = ?, valor_pacote = ?
  WHERE id = ?`;

const isLegacy = (db) => schemaVersion(db) < LIST_IDS_VERSION;

// Os parâmetros na ordem do INSERT_PET_SQL e do UPDATE_PET_SQL, como o PetRepository monta.
const petParams = (pet, legacy = false) => [
  pet.name,
  normalizeForSearch(pet.name),
  pet.species_id,
  legacy ? legacySize(pet.size) : pet.size,
  pet.breed_id,
  pet.notes,
  pet.owner_id,
  pet.default_service,
  pet.reschedule_active,
  pet.package_frequency,
  pet.package_start_date,
  pet.default_time,
  pet.package_price,
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
  const legacy = isBeforeEnglish(db);
  const sql = legacy ? legacyInsertPetSql(schemaVersion(db)) : INSERT_PET_SQL;
  const result = db.prepare(sql).run(...petParams(pet, legacy));
  return { ...pet, id: Number(result.lastInsertRowid) };
}

/** Só o UPDATE do formulário do pet, sem passar pela remarcação, como o insertPet. */
export function updatePet(db, pet) {
  const legacy = isBeforeEnglish(db);
  const sql = legacy ? legacyUpdatePetSql(schemaVersion(db)) : UPDATE_PET_SQL;
  db.prepare(sql).run(...petParams(pet, legacy), pet.id);
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
  service: "Banho", date: null, time: "10:00", deliver_pet: 0, completed: 0, notes: null,
  is_auto: 0, price: 6000, payment_method: "", is_paid: 0,
};

/**
 * Cria um agendamento pelo comando do app (INSERT_APPOINTMENT_SQL), com o serviço e a forma de pagamento
 * pelo nome. Só vale num banco da versão 6 em diante. Devolve o id.
 */
export function insertAppointment(db, petId, fields = {}) {
  const appointment = { ...DEFAULT_APPOINTMENT, date: isoDate(2), ...fields, pet_id: petId };
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

/** As linhas da tabela na ordem em que entraram. Num banco de antes da versão 7, com os nomes de hoje. */
export const tableRows = (db, table) =>
  db.prepare(`SELECT ${isBeforeEnglish(db) ? englishColumnsOf(db, table) : "*"} FROM ${table} ORDER BY rowid`).all();

export const petRow = (db, id) =>
  db.prepare(`SELECT ${isBeforeEnglish(db) ? englishColumnsOf(db, "pets") : "*"} FROM pets WHERE id = ?`).get(id);

/**
 * Os agendamentos do pet, com as colunas que as telas leem (o serviço e a forma de pagamento pelo nome),
 * prontos para salvar de novo pela remarcação. Num banco de antes da versão 7, a linha como está no
 * banco, com os nomes de hoje.
 */
export const appointmentsOf = (db, petId) =>
  isBeforeEnglish(db)
    ? db
        .prepare(`SELECT ${englishColumnsOf(db, "appointments")} FROM appointments WHERE pet_id = ? ORDER BY data, id`)
        .all(petId)
    : db
        .prepare(`SELECT ${APPOINTMENT_COLUMNS} FROM ${APPOINTMENTS_TABLE} WHERE AP.pet_id = ? ORDER BY AP.date, AP.id`)
        .all(petId);

export const pendingAutoOf = (db, petId) =>
  appointmentsOf(db, petId).filter((a) => a.is_auto === 1 && a.completed === 0);
