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
import { assertBreedOfSpecies, assertNewBreedName, breedNameKey } from "../src/service/breedRules.ts";
import { breedSchema } from "../src/validation/breedSchema.ts";
import { parseInput } from "../src/validation/parseInput.ts";
import { normalizeForSearch } from "../src/utils/formatadores/normalizaNome.ts";
import { AppError } from "../src/errors/AppError.ts";
import { MESSAGES } from "../src/globals/messages.ts";

// Da carga inicial do esquema.
const CAO = 1;
const GATO = 2;
const VIRA_LATA_CAO = 1;
const SIAMES = 16;

const appError = (code, message) => (error) =>
  error instanceof AppError && error.code === code && error.message === message;

/** O createBreed do SpeciesController e do SpeciesService, passo a passo. */
function createBreed(db, input) {
  const { especieId, nomeRaca } = parseInput(breedSchema, input);
  if (!db.prepare(FIND_SPECIES_SQL).get(especieId)) {
    throw new AppError("NOT_FOUND", MESSAGES.species.notFound);
  }
  const names = db.prepare(LIST_BREED_NAMES_SQL).all(especieId).map((row) => row.nome_raca);
  assertNewBreedName(names, nomeRaca);
  const result = db.prepare(INSERT_BREED_SQL).run(especieId, nomeRaca, normalizeForSearch(nomeRaca));
  return Number(result.lastInsertRowid);
}

/** O assertBreedOfSpecies do SpeciesService, que o PetService chama antes de gravar o pet. */
const checkBreedOfPet = (db, pet) =>
  assertBreedOfSpecies(db.prepare(FIND_BREED_SQL).get(pet.raca) ?? null, pet.especie);

const breedCount = (db) => db.prepare("SELECT COUNT(*) AS total FROM race").get().total;

