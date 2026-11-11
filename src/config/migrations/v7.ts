// Versão 7 do esquema: tabelas, colunas e códigos em inglês (NOMES-1) e o tema na tabela de
// preferências (P19).
//
// - As tabelas race, service_type e configs viram breeds, services e settings. Cada coluna ganha o
//   nome em inglês, igual ao campo do modelo (model/), e as listas de apoio passam a usar `name`.
// - Os códigos gravados de espécie e porte também vão para o inglês: CAO, GATO e OUTRO viram DOG, CAT e
//   OTHER; PEQUENO, MEDIO, GRANDE e GRANDAO viram SMALL, MEDIUM, LARGE e EXTRA_LARGE. As telas mostram
//   os rótulos de petEnums.ts, então nada muda para o usuário.
// - A configs (id, config, is_ativo) vira a settings (key, value). O tema escuro ligado vira
//   ('theme', 'dark'); desligado, não entra nada, e o app segue o tema do sistema até o usuário
//   escolher (P19).
// - Os ids e a contagem de ids (sqlite_sequence) são mantidos. Os índices e os triggers voltam com os
//   nomes novos e a mesma regra da versão 6. Um backup antigo passa por esta mesma migração.
//
// Como as versões anteriores, esta traz o texto inteiro do que cria. As chaves estrangeiras ficam
// desligadas durante as migrações (migrator.ts).
import type { Migration } from "../migrator";

/**
 * Troca a tabela `from` pela `to`, com as colunas de `columns` (nova: expressão sobre a antiga). A
 * contagem de ids passa para a tabela nova, para um id apagado não voltar a ser usado.
 */
function rebuildTable(
  from: string,
  to: string,
  definition: string,
  columns: Readonly<Record<string, string>>,
): string {
  const next = `${to}_v7`;
  return `
    CREATE TABLE ${next} (${definition});
    INSERT INTO ${next} (${Object.keys(columns).join(", ")})
      SELECT ${Object.values(columns).join(", ")} FROM ${from};
    DELETE FROM sqlite_sequence WHERE name = '${next}';
    UPDATE sqlite_sequence SET name = '${next}' WHERE name = '${from}';
    DROP TABLE ${from};
    ALTER TABLE ${next} RENAME TO ${to};
  `;
}

const TODAY = `date('now', 'localtime')`;

const isHourMinute = (column: string) =>
  `(${column} GLOB '[01][0-9]:[0-5][0-9]' OR ${column} GLOB '2[0-3]:[0-5][0-9]')`;

const codeFrom = (column: string, codes: Readonly<Record<string, string>>) =>
  `CASE ${column} ${Object.entries(codes)
    .map(([old, code]) => `WHEN '${old}' THEN '${code}'`)
    .join(" ")} ELSE ${column} END`;

const SPECIES_CODES = { CAO: "DOG", GATO: "CAT", OUTRO: "OTHER" };
const SIZE_CODES = { PEQUENO: "SMALL", MEDIO: "MEDIUM", GRANDE: "LARGE", GRANDAO: "EXTRA_LARGE" };

// Os triggers saem antes das tabelas, como na versão 6: o SQLite recusa renomear uma tabela enquanto
// um trigger cita outra que está sendo trocada.
export const SQL_DROP_TRIGGERS_V7 = `
  DROP TRIGGER IF EXISTS trg_ultima_visita;
  DROP TRIGGER IF EXISTS trg_pet_remarcacao_desativar;
  DROP TRIGGER IF EXISTS trg_owner_desativar_pets;
  DROP TRIGGER IF EXISTS trg_pet_ativar_owner;
  DROP TRIGGER IF EXISTS trg_pet_desativar_limpar_remarcacao;
`;

export const SQL_SETTINGS_V7 = `
  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    CHECK (key <> 'theme' OR value IN ('light', 'dark'))
  );
  INSERT INTO settings (key, value)
    SELECT 'theme', 'dark' FROM configs WHERE config = 'Modo Escuro' AND is_ativo = 1;
  DELETE FROM sqlite_sequence WHERE name = 'configs';
  DROP TABLE configs;
`;

export const SQL_REBUILD_SERVICES_V7 = rebuildTable(
  "service_type",
  "services",
  `
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
  `,
  { id: "id", name: "servico", is_active: "is_ativo" },
);

export const SQL_REBUILD_PAYMENT_METHODS_V7 = rebuildTable(
  "payment_methods",
  "payment_methods",
  `
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL UNIQUE,
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1))
  `,
  { id: "id", name: "tipo_pgto", is_active: "is_ativo" },
);

