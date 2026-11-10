// Restauração de backup (BackupService.importDatabase): o mesmo upgradeBackup e o mesmo restoreBackup
// do app. O "arquivo" importado é um banco em memória compartilhada, que a conexão do app anexa como
// "src", então nada vai para o disco.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  asMigrationDatabase,
  createDatabase,
  createLegacyDatabase,
  databaseAt,
  insertOwner,
  insertPet,
  isoDate,
  legacyDateInt,
  openConnection,
  pendingAutoOf,
  petRow,
} from "./helpers/database.mjs";
import { buildDemoDataSql } from "../app/config/demoData.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";
import { MIGRATIONS } from "../app/config/schema.ts";
import {
  restoreBackup,
  upgradeBackup,
} from "../app/config/backupRestore.ts";
import { BACKUP_TABLES } from "../app/repository/sql/backupSql.ts";
import { MESSAGES } from "../app/globals/messages.ts";
import { AppError } from "../app/errors/AppError.ts";

const LATEST = MIGRATIONS.length;

let backupCount = 0;

/** Um caminho de memória compartilhada, que outra conexão consegue anexar. */
const backupUri = () => `file:backup-${process.pid}-${++backupCount}?mode=memory&cache=shared`;

/** Um backup da versão atual, com os dados de exemplo. */
async function createBackup() {
  const uri = backupUri();
  const backup = await createDatabase(uri);
  backup.exec(buildDemoDataSql({ today: new Date(), normalize: normalizeForSearch }));
  return { uri, backup };
}

/**
 * Um backup no formato das versões 1 e 2: um dono com um pet de pacote (que já gera a agenda pelo
 * trigger da época) e um atendimento concluído, com a data AAAAMMDD e o valor em texto.
 */
function fillLegacyBackup(backup) {
  const dono_id = insertOwner(backup, { nome: "Dono do backup antigo" });
  const pet = insertPet(backup, {
    dono_id,
    remarcacao_ativa: 1,
    pacote_remarcacao: 4,
    data_inicio_pacote: legacyDateInt(3),
    valor_pacote: "200,00",
  });
  backup
    .prepare("INSERT INTO appointments (pet_id, servico, data, valor, concluido) VALUES (?, 'Banho', ?, '12,5', 1)")
    .run(pet.id, legacyDateInt(-10));
  return pet;
}

/** Os mesmos passos do importDatabase, depois de o arquivo ser escolhido e copiado. */
async function importBackup(app, { uri, backup }) {
  await upgradeBackup(asMigrationDatabase(backup), MIGRATIONS);
  await restoreBackup(asMigrationDatabase(app), uri);
}

/** Um app com um dono cadastrado, para conferir se ele some ou fica depois da importação. */
async function appWithData() {
  const app = await createDatabase();
  insertOwner(app, { nome: "Dono que estava no app" });
  return app;
}

/** Danifica o arquivo: o índice dos donos de pet passa a descrever outra coluna. */
function damageIndex(uri) {
  // O node:sqlite abre no modo defensivo, que não deixa mexer no sqlite_master.
  const raw = new DatabaseSync(uri, { defensive: false });
  raw.exec(`
    PRAGMA writable_schema = ON;
    UPDATE sqlite_master SET sql = replace(sql, '(dono_id)', '(nome)') WHERE name = 'idx_pets_dono_id';
    PRAGMA writable_schema = RESET;
  `);
  raw.close();
}

/** A conexão do app com a cópia de uma tabela falhando, como num disco cheio. */
function failingOnCopyOf(app, table) {
  const db = asMigrationDatabase(app);
  return {
    ...db,
    execAsync: async (sql) => {
      if (sql.startsWith(`INSERT INTO main.${table} `)) throw new Error("disk I/O error");
      await db.execAsync(sql);
    },
  };
}

const rows = (db, tabela) => db.prepare(`SELECT * FROM ${tabela} ORDER BY id`).all();
const allTables = (db) => Object.fromEntries(BACKUP_TABLES.map((table) => [table, rows(db, table)]));
/** Os atendimentos concluídos, como objetos simples para comparar. */
const doneAppointments = (db) =>
  db.prepare("SELECT data, valor FROM appointments WHERE concluido = 1").all().map((row) => ({ ...row }));
