// A leitura de um pet pelo id, com as colunas nomeadas do getPetById.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createDatabase, insertOwner, insertPet, isoDate } from "./helpers/database.mjs";
import { FIND_PET_SQL } from "../src/repository/sql/petsSql.ts";

describe("FIND_PET_SQL", () => {
  let db;
  let pet;

  beforeEach(async () => {
    db = await createDatabase();
    pet = insertPet(db, {
      name: "Thor",
      owner_id: insertOwner(db),
      reschedule_active: 1,
      package_frequency: 4,
      package_start_date: isoDate(3),
      package_price: 32000,
    });
  });

  test("traz as colunas do modelo Pet, sem o nome normalizado da busca", () => {
    const row = db.prepare(FIND_PET_SQL).get(pet.id);

    assert.deepEqual(Object.keys(row).sort(), [
      "breed_id",
      "created_at",
      "default_service",
      "default_time",
      "id",
      "is_active",
      "last_auto_visit_date",
      "last_visit_date",
      "name",
      "notes",
      "owner_id",
      "package_frequency",
      "package_price",
      "package_start_date",
      "reschedule_active",
      "size",
      "species_id",
    ]);
    assert.equal(row.name, "Thor");
    assert.equal(row.package_price, 32000);
  });

  test("id que não existe, inclusive texto malicioso, não traz nada", () => {
    for (const id of [999999, -1, "1 OR 1=1", "1; DROP TABLE pets"]) {
      assert.equal(db.prepare(FIND_PET_SQL).get(id), undefined, String(id));
    }
    assert.ok(db.prepare(FIND_PET_SQL).get(pet.id), "a tabela continua lá");
  });
});
