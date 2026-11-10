// Validação da entrada com Zod (VALID-1): cada schema com entrada válida, inválida e nos limites, a
// entrada maliciosa e a conversão da falha no AppError com a mensagem de globals. Nenhum texto do Zod,
// em inglês, chega à tela.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as z from "zod";
import { parseInput, parseRecordId } from "../app/validation/parseInput.ts";
import { ownerSchema } from "../app/validation/ownerSchema.ts";
import { petSchema } from "../app/validation/petSchema.ts";
import { isPacoteRemarcacao, PacoteRemarcacao, PorteAnimal, TipoServico } from "../app/config/petEnums.ts";
import { appointmentSchema } from "../app/validation/appointmentSchema.ts";
import { breedSchema } from "../app/validation/breedSchema.ts";
import { breedCountSchema, breedSearchSchema, nameSearchSchema } from "../app/validation/searchSchema.ts";
import { configUpdateSchema } from "../app/validation/configSchema.ts";
import { AppError, logError } from "../app/errors/AppError.ts";
import { MESSAGES } from "../app/globals/messages.ts";
import {
  MAX_ADDRESS_LENGTH,
  MAX_BREED_NAME_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_LIST_ITEM_LENGTH,
  MAX_NOTES_LENGTH,
  MAX_OWNER_NAME_LENGTH,
  MAX_PET_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_SEARCH_LENGTH,
} from "../app/globals/limits.ts";
import { createDatabase } from "./helpers/database.mjs";
import { INSERT_OWNER_SQL } from "../app/repository/sql/ownersSql.ts";
import { normalizeForSearch } from "../app/utils/formatadores/normalizaNome.ts";

// ─── Apoio ──────────────────────────────────────────────────────────────────

/** O AppError de validação com a mensagem esperada. */
const validationError = (message) => (error) =>
  error instanceof AppError && error.code === "VALIDATION" && error.message === message;

/** Confere que a entrada é recusada com a mensagem esperada. */
function assertRejects(schema, input, message, label = JSON.stringify(input)) {
  assert.throws(() => parseInput(schema, input), validationError(message), label);
}

/** O AppError da entrada, para conferir o código, a mensagem e o motivo. */
function errorOf(schema, input) {
  try {
    parseInput(schema, input);
  } catch (error) {
    return error;
  }
  assert.fail(`a entrada passou: ${JSON.stringify(input)}`);
}

/** As chamadas do console.error durante `work`, sem escrever no terminal dos testes. */
function captureConsoleError(t, work) {
  const spy = t.mock.method(console, "error", () => {});
  work();
  return spy.mock.calls.map((call) => call.arguments);
}

const owner = (fields = {}) => ({
  nome: "Ana Souza",
  telefone: "(45) 99999-1234",
  email: "ana@example.com",
  endereco: "Rua das Acácias, 100",
  is_ativo: 1,
  ...fields,
});

const pet = (fields = {}) => ({
  nome: "Thor",
  especie: 1,
  dono_id: 1,
  porte: "MEDIO",
  raca: 1,
  servico_padrao: "Banho",
  observacoes: "",
  is_ativo: 1,
  remarcacao_ativa: 0,
  pacote_remarcacao: null,
  valor_pacote: null,
  data_inicio_pacote: "2026-11-09",
  horario_padrao: "00:00",
  ...fields,
});

/** Pet com a remarcação ligada e o pacote completo. */
const petWithPackage = (fields = {}) =>
  pet({
    remarcacao_ativa: 1,
    pacote_remarcacao: 4,
    valor_pacote: 32_000,
    data_inicio_pacote: "2026-11-09",
    horario_padrao: "09:30",
    ...fields,
  });

const appointment = (fields = {}) => ({
  pet_id: 1,
  servico: "Banho e Tosa",
  data: "2026-11-09",
  hora: "09:30",
  valor: 8_000,
  tipo_pgto: "PIX",
  observacao: "",
  entregar_pet: 0,
  concluido: 0,
  is_auto_agen: 0,
  ta_pago: 0,
  ...fields,
});

const nameSearch = (fields = {}) => ({ query: "", ativo: 1, page: 0, limit: 20, ...fields });

