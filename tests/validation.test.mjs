// Validação da entrada com Zod (VALID-1): cada schema com entrada válida, inválida e nos limites, a
// entrada maliciosa e a conversão da falha no AppError com a mensagem de globals. Nenhum texto do Zod,
// em inglês, chega à tela.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import * as z from "zod";
import { parseInput, parseRecordId } from "../src/validation/parseInput.ts";
import { ownerSchema } from "../src/validation/ownerSchema.ts";
import { petSchema } from "../src/validation/petSchema.ts";
import {
  isPackageFrequency,
  isPetSize,
  PackageFrequency,
  PetSize,
  ServiceName,
} from "../src/config/petEnums.ts";
import { appointmentSchema } from "../src/validation/appointmentSchema.ts";
import { breedSchema } from "../src/validation/breedSchema.ts";
import {
  breedCountSchema,
  breedSearchSchema,
  nameSearchSchema,
} from "../src/validation/searchSchema.ts";
import { themeSchema } from "../src/validation/settingsSchema.ts";
import { AppError, logError } from "../src/errors/AppError.ts";
import { MESSAGES } from "../src/globals/messages.ts";
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
} from "../src/globals/limits.ts";
import { createDatabase } from "./helpers/database.mjs";
import { INSERT_OWNER_SQL } from "../src/repository/sql/ownersSql.ts";
import { normalizeForSearch } from "../src/utils/formatters/normalizeForSearch.ts";

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
  name: "Ana Souza",
  phone: "(45) 99999-1234",
  email: "ana@example.com",
  address: "Rua das Acácias, 100",
  is_active: 1,
  ...fields,
});

const pet = (fields = {}) => ({
  name: "Thor",
  species_id: 1,
  owner_id: 1,
  size: "MEDIUM",
  breed_id: 1,
  default_service: "Banho",
  notes: "",
  is_active: 1,
  reschedule_active: 0,
  package_frequency: null,
  package_price: null,
  package_start_date: "2026-11-09",
  default_time: "00:00",
  ...fields,
});

/** Pet com a remarcação ligada e o pacote completo. */
const petWithPackage = (fields = {}) =>
  pet({
    reschedule_active: 1,
    package_frequency: 4,
    package_price: 32_000,
    package_start_date: "2026-11-09",
    default_time: "09:30",
    ...fields,
  });

const appointment = (fields = {}) => ({
  pet_id: 1,
  service: "Banho e Tosa",
  date: "2026-11-09",
  time: "09:30",
  price: 8_000,
  payment_method: "PIX",
  notes: "",
  deliver_pet: 0,
  completed: 0,
  is_auto: 0,
  is_paid: 0,
  ...fields,
});

const nameSearch = (fields = {}) => ({ query: "", active: 1, page: 0, limit: 20, ...fields });

// ─── parseInput ─────────────────────────────────────────────────────────────