export const SQL_REBUILD_SPECIES_V7 = rebuildTable(
  "species",
  "species",
  `
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
  `,
  { id: "id", name: codeFrom("nome", SPECIES_CODES) },
);

export const SQL_REBUILD_BREEDS_V7 = rebuildTable(
  "race",
  "breeds",
  `
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    species_id      INTEGER NOT NULL,
    name            TEXT    NOT NULL,
    normalized_name TEXT    NOT NULL,
    FOREIGN KEY (species_id) REFERENCES species(id) ON DELETE CASCADE,
    UNIQUE (species_id, name)
  `,
  {
    id: "id",
    species_id: "especie_id",
    name: "nome_raca",
    normalized_name: "nome_raca_normalized",
  },
);

export const SQL_REBUILD_OWNERS_V7 = rebuildTable(
  "owners",
  "owners",
  `
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    normalized_name TEXT    NOT NULL DEFAULT '',
    phone           TEXT    NOT NULL,
    email           TEXT,
    address         TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at      TEXT    NOT NULL DEFAULT (${TODAY})
  `,
  {
    id: "id",
    name: "nome",
    normalized_name: "nome_normalizado",
    phone: "telefone",
    email: "email",
    address: "endereco",
    is_active: "is_ativo",
    created_at: "criado_em",
  },
);

export const SQL_REBUILD_PETS_V7 = rebuildTable(
  "pets",
  "pets",
  `
    id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    name                 TEXT    NOT NULL,
    normalized_name      TEXT    NOT NULL DEFAULT '',
    species_id           INTEGER NOT NULL,
    size                 TEXT    NOT NULL CHECK (size IN ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE')),
    breed_id             INTEGER NOT NULL,
    notes                TEXT,
    owner_id             INTEGER NOT NULL,
    default_service_id   INTEGER NOT NULL,
    reschedule_active    INTEGER NOT NULL DEFAULT 0 CHECK (reschedule_active IN (0, 1)),
    package_frequency    INTEGER CHECK (package_frequency IN (2, 4)),
    package_price        INTEGER DEFAULT 0 CHECK (package_price >= 0),
    package_start_date   TEXT,
    default_time         TEXT    NOT NULL DEFAULT '00:00' CHECK ${isHourMinute("default_time")},
    last_visit_date      TEXT,
    last_auto_visit_date TEXT,
    is_active            INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at           TEXT    NOT NULL DEFAULT (${TODAY}),
    FOREIGN KEY (owner_id)           REFERENCES owners(id)   ON DELETE CASCADE,
    FOREIGN KEY (species_id)         REFERENCES species(id)  ON DELETE RESTRICT,
    FOREIGN KEY (breed_id)           REFERENCES breeds(id)   ON DELETE RESTRICT,
    FOREIGN KEY (default_service_id) REFERENCES services(id) ON DELETE RESTRICT
  `,
  {
    id: "id",
    name: "nome",
    normalized_name: "nome_normalizado",
    species_id: "especie",
    size: codeFrom("porte", SIZE_CODES),
    breed_id: "raca",
    notes: "observacoes",
    owner_id: "dono_id",
    default_service_id: "servico_padrao_id",
    reschedule_active: "remarcacao_ativa",
    package_frequency: "pacote_remarcacao",
    package_price: "valor_pacote",
    package_start_date: "data_inicio_pacote",
    default_time: "horario_padrao",
    last_visit_date: "current_ultima_visita_data",
    last_auto_visit_date: "ultimo_visita_data_auto",
    is_active: "is_ativo",
    created_at: "criado_em",
  },
);

export const SQL_REBUILD_APPOINTMENTS_V7 = rebuildTable(
  "appointments",
  "appointments",
  `
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    pet_id              INTEGER NOT NULL,
    service_id          INTEGER NOT NULL,
    service_name        TEXT    NOT NULL CHECK (trim(service_name) <> ''),
    date                TEXT    NOT NULL,
    time                TEXT    NOT NULL DEFAULT '00:00' CHECK ${isHourMinute("time")},
    weekday             INTEGER GENERATED ALWAYS AS (CAST(strftime('%w', date) AS INTEGER)) VIRTUAL,
    deliver_pet         INTEGER NOT NULL DEFAULT 0 CHECK (deliver_pet IN (0, 1)),
    completed           INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    notes               TEXT,
    is_auto             INTEGER NOT NULL DEFAULT 0 CHECK (is_auto IN (0, 1)),
    price               INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    payment_method_id   INTEGER,
    payment_method_name TEXT,
    is_paid             INTEGER NOT NULL DEFAULT 0 CHECK (is_paid IN (0, 1)),
    created_at          TEXT    NOT NULL DEFAULT (${TODAY}),
    CHECK ((payment_method_id IS NULL) = (payment_method_name IS NULL)),
    FOREIGN KEY (pet_id)            REFERENCES pets(id)            ON DELETE CASCADE,
    FOREIGN KEY (service_id)        REFERENCES services(id)        ON DELETE RESTRICT,
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE RESTRICT
  `,
  {
    id: "id",
    pet_id: "pet_id",
    service_id: "servico_id",
    service_name: "servico_nome",
    date: "data",
    time: "hora",
    deliver_pet: "entregar_pet",
    completed: "concluido",
    notes: "observacao",
    is_auto: "is_auto_agen",
    price: "valor",
    payment_method_id: "tipo_pgto_id",
    payment_method_name: "tipo_pgto_nome",
    is_paid: "ta_pago",
    created_at: "criado_em",
  },
);