// ─── parseInput ─────────────────────────────────────────────────────────────

describe("parseInput", () => {
  test("devolve o dado limpo: texto sem espaço nas pontas e opcional vazio como null", () => {
    const data = parseInput(ownerSchema, owner({ nome: "  Ana Souza  ", email: "   ", endereco: "" }));
    assert.deepEqual(data, {
      nome: "Ana Souza",
      telefone: "(45) 99999-1234",
      email: null,
      endereco: null,
      is_ativo: 1,
    });
  });

  test("descarta os campos fora do schema", () => {
    const data = parseInput(ownerSchema, owner({ id: 99, criado_em: "2020-01-01", is_admin: true }));
    assert.deepEqual(Object.keys(data).sort(), ["email", "endereco", "is_ativo", "nome", "telefone"]);
  });

  test("a falha do usuário vira um AppError com a mensagem do campo, sem ir para o log", (t) => {
    const error = errorOf(ownerSchema, owner({ nome: "" }));
    assert.ok(error instanceof AppError);
    assert.equal(error.code, "VALIDATION");
    assert.equal(error.message, MESSAGES.owner.nameRequired);
    assert.equal(error.cause, undefined);
    assert.deepEqual(captureConsoleError(t, () => logError(error)), []);
  });

  test("com mais de uma falha, mostra a do primeiro campo do formulário", () => {
    assertRejects(ownerSchema, owner({ nome: "", telefone: "", email: "x" }), MESSAGES.owner.nameRequired);
    assertRejects(ownerSchema, owner({ telefone: "", email: "x" }), MESSAGES.owner.phoneRequired);
  });

  test("entrada que não é um cadastro: mensagem genérica, e o detalhe do Zod vai para o log", (t) => {
    for (const input of [null, undefined, "nome=Ana", 42, [], true]) {
      const error = errorOf(ownerSchema, input);
      assert.equal(error.code, "VALIDATION", String(input));
      assert.equal(error.message, MESSAGES.invalidInput, String(input));
      assert.ok(error.cause instanceof z.ZodError, String(input));

      const calls = captureConsoleError(t, () => logError(error, "salvar dono"));
      assert.deepEqual(calls.at(-1), ["[salvar dono]", error]);
    }
  });

  test("campo com tipo errado ou ausente é defeito de quem chamou: mensagem genérica e detalhe no log", () => {
    const wrongTypes = [
      [ownerSchema, owner({ nome: 123 })],
      [ownerSchema, owner({ telefone: undefined })],
      [ownerSchema, owner({ email: 7 })],
      [appointmentSchema, appointment({ valor: "80,00" })],
      [appointmentSchema, appointment({ pet_id: "1" })],
      [appointmentSchema, appointment({ data: 20261109 })],
      [petSchema, pet({ especie: 1.5 })],
    ];
    for (const [schema, input] of wrongTypes) {
      const error = errorOf(schema, input);
      assert.equal(error.message, MESSAGES.invalidInput, JSON.stringify(input));
      assert.ok(error.cause instanceof z.ZodError);
    }
  });

  test("nenhuma falha mostra o texto do Zod, em inglês", () => {
    const zodWords = /invalid|expected|received|too (big|small)|must|string|number|object/i;
    const failures = [
      [ownerSchema, null],
      [ownerSchema, owner({ nome: ["Ana"] })],
      [ownerSchema, owner({ email: "x@" })],
      [petSchema, pet({ porte: { $ne: null } })],
      [petSchema, petWithPackage({ pacote_remarcacao: null })],
      [appointmentSchema, appointment({ hora: "25:00" })],
      [appointmentSchema, appointment({ concluido: true })],
      [nameSearchSchema, nameSearch({ page: "0" })],
      [breedSchema, { especieId: 1 }],
      [configUpdateSchema, { id: 0, is_ativo: 1 }],
    ];
    for (const [schema, input] of failures) {
      const { message } = errorOf(schema, input);
      assert.doesNotMatch(message, zodWords, `${JSON.stringify(input)} → "${message}"`);
    }
  });
});