describe("parseInput", () => {
  test("devolve o dado limpo: texto sem espaço nas pontas e opcional vazio como null", () => {
    const data = parseInput(
      ownerSchema,
      owner({ name: "  Ana Souza  ", email: "   ", address: "" }),
    );
    assert.deepEqual(data, {
      name: "Ana Souza",
      phone: "(45) 99999-1234",
      email: null,
      address: null,
      is_active: 1,
    });
  });

  test("descarta os campos fora do schema", () => {
    const data = parseInput(
      ownerSchema,
      owner({ id: 99, created_at: "2020-01-01", is_admin: true }),
    );
    assert.deepEqual(Object.keys(data).sort(), ["address", "email", "is_active", "name", "phone"]);
  });

  test("a falha do usuário vira um AppError com a mensagem do campo, sem ir para o log", (t) => {
    const error = errorOf(ownerSchema, owner({ name: "" }));
    assert.ok(error instanceof AppError);
    assert.equal(error.code, "VALIDATION");
    assert.equal(error.message, MESSAGES.owner.nameRequired);
    assert.equal(error.cause, undefined);
    assert.deepEqual(
      captureConsoleError(t, () => logError(error)),
      [],
    );
  });

  test("com mais de uma falha, mostra a do primeiro campo do formulário", () => {
    assertRejects(
      ownerSchema,
      owner({ name: "", phone: "", email: "x" }),
      MESSAGES.owner.nameRequired,
    );
    assertRejects(ownerSchema, owner({ phone: "", email: "x" }), MESSAGES.owner.phoneRequired);
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
      [ownerSchema, owner({ name: 123 })],
      [ownerSchema, owner({ phone: undefined })],
      [ownerSchema, owner({ email: 7 })],
      [appointmentSchema, appointment({ price: "80,00" })],
      [appointmentSchema, appointment({ pet_id: "1" })],
      [appointmentSchema, appointment({ date: 20261109 })],
      [petSchema, pet({ species_id: 1.5 })],
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
      [ownerSchema, owner({ name: ["Ana"] })],
      [ownerSchema, owner({ email: "x@" })],
      [petSchema, pet({ size: { $ne: null } })],
      [petSchema, petWithPackage({ package_frequency: null })],
      [appointmentSchema, appointment({ time: "25:00" })],
      [appointmentSchema, appointment({ completed: true })],
      [nameSearchSchema, nameSearch({ page: "0" })],
      [breedSchema, { speciesId: 1 }],
      [themeSchema, "escuro"],
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
    assert.equal(
      parseRecordId(Number.MAX_SAFE_INTEGER, MESSAGES.owner.notFound),
      Number.MAX_SAFE_INTEGER,
    );
  });

  test("um id fora do formato responde como registro que não existe", () => {
    for (const value of [0, -1, 1.5, "1", NaN, Infinity, 2 ** 53, null, undefined, {}]) {
      assert.throws(
        () => parseRecordId(value, MESSAGES.pet.notFound),
        (error) =>
          error instanceof AppError &&
          error.code === "NOT_FOUND" &&
          error.message === MESSAGES.pet.notFound,
        String(value),
      );
    }
  });
});

// ─── Dono ───────────────────────────────────────────────────────────────────

