import * as SQLite from "expo-sqlite";
import { SCHEMA_STATEMENTS } from "./schema";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync("petshop.db");
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
  }
  return db;
}

/* - Drops de triggers, index e tables
  //Cole lá em baixo, vai ter a indicação
    await db.execAsync(`
    DROP INDEX IF EXISTS idx_pets_dono_id;
    DROP INDEX IF EXISTS idx_appointments_pet_id;
    DROP INDEX IF EXISTS idx_appointments_pet_data;
    DROP INDEX IF EXISTS idx_appointments_data_concluido;
    DROP INDEX IF EXISTS idx_owners_nome_normalizado;
    DROP INDEX IF EXISTS idx_pets_nome_normalizado;
    DROP INDEX IF EXISTS idx_appointments_stats;
    DROP INDEX IF EXISTS idx_appointments_perf_hora;
    DROP INDEX IF EXISTS idx_appointments_auto_agen;
    DROP INDEX IF EXISTS idx_pets_ausentes;
    DROP INDEX IF EXISTS idx_appointments_mensal;
    DROP INDEX IF EXISTS idx_appointments_auto_pendentes;


    DROP TRIGGER IF EXISTS trg_ultima_visita;
    DROP TRIGGER IF EXISTS trg_remarcacao_automatica;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_insert;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_ativar;
    DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
    DROP TRIGGER IF EXISTS trg_owner_desativar_pets;
    DROP TRIGGER IF EXISTS trg_pet_ativar_owner;
    DROP TRIGGER IF EXISTS trg_pet_desativar_limpar_remarcacao;

    DROP TABLE IF EXISTS appointments;
    DROP TABLE IF EXISTS pets;
    DROP TABLE IF EXISTS owners;
    DROP TABLE IF EXISTS race;
    DROP TABLE IF EXISTS species;
    DROP TABLE IF EXISTS service_type;
    DROP TABLE IF EXISTS configs;
    DROP TABLE IF EXISTS payment_methods;`);
*/

export async function initDatabase(): Promise<void> {
  const db = await getDatabase();

  // Cole abaixo os drops:

  try {
    for (const sql of SCHEMA_STATEMENTS) {
      await db.execAsync(sql);
    }
  } catch (e) {
    console.log(e);
  }
}