describe("parseRecordId", () => {
  test("aceita inteiros positivos", () => {
    assert.equal(parseRecordId(1, MESSAGES.owner.notFound), 1);
    assert.equal(parseRecordId(Number.MAX_SAFE_INTEGER, MESSAGES.owner.notFound), Number.MAX_SAFE_INTEGER);
  });

  test("um id fora do formato responde como registro que não existe", () => {
    for (const value of [0, -1, 1.5, "1", NaN, Infinity, 2 ** 53, null, undefined, {}]) {
      assert.throws(
        () => parseRecordId(value, MESSAGES.pet.notFound),
        (error) => error instanceof AppError && error.code === "NOT_FOUND" && error.message === MESSAGES.pet.notFound,
        String(value),
      );
    }
  });
});

// ─── Dono ───────────────────────────────────────────────────────────────────

describe("dono", () => {
  test("aceita o cadastro completo e o mínimo, sem e-mail nem endereço", () => {
    assert.doesNotThrow(() => parseInput(ownerSchema, owner()));
    const minimal = parseInput(ownerSchema, owner({ email: undefined, endereco: null }));
    assert.equal(minimal.email, null);
    assert.equal(minimal.endereco, null);
  });

  test("nome: obrigatório, sem só espaços e até o limite", () => {
    for (const nome of ["", "   ", "\t\n"]) {
      assertRejects(ownerSchema, owner({ nome }), MESSAGES.owner.nameRequired);
    }
    assert.doesNotThrow(() => parseInput(ownerSchema, owner({ nome: "a".repeat(MAX_OWNER_NAME_LENGTH) })));
    assertRejects(
      ownerSchema,
      owner({ nome: "a".repeat(MAX_OWNER_NAME_LENGTH + 1) }),
      MESSAGES.textTooLong("O nome do dono", MAX_OWNER_NAME_LENGTH),
    );
  });

  test("o limite conta o texto sem os espaços das pontas", () => {
    const nome = `  ${"a".repeat(MAX_OWNER_NAME_LENGTH)}  `;
    assert.equal(parseInput(ownerSchema, owner({ nome })).nome.length, MAX_OWNER_NAME_LENGTH);
  });

  test("telefone vazio e telefone inválido têm mensagens diferentes", () => {
    for (const telefone of ["", "   "]) {
      assertRejects(ownerSchema, owner({ telefone }), MESSAGES.owner.phoneRequired);
    }
    const invalid = [
      "(45) 9999-123", // 9 dígitos
      "(45) 99999-12345", // 12 dígitos
      "(45) 89999-1234", // 11 dígitos sem o 9 do celular
      "(11) 11111-1111", // todos iguais
      "abc(45) 99999-1234", // letras
      "(45) 99999-1234; DROP", // caracteres fora da máscara
      "+55 45 99999-1234", // código do país
    ];
    for (const telefone of invalid) {
      assertRejects(ownerSchema, owner({ telefone }), MESSAGES.owner.phoneInvalid, telefone);
    }
  });

  test("telefone válido: fixo de 10 dígitos, celular de 11, com ou sem máscara", () => {
    for (const telefone of ["(45) 3333-4444", "4533334444", "(45) 99999-1234", "45999991234", "45 99999 1234"]) {
      assert.equal(parseInput(ownerSchema, owner({ telefone })).telefone, telefone);
    }
    assert.equal(parseInput(ownerSchema, owner({ telefone: " (45) 99999-1234 " })).telefone, "(45) 99999-1234");
  });

  test("telefone acima do tamanho da máscara é inválido", () => {
    const atLimit = "(45) 99999-1234";
    assert.equal(atLimit.length, MAX_PHONE_LENGTH);
    assert.doesNotThrow(() => parseInput(ownerSchema, owner({ telefone: atLimit })));
    assertRejects(ownerSchema, owner({ telefone: `${atLimit}5` }), MESSAGES.owner.phoneInvalid);
  });

  test("e-mail: opcional, com formato conferido e até o limite", () => {
    assert.equal(parseInput(ownerSchema, owner({ email: " Ana.Souza+pet@example.com.br " })).email, "Ana.Souza+pet@example.com.br");
    for (const email of ["ana", "ana@", "ana@example", "@example.com", "ana souza@example.com", "ana@@example.com", "ana..souza@example.com"]) {
      assertRejects(ownerSchema, owner({ email }), MESSAGES.owner.emailInvalid, email);
    }
    const domain = "@example.com";
    const atLimit = `${"a".repeat(MAX_EMAIL_LENGTH - domain.length)}${domain}`;
    assert.equal(parseInput(ownerSchema, owner({ email: atLimit })).email, atLimit);
    assertRejects(ownerSchema, owner({ email: `a${atLimit}` }), MESSAGES.textTooLong("O e-mail", MAX_EMAIL_LENGTH));
  });

  test("endereço: opcional e até o limite", () => {
    assert.doesNotThrow(() => parseInput(ownerSchema, owner({ endereco: "a".repeat(MAX_ADDRESS_LENGTH) })));
    assertRejects(
      ownerSchema,
      owner({ endereco: "a".repeat(MAX_ADDRESS_LENGTH + 1) }),
      MESSAGES.textTooLong("O endereço", MAX_ADDRESS_LENGTH),
    );
  });

  test("ativo só aceita 0 ou 1", () => {
    for (const is_ativo of [2, -1, "1", null, true]) {
      assertRejects(ownerSchema, owner({ is_ativo }), MESSAGES.invalidFlag("Ativo"), String(is_ativo));
    }
  });

  test("o dono conferido grava no banco sem espaço sobrando, e aspas, ponto e vírgula e % ficam como texto", async () => {
    const db = await createDatabase();
    const data = parseInput(
      ownerSchema,
      owner({ nome: "  O'Brien; DROP TABLE owners; --  ", endereco: " Rua 100% Feliz, 'casa' ", email: "" }),
    );
    db.prepare(INSERT_OWNER_SQL).run(data.nome, normalizeForSearch(data.nome), data.telefone, data.email, data.endereco);

    const saved = db.prepare("SELECT nome, telefone, email, endereco FROM owners").get();
    assert.deepEqual({ ...saved }, {
      nome: "O'Brien; DROP TABLE owners; --",
      telefone: "(45) 99999-1234",
      email: null,
      endereco: "Rua 100% Feliz, 'casa'",
    });
  });
});

