// SQL da restauração de backup sem depender do Expo: o BackupService e os testes executam os mesmos
// comandos. O banco importado fica anexado como "src".

/** As tabelas restauradas, nesta ordem. */
export const BACKUP_TABLES = [
  "configs",
  "service_type",
  "species",
  "race",
  "owners",
  "pets",
  "appointments",
];

export const clearTableSql = (tabela: string) => `DELETE FROM main.${tabela};`;

export const copyTableSql = (tabela: string) =>
  `INSERT INTO main.${tabela} SELECT * FROM src.${tabela};`;
