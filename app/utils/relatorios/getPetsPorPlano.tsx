import { PlanoItem } from "../../config/consts";
import { getDatabase } from "../../config/database";
import { BarChartItem } from "../../view/components/Relatorios/BarChart";

/**
 * Retorna a contagem de pets ativos por plano de remarcação.
 * Sempre retorna os dois planos (y = 0 se nenhum pet naquele plano).
 *
 * Usa: idx_pets_ausentes (remarcacao_ativa, is_ativo, current_ultima_visita_data)
 * → filtra por remarcacao_ativa + is_ativo sem tocar nas linhas
 */
export async function getPlanosAtivos(): Promise<PlanoItem[]> {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    pacote_remarcacao: number;
    total: number;
  }>(`
    SELECT pacote_remarcacao, COUNT(*) AS total
    FROM pets
    WHERE remarcacao_ativa = 1
      AND is_ativo = 1
      AND pacote_remarcacao IS NOT NULL
    GROUP BY pacote_remarcacao
    ORDER BY pacote_remarcacao ASC
  `);

  const mapa = new Map(rows.map((r) => [r.pacote_remarcacao, r.total]));

  return [
    { x: "Quinzenal\n(2x/mês)", y: mapa.get(2) ?? 0, pacote: 2 },
    { x: "Semanal\n(4x/mês)", y: mapa.get(4) ?? 0, pacote: 4 },
  ];
}

export interface PetPlanoDetalhe {
  petId: number;
  petNome: string;
  donoNome: string;
  donoTelefone: string;
  pacote: 2 | 4;
  dataInicio: number; // YYYYMMDD
  ultimaVisita: number | null; // YYYYMMDD ou null
}

/**
 * Retorna a lista completa de pets ativos em planos de remarcação.
 * Útil para exibir abaixo do gráfico ou em uma tela de detalhe.
 *
 * @param pacote  2 = quinzenal | 4 = semanal | undefined = ambos
 */
export async function getPetsPorPlano(
  pacote?: 2 | 4,
): Promise<PetPlanoDetalhe[]> {
  const db = await getDatabase();

  const filtroPlano =
    pacote != null ? `AND p.pacote_remarcacao = ${pacote}` : "";

  const rows = await db.getAllAsync<{
    pet_id: number;
    pet_nome: string;
    dono_nome: string;
    dono_telefone: string;
    pacote: number;
    data_inicio: number;
    ultima_visita: number | null;
  }>(`
    SELECT
      p.id                          AS pet_id,
      p.nome                        AS pet_nome,
      o.nome                        AS dono_nome,
      o.telefone                    AS dono_telefone,
      p.pacote_remarcacao           AS pacote,
      p.data_inicio_pacote          AS data_inicio,
      p.current_ultima_visita_data  AS ultima_visita
    FROM pets p
    JOIN owners o ON o.id = p.dono_id
    WHERE p.remarcacao_ativa = 1
      AND p.is_ativo = 1
      AND p.pacote_remarcacao IS NOT NULL
      ${filtroPlano}
    ORDER BY p.pacote_remarcacao ASC, p.nome ASC
  `);

  return rows.map((r) => ({
    petId: r.pet_id,
    petNome: r.pet_nome,
    donoNome: r.dono_nome,
    donoTelefone: r.dono_telefone,
    pacote: r.pacote as 2 | 4,
    dataInicio: r.data_inicio,
    ultimaVisita: r.ultima_visita,
  }));
}