// ─── Pet ────────────────────────────────────────────────────────────────────

describe("pet", () => {
  test("os valores do pet vêm de petEnums.ts", () => {
    assert.deepEqual(Object.values(PorteAnimal), ["PEQUENO", "MEDIO", "GRANDE", "GRANDAO"]);
    assert.deepEqual(Object.values(TipoServico), ["Banho", "Banho e Tosa", "Banho e Higiênica"]);
    assert.deepEqual(PacoteRemarcacao, { Mensal: 4, Quinzenal: 2 });
  });

  test("isPacoteRemarcacao aceita só 4 e 2, como o pet salvo traz do banco", () => {
    assert.ok(isPacoteRemarcacao(4) && isPacoteRemarcacao(2));
    for (const entrada of [3, 0, -4, "4", "Mensal", null, undefined, NaN, {}, [4]]) {
      assert.equal(isPacoteRemarcacao(entrada), false, String(entrada));
    }
  });

  test("aceita o pet sem pacote e o pet com o pacote completo", () => {
    const withoutPackage = parseInput(petSchema, pet());
    assert.equal(withoutPackage.observacoes, null);
    assert.equal(withoutPackage.pacote_remarcacao, null);
    assert.equal(withoutPackage.valor_pacote, null);

    const withPackage = parseInput(petSchema, petWithPackage());
    assert.equal(withPackage.pacote_remarcacao, 4);
    assert.equal(withPackage.valor_pacote, 32_000);
    assert.equal(withPackage.horario_padrao, "09:30");
  });

  test("nome: obrigatório e até o limite", () => {
    assertRejects(petSchema, pet({ nome: "  " }), MESSAGES.pet.nameRequired);
    assert.doesNotThrow(() => parseInput(petSchema, pet({ nome: "a".repeat(MAX_PET_NAME_LENGTH) })));
    assertRejects(
      petSchema,
      pet({ nome: "a".repeat(MAX_PET_NAME_LENGTH + 1) }),
      MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH),
    );
  });

  test("espécie, dono e raça precisam de um id escolhido", () => {
    for (const value of [0, -3]) {
      assertRejects(petSchema, pet({ especie: value }), MESSAGES.pet.speciesRequired);
      assertRejects(petSchema, pet({ dono_id: value }), MESSAGES.pet.ownerRequired);
      assertRejects(petSchema, pet({ raca: value }), MESSAGES.pet.breedRequired);
    }
  });

  test("porte e serviço padrão só aceitam os valores da lista, e a mensagem mostra quais", () => {
    for (const porte of ["pequeno", "ENORME", "", null]) {
      assertRejects(
        petSchema,
        pet({ porte }),
        MESSAGES.invalidOption("Porte", ["PEQUENO", "MEDIO", "GRANDE", "GRANDAO"]),
        String(porte),
      );
    }
    assertRejects(
      petSchema,
      pet({ servico_padrao: "Tosa" }),
      MESSAGES.invalidOption("Serviço padrão", ["Banho", "Banho e Tosa", "Banho e Higiênica"]),
    );
  });

  test("pacote: só 4 (mensal) ou 2 (quinzenal); o nome do enum não passa como valor", () => {
    assert.equal(parseInput(petSchema, petWithPackage({ pacote_remarcacao: 2 })).pacote_remarcacao, 2);
    for (const pacote_remarcacao of [3, 0, "Mensal", "4"]) {
      assertRejects(
        petSchema,
        petWithPackage({ pacote_remarcacao }),
        MESSAGES.invalidOption("Pacote de remarcação", [4, 2]),
        String(pacote_remarcacao),
      );
    }
  });

  test("com a remarcação ligada, pacote, valor e início são obrigatórios, cada um com a sua mensagem", () => {
    assertRejects(petSchema, petWithPackage({ pacote_remarcacao: null }), MESSAGES.pet.packageRequired);
    assertRejects(petSchema, petWithPackage({ valor_pacote: undefined }), MESSAGES.pet.packageValueRequired);
    assertRejects(petSchema, petWithPackage({ data_inicio_pacote: "" }), MESSAGES.pet.packageStartRequired);
  });

  test("com a remarcação desligada, o pacote pode ficar vazio", () => {
    const data = parseInput(petSchema, pet({ pacote_remarcacao: undefined, data_inicio_pacote: null }));
    assert.equal(data.data_inicio_pacote, null);
  });

  test("valor do pacote: centavos inteiros e sem sinal", () => {
    assert.equal(parseInput(petSchema, petWithPackage({ valor_pacote: 0 })).valor_pacote, 0);
    for (const valor_pacote of [-1, 120.5, Number.MAX_SAFE_INTEGER + 1]) {
      assertRejects(petSchema, petWithPackage({ valor_pacote }), MESSAGES.money.invalid, String(valor_pacote));
    }
  });

  test("início do pacote: um dia que existe no calendário", () => {
    for (const data_inicio_pacote of ["2028-02-29", "2026-12-31", "2026-01-01"]) {
      assert.doesNotThrow(() => parseInput(petSchema, petWithPackage({ data_inicio_pacote })));
    }
    for (const data_inicio_pacote of ["2026-02-30", "2026-02-29", "2100-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "2026-01-00", "09/11/2026", "2026-1-9"]) {
      assertRejects(
        petSchema,
        petWithPackage({ data_inicio_pacote }),
        MESSAGES.date.invalid,
        data_inicio_pacote,
      );
    }
  });

  test("horário padrão: HH:MM real, e vazio fica 00:00, como no banco", () => {
    for (const horario_padrao of ["", "  ", null, undefined]) {
      assert.equal(parseInput(petSchema, pet({ horario_padrao })).horario_padrao, "00:00");
    }
    assert.equal(parseInput(petSchema, pet({ horario_padrao: "23:59" })).horario_padrao, "23:59");
    for (const horario_padrao of ["9", "9:30", "24:00", "12:60", "0930", "09h30"]) {
      assertRejects(petSchema, pet({ horario_padrao }), MESSAGES.pet.defaultTimeInvalid, horario_padrao);
    }
  });

  test("observação: opcional e até o limite", () => {
    assert.doesNotThrow(() => parseInput(petSchema, pet({ observacoes: "a".repeat(MAX_NOTES_LENGTH) })));
    assertRejects(
      petSchema,
      pet({ observacoes: "a".repeat(MAX_NOTES_LENGTH + 1) }),
      MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH),
    );
  });

  test("remarcação ativa e ativo só aceitam 0 ou 1", () => {
    assertRejects(petSchema, pet({ remarcacao_ativa: 2 }), MESSAGES.invalidFlag("Remarcação ativa"));
    assertRejects(petSchema, pet({ is_ativo: "1" }), MESSAGES.invalidFlag("Ativo"));
  });
});

