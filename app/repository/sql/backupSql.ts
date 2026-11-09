// SQL da restauração de backup sem depender do Expo: o BackupService e os testes executam os mesmos
// comandos (app/config/backupRestore.ts). O banco importado fica anexado como "src".

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

/** Os nomes das tabelas de um banco, para conferir se o arquivo é um backup do app. */
export const LIST_TABLES_SQL = "SELECT name FROM sqlite_master WHERE type = 'table';";

/** Anexa o backup. Parâmetro: o caminho do arquivo, sem o "file://". */
export const ATTACH_BACKUP_SQL = "ATTACH DATABASE ? AS src;";

export const DETACH_BACKUP_SQL = "DETACH DATABASE src;";

export const clearTableSql = (tabela: string) => `DELETE FROM main.${tabela};`;

export const copyTableSql = (tabela: string) =>
  `INSERT INTO main.${tabela} SELECT * FROM src.${tabela};`;
