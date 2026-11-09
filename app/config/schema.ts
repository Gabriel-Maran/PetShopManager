// Esquema do banco em SQL puro, sem depender do Expo. Cada versão fica num arquivo de migrations/, e o
// app aplica a lista MIGRATIONS na abertura (database.ts); os testes aplicam a mesma lista num SQLite
// em memória. Os imports levam a extensão .ts porque o Node dos testes exige.
import type { Migration } from "./migrator";
import { V1 } from "./migrations/v1.ts";
import { V2 } from "./migrations/v2.ts";

// ── Pragmas da conexão ────────────────────────────────────────────────────
// Valem só para a conexão aberta e não ficam no arquivo do banco. Por isso são ligados a cada
// abertura (getDatabase), e não numa migração.

export const SQL_CONNECTION_PRAGMAS = `
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
`;

// ── Migrações ─────────────────────────────────────────────────────────────
// Cada item leva o banco uma versão adiante (migrator.ts), em sequência a partir de 1.

export const MIGRATIONS: readonly Migration[] = [V1, V2];