// ─── Agendamento ────────────────────────────────────────────────────────────

describe("agendamento", () => {
  test("aceita o agendamento completo, e a observação vazia vira null", () => {
    const data = parseInput(appointmentSchema, appointment({ observacao: "  " }));
    assert.equal(data.observacao, null);
    assert.equal(data.tipo_pgto, "PIX");
  });

  test("o tipo de pagamento é opcional e fica como texto vazio, como o banco guarda", () => {
    assert.equal(parseInput(appointmentSchema, appointment({ tipo_pgto: "  " })).tipo_pgto, "");
    assertRejects(
      appointmentSchema,
      appointment({ tipo_pgto: "a".repeat(MAX_LIST_ITEM_LENGTH + 1) }),
      MESSAGES.textTooLong("O tipo de pagamento", MAX_LIST_ITEM_LENGTH),
    );
  });

  test("pet, serviço, data, horário e valor têm cada um a sua mensagem", () => {
    assertRejects(appointmentSchema, appointment({ pet_id: 0 }), MESSAGES.appointment.petRequired);
    assertRejects(appointmentSchema, appointment({ servico: " " }), MESSAGES.appointment.serviceRequired);
    assertRejects(appointmentSchema, appointment({ data: "2026-02-30" }), MESSAGES.date.invalid);
    assertRejects(appointmentSchema, appointment({ hora: "" }), MESSAGES.appointment.timeRequired);
    assertRejects(appointmentSchema, appointment({ hora: "9" }), MESSAGES.appointment.timeInvalid);
    assertRejects(appointmentSchema, appointment({ valor: -100 }), MESSAGES.money.invalid);
  });

  test("serviço até o limite", () => {
    assert.doesNotThrow(() => parseInput(appointmentSchema, appointment({ servico: "a".repeat(MAX_LIST_ITEM_LENGTH) })));
    assertRejects(
      appointmentSchema,
      appointment({ servico: "a".repeat(MAX_LIST_ITEM_LENGTH + 1) }),
      MESSAGES.textTooLong("O serviço", MAX_LIST_ITEM_LENGTH),
    );
  });

  test("horário: de 00:00 a 23:59, sempre com horas e minutos", () => {
    for (const hora of ["00:00", "09:30", "23:59"]) {
      assert.equal(parseInput(appointmentSchema, appointment({ hora })).hora, hora);
    }
    assert.equal(parseInput(appointmentSchema, appointment({ hora: " 09:30 " })).hora, "09:30");
    for (const hora of ["9", "09", "9:30", "24:00", "23:60", "-1:00", "09:30:00", "0930"]) {
      assertRejects(appointmentSchema, appointment({ hora }), MESSAGES.appointment.timeInvalid, hora);
    }
  });

  test("data: só um dia que existe, no formato do banco", () => {
    assert.doesNotThrow(() => parseInput(appointmentSchema, appointment({ data: "2028-02-29" })));
    for (const data of ["", "2026-02-29", "2026-11-31", "09/11/2026", "2026/11/09", " 2026-11-09"]) {
      assertRejects(appointmentSchema, appointment({ data }), MESSAGES.date.invalid, data);
    }
  });

  test("valor: centavos inteiros e sem sinal, de zero ao maior inteiro seguro", () => {
    assert.equal(parseInput(appointmentSchema, appointment({ valor: 0 })).valor, 0);
    assert.equal(
      parseInput(appointmentSchema, appointment({ valor: Number.MAX_SAFE_INTEGER })).valor,
      Number.MAX_SAFE_INTEGER,
    );
    for (const valor of [-1, 0.5, 80.1, Number.MAX_SAFE_INTEGER + 1]) {
      assertRejects(appointmentSchema, appointment({ valor }), MESSAGES.money.invalid, String(valor));
    }
  });

  test("observação até o limite", () => {
    assertRejects(
      appointmentSchema,
      appointment({ observacao: "a".repeat(MAX_NOTES_LENGTH + 1) }),
      MESSAGES.textTooLong("A observação do agendamento", MAX_NOTES_LENGTH),
    );
  });

  test("os campos de sim ou não só aceitam 0 ou 1", () => {
    assertRejects(appointmentSchema, appointment({ entregar_pet: 2 }), MESSAGES.invalidFlag("Entregar pet"));
    assertRejects(appointmentSchema, appointment({ concluido: true }), MESSAGES.invalidFlag("Concluído"));
    assertRejects(appointmentSchema, appointment({ ta_pago: "1" }), MESSAGES.invalidFlag("Pago"));
  });
});

