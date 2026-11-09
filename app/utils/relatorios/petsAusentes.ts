import { getDatabase } from "../../config/database";
import { PETS_AUSENTES_SQL } from "../../repository/sql/relatoriosSql";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";
import { type IsoDate, todayIso } from "../datas";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface PetAusenteItem extends BarChartItem {
  // x = "NomePet · NomeDono"   y = dias ausente
  petId: number;
  dono_telefone: string;
  ultima_visita: IsoDate | null; // null: nunca veio
}

// ─── Privado ──────────────────────────────────────────────────────────────────

async function fetchPetsAusentes(
  remarcacaoAtiva: 0 | 1,
  limite: number,
): Promise<PetAusenteItem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    pet_id: number;
    label: string;
    dias_ausente: number;
    ultima_visita: IsoDate | null;
    dono_telefone: string;
  }>(PETS_AUSENTES_SQL, [todayIso(), remarcacaoAtiva, limite]);

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
