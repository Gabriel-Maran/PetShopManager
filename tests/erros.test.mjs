// Módulo de erros (ERRO-1): o AppError, o texto que a tela mostra, o que vai para o log e as mensagens
// de globals. Só o AppError leva a própria mensagem à tela; qualquer outro erro vira a genérica.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { AppError, isAppError, logError, toUserMessage } from "../src/errors/AppError.ts";
import { MESSAGES } from "../src/globals/messages.ts";

/** Todas as frases fixas de MESSAGES, com o caminho de cada uma. */
function fixedMessages(group = MESSAGES, path = "MESSAGES") {
  return Object.entries(group).flatMap(([key, value]) => {
    const keyPath = `${path}.${key}`;
    if (typeof value === "string") return [[keyPath, value]];
    if (typeof value === "function") return [];
    return fixedMessages(value, keyPath);
  });
}

/** As chamadas do console.error durante `work`, sem escrever no terminal dos testes. */
function captureConsoleError(t, work) {
  const spy = t.mock.method(console, "error", () => {});
  work();
  return spy.mock.calls.map((call) => call.arguments);
}

describe("AppError", () => {
  test("guarda o código, a mensagem e o motivo, e continua sendo um Error", () => {
    const cause = new Error("SQLITE_CORRUPT");
    const error = new AppError("INVALID_BACKUP", MESSAGES.backup.notABackup, { cause });

    assert.ok(error instanceof Error);
    assert.ok(error instanceof AppError);
    assert.ok(isAppError(error));
    assert.equal(error.name, "AppError");
    assert.equal(error.code, "INVALID_BACKUP");
    assert.equal(error.message, MESSAGES.backup.notABackup);
    assert.equal(error.cause, cause);
    assert.match(error.stack, /AppError/);
  });

  test("um Error comum, um texto ou nada não contam como AppError", () => {
    for (const value of [new Error("x"), new TypeError("x"), "Dono não encontrado.", null, undefined, {}]) {
      assert.equal(isAppError(value), false, String(value));
    }
  });
});

describe("toUserMessage", () => {
  test("o AppError mostra a própria mensagem", () => {
    const error = new AppError("VALIDATION", MESSAGES.owner.phoneInvalid);
    assert.equal(toUserMessage(error), MESSAGES.owner.phoneInvalid);
  });

  test("qualquer outro erro vira a mensagem genérica, sem detalhe interno", () => {
    const internals = [
      new Error("SQLITE_CONSTRAINT: NOT NULL constraint failed: owners.nome"),
      new TypeError("Cannot read properties of undefined (reading 'id')"),
      "UNIQUE constraint failed: races.nome_raca",
      { message: "objeto qualquer" },
      null,
      undefined,
    ];
    for (const error of internals) {
      assert.equal(toUserMessage(error), MESSAGES.unexpected, String(error));
    }
  });

  test("a tela pode trocar a genérica por uma do contexto", () => {
    assert.equal(toUserMessage(new Error("disk I/O error"), MESSAGES.database.openFailed), MESSAGES.database.openFailed);
    const known = new AppError("DATABASE", MESSAGES.database.newerVersion);
    assert.equal(toUserMessage(known, MESSAGES.database.openFailed), MESSAGES.database.newerVersion);
  });
});

describe("logError", () => {
  test("uma falha de validação é prevista e não vai para o log", (t) => {
    const calls = captureConsoleError(t, () => logError(new AppError("VALIDATION", MESSAGES.pet.nameRequired)));
    assert.deepEqual(calls, []);
  });

  test("o erro inesperado vai inteiro para o log, com o contexto", (t) => {
    const error = new Error("SQLITE_BUSY");
    const calls = captureConsoleError(t, () => logError(error, "tema"));
    assert.deepEqual(calls, [["[tema]", error]]);
  });

  test("um AppError com motivo vai para o log, para o motivo não se perder", (t) => {
    const error = new AppError("DATABASE", MESSAGES.database.migrationFailed(4), { cause: new Error("no such table") });
    const calls = captureConsoleError(t, () => logError(error));
    assert.deepEqual(calls, [["[erro]", error]]);
  });
});

describe("mensagens de globals", () => {
  test("cada falha tem a sua frase: nenhuma mensagem se repete", () => {
    const seen = new Map();
    for (const [path, text] of fixedMessages()) {
      assert.ok(!seen.has(text), `${path} repete ${seen.get(text)}: "${text}"`);
      seen.set(text, path);
    }
  });

  test("toda mensagem é uma frase completa, sem espaço sobrando", () => {
    const dynamic = [
      ["MESSAGES.invalidOption", MESSAGES.invalidOption("Porte", ["PEQUENO", "MEDIO"])],
      ["MESSAGES.invalidFlag", MESSAGES.invalidFlag("Ativo")],
      ["MESSAGES.database.migrationFailed", MESSAGES.database.migrationFailed(4)],
    ];
    for (const [path, text] of [...fixedMessages(), ...dynamic]) {
      assert.equal(text, text.trim(), path);
      assert.match(text, /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ].*\.$/su, `${path}: "${text}"`);
    }
  });

  test("as mensagens com valor mostram o que foi aceito", () => {
    assert.equal(
      MESSAGES.invalidOption("Pacote de remarcação", ["Mensal", "Quinzenal", 4, 2]),
      "Pacote de remarcação inválido. Valores aceitos: Mensal, Quinzenal, 4, 2.",
    );
    assert.equal(MESSAGES.invalidFlag("Remarcação ativa"), "Remarcação ativa deve ser 0 ou 1.");
    assert.equal(
      MESSAGES.database.migrationFailed(3),
      "A atualização do banco para a versão 3 falhou, e nenhum dado foi alterado.",
    );
  });

  test("o telefone vazio e o telefone inválido têm mensagens diferentes", () => {
    assert.notEqual(MESSAGES.owner.phoneRequired, MESSAGES.owner.phoneInvalid);
    assert.notEqual(MESSAGES.owner.nameRequired, MESSAGES.owner.phoneRequired);
  });
});
