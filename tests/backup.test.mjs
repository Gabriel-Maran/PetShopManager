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
  createPet,
  databaseAt,
  insertOwner,
  insertPet,
  isoDate,
  legacyDateInt,
  openConnection,
  pendingAutoOf,
  petRow,
} from "./helpers/database.mjs";
import { buildDemoDataSql } from "../src/config/demoData.ts";
import { normalizeForSearch } from "../src/utils/formatadores/normalizaNome.ts";
import { MIGRATIONS } from "../src/config/schema.ts";
import {
  restoreBackup,
  upgradeBackup,
} from "../src/config/backupRestore.ts";
import { BACKUP_TABLES } from "../src/repository/sql/backupSql.ts";
import {
  FIND_APPOINTMENT_SQL,
  LIST_APPOINTMENTS_BETWEEN_SQL,
  UPDATE_APPOINTMENT_SQL,
  updateAppointmentParams,
} from "../src/repository/sql/appointmentsSql.ts";
import { LIST_PAYMENT_METHODS_SQL, LIST_SERVICE_TYPES_SQL } from "../src/repository/sql/listsSql.ts";
import { FIND_PET_SQL } from "../src/repository/sql/petsSql.ts";
import { MESSAGES } from "../src/globals/messages.ts";
import { AppError } from "../src/errors/AppError.ts";

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

  test("depois da importação, o cadastro de um pet com pacote gera a agenda", async () => {
    const { uri, backup } = await createBackup();
    const app = await createDatabase();
    await importBackup(app, { uri, backup });

    const dono_id = insertOwner(app, { nome: "Dono novo" });
    const pet = await createPet(app, { dono_id, remarcacao_ativa: 1, pacote_remarcacao: 2, data_inicio_pacote: isoDate(1) });

    const agenda = pendingAutoOf(app, pet.id);
    assert.ok(agenda.length > 0, "a remarcação gera a agenda no banco restaurado");
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

    const appColumns =
      "SELECT id, pet_id, servico_id, data, hora, valor, concluido, tipo_pgto_id FROM appointments ORDER BY id";
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

  test("um backup da versão 3, com a agenda feita pelos triggers, entra igual e sem eles", async () => {
    const uri = backupUri();
    const backup = await databaseAt(3, uri);
    const dono_id = insertOwner(backup, { nome: "Dono do backup da versão 3" });
    const pet = insertPet(backup, {
      dono_id, remarcacao_ativa: 1, pacote_remarcacao: 2, data_inicio_pacote: isoDate(-20), valor_pacote: 20001,
    });
    const agendaBefore = rows(backup, "appointments");
    assert.ok(agendaBefore.length > 0, "o trigger da versão 3 gerou a agenda");
    const app = await appWithData();

    await importBackup(app, { uri, backup });

    assert.equal(userVersion(app), LATEST);
    // Desde a versão 6, o serviço vai pelo id (o "Banho" é o 1 da carga inicial) e pelo nome da época,
    // e o "0" do DEFAULT antigo do pagamento é a forma não informada.
    const inV6 = ({ servico, tipo_pgto, ...rest }) => ({
      ...rest, servico_id: 1, servico_nome: "Banho", tipo_pgto_id: null, tipo_pgto_nome: null,
    });
    assert.deepEqual(
      rows(app, "appointments").map((row) => ({ ...row })),
      agendaBefore.map(inV6),
      "a agenda vem como estava",
    );
    assert.equal(petRow(app, pet.id).ultimo_visita_data_auto, pendingAutoOf(backup, pet.id).at(-1).data);
    const triggers = appTriggers(app).map(({ name }) => name);
    assert.ok(!triggers.includes("trg_pet_remarcacao_insert") && !triggers.includes("trg_remarcacao_automatica"));
    backup.close();
  });

  test("um backup da versão 5 entra com o serviço e o pagamento pelo id, mesmo com outra lista", async () => {
    const uri = backupUri();
    const backup = await databaseAt(5, uri);
    // A carga de maio de 2026 tinha o PIX no 3 e o Dinheiro no 4; o app de hoje tem o PIX no 4.
    backup.exec(`
      UPDATE payment_methods SET tipo_pgto = 'PIX' WHERE id = 3;
      UPDATE payment_methods SET tipo_pgto = 'Dinheiro' WHERE id = 4;
    `);
    const pet = insertPet(backup, {
      dono_id: insertOwner(backup, { nome: "Dono do backup da versão 5" }),
      porte: "Médio",
      servico_padrao: "Banho e Tosa",
      horario_padrao: null,
    });
    const insert = backup.prepare(
      "INSERT INTO appointments (pet_id, servico, data, hora, valor, tipo_pgto, concluido) VALUES (?, ?, ?, ?, ?, ?, 1)",
    );
    insert.run(pet.id, "Banho e Tosa", isoDate(-7), "9:30", 9500, "PIX");
    insert.run(pet.id, "Hidratação", isoDate(-3), "15:00", 4000, "Vale-presente");
    const app = await appWithData();

    await importBackup(app, { uri, backup });

    assert.equal(userVersion(app), LATEST);
    // A lista de pagamento vem junto do backup: sem ela, o id 3 seria o Dinheiro do app.
    assert.deepEqual(rows(app, "payment_methods"), rows(backup, "payment_methods"));
    const shown = app
      .prepare(LIST_APPOINTMENTS_BETWEEN_SQL)
      .all(isoDate(-10), isoDate(0))
      .map(({ servico, tipo_pgto, hora, valor }) => ({ servico, tipo_pgto, hora, valor }));
    assert.deepEqual(shown, [
      { servico: "Banho e Tosa", tipo_pgto: "PIX", hora: "09:30", valor: 9500 },
      { servico: "Hidratação", tipo_pgto: "Vale-presente", hora: "15:00", valor: 4000 },
    ]);
    const restoredPet = app.prepare(FIND_PET_SQL).get(pet.id);
    assert.deepEqual(
      [restoredPet.porte, restoredPet.servico_padrao, restoredPet.horario_padrao],
      ["MEDIO", "Banho e Tosa", "00:00"],
    );
    backup.close();
  });

  test("um backup da versão 5 com dado ruim entra com notas, ocultos, nomes e serviços padrão corretos", async () => {
    const uri = backupUri();
    const backup = await databaseAt(5, uri);
    // O backup tem outra lista de pagamento (o PIX no 3) e nem tem o "Banho" na lista de serviços.
    backup.exec(`
      UPDATE payment_methods SET tipo_pgto = 'PIX' WHERE id = 3;
      UPDATE payment_methods SET tipo_pgto = 'Dinheiro' WHERE id = 4;
      DELETE FROM service_type WHERE servico = 'Banho';
    `);
    const pet = insertPet(backup, {
      dono_id: insertOwner(backup, { nome: "Dono do backup da versão 5 com dado ruim" }),
      porte: "xyz",
      servico_padrao: "Hidratação",
      observacoes: "Observação do pet",
      horario_padrao: "25:00",
      valor_pacote: -1150,
    });
    const insert = backup.prepare(
      `INSERT INTO appointments (pet_id, servico, data, hora, valor, tipo_pgto, observacao, concluido)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    );
    const textOnly = Number(insert.run(pet.id, "Banho", isoDate(-7), "9:30", 6000, "PIX", null).lastInsertRowid);
    const hidden = Number(
      insert.run(pet.id, "Hidratação", isoDate(-3), "abc", -50, "Vale-presente", "Já tinha observação").lastInsertRowid,
    );
    const app = await appWithData();

    await importBackup(app, { uri, backup });

    // As listas vêm do backup, com o "Banho" ativo e os desconhecidos ocultos.
    assert.deepEqual(rows(app, "payment_methods"), rows(backup, "payment_methods"));
    assert.deepEqual(rows(app, "service_type"), rows(backup, "service_type"));
    const active = (sql, column) => app.prepare(sql).all().map((row) => row[column]);
    assert.ok(active(LIST_SERVICE_TYPES_SQL, "servico").includes("Banho"));
    assert.ok(!active(LIST_SERVICE_TYPES_SQL, "servico").includes("Hidratação"));
    assert.ok(!active(LIST_PAYMENT_METHODS_SQL, "tipo_pgto").includes("Vale-presente"));

    // As notas, os nomes da época e os ids de pagamento da lista do backup.
    const restoredPet = app.prepare(FIND_PET_SQL).get(pet.id);
    assert.deepEqual(
      [restoredPet.porte, restoredPet.horario_padrao, restoredPet.valor_pacote, restoredPet.servico_padrao],
      ["MEDIO", "00:00", 0, "Hidratação"],
    );
    assert.equal(
      restoredPet.observacoes,
      'Observação do pet\nPorte antigo: "xyz". Horário padrão antigo: "25:00". Valor do pacote antigo: "-11,50".',
    );
    const stored = (id) =>
      ({ ...app.prepare("SELECT servico_nome, tipo_pgto_id, tipo_pgto_nome, hora, valor, observacao FROM appointments WHERE id = ?").get(id) });
    assert.deepEqual(stored(textOnly), {
      servico_nome: "Banho", tipo_pgto_id: 3, tipo_pgto_nome: "PIX", hora: "09:30", valor: 6000, observacao: null,
    });
    assert.deepEqual(stored(hidden), {
      servico_nome: "Hidratação",
      tipo_pgto_id: backup.prepare("SELECT id FROM payment_methods WHERE tipo_pgto = 'Vale-presente'").get().id,
      tipo_pgto_nome: "Vale-presente",
      hora: "00:00",
      valor: 0,
      observacao: 'Já tinha observação\nHorário antigo: "abc". Valor antigo: "-0,50".',
    });

    // Editar o oculto sem trocar funciona, e renomear depois da restauração não muda o histórico.
    const before = { ...app.prepare("SELECT servico_id, tipo_pgto_id FROM appointments WHERE id = ?").get(hidden) };
    const old = app.prepare(FIND_APPOINTMENT_SQL).get(hidden);
    app.prepare(UPDATE_APPOINTMENT_SQL).run(...updateAppointmentParams({ ...old, ta_pago: 1 }, hidden));
    assert.deepEqual({ ...app.prepare("SELECT servico_id, tipo_pgto_id FROM appointments WHERE id = ?").get(hidden) }, before);
    app.prepare("UPDATE service_type SET servico = 'Hidratação premium' WHERE servico = 'Hidratação'").run();
    app.prepare("UPDATE payment_methods SET tipo_pgto = 'Pix' WHERE tipo_pgto = 'PIX'").run();
    const shown = app.prepare(LIST_APPOINTMENTS_BETWEEN_SQL).all(isoDate(-10), isoDate(0));
    assert.deepEqual(
      shown.map(({ servico, tipo_pgto }) => ({ servico, tipo_pgto })),
      [{ servico: "Banho", tipo_pgto: "PIX" }, { servico: "Hidratação", tipo_pgto: "Vale-presente" }],
    );

    // O esquema é o de um banco novo, e os dados de exemplo carregam sobre ele.
    const schema = (db) => db.prepare("SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name").all();
    assert.deepEqual(schema(app), schema(await createDatabase()));
    app.exec("DELETE FROM owners;");
    app.exec(buildDemoDataSql({ today: new Date(), normalize: normalizeForSearch }));
    const demo = app.prepare("SELECT COUNT(*) AS total, SUM(servico_nome IS NULL) AS unnamed FROM appointments").get();
    assert.ok(demo.total > 0 && demo.unnamed === 0);
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
