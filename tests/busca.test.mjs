// Busca paginada por nome (BUG-5): a lista e o total saem da mesma função, com o mesmo filtro, nos dois
// status, com e sem acento, e o texto digitado nunca vira coringa nem comando.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabase, insertOwner, insertPet } from "./helpers/database.mjs";
import { DEACTIVATE_OWNER_SQL, searchOwnersSql } from "../src/repository/sql/ownersSql.ts";
import { DEACTIVATE_PET_SQL, searchPetsSql } from "../src/repository/sql/petsSql.ts";
import { toSearchPattern } from "../src/repository/sql/searchSql.ts";
import { countBreedsSql, INSERT_BREED_SQL, listBreedsSql } from "../src/repository/sql/breedsSql.ts";
import { normalizeForSearch } from "../src/utils/formatadores/normalizaNome.ts";
import { validateNameSearch } from "../src/controller/validateNameSearch.ts";
import { MAX_SEARCH_LENGTH } from "../src/globals/limits.ts";
import { MESSAGES } from "../src/globals/messages.ts";
import { AppError } from "../src/errors/AppError.ts";

/** A busca como a tela monta, com o que o teste quiser trocar. */
const nameSearch = (fields = {}) => ({ query: "", ativo: 1, page: 0, limit: 20, ...fields });

/** Roda a página e a contagem como o fetchPage do app. */
function runPage(db, { list, count }) {
  return {
    items: db.prepare(list.sql).all(...list.params),
    total: db.prepare(count.sql).get(...count.params).total,
  };
}

const names = (page) => page.items.map((item) => item.nome);

describe("busca de donos", () => {
  let db;

  beforeEach(async () => {
    db = await createDatabase();
  });

  test("a lista e o total usam o mesmo status, nos ativos e nos inativos", () => {
    insertOwner(db, { nome: "Ana" });
    insertOwner(db, { nome: "Bruno" });
    const inactiveId = insertOwner(db, { nome: "Carla" });
    db.prepare(DEACTIVATE_OWNER_SQL).run(inactiveId);

    const active = runPage(db, searchOwnersSql(nameSearch({ ativo: 1 })));
    const inactive = runPage(db, searchOwnersSql(nameSearch({ ativo: 0 })));

    assert.deepEqual(names(active).sort(), ["Ana", "Bruno"]);
    assert.equal(active.total, 2);
    assert.deepEqual(names(inactive), ["Carla"]);
    assert.equal(inactive.total, 1);
  });

  test("a busca ignora acento e maiúsculas, e o total conta o que a lista mostra", () => {
    insertOwner(db, { nome: "João Silva" });
    insertOwner(db, { nome: "Joana" });
    insertOwner(db, { nome: "Pedro" });

    for (const query of ["joao", "JOÃO", "  João  "]) {
      const page = runPage(db, searchOwnersSql(nameSearch({ query })));
      assert.deepEqual(names(page), ["João Silva"], query);
      assert.equal(page.total, 1, query);
    }

    const both = runPage(db, searchOwnersSql(nameSearch({ query: "jo" })));
    assert.equal(both.total, 2);
    assert.equal(both.items.length, 2);
  });

  test("sem texto, os mais novos vêm primeiro; com texto, a ordem é alfabética, sem olhar o acento", () => {
    for (const nome of ["Bruna", "Ângela", "Carla", "Ana"]) insertOwner(db, { nome });

    const recent = runPage(db, searchOwnersSql(nameSearch()));
    assert.deepEqual(names(recent), ["Ana", "Carla", "Ângela", "Bruna"]);

    const byName = runPage(db, searchOwnersSql(nameSearch({ query: "a" })));
    assert.deepEqual(names(byName), ["Ana", "Ângela", "Bruna", "Carla"]);
  });

  test("as páginas não repetem nem pulam ninguém, mesmo com a mesma data de cadastro", () => {
    for (let i = 1; i <= 25; i++) insertOwner(db, { nome: `Dono ${String(i).padStart(2, "0")}` });

    const pages = [0, 1, 2].map((page) => runPage(db, searchOwnersSql(nameSearch({ page, limit: 10 }))));
    const ids = pages.flatMap((page) => page.items.map((item) => item.id));

    assert.deepEqual(pages.map((page) => page.items.length), [10, 10, 5]);
    assert.equal(new Set(ids).size, 25);
    assert.ok(pages.every((page) => page.total === 25));
  });

  test("% e _ na busca são texto, não coringa", () => {
    insertOwner(db, { nome: "Ana" });
    insertOwner(db, { nome: "Loja 100%" });
    insertOwner(db, { nome: "Pet_Shop" });

    const percent = runPage(db, searchOwnersSql(nameSearch({ query: "%" })));
    assert.deepEqual(names(percent), ["Loja 100%"]);
    assert.equal(percent.total, 1);

    const underscore = runPage(db, searchOwnersSql(nameSearch({ query: "_" })));
    assert.deepEqual(names(underscore), ["Pet_Shop"]);
    assert.equal(underscore.total, 1);
  });

  test("um comando SQL digitado na busca é só texto", () => {
    insertOwner(db, { nome: "Ana" });

    const page = runPage(db, searchOwnersSql(nameSearch({ query: "'; DROP TABLE owners; --" })));

    assert.deepEqual(page, { items: [], total: 0 });
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM owners").get().total, 1);
  });
});