describe("raça repetida", () => {
  test("o nome comparado ignora acento, maiúscula e espaços sobrando", () => {
    assert.equal(breedNameKey("  Pastor   Alemão "), "pastor alemao");
    assert.equal(breedNameKey("PASTOR ALEMAO"), breedNameKey("Pastor Alemão"));
    assert.notEqual(breedNameKey("Pastor Alemão"), breedNameKey("Pastor Belga"));
  });

  test("cadastra a raça nova e devolve o id, que a busca do seletor encontra", async () => {
    const db = await createDatabase();
    const id = createBreed(db, { especieId: CAO, nomeRaca: "  Pastor Alemão  " });

    assert.deepEqual({ ...db.prepare(FIND_BREED_SQL).get(id) }, { id, especie_id: CAO, nome_raca: "Pastor Alemão" });
    const { sql, params } = listBreedsSql(CAO, "pastor alemao", 0, 20);
    assert.deepEqual(db.prepare(sql).all(...params).map((row) => row.id), [id]);
  });

  test("recusa o mesmo nome na mesma espécie com outro acento, maiúscula ou espaçamento", async () => {
    const db = await createDatabase();
    createBreed(db, { especieId: CAO, nomeRaca: "Pastor Alemão" });
    const before = breedCount(db);

    for (const nomeRaca of ["Pastor Alemao", "pastor alemão", "PASTOR ALEMÃO", "Pastor  Alemão", " Pástor Alemão "]) {
      assert.throws(
        () => createBreed(db, { especieId: CAO, nomeRaca }),
        appError("CONFLICT", MESSAGES.breed.duplicate),
        nomeRaca,
      );
    }
    assert.equal(breedCount(db), before);
  });

  test("recusa a repetida da carga inicial, que tem a coluna normalizada sem a pontuação", async () => {
    const db = await createDatabase();
    for (const [especieId, nomeRaca] of [[CAO, "vira-lata (srd)"], [GATO, "Siames"], [CAO, "Spitz Alemao (Lulu)"]]) {
      assert.throws(
        () => createBreed(db, { especieId, nomeRaca }),
        appError("CONFLICT", MESSAGES.breed.duplicate),
        nomeRaca,
      );
    }
  });

  test("o mesmo nome em outra espécie e um nome só parecido passam", async () => {
    const db = await createDatabase();
    createBreed(db, { especieId: CAO, nomeRaca: "Pastor Alemão" });

    assert.doesNotThrow(() => createBreed(db, { especieId: GATO, nomeRaca: "Pastor Alemão" }));
    assert.doesNotThrow(() => createBreed(db, { especieId: CAO, nomeRaca: "Pastor Alemão Branco" }));
    assert.doesNotThrow(() => createBreed(db, { especieId: CAO, nomeRaca: "Poo" }), "parte de Poodle não é repetida");
  });

  test("curingas do LIKE e SQL no nome são só texto e não acham uma raça repetida", async () => {
    const db = await createDatabase();
    for (const nomeRaca of ["%%", "__", "Poodle'; DROP TABLE race; --", "\\%"]) {
      const id = createBreed(db, { especieId: CAO, nomeRaca });
      assert.equal(db.prepare(FIND_BREED_SQL).get(id).nome_raca, nomeRaca);
    }
    assert.throws(
      () => createBreed(db, { especieId: CAO, nomeRaca: "Poodle'; drop table RACE; --" }),
      appError("CONFLICT", MESSAGES.breed.duplicate),
    );
  });

  test("a espécie precisa existir, e a entrada inválida nem chega ao banco", async () => {
    const db = await createDatabase();
    const before = breedCount(db);

    assert.throws(
      () => createBreed(db, { especieId: 999, nomeRaca: "Pastor Alemão" }),
      appError("NOT_FOUND", MESSAGES.species.notFound),
    );
    assert.throws(() => createBreed(db, { especieId: 0, nomeRaca: "Pastor" }), appError("VALIDATION", MESSAGES.breed.speciesRequired));
    assert.throws(() => createBreed(db, { especieId: CAO, nomeRaca: " a " }), appError("VALIDATION", MESSAGES.breed.nameTooShort));
    assert.throws(() => createBreed(db, { especieId: "1 OR 1=1", nomeRaca: "Pastor" }), appError("VALIDATION", MESSAGES.invalidInput));
    assert.equal(breedCount(db), before);
  });
});

describe("raça da espécie do pet", () => {
  test("a raça da espécie escolhida passa, e o pet grava", async () => {
    const db = await createDatabase();
    const pet = { especie: GATO, raca: SIAMES, dono_id: insertOwner(db) };

    assert.doesNotThrow(() => checkBreedOfPet(db, pet));
    assert.equal(insertPet(db, pet).raca, SIAMES);
  });

  test("a raça de outra espécie é recusada com a mensagem para escolher de novo", async () => {
    const db = await createDatabase();
    const siames = db.prepare(FIND_BREED_SQL).get(SIAMES);
    assert.equal(siames.especie_id, GATO, "o Siamês da carga inicial é de gato");

    assert.throws(
      () => checkBreedOfPet(db, { especie: CAO, raca: SIAMES }),
      appError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies),
    );
    assert.throws(
      () => checkBreedOfPet(db, { especie: GATO, raca: VIRA_LATA_CAO }),
      appError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies),
    );
  });

  test("a raça que não existe responde como não encontrada", async () => {
    const db = await createDatabase();
    for (const raca of [999, 2 ** 31]) {
      assert.throws(() => checkBreedOfPet(db, { especie: CAO, raca }), appError("NOT_FOUND", MESSAGES.breed.notFound), String(raca));
    }
  });

  test("a raça nova serve só para a espécie em que foi cadastrada", async () => {
    const db = await createDatabase();
    const id = createBreed(db, { especieId: GATO, nomeRaca: "Azul Russo" });

    assert.doesNotThrow(() => checkBreedOfPet(db, { especie: GATO, raca: id }));
    assert.throws(() => checkBreedOfPet(db, { especie: CAO, raca: id }), appError("VALIDATION", MESSAGES.pet.breedOfOtherSpecies));
  });
});