const idSequences = (db) => db.prepare("SELECT name, seq FROM sqlite_sequence ORDER BY name").all();
const appTriggers = (db) =>
  db.prepare("SELECT name, sql FROM sqlite_master WHERE type = 'trigger' ORDER BY rowid").all();
const userVersion = (db) => db.prepare("PRAGMA user_version").get().user_version;
const isAttached = (db) => db.prepare("PRAGMA database_list").all().some(({ name }) => name === "src");
const foreignKeysOn = (db) => db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1;

/** Confere que a importação recusada não mexeu em nada do app. */
function assertUntouched(app, before) {
  assert.deepEqual(allTables(app), before.tables, "os dados do app continuam iguais");
  assert.deepEqual(appTriggers(app), before.triggers, "os triggers do app continuam iguais");
  assert.equal(isAttached(app), false, "o backup é desanexado");
  assert.equal(foreignKeysOn(app), true, "as chaves voltam ligadas");
}
const snapshot = (app) => ({ tables: allTables(app), triggers: appTriggers(app) });

describe("restauração de backup", () => {
  test("exportar e importar devolve o mesmo banco: as tabelas, a contagem de ids e os triggers", async () => {
    const { uri, backup } = await createBackup();
    // O último agendamento foi apagado no aparelho de origem, e o id dele não deve voltar a ser usado.
    backup.exec("DELETE FROM appointments WHERE id = (SELECT MAX(id) FROM appointments);");
    const app = await appWithData();
    const triggers = appTriggers(app);

    await importBackup(app, { uri, backup });

    assert.deepEqual(allTables(app), allTables(backup));
    assert.deepEqual(idSequences(app), idSequences(backup));
    assert.deepEqual(appTriggers(app), triggers, "os triggers voltam iguais, na mesma ordem");
    assert.equal(isAttached(app), false, "o backup é desanexado no fim");
    assert.equal(foreignKeysOn(app), true, "as chaves voltam ligadas");
    backup.close();
  });

  test("BKP-1: o ponteiro da remarcação dos pets com pacote volta igual ao do backup", async () => {
    const { uri, backup } = await createBackup();
    // Um backup antigo: a agenda do pacote ia só até a metade, e o ponteiro apontava para lá.
    const pet = backup.prepare("SELECT id FROM pets WHERE remarcacao_ativa = 1 ORDER BY id LIMIT 1").get();
    const pending = pendingAutoOf(backup, pet.id);
    const cut = pending[Math.floor(pending.length / 2)].data;
    backup.prepare("DELETE FROM appointments WHERE pet_id = ? AND is_auto_agen = 1 AND data > ?").run(pet.id, cut);
    backup.prepare("UPDATE pets SET ultimo_visita_data_auto = ? WHERE id = ?").run(cut, pet.id);
    const app = await createDatabase();

    await importBackup(app, { uri, backup });

    // Antes, o trigger de cadastro do pet refazia a agenda na cópia e levava o ponteiro além do corte.
    assert.equal(petRow(app, pet.id).ultimo_visita_data_auto, cut);
    assert.deepEqual(rows(app, "pets"), rows(backup, "pets"));
    assert.deepEqual(rows(app, "appointments"), rows(backup, "appointments"));
    backup.close();
  });

  test("depois da importação, o cadastro de um pet com pacote volta a gerar a agenda", async () => {
    const { uri, backup } = await createBackup();
    const app = await createDatabase();
    await importBackup(app, { uri, backup });

    const dono_id = insertOwner(app, { nome: "Dono novo" });
    const pet = insertPet(app, { dono_id, remarcacao_ativa: 1, pacote_remarcacao: 2, data_inicio_pacote: isoDate(1) });

    const agenda = pendingAutoOf(app, pet.id);
    assert.ok(agenda.length > 0, "o trigger de cadastro voltou");
    assert.equal(petRow(app, pet.id).ultimo_visita_data_auto, agenda.at(-1).data);
    backup.close();
  });

  test("a ordem das colunas no arquivo do backup não importa", async () => {
    const { uri, backup } = await createBackup();
    // As configurações com as colunas ao contrário: com SELECT *, o is_ativo cairia no id.
    backup.exec(`
      CREATE TABLE configs_invertida (is_ativo INTEGER NOT NULL DEFAULT 0, config TEXT NOT NULL UNIQUE, id INTEGER PRIMARY KEY AUTOINCREMENT);
      INSERT INTO configs_invertida (is_ativo, config, id) SELECT is_ativo, config, id FROM configs;
      DROP TABLE configs;
      ALTER TABLE configs_invertida RENAME TO configs;
    `);
    const app = await createDatabase();

    await importBackup(app, { uri, backup });

    const byName = "SELECT id, config, is_ativo FROM configs ORDER BY id";
    assert.deepEqual(app.prepare(byName).all(), backup.prepare(byName).all());
    backup.close();
  });

  test("uma coluna a mais no backup fica de fora, e o resto entra", async () => {
    const { uri, backup } = await createBackup();
    backup.exec("ALTER TABLE appointments ADD COLUMN extra TEXT DEFAULT 'não é do app';");
    const app = await createDatabase();

    await importBackup(app, { uri, backup });

    const appColumns = "SELECT id, pet_id, servico, data, hora, valor, concluido FROM appointments ORDER BY id";
    assert.deepEqual(app.prepare(appColumns).all(), backup.prepare(appColumns).all());
    backup.close();
  });

  test("se a cópia de uma tabela falha no meio, o app fica como estava, com os triggers", async () => {
    const { uri, backup } = await createBackup();
    const app = await appWithData();
    const before = snapshot(app);

    // Os agendamentos são a última tabela copiada: as outras já foram trocadas quando ela falha.
    await assert.rejects(restoreBackup(failingOnCopyOf(app, "appointments"), uri), /disk I\/O error/);

    assertUntouched(app, before);
    backup.close();
  });
});