describe("busca de pets", () => {
  let db;
  let ownerId;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db, { nome: "Maria" });
  });

  test("a lista traz espécie, raça e dono, e o total bate nos dois status", () => {
    insertPet(db, { nome: "Rex", dono_id: ownerId });
    insertPet(db, { nome: "Rémi", dono_id: ownerId });
    const inactive = insertPet(db, { nome: "Thor", dono_id: ownerId });
    db.prepare(DEACTIVATE_PET_SQL).run(inactive.id);

    const active = runPage(db, searchPetsSql(nameSearch({ ativo: 1 })));
    assert.deepEqual(names(active).sort(), ["Rex", "Rémi"].sort());
    assert.equal(active.total, 2);
    assert.equal(active.items[0].nome_dono, "Maria");
    assert.ok(active.items.every((pet) => pet.nome_especie && pet.nome_raca));

    const inactivePage = runPage(db, searchPetsSql(nameSearch({ ativo: 0 })));
    assert.deepEqual(names(inactivePage), ["Thor"]);
    assert.equal(inactivePage.total, 1);
  });

  test("a busca por pet sem acento acha o nome com acento, e o total acompanha", () => {
    insertPet(db, { nome: "Rémi", dono_id: ownerId });
    insertPet(db, { nome: "Rex", dono_id: ownerId });

    const page = runPage(db, searchPetsSql(nameSearch({ query: "remi" })));

    assert.deepEqual(names(page), ["Rémi"]);
    assert.equal(page.total, 1);
  });
});

