// Apoio dos testes do banco: cria o esquema real do app num SQLite em memória e grava com os mesmos
// comandos SQL dos repositories (app/repository/sql). Nada é gravado em disco.
//
// Os triggers comparam datas com o relógio do SQLite ('now', em UTC), que não dá para fixar. Por isso
// as datas dos testes são relativas ao dia de verdade e ficam longe da virada do dia.
import { DatabaseSync } from "node:sqlite";
import { MIGRATIONS, SQL_CONNECTION_PRAGMAS } from "../../app/config/schema.ts";
import { migrateDatabase } from "../../app/config/migrator.ts";
import { normalizeForSearch } from "../../app/utils/formatadores/normalizaNome.ts";
import { INSERT_OWNER_SQL } from "../../app/repository/sql/ownersSql.ts";
import { INSERT_PET_SQL, UPDATE_PET_SQL } from "../../app/repository/sql/petsSql.ts";

/** Conexão aberta como o getDatabase do app abre, ainda sem as migrações. */
export function openConnection(path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec(SQL_CONNECTION_PRAGMAS);
  return db;
}

/** O DatabaseSync com a interface assíncrona do expo-sqlite que o migrateDatabase usa. */
export function asMigrationDatabase(db) {
  return {
    execAsync: async (sql) => {
      db.exec(sql);
    },
    getFirstAsync: async (sql) => db.prepare(sql).get() ?? null,
  };
}

/**
 * Banco novo, igual ao da primeira abertura do app: as mesmas migrações, pelo mesmo código. O caminho
 * pode ser uma memória compartilhada.
 */
export async function createDatabase(path = ":memory:") {
  const db = openConnection(path);
  await migrateDatabase(asMigrationDatabase(db), MIGRATIONS);
  return db;
}

/** Data no formato do banco (YYYYMMDD), a tantos dias de hoje, pelo calendário local. */
export function dateInt(offsetDays = 0) {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays);
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

/** YYYYMMDD → Date local, para comparar dias da semana e intervalos. */
export function toDate(value) {
  const text = String(value);
  return new Date(Number(text.slice(0, 4)), Number(text.slice(4, 6)) - 1, Number(text.slice(6, 8)));
}

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
  valor_pacote: "0,00",
};

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

/** Cadastra um pet como o app faz. Devolve o pet completo, para editar depois com updatePet. */
export function insertPet(db, fields) {
  const pet = { ...DEFAULT_PET, ...fields };
  const result = db.prepare(INSERT_PET_SQL).run(...petParams(pet));
  return { ...pet, id: Number(result.lastInsertRowid) };
}

/** Salva o formulário de edição do pet, que regrava todos os campos, como o app faz. */
export function updatePet(db, pet) {
  db.prepare(UPDATE_PET_SQL).run(...petParams(pet), pet.id);
}

export const petRow = (db, id) => db.prepare("SELECT * FROM pets WHERE id = ?").get(id);

export const appointmentsOf = (db, petId) =>
  db.prepare("SELECT * FROM appointments WHERE pet_id = ? ORDER BY data, id").all(petId);

export const pendingAutoOf = (db, petId) =>
  appointmentsOf(db, petId).filter((a) => a.is_auto_agen === 1 && a.concluido === 0);
