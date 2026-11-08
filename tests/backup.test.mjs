// Caracterização da restauração de backup (BackupService.importDatabase): os mesmos comandos SQL, com
// o banco importado anexado como "src". O "arquivo" importado é um banco em memória compartilhada,
// então nada vai para o disco.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabase } from "./helpers/database.mjs";
import { buildDemoDataSql } from "../app/config/demoData.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";
import {
  BACKUP_TABLES,
  clearTableSql,
  copyTableSql,
} from "../app/repository/sql/backupSql.ts";

let backupCount = 0;

/** Um backup com os dados de exemplo, num banco em memória que outra conexão consegue anexar. */
function createBackup() {
  const uri = `file:backup-${process.pid}-${++backupCount}?mode=memory&cache=shared`;
  const backup = createDatabase(uri);
  backup.exec(buildDemoDataSql({ today: new Date(), normalize: normalizeForSearch }));
  return { uri, backup };
}

/** Os mesmos passos do importDatabase, depois de o arquivo ser escolhido e copiado. */
function restore(app, uri) {
  app.exec(`ATTACH DATABASE '${uri}' AS src;`);
  try {
    app.exec("PRAGMA foreign_keys = OFF;");
    app.exec("BEGIN TRANSACTION;");
    for (const tabela of BACKUP_TABLES) {
      app.exec(clearTableSql(tabela));
      app.exec(copyTableSql(tabela));
    }
    app.exec("COMMIT;");
  } finally {
    app.exec("PRAGMA foreign_keys = ON;");
    app.exec("DETACH DATABASE src;");
  }
}

const rows = (db, tabela) => db.prepare(`SELECT * FROM ${tabela} ORDER BY id`).all();

describe("restauração de backup", () => {
  test("donos e agendamentos voltam iguais aos do backup, e os dados antigos do app somem", () => {
    const { uri, backup } = createBackup();
    const app = createDatabase();
    app.exec("INSERT INTO owners (nome, telefone) VALUES ('Dono que estava no app', '(44) 90000-0000')");

    restore(app, uri);

    assert.deepEqual(rows(app, "owners"), rows(backup, "owners"));
    assert.deepEqual(rows(app, "appointments"), rows(backup, "appointments"));
    backup.close();
  });

  test("BKP-1, confirmado: o ponteiro da remarcação dos pets com pacote é recalculado na importação", () => {
    const { uri, backup } = createBackup();
    // Simula um backup antigo: a agenda do pacote ia só até a metade, e o ponteiro apontava para lá.
    const pet = backup.prepare("SELECT id FROM pets WHERE remarcacao_ativa = 1 ORDER BY id LIMIT 1").get();
    const pending = backup
      .prepare("SELECT data FROM appointments WHERE pet_id = ? AND is_auto_agen = 1 AND concluido = 0 ORDER BY data")
      .all(pet.id);
    const cut = pending[Math.floor(pending.length / 2)].data;
    backup.prepare("DELETE FROM appointments WHERE pet_id = ? AND is_auto_agen = 1 AND data > ?").run(pet.id, cut);
    backup.prepare("UPDATE pets SET ultimo_visita_data_auto = ? WHERE id = ?").run(cut, pet.id);
    const app = createDatabase();

    restore(app, uri);

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
