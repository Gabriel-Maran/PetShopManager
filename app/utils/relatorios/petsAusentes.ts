import { getDatabase } from "../../config/database";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PetAusenteItem extends BarChartItem {
  // x = "NomePet · NomeDono"   y = dias ausente
  petId: number;
  dono_telefone: string;
  ultima_visita: number | null; // YYYYMMDD ou null (nunca veio)
}

// ─── Helper SQL ───────────────────────────────────────────────────────────────

// Converte coluna YYYYMMDD inteiro → 'YYYY-MM-DD' para julianday()
// COALESCE: se nunca veio (current_ultima_visita_data IS NULL), usa criado_em
const SQL_DIAS_AUSENTE = `
  MAX(0, CAST(
    julianday('now') - julianday(printf('%04d-%02d-%02d',
      COALESCE(p.current_ultima_visita_data, p.criado_em) / 10000,
      (COALESCE(p.current_ultima_visita_data, p.criado_em) / 100) % 100,
      COALESCE(p.current_ultima_visita_data, p.criado_em) % 100
    ))
  AS INTEGER))
`;

// ─── Privado ──────────────────────────────────────────────────────────────────

async function fetchPetsAusentes(
  remarcacaoAtiva: 0 | 1,
  limite: number,
): Promise<PetAusenteItem[]> {
  const db = await getDatabase();

  // Índice usado: idx_pets_ausentes (remarcacao_ativa, is_ativo, current_ultima_visita_data)
  // ORDER BY no inteiro YYYYMMDD direto → aproveita o índice, zero conversão no sort
  const rows = await db.getAllAsync<{
    pet_id: number;
    label: string;
    dias_ausente: number;
    ultima_visita: number | null;
    dono_telefone: string;
  }>(
    `SELECT
      p.id                                                    AS pet_id,
      substr(p.nome, 1, 10) || ' · ' || substr(o.nome, 1, 8)  AS label,
      ${SQL_DIAS_AUSENTE}                                     AS dias_ausente,
      p.current_ultima_visita_data                            AS ultima_visita,
      o.telefone                                              AS dono_telefone
    FROM pets p
    JOIN owners o ON o.id = p.dono_id
    WHERE p.remarcacao_ativa = ?
      AND p.is_ativo = 1
    ORDER BY p.current_ultima_visita_data ASC
    LIMIT ?`,
    [remarcacaoAtiva, limite],
  );

  return rows.map((r) => ({
    x: r.label,
    y: r.dias_ausente,
    petId: r.pet_id,
    dono_telefone: r.dono_telefone,
    ultima_visita: r.ultima_visita,
  }));
}

// ─── Funções públicas ─────────────────────────────────────────────────────────

/** Top pets SEM remarcação automática há mais tempo sem visita */
export async function petsAusentesSemRemarcacao(
  limite = 30,
): Promise<PetAusenteItem[]> {
  return fetchPetsAusentes(0, limite);
}

/** Top pets COM remarcação automática há mais tempo sem visita
 *  (detecta quem deveria estar vindo mas não está aparecendo) */
export async function petsAusentesComRemarcacao(
  limite = 30,
): Promise<PetAusenteItem[]> {
  return fetchPetsAusentes(1, limite);
}
