// SQL da restauração de backup sem depender do Expo: o BackupService e os testes executam os mesmos
// comandos (app/config/backupRestore.ts). O banco importado fica anexado como "src".
//
// Os nomes de tabela, coluna e trigger que entram no texto dos comandos vêm desta lista ou do esquema
// do próprio app ("main"), nunca do arquivo importado.

/** As tabelas restauradas, nesta ordem. Um arquivo sem todas elas não é backup do app. */
export const BACKUP_TABLES = [
  "configs",
  "service_type",
  "species",
  "race",
  "owners",
  "pets",
  "appointments",
];

/** Confere o arquivo inteiro e para no primeiro problema. Um arquivo íntegro devolve "ok". */
export const INTEGRITY_CHECK_SQL = "PRAGMA integrity_check(1);";

/** Os nomes das tabelas de um banco, para conferir se o arquivo é um backup do app. */
export const LIST_TABLES_SQL = "SELECT name FROM sqlite_master WHERE type = 'table';";

/** Anexa o backup. Parâmetro: o caminho do arquivo, sem o "file://". */
export const ATTACH_BACKUP_SQL = "ATTACH DATABASE ? AS src;";

export const DETACH_BACKUP_SQL = "DETACH DATABASE src;";

/**
 * As colunas de uma tabela, sem a coluna gerada (dia_semana), que o SQLite calcula sozinho. O banco
 * vai no segundo argumento: com "src.pragma_table_info", o SQLite leria a tabela do main.
 */
export const tableColumnsSql = (schema: "main" | "src", tabela: string) =>
  `SELECT name FROM pragma_table_info('${tabela}', '${schema}');`;

export const clearTableSql = (tabela: string) => `DELETE FROM main.${tabela};`;

/** Copia pelo nome das colunas: a ordem delas no arquivo do backup não importa. */
export function copyTableSql(tabela: string, colunas: readonly string[]): string {
  const lista = colunas.map((coluna) => `"${coluna}"`).join(", ");
  return `INSERT INTO main.${tabela} (${lista}) SELECT ${lista} FROM src.${tabela};`;
}

const BACKUP_TABLE_NAMES = BACKUP_TABLES.map((tabela) => `'${tabela}'`).join(", ");

/** A contagem de ids volta a ser a do backup, para um id apagado lá não voltar a ser usado. */
export const COPY_ID_SEQUENCES_SQL = `
  DELETE FROM main.sqlite_sequence WHERE name IN (${BACKUP_TABLE_NAMES});
  INSERT INTO main.sqlite_sequence (name, seq)
    SELECT name, seq FROM src.sqlite_sequence WHERE name IN (${BACKUP_TABLE_NAMES});
`;

/** Os triggers do app, na ordem em que foram criados, com o comando que cria cada um. */
export const LIST_APP_TRIGGERS_SQL =
  "SELECT name, sql FROM main.sqlite_master WHERE type = 'trigger' ORDER BY rowid;";

export const dropTriggerSql = (trigger: string) => `DROP TRIGGER main."${trigger}";`;
