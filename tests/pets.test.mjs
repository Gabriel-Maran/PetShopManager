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
      nome: "Thor", dono_id: insertOwner(db), remarcacao_ativa: 1, pacote_remarcacao: 4,
      data_inicio_pacote: isoDate(3), valor_pacote: 32000,
    });
  });

  test("traz as colunas do modelo Pet, sem o nome normalizado da busca", () => {
    const row = db.prepare(FIND_PET_SQL).get(pet.id);

    assert.deepEqual(Object.keys(row).sort(), [
      "criado_em", "current_ultima_visita_data", "data_inicio_pacote", "dono_id", "especie",
      "horario_padrao", "id", "is_ativo", "nome", "observacoes", "pacote_remarcacao", "porte", "raca",
      "remarcacao_ativa", "servico_padrao", "ultimo_visita_data_auto", "valor_pacote",
    ]);
    assert.equal(row.nome, "Thor");
    assert.equal(row.valor_pacote, 32000);
  });

  test("id que não existe, inclusive texto malicioso, não traz nada", () => {
    for (const id of [999999, -1, "1 OR 1=1", "1; DROP TABLE pets"]) {
      assert.equal(db.prepare(FIND_PET_SQL).get(id), undefined, String(id));
    }
    assert.ok(db.prepare(FIND_PET_SQL).get(pet.id), "a tabela continua lá");
  });
});