describe("backup de versão anterior", () => {
  test("um backup da versão 2 entra com o dinheiro em centavos e as datas em texto", async () => {
    const uri = backupUri();
    const backup = await databaseAt(2, uri);
    const pet = fillLegacyBackup(backup);
    const app = await appWithData();

    await importBackup(app, { uri, backup });

    assert.equal(userVersion(backup), LATEST, "a cópia do backup sobe para a última versão");
    assert.equal(userVersion(app), LATEST);
    const [owner] = rows(app, "owners");
    assert.equal(owner.nome, "Dono do backup antigo");
    const restoredPet = petRow(app, pet.id);
    assert.equal(restoredPet.valor_pacote, 20000);
    assert.equal(restoredPet.data_inicio_pacote, isoDate(3));
    assert.deepEqual(doneAppointments(app), [{ data: isoDate(-10), valor: 1250 }]);
    // A agenda do pacote volta como a do backup, convertida, e não como o trigger do app a faria.
    assert.deepEqual(rows(app, "appointments"), rows(backup, "appointments"));
    assert.deepEqual(rows(app, "pets"), rows(backup, "pets"));
    backup.close();
  });

  test("um backup de antes das migrações também entra no formato de hoje", async () => {
    const uri = backupUri();
    const backup = createLegacyDatabase(uri);
    const pet = fillLegacyBackup(backup);
    assert.equal(userVersion(backup), 0);
    const app = await appWithData();

    await importBackup(app, { uri, backup });

    assert.equal(userVersion(backup), LATEST);
    const restoredPet = app.prepare("SELECT valor_pacote, data_inicio_pacote FROM pets WHERE id = ?").get(pet.id);
    assert.deepEqual({ ...restoredPet }, { valor_pacote: 20000, data_inicio_pacote: isoDate(3) });
    assert.deepEqual(doneAppointments(app), [{ data: isoDate(-10), valor: 1250 }]);
    backup.close();
  });
});