describe("busca de raças", () => {
  let db;
  let speciesId;

  /** Grava a raça com o comando do app, na espécie criada para o teste. */
  const insertBreed = (nome) =>
    db.prepare(INSERT_BREED_SQL).run(speciesId, nome, normalizeForSearch(nome));

  /** Roda a página e a contagem como o SpeciesRepository. */
  function runBreeds(query, { page = 0, limit = 20 } = {}) {
    const list = listBreedsSql(speciesId, query, page, limit);
    const count = countBreedsSql(speciesId, query);
    return {
      items: db.prepare(list.sql).all(...list.params),
      total: db.prepare(count.sql).get(...count.params).total,
    };
  }

  beforeEach(async () => {
    db = await createDatabase();
    // Uma espécie só do teste, para as raças semeadas do cão e do gato não entrarem na conta.
    speciesId = Number(db.prepare("INSERT INTO species (nome) VALUES ('TESTE')").run().lastInsertRowid);
  });

  test("sem texto, traz todas as raças da espécie, de A a Z, e só dela", () => {
    for (const nome of ["Poodle", "Akita", "Beagle"]) insertBreed(nome);

    const page = runBreeds("");

    assert.deepEqual(names(page), ["Akita", "Beagle", "Poodle"]);
    assert.equal(page.total, 3);
  });

  test("a busca ignora acento e maiúsculas, e o total acompanha a lista", () => {
    for (const nome of ["Spitz Alemão", "Pastor Alemão", "Pug"]) insertBreed(nome);

    for (const query of ["alemao", "ALEMÃO", "  Alemão  "]) {
      const page = runBreeds(query);
      assert.deepEqual(names(page), ["Pastor Alemão", "Spitz Alemão"], query);
      assert.equal(page.total, 2, query);
    }
  });

  test("% e _ na busca são texto, não coringa", () => {
    for (const nome of ["Akita", "Mestiço 50%", "Raça_Nova"]) insertBreed(nome);

    const percent = runBreeds("%");
    assert.deepEqual(names(percent), ["Mestiço 50%"]);
    assert.equal(percent.total, 1);

    const underscore = runBreeds("_");
    assert.deepEqual(names(underscore), ["Raça_Nova"]);
    assert.equal(underscore.total, 1);
  });

  test("as páginas não repetem nem pulam nenhuma raça", () => {
    for (let i = 1; i <= 25; i++) insertBreed(`Raça ${String(i).padStart(2, "0")}`);

    const pages = [0, 1, 2].map((page) => runBreeds("", { page, limit: 10 }));
    const ids = pages.flatMap((page) => page.items.map((item) => item.id));

    assert.deepEqual(pages.map((page) => page.items.length), [10, 10, 5]);
    assert.equal(new Set(ids).size, 25);
    assert.ok(pages.every((page) => page.total === 25));
  });

  test("um comando SQL digitado na busca é só texto", () => {
    insertBreed("Akita");

    const page = runBreeds("'; DROP TABLE race; --");

    assert.deepEqual(page, { items: [], total: 0 });
    assert.equal(db.prepare("SELECT COUNT(*) AS total FROM race WHERE especie_id = ?").get(speciesId).total, 1);
  });
});

describe("toSearchPattern", () => {
  test("tira acento e maiúsculas e escapa os coringas do LIKE", () => {
    assert.equal(toSearchPattern("  João  "), "%joao%");
    assert.equal(toSearchPattern("100%_\\"), "%100\\%\\_\\\\%");
    assert.equal(toSearchPattern(""), "%%");
  });
});

describe("validateNameSearch", () => {
  /** O AppError de validação com a mensagem esperada. */
  const validationError = (message) => (error) =>
    error instanceof AppError && error.code === "VALIDATION" && error.message === message;

  test("aceita a busca da tela, inclusive o texto no limite", () => {
    assert.doesNotThrow(() => validateNameSearch(nameSearch()));
    assert.doesNotThrow(() => validateNameSearch(nameSearch({ ativo: 0, page: 3 })));
    assert.doesNotThrow(() => validateNameSearch(nameSearch({ query: "a".repeat(MAX_SEARCH_LENGTH) })));
  });

  test("recusa o filtro de status fora de 0 e 1", () => {
    for (const ativo of [2, -1, "1", null]) {
      assert.throws(
        () => validateNameSearch(nameSearch({ ativo })),
        validationError(MESSAGES.invalidFlag("Filtro ativo")),
        String(ativo),
      );
    }
  });

  test("recusa página e limite que não são inteiros válidos", () => {
    for (const fields of [{ page: -1 }, { page: 1.5 }, { page: NaN }, { limit: 0 }, { limit: 2.5 }]) {
      assert.throws(
        () => validateNameSearch(nameSearch(fields)),
        validationError(MESSAGES.search.invalidPage),
        JSON.stringify(fields),
      );
    }
  });

  test("recusa o texto acima do limite", () => {
    assert.throws(
      () => validateNameSearch(nameSearch({ query: "a".repeat(MAX_SEARCH_LENGTH + 1) })),
      validationError(MESSAGES.search.tooLong(MAX_SEARCH_LENGTH)),
    );
  });
});
