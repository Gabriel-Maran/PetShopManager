// O BackupService importa módulos nativos do Expo e não carrega no Node, então a parte pura (o nome
// do arquivo) não dá para importar daqui. Este teste guarda o que dá para conferir sem o aparelho:
// o serviço usa a API nova do expo-file-system e o nome exportado segue o formato combinado.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/service/BackupService.ts", import.meta.url), "utf8");
const easConfig = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"));

describe("BackupService", () => {
  test("usa a API nova do expo-file-system, não a legacy", () => {
    assert.doesNotMatch(source, /expo-file-system\/legacy/);
    assert.match(source, /from "expo-file-system"/);
  });

  test("o arquivo exportado se chama petshop-AAAA-MM-DD.db", () => {
    assert.match(source, /`petshop-\$\{todayIso\(\)\}\$\{BACKUP_EXTENSION\}`/);
    assert.match(source, /BACKUP_EXTENSION = "\.db"/);
  });
});

describe("eas.json", () => {
  test("fixa a faixa do EAS CLI e a origem do versionCode", () => {
    assert.ok(easConfig.cli.version);
    assert.equal(easConfig.cli.appVersionSource, "remote");
  });

  test("o perfil production incrementa o versionCode", () => {
    assert.equal(easConfig.build.production.autoIncrement, true);
  });
});