describe("arquivo inválido ou malicioso", () => {
  const rejection = (message) => ({ name: "AppError", code: "INVALID_BACKUP", message });

  test("um backup de uma versão mais nova do app é recusado, e os dados do app ficam", async () => {
    const { uri, backup } = await createBackup();
    backup.exec(`PRAGMA user_version = ${LATEST + 1};`);
    const app = await appWithData();
    const before = snapshot(app);

    await assert.rejects(importBackup(app, { uri, backup }), rejection(MESSAGES.backup.newerVersion));

    assertUntouched(app, before);
    assert.equal(userVersion(backup), LATEST + 1, "a cópia não é mexida");
    backup.close();
  });

  test("um banco sem as tabelas do app é recusado antes de qualquer migração", async () => {
    const uri = backupUri();
    const backup = openConnection(uri);
    backup.exec("CREATE TABLE notas (id INTEGER PRIMARY KEY, texto TEXT);");
    const app = await appWithData();
    const before = snapshot(app);

    await assert.rejects(importBackup(app, { uri, backup }), rejection(MESSAGES.backup.notABackup));

    assertUntouched(app, before);
    const tables = backup.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
    assert.deepEqual(tables.map(({ name }) => name), ["notas"], "nenhuma tabela é criada na cópia");
    assert.equal(userVersion(backup), 0);
    backup.close();
  });

  test("um arquivo que não é banco SQLite é recusado com a mesma mensagem", async () => {
    const sqliteError = new Error("file is not a database");
    const notADatabase = {
      execAsync: async () => {},
      getFirstAsync: async () => {
        throw sqliteError;
      },
      getAllAsync: async () => {
        throw sqliteError;
      },
    };

    await assert.rejects(upgradeBackup(notADatabase, MIGRATIONS), (error) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.code, "INVALID_BACKUP");
      assert.equal(error.message, MESSAGES.backup.notABackup);
      assert.equal(error.cause, sqliteError, "o motivo de verdade fica no cause");
      return true;
    });
  });

  test("um backup danificado é recusado pelo integrity_check, antes das migrações", async () => {
    const uri = backupUri();
    const backup = await databaseAt(2, uri);
    fillLegacyBackup(backup);
    damageIndex(uri);
    const app = await appWithData();
    const before = snapshot(app);

    await assert.rejects(importBackup(app, { uri, backup }), (error) => {
      assert.equal(error.code, "INVALID_BACKUP");
      assert.equal(error.message, MESSAGES.backup.damaged);
      assert.match(error.cause.message, /idx_pets_dono_id/, "o problema achado fica no cause, para o log");
      return true;
    });

    assertUntouched(app, before);
    assert.equal(userVersion(backup), 2, "a cópia não passa pelas migrações");
    backup.close();
  });

  test("um backup sem uma coluna do app é recusado antes de mexer nos dados", async () => {
    const { uri, backup } = await createBackup();
    backup.exec("ALTER TABLE owners DROP COLUMN email;");
    const app = await appWithData();
    const before = snapshot(app);

    await assert.rejects(importBackup(app, { uri, backup }), rejection(MESSAGES.backup.notABackup));

    assertUntouched(app, before);
    backup.close();
  });

  test("um backup com uma função insegura no esquema é recusado sem rodar a função", async () => {
    const { uri, backup } = await createBackup();
    let calls = 0;
    const sideEffect = () => {
      calls += 1;
      return 1;
    };
    // Quem montou o arquivo usou uma função com efeito colateral num CHECK, que o SQLite roda ao
    // conferir a tabela. Aqui a função existe nas duas conexões, como se o aparelho a tivesse.
    const author = new DatabaseSync(uri);
    author.function("efeito_colateral", { varargs: true }, sideEffect);
    author.exec(`
      CREATE TABLE notas (id INTEGER PRIMARY KEY, texto TEXT CHECK (efeito_colateral(texto)));
      INSERT INTO notas (texto) VALUES ('roda no integrity_check');
    `);
    author.close();
    backup.function("efeito_colateral", { varargs: true }, sideEffect);
    calls = 0;
    const app = await appWithData();
    const before = snapshot(app);

    assert.equal(backup.prepare("PRAGMA trusted_schema").get().trusted_schema, 0, "aberto como o app abre");
    await assert.rejects(importBackup(app, { uri, backup }), (error) => {
      assert.equal(error.message, MESSAGES.backup.notABackup);
      assert.match(error.cause.message, /unsafe use of efeito_colateral/);
      return true;
    });

    assert.equal(calls, 0, "a função do arquivo não rodou");
    assertUntouched(app, before);
    backup.close();
  });
});
