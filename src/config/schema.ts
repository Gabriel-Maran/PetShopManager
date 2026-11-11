// Esquema do banco em SQL puro, sem depender do Expo. Cada versão fica num arquivo de migrations/, e o
// app aplica a lista MIGRATIONS na abertura (database.ts); os testes aplicam a mesma lista num SQLite
// em memória. Os imports levam a extensão .ts porque o Node dos testes exige.
import type { Migration } from "./migrator";
import { V1 } from "./migrations/v1.ts";
import { V2 } from "./migrations/v2.ts";
import { V3 } from "./migrations/v3.ts";
import { V4 } from "./migrations/v4.ts";
import { V5 } from "./migrations/v5.ts";
import { V6 } from "./migrations/v6.ts";
import { V7 } from "./migrations/v7.ts";

// ── Pragmas da conexão ────────────────────────────────────────────────────
// Valem só para a conexão aberta e não ficam no arquivo do banco. Por isso são ligados a cada
// abertura (getDatabase), e não numa migração.
//
// Com o trusted_schema desligado, os triggers, CHECKs, valores padrão e colunas geradas de um banco
// só usam funções sem efeito colateral. O esquema do app só usa as funções do próprio SQLite (date,
// strftime, substr...), e um backup escolhido pelo usuário, que vem de fora, não consegue rodar outra
// coisa ao ser conferido ou anexado (BKP-1).

export const SQL_CONNECTION_PRAGMAS = `
  PRAGMA foreign_keys = ON;
  PRAGMA recursive_triggers = ON;
  PRAGMA trusted_schema = OFF;
`;

// ── Migrações ─────────────────────────────────────────────────────────────
// Cada item leva o banco uma versão adiante (migrator.ts), em sequência a partir de 1.

export const MIGRATIONS: readonly Migration[] = [V1, V2, V3, V4, V5, V6, V7];