// ─── Raça ───────────────────────────────────────────────────────────────────

describe("raça", () => {
  const breed = (fields = {}) => ({ especieId: 1, nomeRaca: "Poodle", ...fields });

  test("aceita a raça e tira os espaços das pontas", () => {
    assert.deepEqual(parseInput(breedSchema, breed({ nomeRaca: "  Golden Retriever  " })), {
      especieId: 1,
      nomeRaca: "Golden Retriever",
    });
  });

  test("espécie escolhida, nome obrigatório, com pelo menos 2 caracteres e até o limite", () => {
    assertRejects(breedSchema, breed({ especieId: 0 }), MESSAGES.breed.speciesRequired);
    assertRejects(breedSchema, breed({ nomeRaca: "   " }), MESSAGES.breed.nameRequired);
    assertRejects(breedSchema, breed({ nomeRaca: " a " }), MESSAGES.breed.nameTooShort);
    assert.doesNotThrow(() => parseInput(breedSchema, breed({ nomeRaca: "ab" })));
    assert.doesNotThrow(() => parseInput(breedSchema, breed({ nomeRaca: "a".repeat(MAX_BREED_NAME_LENGTH) })));
    assertRejects(
      breedSchema,
      breed({ nomeRaca: "a".repeat(MAX_BREED_NAME_LENGTH + 1) }),
      MESSAGES.textTooLong("O nome da raça", MAX_BREED_NAME_LENGTH),
    );
  });
});

