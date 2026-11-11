// Caracterização da ativação e desativação em cascata de donos e pets, feita pelos triggers. A agenda do
// pacote, desde a versão 4 do esquema, vem do PackageScheduleService, pelo mesmo caminho do app.
import { beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createDatabase,
  createPet,
  insertOwner,
  isoDate,
  packageScheduleOf,
  pendingAutoOf,
  petRow,
  savePet,
} from "./helpers/database.mjs";
import { DEACTIVATE_OWNER_SQL } from "../src/repository/sql/ownersSql.ts";
import { DEACTIVATE_PET_SQL } from "../src/repository/sql/petsSql.ts";

/** Reativa o pet como o app faz. */
const activatePet = (db, petId) => packageScheduleOf(db).activatePet(petId, new Date());

const ownerActive = (db, id) =>
  db.prepare("SELECT is_active FROM owners WHERE id = ?").get(id).is_active;

describe("cascata entre donos e pets", () => {
  let db;
  let ownerId;
  let withPackage;
  let withoutPackage;

  beforeEach(async () => {
    db = await createDatabase();
    ownerId = insertOwner(db);
    withPackage = await createPet(db, {
      name: "Thor",
      owner_id: ownerId,
      reschedule_active: 1,
      package_frequency: 4,
      package_start_date: isoDate(3),
      package_price: 32000,
    });
    withoutPackage = await createPet(db, { name: "Mel", owner_id: ownerId });
  });

  test("desativar o dono desativa os pets dele", () => {
    db.prepare(DEACTIVATE_OWNER_SQL).run(ownerId);

    assert.equal(petRow(db, withPackage.id).is_active, 0);
    assert.equal(petRow(db, withoutPackage.id).is_active, 0);
  });

  test("desativar um pet com pacote desliga o pacote e apaga os automáticos futuros", () => {
    assert.ok(pendingAutoOf(db, withPackage.id).length > 0, "o pet começa com a agenda do pacote");

    db.prepare(DEACTIVATE_PET_SQL).run(withPackage.id);

    const pet = petRow(db, withPackage.id);
    assert.equal(pet.reschedule_active, 0);
    assert.equal(pet.package_start_date, null);
    assert.equal(pet.last_auto_visit_date, null);
    assert.equal(pendingAutoOf(db, withPackage.id).filter((a) => a.date > isoDate(1)).length, 0);
  });

  test("desativar o dono também limpa o pacote dos pets, pelos triggers em cadeia", () => {
    db.prepare(DEACTIVATE_OWNER_SQL).run(ownerId);

    assert.equal(petRow(db, withPackage.id).reschedule_active, 0);
    assert.equal(pendingAutoOf(db, withPackage.id).filter((a) => a.date > isoDate(1)).length, 0);
  });

  test("reativar um pet reativa o dono, e o pacote continua desligado", async () => {
    db.prepare(DEACTIVATE_OWNER_SQL).run(ownerId);

    await activatePet(db, withPackage.id);

    assert.equal(ownerActive(db, ownerId), 1);
    assert.equal(petRow(db, withPackage.id).is_active, 1);
    assert.equal(petRow(db, withPackage.id).reschedule_active, 0);
    assert.equal(pendingAutoOf(db, withPackage.id).length, 0);
    // O outro pet do dono continua desativado: a reativação não volta em cascata.
    assert.equal(petRow(db, withoutPackage.id).is_active, 0);
  });

  test("o pet editado com o pacote ligado enquanto inativo ganha a agenda de hoje em diante ao reativar", async () => {
    db.prepare(DEACTIVATE_PET_SQL).run(withPackage.id);
    // Inativo, a edição só grava o pet: a agenda espera a reativação.
    await savePet(db, { ...withPackage, package_start_date: isoDate(-10) });
    assert.equal(pendingAutoOf(db, withPackage.id).filter((a) => a.date > isoDate(1)).length, 0);

    await activatePet(db, withPackage.id);

    const agenda = pendingAutoOf(db, withPackage.id);
    assert.ok(agenda.length > 0);
    assert.ok(
      agenda.every((a) => a.date >= isoDate(0)),
      "nenhuma data passada é criada",
    );
    assert.equal(petRow(db, withPackage.id).last_auto_visit_date, agenda.at(-1).date);
  });
});
