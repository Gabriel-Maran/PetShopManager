// Caracterização da ativação e desativação em cascata de donos e pets, feita pelos triggers.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createDatabase,
  dateInt,
  insertOwner,
  insertPet,
  pendingAutoOf,
  petRow,
} from "./helpers/database.mjs";
import { DEACTIVATE_OWNER_SQL } from "../app/repository/sql/ownersSql.ts";
import { ACTIVATE_PET_SQL, DEACTIVATE_PET_SQL } from "../app/repository/sql/petsSql.ts";

const ownerActive = (db, id) => db.prepare("SELECT is_ativo FROM owners WHERE id = ?").get(id).is_ativo;

describe("cascata entre donos e pets", () => {
  let db;
  let ownerId;
  let withPackage;
  let withoutPackage;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db);
    withPackage = insertPet(db, {
      nome: "Thor", dono_id: ownerId, remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: dateInt(3), valor_pacote: "320,00",
    });
    withoutPackage = insertPet(db, { nome: "Mel", dono_id: ownerId });
  });

  test("desativar o dono desativa os pets dele", () => {
    db.prepare(DEACTIVATE_OWNER_SQL).run(ownerId);

    assert.equal(petRow(db, withPackage.id).is_ativo, 0);
    assert.equal(petRow(db, withoutPackage.id).is_ativo, 0);
  });

  test("desativar um pet com pacote desliga o pacote e apaga os automáticos futuros", () => {
    db.prepare(DEACTIVATE_PET_SQL).run(withPackage.id);

    const pet = petRow(db, withPackage.id);
    assert.equal(pet.remarcacao_ativa, 0);
    assert.equal(pet.data_inicio_pacote, null);
    assert.equal(pet.ultimo_visita_data_auto, null);
    assert.equal(pendingAutoOf(db, withPackage.id).filter((a) => a.data > dateInt(1)).length, 0);
  });

  test("desativar o dono também limpa o pacote dos pets, pelos triggers em cadeia", () => {
    db.prepare(DEACTIVATE_OWNER_SQL).run(ownerId);

    assert.equal(petRow(db, withPackage.id).remarcacao_ativa, 0);
    assert.equal(pendingAutoOf(db, withPackage.id).filter((a) => a.data > dateInt(1)).length, 0);
  });

  test("reativar um pet reativa o dono, e o pacote continua desligado", () => {
    db.prepare(DEACTIVATE_OWNER_SQL).run(ownerId);

    db.prepare(ACTIVATE_PET_SQL).run(withPackage.id);

    assert.equal(ownerActive(db, ownerId), 1);
    assert.equal(petRow(db, withPackage.id).is_ativo, 1);
    assert.equal(petRow(db, withPackage.id).remarcacao_ativa, 0);
    assert.equal(pendingAutoOf(db, withPackage.id).length, 0);
    // O outro pet do dono continua desativado: a reativação não volta em cascata.
    assert.equal(petRow(db, withoutPackage.id).is_ativo, 0);
  });
});