// ─── Buscas e configuração ──────────────────────────────────────────────────

describe("buscas", () => {
  test("a busca de donos e pets devolve o texto sem espaço nas pontas", () => {
    assert.equal(parseInput(nameSearchSchema, nameSearch({ query: "  ana  " })).query, "ana");
  });

  test("% , _ , aspas e ponto e vírgula ficam como texto na busca", () => {
    const query = "100%_'; DROP TABLE pets; --";
    assert.equal(parseInput(nameSearchSchema, nameSearch({ query })).query, query);
  });

  test("a busca de raças confere a espécie, a página e o texto", () => {
    assert.deepEqual(parseInput(breedSearchSchema, { especieId: 2, page: 0, query: " poo " }), {
      especieId: 2,
      page: 0,
      query: "poo",
    });
    assertRejects(breedSearchSchema, { especieId: 0, page: 0, query: "" }, MESSAGES.breed.speciesRequired);
    assertRejects(breedSearchSchema, { especieId: 2, page: -1, query: "" }, MESSAGES.search.invalidPage);
    assertRejects(
      breedSearchSchema,
      { especieId: 2, page: 0, query: "a".repeat(MAX_SEARCH_LENGTH + 1) },
      MESSAGES.search.tooLong(MAX_SEARCH_LENGTH),
    );
  });

  test("a contagem de raças é a mesma busca, sem a página", () => {
    assert.deepEqual(parseInput(breedCountSchema, { especieId: 2, query: "", page: 5 }), { especieId: 2, query: "" });
  });
});

