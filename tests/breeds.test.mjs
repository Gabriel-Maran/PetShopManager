// Raças: o cadastro recusa o nome repetido na espécie, mesmo com outro acento, e o pet só grava a raça
// da espécie escolhida. Os passos são os do SpeciesService, com o SQL de breedsSql.ts e as regras de
// breedRules.ts, num SQLite em memória.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabase, insertOwner, insertPet } from "./helpers/database.mjs";
import {
  FIND_BREED_SQL,
  FIND_SPECIES_SQL,
  INSERT_BREED_SQL,
  LIST_BREED_NAMES_SQL,
  listBreedsSql,
} from "../src/repository/sql/breedsSql.ts";
import {
  assertBreedOfSpecies,
  assertNewBreedName,
  breedNameKey,
} from "../src/service/breedRules.ts";
import { breedSchema } from "../src/validation/breedSchema.ts";
import { parseInput } from "../src/validation/parseInput.ts";
import { normalizeForSearch } from "../src/utils/formatters/normalizeForSearch.ts";
import { AppError } from "../src/errors/AppError.ts";
import { MESSAGES } from "../src/globals/messages.ts";

// Da carga inicial do esquema.
const CAO = 1;
const GATO = 2;
const MIXED_BREED_DOG = 1;
const SIAMESE = 16;

const appError = (code, message) => (error) =>
  error instanceof AppError && error.code === code && error.message === message;

/** O createBreed do SpeciesController e do SpeciesService, passo a passo. */
function createBreed(db, input) {
  const { speciesId, breedName } = parseInput(breedSchema, input);
  if (!db.prepare(FIND_SPECIES_SQL).get(speciesId)) {
    throw new AppError("NOT_FOUND", MESSAGES.species.notFound);
  }
  const names = db
    .prepare(LIST_BREED_NAMES_SQL)
    .all(speciesId)
    .map((row) => row.name);
  assertNewBreedName(names, breedName);
  const result = db
    .prepare(INSERT_BREED_SQL)
    .run(speciesId, breedName, normalizeForSearch(breedName));
  return Number(result.lastInsertRowid);
}

/** O assertBreedOfSpecies do SpeciesService, que o PetService chama antes de gravar o pet. */
const checkBreedOfPet = (db, pet) =>
  assertBreedOfSpecies(db.prepare(FIND_BREED_SQL).get(pet.breed_id) ?? null, pet.species_id);

const breedCount = (db) => db.prepare("SELECT COUNT(*) AS total FROM breeds").get().total;

