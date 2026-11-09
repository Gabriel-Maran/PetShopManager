// Restauração de backup (BackupService.importDatabase): o mesmo upgradeBackup e o mesmo restoreBackup
// do app. O "arquivo" importado é um banco em memória compartilhada, que a conexão do app anexa como
// "src", então nada vai para o disco.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
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
} from "./helpers/database.mjs";
import { buildDemoDataSql } from "../app/config/demoData.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";
import { MIGRATIONS } from "../app/config/schema.ts";
import {
  restoreBackup,
  upgradeBackup,
} from "../app/config/backupRestore.ts";
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

const rows = (db, tabela) => db.prepare(`SELECT * FROM ${tabela} ORDER BY id`).all();
/** Os atendimentos concluídos, como objetos simples para comparar. */
const doneAppointments = (db) =>
  db.prepare("SELECT data, valor FROM appointments WHERE concluido = 1").all().map((row) => ({ ...row }));
const userVersion = (db) => db.prepare("PRAGMA user_version").get().user_version;
const isAttached = (db) => db.prepare("PRAGMA database_list").all().some(({ name }) => name === "src");

describe("restauração de backup", () => {
  test("donos e agendamentos voltam iguais aos do backup, e os dados antigos do app somem", async () => {
    const { uri, backup } = await createBackup();
    const app = await appWithData();

    await importBackup(app, { uri, backup });

    assert.deepEqual(rows(app, "owners"), rows(backup, "owners"));
    assert.deepEqual(rows(app, "appointments"), rows(backup, "appointments"));
    assert.equal(isAttached(app), false, "o backup é desanexado no fim");
    assert.equal(app.prepare("PRAGMA foreign_keys").get().foreign_keys, 1, "as chaves voltam ligadas");
    backup.close();
  });

  test("BKP-1, confirmado: o ponteiro da remarcação dos pets com pacote é recalculado na importação", async () => {
    const { uri, backup } = await createBackup();
    // Simula um backup antigo: a agenda do pacote ia só até a metade, e o ponteiro apontava para lá.
    const pet = backup.prepare("SELECT id FROM pets WHERE remarcacao_ativa = 1 ORDER BY id LIMIT 1").get();
    const pending = backup
      .prepare("SELECT data FROM appointments WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0 ORDER BY data")
      .all(pet.id);
    const cut = pending[Math.floor(pending.length / 2)].data;
    backup.prepare("DELETE FROM appointments WHERE pet_id = ? AND is_auto_agen = 1 AND data > ?").run(pet.id, cut);
    backup.prepare("UPDATE pets SET ultimo_visita_data_auto = ? WHERE id = ?").run(cut, pet.id);
    const app = await createDatabase();

    await importBackup(app, { uri, backup });

    const restored = app.prepare("SELECT ultimo_visita_data_auto FROM pets WHERE id = ?").get(pet.id);
    const lastPending = app
      .prepare("SELECT MAX(data) AS data FROM appointments WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0")
      .get(pet.id).data;
    // A agenda voltou igual à do backup, mas o ponteiro não: o trigger de cadastro do pet o refez.
    assert.equal(lastPending, cut);
    assert.notEqual(restored.ultimo_visita_data_auto, cut);
    assert.ok(restored.ultimo_visita_data_auto > cut);

    // Os pets sem pacote voltam exatamente iguais.
    const withoutPackage = "SELECT * FROM pets WHERE remarcacao_ativa = 0 ORDER BY id";
    assert.deepEqual(app.prepare(withoutPackage).all(), backup.prepare(withoutPackage).all());
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
    const restoredPet = app.prepare("SELECT * FROM pets WHERE id = ?").get(pet.id);
    assert.equal(restoredPet.valor_pacote, 20000);
    assert.equal(restoredPet.data_inicio_pacote, isoDate(3));
    assert.deepEqual(doneAppointments(app), [{ data: isoDate(-10), valor: 1250 }]);
    // A agenda do pacote volta como a do backup, convertida, e não como o trigger do app a faria.
    assert.deepEqual(rows(app, "appointments"), rows(backup, "appointments"));
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

  test("um backup de uma versão mais nova do app é recusado, e os dados do app ficam", async () => {
    const { uri, backup } = await createBackup();
    backup.exec(`PRAGMA user_version = ${LATEST + 1};`);
    const app = await appWithData();
    const before = rows(app, "owners");

    await assert.rejects(importBackup(app, { uri, backup }), { name: "AppError", code: "INVALID_BACKUP", message: MESSAGES.backup.newerVersion });

    assert.deepEqual(rows(app, "owners"), before);
    assert.equal(userVersion(backup), LATEST + 1, "a cópia não é mexida");
    backup.close();
  });

  test("um banco sem as tabelas do app é recusado antes de qualquer migração", async () => {
    const uri = backupUri();
    const backup = openConnection(uri);
    backup.exec("CREATE TABLE notas (id INTEGER PRIMARY KEY, texto TEXT);");
    const app = await appWithData();
    const before = rows(app, "owners");

    await assert.rejects(importBackup(app, { uri, backup }), { name: "AppError", code: "INVALID_BACKUP", message: MESSAGES.backup.notABackup });

    assert.deepEqual(rows(app, "owners"), before);
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

  test("se a cópia de uma tabela falha no meio, o app fica como estava", async () => {
    const { uri, backup } = await createBackup();
    // Os agendamentos, a última tabela copiada, com uma coluna a mais que a do app.
    backup.exec("ALTER TABLE appointments ADD COLUMN extra TEXT;");
    const app = await appWithData();
    const before = Object.fromEntries(
      ["owners", "pets", "appointments"].map((table) => [table, rows(app, table)]),
    );

    await assert.rejects(importBackup(app, { uri, backup }), /values were supplied/);

    for (const [table, tableRows] of Object.entries(before)) {
      assert.deepEqual(rows(app, table), tableRows, `${table} continua igual`);
    }
    assert.equal(isAttached(app), false, "o backup é desanexado mesmo com a falha");
    assert.equal(app.prepare("PRAGMA foreign_keys").get().foreign_keys, 1);
    backup.close();
  });
});