describe("configuração", () => {
  test("liga e desliga com 0 ou 1", () => {
    assert.deepEqual(parseInput(configUpdateSchema, { id: 1, is_ativo: 0 }), { id: 1, is_ativo: 0 });
    assertRejects(configUpdateSchema, { id: 1, is_ativo: 2 }, MESSAGES.invalidFlag("Configuração"));
  });

  test("o id não vem do usuário: fora do formato, é a mensagem genérica", () => {
    assertRejects(configUpdateSchema, { id: 0, is_ativo: 1 }, MESSAGES.invalidInput);
  });
});

// ─── Entrada maliciosa ──────────────────────────────────────────────────────

describe("entrada maliciosa", () => {
  test("texto gigante para no limite do campo, sem chegar às outras regras", () => {
    const huge = "a".repeat(1_000_000);
    const cases = [
      [ownerSchema, owner({ nome: huge }), MESSAGES.textTooLong("O nome do dono", MAX_OWNER_NAME_LENGTH)],
      [ownerSchema, owner({ telefone: huge }), MESSAGES.owner.phoneInvalid],
      [ownerSchema, owner({ email: `${huge}@example.com` }), MESSAGES.textTooLong("O e-mail", MAX_EMAIL_LENGTH)],
      [ownerSchema, owner({ endereco: huge }), MESSAGES.textTooLong("O endereço", MAX_ADDRESS_LENGTH)],
      [petSchema, pet({ nome: huge }), MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH)],
      [petSchema, pet({ observacoes: huge }), MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH)],
      [petSchema, pet({ horario_padrao: huge }), MESSAGES.pet.defaultTimeInvalid],
      [appointmentSchema, appointment({ servico: huge }), MESSAGES.textTooLong("O serviço", MAX_LIST_ITEM_LENGTH)],
      [appointmentSchema, appointment({ hora: huge }), MESSAGES.appointment.timeInvalid],
      [appointmentSchema, appointment({ data: huge }), MESSAGES.date.invalid],
      [nameSearchSchema, nameSearch({ query: huge }), MESSAGES.search.tooLong(MAX_SEARCH_LENGTH)],
      [breedSchema, { especieId: 1, nomeRaca: huge }, MESSAGES.textTooLong("O nome da raça", MAX_BREED_NAME_LENGTH)],
    ];
    for (const [schema, input, message] of cases) {
      assertRejects(schema, input, message, message);
    }
  });

  test("o __proto__ de um JSON não entra no dado nem muda os objetos do app", () => {
    const input = JSON.parse(
      '{"nome":"Ana","telefone":"(45) 99999-1234","is_ativo":1,"__proto__":{"isAdmin":true},"constructor":{"x":1}}',
    );
    const data = parseInput(ownerSchema, input);
    assert.equal(Object.hasOwn(data, "__proto__"), false);
    assert.equal(Object.hasOwn(data, "constructor"), false);
    assert.equal({}.isAdmin, undefined);
    assert.equal(data.isAdmin, undefined);
  });

  test("objeto no lugar de valor não passa como filtro", () => {
    assertRejects(petSchema, pet({ dono_id: { $gt: 0 } }), MESSAGES.invalidInput);
    assertRejects(nameSearchSchema, nameSearch({ ativo: { $ne: 0 } }), MESSAGES.invalidFlag("Filtro ativo"));
  });
});

// ─── Mensagens novas ────────────────────────────────────────────────────────

describe("mensagens da validação", () => {
  test("o limite de texto diz o campo e o tamanho", () => {
    assert.equal(MESSAGES.textTooLong("O nome do dono", 100), "O nome do dono pode ter até 100 caracteres.");
  });

  test("o horário vazio e o horário inválido têm mensagens diferentes, como o telefone", () => {
    assert.notEqual(MESSAGES.appointment.timeRequired, MESSAGES.appointment.timeInvalid);
    assert.notEqual(MESSAGES.appointment.timeInvalid, MESSAGES.pet.defaultTimeInvalid);
    assert.notEqual(MESSAGES.pet.packageRequired, MESSAGES.invalidOption("Pacote de remarcação", [4, 2]));
  });
});