describe("raça repetida", () => {
  test("o nome comparado ignora acento, maiúscula e espaços sobrando", () => {
    assert.equal(breedNameKey("  Pastor   Alemão "), "pastor alemao");
    assert.equal(breedNameKey("PASTOR ALEMAO"), breedNameKey("Pastor Alemão"));
    assert.notEqual(breedNameKey("Pastor Alemão"), breedNameKey("Pastor Belga"));
  });

  test("cadastra a raça nova e devolve o id, que a busca do seletor encontra", async () => {
    const db = await createDatabase();
    const id = createBreed(db, { speciesId: CAO, breedName: "  Pastor Alemão  " });

    assert.deepEqual(
      { ...db.prepare(FIND_BREED_SQL).get(id) },
      { id, species_id: CAO, name: "Pastor Alemão" },
    );
    const { sql, params } = listBreedsSql(CAO, "pastor alemao", 0, 20);
    assert.deepEqual(
      db
        .prepare(sql)
        .all(...params)
        .map((row) => row.id),
      [id],
    );
  });

  test("recusa o mesmo nome na mesma espécie com outro acento, maiúscula ou espaçamento", async () => {
    const db = await createDatabase();
    createBreed(db, { speciesId: CAO, breedName: "Pastor Alemão" });
    const before = breedCount(db);

    for (const breedName of [
      "Pastor Alemao",
      "pastor alemão",
      "PASTOR ALEMÃO",
      "Pastor  Alemão",
      " Pástor Alemão ",
    ]) {
      assert.throws(
        () => createBreed(db, { speciesId: CAO, breedName }),
        appError("CONFLICT", MESSAGES.breed.duplicate),
        breedName,
      );
    }
    assert.equal(breedCount(db), before);
  });

  test("recusa a repetida da carga inicial, que tem a coluna normalizada sem a pontuação", async () => {
    const db = await createDatabase();
    for (const [speciesId, breedName] of [
      [CAO, "vira-lata (srd)"],
      [GATO, "Siames"],
      [CAO, "Spitz Alemao (Lulu)"],
    ]) {
      assert.throws(
        () => createBreed(db, { speciesId, breedName }),
        appError("CONFLICT", MESSAGES.breed.duplicate),
        breedName,
      );
    }
  });

  test("o mesmo nome em outra espécie e um nome só parecido passam", async () => {
    const db = await createDatabase();
    createBreed(db, { speciesId: CAO, breedName: "Pastor Alemão" });

    assert.doesNotThrow(() => createBreed(db, { speciesId: GATO, breedName: "Pastor Alemão" }));
    assert.doesNotThrow(() =>
      createBreed(db, { speciesId: CAO, breedName: "Pastor Alemão Branco" }),
    );
    assert.doesNotThrow(
      () => createBreed(db, { speciesId: CAO, breedName: "Poo" }),
      "parte de Poodle não é repetida",
    );
  });

  test("curingas do LIKE e SQL no nome são só texto e não acham uma raça repetida", async () => {
    const db = await createDatabase();
    for (const breedName of ["%%", "__", "Poodle'; DROP TABLE race; --", "\\%"]) {
      const id = createBreed(db, { speciesId: CAO, breedName });
      assert.equal(db.prepare(FIND_BREED_SQL).get(id).name, breedName);
    }
    assert.throws(
      () => createBreed(db, { speciesId: CAO, breedName: "Poodle'; drop table RACE; --" }),
      appError("CONFLICT", MESSAGES.breed.duplicate),
    );
  });

  test("a espécie precisa existir, e a entrada inválida nem chega ao banco", async () => {
    const db = await createDatabase();
    const before = breedCount(db);

    assert.throws(
      () => createBreed(db, { speciesId: 999, breedName: "Pastor Alemão" }),
      appError("NOT_FOUND", MESSAGES.species.notFound),
    );
    assert.throws(
      () => createBreed(db, { speciesId: 0, breedName: "Pastor" }),
      appError("VALIDATION", MESSAGES.breed.speciesRequired),
    );
    assert.throws(
      () => createBreed(db, { speciesId: CAO, breedName: " a " }),
      appError("VALIDATION", MESSAGES.breed.nameTooShort),
    );
    assert.throws(
      () => createBreed(db, { speciesId: "1 OR 1=1", breedName: "Pastor" }),
      appError("VALIDATION", MESSAGES.invalidInput),
    );
    assert.equal(breedCount(db), before);
  });
});

describe("raça da espécie do pet", () => {
  test("a raça da espécie escolhida passa, e o pet grava", async () => {
    const db = await createDatabase();
    const pet = { species_id: GATO, breed_id: SIAMESE, owner_id: insertOwner(db) };

    assert.doesNotThrow(() => checkBreedOfPet(db, pet));
    assert.equal(insertPet(db, pet).breed_id, SIAMESE);
  });

  test("a raça de outra espécie é recusada com a mensagem para escolher de novo", async () => {
    const db = await createDatabase();
    const siamese = db.prepare(FIND_BREED_SQL).get(SIAMESE);
    assert.equal(siamese.species_id, GATO, "o Siamês da carga inicial é de gato");

    assert.throws(
      () => checkBreedOfPet(db, { species_id: CAO, breed_id: SIAMESE }),
      appError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies),
    );
    assert.throws(
      () => checkBreedOfPet(db, { species_id: GATO, breed_id: MIXED_BREED_DOG }),
      appError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies),
    );
  });

  test("a raça que não existe responde como não encontrada", async () => {
    const db = await createDatabase();
    for (const breed_id of [999, 2 ** 31]) {
      assert.throws(
        () => checkBreedOfPet(db, { species_id: CAO, breed_id }),
        appError("NOT_FOUND", MESSAGES.breed.notFound),
        String(breed_id),
      );
    }
  });

  test("a raça nova serve só para a espécie em que foi cadastrada", async () => {
    const db = await createDatabase();
    const id = createBreed(db, { speciesId: GATO, breedName: "Azul Russo" });

    assert.doesNotThrow(() => checkBreedOfPet(db, { species_id: GATO, breed_id: id }));
    assert.throws(
      () => checkBreedOfPet(db, { species_id: CAO, breed_id: id }),
      appError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies),
    );
  });
});
