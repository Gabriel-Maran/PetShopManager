// Dados pessoais no aparelho e no backup (SEG-1, decisão P20): o banco, com nome, telefone, e-mail e
// endereço dos clientes, não vai sozinho para a nuvem pelo backup automático do Android, e quem exporta
// o backup pelo app é avisado do que vai dentro do arquivo.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DIALOGS } from "../src/globals/messages.ts";

const appConfig = JSON.parse(readFileSync(new URL("../app.json", import.meta.url), "utf8"));

describe("backup automático do Android", () => {
  test("fica desligado no app.json", () => {
    // Comparado com o booleano: um "false" em texto não desliga nada no build.
    assert.equal(appConfig.expo.android.allowBackup, false);
  });
});

describe("aviso ao exportar o backup", () => {
  test("diz quais dados pessoais vão no arquivo e que ele não tem senha", () => {
    const { message } = DIALOGS.exportBackup;
    for (const personalData of ["nome", "telefone", "e-mail", "endereço"]) {
      assert.match(message, new RegExp(personalData), `o aviso não cita ${personalData}`);
    }
    assert.match(message, /senha/);
  });
});

describe("modais de confirmação", () => {
  test("todo modal tem título, mensagem em frase terminada em ponto e botão curto", () => {
    for (const [name, dialog] of Object.entries(DIALOGS)) {
      assert.ok(dialog.title.trim().length > 0, `DIALOGS.${name}.title está vazio`);
      assert.match(dialog.message, /^\p{Lu}.*\.$/su, `DIALOGS.${name}.message não é uma frase com ponto`);
      // O botão divide a linha com o "Cancelar": um rótulo longo quebra em duas linhas.
      const { confirmLabel } = dialog;
      assert.ok(confirmLabel.trim().length > 0 && confirmLabel.length <= 12, `DIALOGS.${name}.confirmLabel: "${confirmLabel}"`);
    }
  });
});