// Os mesmos índices da versão 6, com os nomes novos. Os UNIQUE de nome das listas já estão nas tabelas.
export const SQL_CREATE_INDEXES_V7 = `
  CREATE INDEX idx_owners_normalized_name ON owners (normalized_name);
  CREATE INDEX idx_pets_normalized_name ON pets (normalized_name);
  CREATE INDEX idx_pets_owner_id ON pets (owner_id);
  CREATE INDEX idx_pets_absent ON pets (reschedule_active, is_active, last_visit_date);
  CREATE INDEX idx_appointments_pet_date ON appointments (pet_id, date);
  CREATE INDEX idx_appointments_pending_auto ON appointments (pet_id, is_auto, completed, date);
  CREATE INDEX idx_appointments_date_completed ON appointments (date, completed);
  CREATE INDEX idx_appointments_completed_date ON appointments (completed, date);
  CREATE INDEX idx_appointments_auto ON appointments (completed, is_auto);
  CREATE INDEX idx_appointments_hour ON appointments (completed, CAST(substr(time, 1, 2) AS INTEGER));
  CREATE INDEX idx_appointments_weekday ON appointments (completed, weekday);
`;

// A mesma regra dos triggers da versão 6, com os nomes novos.
export const SQL_TRIGGERS_V7 = `
  CREATE TRIGGER trg_pet_reschedule_off
    AFTER UPDATE OF reschedule_active ON pets
    FOR EACH ROW
    WHEN OLD.reschedule_active = 1 AND NEW.reschedule_active = 0
    BEGIN
      DELETE FROM appointments
      WHERE pet_id = NEW.id AND is_auto = 1 AND completed = 0 AND date > ${TODAY};
    END;

  CREATE TRIGGER trg_owner_deactivate_pets
    AFTER UPDATE OF is_active ON owners
    FOR EACH ROW
    WHEN NEW.is_active = 0
    BEGIN
      UPDATE pets SET is_active = 0 WHERE owner_id = NEW.id;
    END;

  CREATE TRIGGER trg_pet_activate_owner
    AFTER UPDATE OF is_active ON pets
    FOR EACH ROW
    WHEN NEW.is_active = 1
    BEGIN
      UPDATE owners SET is_active = 1 WHERE id = NEW.owner_id AND is_active = 0;
    END;

  CREATE TRIGGER trg_pet_deactivate_clear_package
    AFTER UPDATE OF is_active ON pets
    FOR EACH ROW
    WHEN OLD.is_active = 1 AND NEW.is_active = 0
    BEGIN
      DELETE FROM appointments
      WHERE pet_id = NEW.id AND is_auto = 1 AND completed = 0 AND date > ${TODAY};

      UPDATE pets
      SET package_start_date = NULL, last_auto_visit_date = NULL, reschedule_active = 0
      WHERE id = NEW.id;
    END;

  CREATE TRIGGER trg_last_visit
    AFTER UPDATE OF completed ON appointments
    FOR EACH ROW
    WHEN OLD.completed = 0 AND NEW.completed = 1
    BEGIN
      UPDATE pets SET last_visit_date = NEW.date WHERE id = NEW.pet_id;
    END;
`;

export const V7: Migration = {
  version: 7,
  statements: [
    SQL_DROP_TRIGGERS_V7,
    SQL_SETTINGS_V7,
    SQL_REBUILD_SERVICES_V7,
    SQL_REBUILD_PAYMENT_METHODS_V7,
    SQL_REBUILD_SPECIES_V7,
    SQL_REBUILD_BREEDS_V7,
    SQL_REBUILD_OWNERS_V7,
    SQL_REBUILD_PETS_V7,
    SQL_REBUILD_APPOINTMENTS_V7,
    SQL_CREATE_INDEXES_V7,
    SQL_TRIGGERS_V7,
  ],
};