describe("dono", () => {
  test("aceita o cadastro completo e o mínimo, sem e-mail nem endereço", () => {
    assert.doesNotThrow(() => parseInput(ownerSchema, owner()));
    const minimal = parseInput(ownerSchema, owner({ email: undefined, address: null }));
    assert.equal(minimal.email, null);
    assert.equal(minimal.address, null);
  });

  test("nome: obrigatório, sem só espaços e até o limite", () => {
    for (const name of ["", "   ", "\t\n"]) {
      assertRejects(ownerSchema, owner({ name }), MESSAGES.owner.nameRequired);
    }
    assert.doesNotThrow(() =>
      parseInput(ownerSchema, owner({ name: "a".repeat(MAX_OWNER_NAME_LENGTH) })),
    );
    assertRejects(
      ownerSchema,
      owner({ name: "a".repeat(MAX_OWNER_NAME_LENGTH + 1) }),
      MESSAGES.textTooLong("O nome do dono", MAX_OWNER_NAME_LENGTH),
    );
  });

  test("o limite conta o texto sem os espaços das pontas", () => {
    const name = `  ${"a".repeat(MAX_OWNER_NAME_LENGTH)}  `;
    assert.equal(parseInput(ownerSchema, owner({ name })).name.length, MAX_OWNER_NAME_LENGTH);
  });

  test("telefone vazio e telefone inválido têm mensagens diferentes", () => {
    for (const phone of ["", "   "]) {
      assertRejects(ownerSchema, owner({ phone }), MESSAGES.owner.phoneRequired);
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
    for (const phone of invalid) {
      assertRejects(ownerSchema, owner({ phone }), MESSAGES.owner.phoneInvalid, phone);
    }
  });

  test("telefone válido: fixo de 10 dígitos, celular de 11, com ou sem máscara", () => {
    for (const phone of [
      "(45) 3333-4444",
      "4533334444",
      "(45) 99999-1234",
      "45999991234",
      "45 99999 1234",
    ]) {
      assert.equal(parseInput(ownerSchema, owner({ phone })).phone, phone);
    }
    assert.equal(
      parseInput(ownerSchema, owner({ phone: " (45) 99999-1234 " })).phone,
      "(45) 99999-1234",
    );
  });

  test("telefone acima do tamanho da máscara é inválido", () => {
    const atLimit = "(45) 99999-1234";
    assert.equal(atLimit.length, MAX_PHONE_LENGTH);
    assert.doesNotThrow(() => parseInput(ownerSchema, owner({ phone: atLimit })));
    assertRejects(ownerSchema, owner({ phone: `${atLimit}5` }), MESSAGES.owner.phoneInvalid);
  });

  test("e-mail: opcional, com formato conferido e até o limite", () => {
    assert.equal(
      parseInput(ownerSchema, owner({ email: " Ana.Souza+pet@example.com.br " })).email,
      "Ana.Souza+pet@example.com.br",
    );
    for (const email of [
      "ana",
      "ana@",
      "ana@example",
      "@example.com",
      "ana souza@example.com",
      "ana@@example.com",
      "ana..souza@example.com",
    ]) {
      assertRejects(ownerSchema, owner({ email }), MESSAGES.owner.emailInvalid, email);
    }
    const domain = "@example.com";
    const atLimit = `${"a".repeat(MAX_EMAIL_LENGTH - domain.length)}${domain}`;
    assert.equal(parseInput(ownerSchema, owner({ email: atLimit })).email, atLimit);
    assertRejects(
      ownerSchema,
      owner({ email: `a${atLimit}` }),
      MESSAGES.textTooLong("O e-mail", MAX_EMAIL_LENGTH),
    );
  });

  test("endereço: opcional e até o limite", () => {
    assert.doesNotThrow(() =>
      parseInput(ownerSchema, owner({ address: "a".repeat(MAX_ADDRESS_LENGTH) })),
    );
    assertRejects(
      ownerSchema,
      owner({ address: "a".repeat(MAX_ADDRESS_LENGTH + 1) }),
      MESSAGES.textTooLong("O endereço", MAX_ADDRESS_LENGTH),
    );
  });

  test("ativo só aceita 0 ou 1", () => {
    for (const is_active of [2, -1, "1", null, true]) {
      assertRejects(
        ownerSchema,
        owner({ is_active }),
        MESSAGES.invalidFlag("Ativo"),
        String(is_active),
      );
    }
  });

  test("o dono conferido grava no banco sem espaço sobrando, e aspas, ponto e vírgula e % ficam como texto", async () => {
    const db = await createDatabase();
    const data = parseInput(
      ownerSchema,
      owner({
        name: "  O'Brien; DROP TABLE owners; --  ",
        address: " Rua 100% Feliz, 'casa' ",
        email: "",
      }),
    );
    db.prepare(INSERT_OWNER_SQL).run(
      data.name,
      normalizeForSearch(data.name),
      data.phone,
      data.email,
      data.address,
    );

    const saved = db.prepare("SELECT name, phone, email, address FROM owners").get();
    assert.deepEqual(
      { ...saved },
      {
        name: "O'Brien; DROP TABLE owners; --",
        phone: "(45) 99999-1234",
        email: null,
        address: "Rua 100% Feliz, 'casa'",
      },
    );
  });
});

// ─── Pet ────────────────────────────────────────────────────────────────────

describe("pet", () => {
  test("os valores do pet vêm de petEnums.ts", () => {
    assert.deepEqual(Object.values(PetSize), ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"]);
    assert.deepEqual(Object.values(ServiceName), ["Banho", "Banho e Tosa", "Banho e Higiênica"]);
    assert.deepEqual(PackageFrequency, { Weekly: 4, Biweekly: 2 });
  });

  test("isPetSize aceita só o código gravado do porte, e não a chave nem o rótulo", () => {
    for (const size of Object.values(PetSize)) assert.ok(isPetSize(size), size);
    for (const input of ["Medium", "Médio", "MEDIO", "", null, undefined, 2]) {
      assert.equal(isPetSize(input), false, String(input));
    }
  });

  test("isPackageFrequency aceita só 4 e 2, como o pet salvo traz do banco", () => {
    assert.ok(isPackageFrequency(4) && isPackageFrequency(2));
    for (const input of [3, 0, -4, "4", "Weekly", null, undefined, NaN, {}, [4]]) {
      assert.equal(isPackageFrequency(input), false, String(input));
    }
  });

  test("aceita o pet sem pacote e o pet com o pacote completo", () => {
    const withoutPackage = parseInput(petSchema, pet());
    assert.equal(withoutPackage.notes, null);
    assert.equal(withoutPackage.package_frequency, null);
    assert.equal(withoutPackage.package_price, null);

    const withPackage = parseInput(petSchema, petWithPackage());
    assert.equal(withPackage.package_frequency, 4);
    assert.equal(withPackage.package_price, 32_000);
    assert.equal(withPackage.default_time, "09:30");
  });

  test("nome: obrigatório e até o limite", () => {
    assertRejects(petSchema, pet({ name: "  " }), MESSAGES.pet.nameRequired);
    assert.doesNotThrow(() =>
      parseInput(petSchema, pet({ name: "a".repeat(MAX_PET_NAME_LENGTH) })),
    );
    assertRejects(
      petSchema,
      pet({ name: "a".repeat(MAX_PET_NAME_LENGTH + 1) }),
      MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH),
    );
  });

  test("espécie, dono e raça precisam de um id escolhido", () => {
    for (const value of [0, -3]) {
      assertRejects(petSchema, pet({ species_id: value }), MESSAGES.pet.speciesRequired);
      assertRejects(petSchema, pet({ owner_id: value }), MESSAGES.pet.ownerRequired);
      assertRejects(petSchema, pet({ breed_id: value }), MESSAGES.pet.breedRequired);
    }
  });

  test("porte e serviço padrão só aceitam os valores da lista, e a mensagem mostra quais", () => {
    for (const size of ["pequeno", "ENORME", "", null]) {
      assertRejects(
        petSchema,
        pet({ size }),
        MESSAGES.invalidOption("Porte", ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"]),
        String(size),
      );
    }
    assertRejects(
      petSchema,
      pet({ default_service: "Tosa" }),
      MESSAGES.invalidOption("Serviço padrão", ["Banho", "Banho e Tosa", "Banho e Higiênica"]),
    );
  });

  test("pacote: só 4 (mensal) ou 2 (quinzenal); o nome do enum não passa como valor", () => {
    assert.equal(
      parseInput(petSchema, petWithPackage({ package_frequency: 2 })).package_frequency,
      2,
    );
    for (const package_frequency of [3, 0, "Mensal", "4"]) {
      assertRejects(
        petSchema,
        petWithPackage({ package_frequency }),
        MESSAGES.invalidOption("Pacote de remarcação", [4, 2]),
        String(package_frequency),
      );
    }
  });

  test("com a remarcação ligada, pacote, valor e início são obrigatórios, cada um com a sua mensagem", () => {
    assertRejects(
      petSchema,
      petWithPackage({ package_frequency: null }),
      MESSAGES.pet.packageRequired,
    );
    assertRejects(
      petSchema,
      petWithPackage({ package_price: undefined }),
      MESSAGES.pet.packageValueRequired,
    );
    assertRejects(
      petSchema,
      petWithPackage({ package_start_date: "" }),
      MESSAGES.pet.packageStartRequired,
    );
  });

  test("com a remarcação desligada, o pacote pode ficar vazio", () => {
    const data = parseInput(
      petSchema,
      pet({ package_frequency: undefined, package_start_date: null }),
    );
    assert.equal(data.package_start_date, null);
  });

  test("valor do pacote: centavos inteiros e sem sinal", () => {
    assert.equal(parseInput(petSchema, petWithPackage({ package_price: 0 })).package_price, 0);
    for (const package_price of [-1, 120.5, Number.MAX_SAFE_INTEGER + 1]) {
      assertRejects(
        petSchema,
        petWithPackage({ package_price }),
        MESSAGES.money.invalid,
        String(package_price),
      );
    }
  });

  test("início do pacote: um dia que existe no calendário", () => {
    for (const package_start_date of ["2028-02-29", "2026-12-31", "2026-01-01"]) {
      assert.doesNotThrow(() => parseInput(petSchema, petWithPackage({ package_start_date })));
    }
    for (const package_start_date of [
      "2026-02-30",
      "2026-02-29",
      "2100-02-29",
      "2026-04-31",
      "2026-13-01",
      "2026-00-10",
      "2026-01-00",
      "09/11/2026",
      "2026-1-9",
    ]) {
      assertRejects(
        petSchema,
        petWithPackage({ package_start_date }),
        MESSAGES.date.invalid,
        package_start_date,
      );
    }
  });

  test("horário padrão: HH:MM real, e vazio fica 00:00, como no banco", () => {
    for (const default_time of ["", "  ", null, undefined]) {
      assert.equal(parseInput(petSchema, pet({ default_time })).default_time, "00:00");
    }
    assert.equal(parseInput(petSchema, pet({ default_time: "23:59" })).default_time, "23:59");
    for (const default_time of ["9", "9:30", "24:00", "12:60", "0930", "09h30"]) {
      assertRejects(
        petSchema,
        pet({ default_time }),
        MESSAGES.pet.defaultTimeInvalid,
        default_time,
      );
    }
  });

  test("observação: opcional e até o limite", () => {
    assert.doesNotThrow(() => parseInput(petSchema, pet({ notes: "a".repeat(MAX_NOTES_LENGTH) })));
    assertRejects(
      petSchema,
      pet({ notes: "a".repeat(MAX_NOTES_LENGTH + 1) }),
      MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH),
    );
  });

  test("remarcação ativa e ativo só aceitam 0 ou 1", () => {
    assertRejects(
      petSchema,
      pet({ reschedule_active: 2 }),
      MESSAGES.invalidFlag("Remarcação ativa"),
    );
    assertRejects(petSchema, pet({ is_active: "1" }), MESSAGES.invalidFlag("Ativo"));
  });
});

// ─── Agendamento ────────────────────────────────────────────────────────────

describe("agendamento", () => {
  test("aceita o agendamento completo, e a observação vazia vira null", () => {
    const data = parseInput(appointmentSchema, appointment({ notes: "  " }));
    assert.equal(data.notes, null);
    assert.equal(data.payment_method, "PIX");
  });

  test("o tipo de pagamento é opcional e fica como texto vazio, como o banco guarda", () => {
    assert.equal(
      parseInput(appointmentSchema, appointment({ payment_method: "  " })).payment_method,
      "",
    );
    assertRejects(
      appointmentSchema,
      appointment({ payment_method: "a".repeat(MAX_LIST_ITEM_LENGTH + 1) }),
      MESSAGES.textTooLong("O tipo de pagamento", MAX_LIST_ITEM_LENGTH),
    );
  });

  test("pet, serviço, data, horário e valor têm cada um a sua mensagem", () => {
    assertRejects(appointmentSchema, appointment({ pet_id: 0 }), MESSAGES.appointment.petRequired);
    assertRejects(
      appointmentSchema,
      appointment({ service: " " }),
      MESSAGES.appointment.serviceRequired,
    );
    assertRejects(appointmentSchema, appointment({ date: "2026-02-30" }), MESSAGES.date.invalid);
    assertRejects(appointmentSchema, appointment({ time: "" }), MESSAGES.appointment.timeRequired);
    assertRejects(appointmentSchema, appointment({ time: "9" }), MESSAGES.appointment.timeInvalid);
    assertRejects(appointmentSchema, appointment({ price: -100 }), MESSAGES.money.invalid);
  });

  test("serviço até o limite", () => {
    assert.doesNotThrow(() =>
      parseInput(appointmentSchema, appointment({ service: "a".repeat(MAX_LIST_ITEM_LENGTH) })),
    );
    assertRejects(
      appointmentSchema,
      appointment({ service: "a".repeat(MAX_LIST_ITEM_LENGTH + 1) }),
      MESSAGES.textTooLong("O serviço", MAX_LIST_ITEM_LENGTH),
    );
  });

  test("horário: de 00:00 a 23:59, sempre com horas e minutos", () => {
    for (const time of ["00:00", "09:30", "23:59"]) {
      assert.equal(parseInput(appointmentSchema, appointment({ time })).time, time);
    }
    assert.equal(parseInput(appointmentSchema, appointment({ time: " 09:30 " })).time, "09:30");
    for (const time of ["9", "09", "9:30", "24:00", "23:60", "-1:00", "09:30:00", "0930"]) {
      assertRejects(
        appointmentSchema,
        appointment({ time }),
        MESSAGES.appointment.timeInvalid,
        time,
      );
    }
  });

  test("data: só um dia que existe, no formato do banco", () => {
    assert.doesNotThrow(() => parseInput(appointmentSchema, appointment({ date: "2028-02-29" })));
    for (const date of [
      "",
      "2026-02-29",
      "2026-11-31",
      "09/11/2026",
      "2026/11/09",
      " 2026-11-09",
    ]) {
      assertRejects(appointmentSchema, appointment({ date }), MESSAGES.date.invalid, date);
    }
  });

  test("valor: centavos inteiros e sem sinal, de zero ao maior inteiro seguro", () => {
    assert.equal(parseInput(appointmentSchema, appointment({ price: 0 })).price, 0);
    assert.equal(
      parseInput(appointmentSchema, appointment({ price: Number.MAX_SAFE_INTEGER })).price,
      Number.MAX_SAFE_INTEGER,
    );
    for (const price of [-1, 0.5, 80.1, Number.MAX_SAFE_INTEGER + 1]) {
      assertRejects(
        appointmentSchema,
        appointment({ price }),
        MESSAGES.money.invalid,
        String(price),
      );
    }
  });

  test("observação até o limite", () => {
    assertRejects(
      appointmentSchema,
      appointment({ notes: "a".repeat(MAX_NOTES_LENGTH + 1) }),
      MESSAGES.textTooLong("A observação do agendamento", MAX_NOTES_LENGTH),
    );
  });

  test("os campos de sim ou não só aceitam 0 ou 1", () => {
    assertRejects(
      appointmentSchema,
      appointment({ deliver_pet: 2 }),
      MESSAGES.invalidFlag("Entregar pet"),
    );
    assertRejects(
      appointmentSchema,
      appointment({ completed: true }),
      MESSAGES.invalidFlag("Concluído"),
    );
    assertRejects(appointmentSchema, appointment({ is_paid: "1" }), MESSAGES.invalidFlag("Pago"));
  });
});

// ─── Raça ───────────────────────────────────────────────────────────────────

describe("raça", () => {
  const breed = (fields = {}) => ({ speciesId: 1, breedName: "Poodle", ...fields });

  test("aceita a raça e tira os espaços das pontas", () => {
    assert.deepEqual(parseInput(breedSchema, breed({ breedName: "  Golden Retriever  " })), {
      speciesId: 1,
      breedName: "Golden Retriever",
    });
  });

  test("espécie escolhida, nome obrigatório, com pelo menos 2 caracteres e até o limite", () => {
    assertRejects(breedSchema, breed({ speciesId: 0 }), MESSAGES.breed.speciesRequired);
    assertRejects(breedSchema, breed({ breedName: "   " }), MESSAGES.breed.nameRequired);
    assertRejects(breedSchema, breed({ breedName: " a " }), MESSAGES.breed.nameTooShort);
    assert.doesNotThrow(() => parseInput(breedSchema, breed({ breedName: "ab" })));
    assert.doesNotThrow(() =>
      parseInput(breedSchema, breed({ breedName: "a".repeat(MAX_BREED_NAME_LENGTH) })),
    );
    assertRejects(
      breedSchema,
      breed({ breedName: "a".repeat(MAX_BREED_NAME_LENGTH + 1) }),
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
    assert.deepEqual(parseInput(breedSearchSchema, { speciesId: 2, page: 0, query: " poo " }), {
      speciesId: 2,
      page: 0,
      query: "poo",
    });
    assertRejects(
      breedSearchSchema,
      { speciesId: 0, page: 0, query: "" },
      MESSAGES.breed.speciesRequired,
    );
    assertRejects(
      breedSearchSchema,
      { speciesId: 2, page: -1, query: "" },
      MESSAGES.search.invalidPage,
    );
    assertRejects(
      breedSearchSchema,
      { speciesId: 2, page: 0, query: "a".repeat(MAX_SEARCH_LENGTH + 1) },
      MESSAGES.search.tooLong(MAX_SEARCH_LENGTH),
    );
  });

  test("a contagem de raças é a mesma busca, sem a página", () => {
    assert.deepEqual(parseInput(breedCountSchema, { speciesId: 2, query: "", page: 5 }), {
      speciesId: 2,
      query: "",
    });
  });
});

describe("preferências", () => {
  test("o tema só aceita claro ou escuro", () => {
    assert.equal(parseInput(themeSchema, "dark"), "dark");
    assert.equal(parseInput(themeSchema, "light"), "light");
    for (const theme of ["escuro", "", null, 1, "dark; DROP TABLE settings"]) {
      assertRejects(
        themeSchema,
        theme,
        MESSAGES.invalidOption("Tema", ["light", "dark"]),
        String(theme),
      );
    }
  });
});

// ─── Entrada maliciosa ──────────────────────────────────────────────────────

describe("entrada maliciosa", () => {
  test("texto gigante para no limite do campo, sem chegar às outras regras", () => {
    const huge = "a".repeat(1_000_000);
    const cases = [
      [
        ownerSchema,
        owner({ name: huge }),
        MESSAGES.textTooLong("O nome do dono", MAX_OWNER_NAME_LENGTH),
      ],
      [ownerSchema, owner({ phone: huge }), MESSAGES.owner.phoneInvalid],
      [
        ownerSchema,
        owner({ email: `${huge}@example.com` }),
        MESSAGES.textTooLong("O e-mail", MAX_EMAIL_LENGTH),
      ],
      [
        ownerSchema,
        owner({ address: huge }),
        MESSAGES.textTooLong("O endereço", MAX_ADDRESS_LENGTH),
      ],
      [petSchema, pet({ name: huge }), MESSAGES.textTooLong("O nome do pet", MAX_PET_NAME_LENGTH)],
      [
        petSchema,
        pet({ notes: huge }),
        MESSAGES.textTooLong("A observação do pet", MAX_NOTES_LENGTH),
      ],
      [petSchema, pet({ default_time: huge }), MESSAGES.pet.defaultTimeInvalid],
      [
        appointmentSchema,
        appointment({ service: huge }),
        MESSAGES.textTooLong("O serviço", MAX_LIST_ITEM_LENGTH),
      ],
      [appointmentSchema, appointment({ time: huge }), MESSAGES.appointment.timeInvalid],
      [appointmentSchema, appointment({ date: huge }), MESSAGES.date.invalid],
      [nameSearchSchema, nameSearch({ query: huge }), MESSAGES.search.tooLong(MAX_SEARCH_LENGTH)],
      [
        breedSchema,
        { speciesId: 1, breedName: huge },
        MESSAGES.textTooLong("O nome da raça", MAX_BREED_NAME_LENGTH),
      ],
    ];
    for (const [schema, input, message] of cases) {
      assertRejects(schema, input, message, message);
    }
  });

  test("o __proto__ de um JSON não entra no dado nem muda os objetos do app", () => {
    const input = JSON.parse(
      '{"name":"Ana","phone":"(45) 99999-1234","is_active":1,"__proto__":{"isAdmin":true},"constructor":{"x":1}}',
    );
    const data = parseInput(ownerSchema, input);
    assert.equal(Object.hasOwn(data, "__proto__"), false);
    assert.equal(Object.hasOwn(data, "constructor"), false);
    assert.equal({}.isAdmin, undefined);
    assert.equal(data.isAdmin, undefined);
  });

  test("objeto no lugar de valor não passa como filtro", () => {
    assertRejects(petSchema, pet({ owner_id: { $gt: 0 } }), MESSAGES.invalidInput);
    assertRejects(
      nameSearchSchema,
      nameSearch({ active: { $ne: 0 } }),
      MESSAGES.invalidFlag("Filtro ativo"),
    );
  });
});

// ─── Mensagens novas ────────────────────────────────────────────────────────

describe("mensagens da validação", () => {
  test("o limite de texto diz o campo e o tamanho", () => {
    assert.equal(
      MESSAGES.textTooLong("O nome do dono", 100),
      "O nome do dono pode ter até 100 caracteres.",
    );
  });

  test("o horário vazio e o horário inválido têm mensagens diferentes, como o telefone", () => {
    assert.notEqual(MESSAGES.appointment.timeRequired, MESSAGES.appointment.timeInvalid);
    assert.notEqual(MESSAGES.appointment.timeInvalid, MESSAGES.pet.defaultTimeInvalid);
    assert.notEqual(
      MESSAGES.pet.packageRequired,
      MESSAGES.invalidOption("Pacote de remarcação", [4, 2]),
    );
  });
});
