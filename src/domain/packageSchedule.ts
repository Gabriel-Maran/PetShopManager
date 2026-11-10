// A regra da remarcação automática dos pacotes (ARQ-2), pura: sem SQLite, sem Expo e sem React, para
// rodar igual no app e nos testes do Node. Até a versão 3 do esquema, ela vivia em três triggers SQL;
// desde a versão 4, o PackageScheduleService chama estas funções e grava o resultado numa transação.
// Quem chama passa o "hoje" pronto, no fuso do aparelho (scheduleClockOf). Os imports levam a extensão
// .ts porque o Node dos testes exige.
import type { PacoteRemarcacao } from "../config/petEnums.ts";
import type { Appointment } from "../model/Appointment.ts";
import type { Pet } from "../model/Pet.ts";
import type { Cents } from "../utils/dinheiro.ts";
import {
  addDays,
  monthOf,
  sameWeekdayInNextMonth,
  todayIso,
  weekdayOf,
  type IsoDate,
} from "../utils/datas.ts";

/** Até quantos dias depois de hoje a agenda do pacote é gerada: o PERIODO_REMARCACAO da versão 1. */
export const SCHEDULE_HORIZON_DAYS = 224;

/** Dias entre os atendimentos: o pacote de 2 por mês é a cada 14 dias, e o de 4, a cada 7. */
const GAP_DAYS: Record<PacoteRemarcacao, number> = { 2: 14, 4: 7 };

/** O momento em que a agenda é calculada, no fuso do aparelho. */
export interface ScheduleClock {
  today: IsoDate;
  /** "HH:MM", para saber se o atendimento de hoje já passou. */
  time: string;
}

/** As colunas do pet que a remarcação lê. */
export type PetPackage = Pick<
  Pet,
  | "remarcacao_ativa"
  | "pacote_remarcacao"
  | "data_inicio_pacote"
  | "valor_pacote"
  | "horario_padrao"
  | "servico_padrao"
  | "is_ativo"
  | "ultimo_visita_data_auto"
>;

/** O pacote pronto para a conta. */
export interface PackagePlan {
  visitsPerMonth: PacoteRemarcacao;
  start: IsoDate;
  priceCents: Cents;
}

/** Um atendimento da agenda do pacote, com o valor dele em centavos. */
export interface PackageVisit {
  date: IsoDate;
  cents: Cents;
}

/** Na agenda de um pet novo, o atendimento que já passou entra como manual (auto = false). */
export interface NewPetVisit extends PackageVisit {
  auto: boolean;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** O dia e o horário de `now` no fuso do aparelho. */
export function scheduleClockOf(now: Date): ScheduleClock {
  return { today: todayIso(now), time: `${pad(now.getHours())}:${pad(now.getMinutes())}` };
}

/**
 * O pacote do pet, se a remarcação estiver ligada. Sem data de início, a agenda começa hoje, e sem
 * valor, os atendimentos valem zero, como os triggers faziam.
 */
export function packagePlanOf(pet: PetPackage, today: IsoDate): PackagePlan | null {
  if (pet.remarcacao_ativa !== 1 || pet.pacote_remarcacao == null) return null;
  return {
    visitsPerMonth: pet.pacote_remarcacao,
    start: pet.data_inicio_pacote ?? today,
    priceCents: pet.valor_pacote ?? 0,
  };
}

/**
 * Valor de um atendimento do pacote, em centavos. A sobra da divisão fica com os primeiros do mês
 * (decisão do Gabriel em 2026-11-08): R$ 100,03 em 4 dá 25,01 nos três primeiros e 25,00 no quarto.
 */
export function visitCents(priceCents: Cents, visitsPerMonth: number, positionInMonth: number): Cents {
  const remainder = priceCents % visitsPerMonth;
  return Math.trunc(priceCents / visitsPerMonth) + (positionInMonth <= remainder ? 1 : 0);
}

/**
 * A agenda do pacote, da data de início até o primeiro atendimento depois de hoje + 224 dias: a cada 7
 * ou 14 dias, até o limite do pacote no mês. Atingido o limite, pula para o mês seguinte, no dia da
 * semana do início. Se a soma dos dias já cai no mês seguinte, a contagem do mês recomeça ali.
 */
export function buildPackageSchedule(plan: PackagePlan, today: IsoDate): PackageVisit[] {
  const horizon = addDays(today, SCHEDULE_HORIZON_DAYS);
  const startWeekday = weekdayOf(plan.start);
  const gap = GAP_DAYS[plan.visitsPerMonth];
  const visit = (date: IsoDate, position: number): PackageVisit => ({
    date,
    cents: visitCents(plan.priceCents, plan.visitsPerMonth, position),
  });

  let date = plan.start;
  let position = 1;
  const visits = [visit(date, position)];
  while (date < horizon) {
    if (position >= plan.visitsPerMonth) {
      date = sameWeekdayInNextMonth(date, startWeekday);
      position = 1;
    } else {
      const next = addDays(date, gap);
      position = monthOf(next) === monthOf(date) ? position + 1 : 1;
      date = next;
    }
    visits.push(visit(date, position));
  }
  return visits;
}

/**
 * A agenda de um pet cadastrado com pacote. O que já passou, inclusive o horário de hoje, entra como
 * manual pendente; o resto, como automático. Sem horário, o atendimento de hoje fica automático.
 */
export function scheduleForNewPet(
  plan: PackagePlan,
  clock: ScheduleClock,
  time: string | null | undefined,
): NewPetVisit[] {
  return buildPackageSchedule(plan, clock.today).map((visit) => ({
    ...visit,
    auto: !(visit.date < clock.today || (visit.date === clock.today && time != null && time < clock.time)),
  }));
}

/**
 * A agenda refeita depois de uma edição: só de hoje em diante, e sem os dias em que o pet já tem um
 * atendimento concluído.
 */
export function scheduleFromToday(
  plan: PackagePlan,
  today: IsoDate,
  concludedDates: ReadonlySet<IsoDate>,
): PackageVisit[] {
  return buildPackageSchedule(plan, today).filter(
    (visit) => visit.date >= today && !concludedDates.has(visit.date),
  );
}

/** Os campos que entram na agenda. Mudar outro, como o nome ou a observação, não refaz nada (BUG-4). */
const SCHEDULE_FIELDS = [
  "remarcacao_ativa",
  "pacote_remarcacao",
  "data_inicio_pacote",
  "is_ativo",
  "horario_padrao",
  "servico_padrao",
  "valor_pacote",
] as const satisfies readonly (keyof PetPackage)[];

/**
 * Se a edição do pet refaz a agenda: o pet fica ativo, com o pacote ligado, e mudou de fato um campo
 * que entra nela (decisão do Gabriel em 2026-11-08). O formulário regrava todos os campos, então a
 * comparação é com o valor de antes.
 */
export function shouldRebuildSchedule(before: PetPackage, after: PetPackage): boolean {
  if (after.remarcacao_ativa !== 1 || after.pacote_remarcacao == null || after.is_ativo !== 1) {
    return false;
  }
  return SCHEDULE_FIELDS.some((field) => (before[field] ?? null) !== (after[field] ?? null));
}

/**
 * Se salvar o agendamento conclui um automático. Só a passagem de pendente para concluído conta:
 * salvar de novo um concluído, para marcar como pago, não cria outro (BUG-3).
 */
export function isAutoVisitConclusion(
  before: Pick<Appointment, "concluido">,
  after: Pick<Appointment, "concluido" | "is_auto_agen">,
): boolean {
  return before.concluido === 0 && after.concluido === 1 && after.is_auto_agen === 1;
}

/**
 * A data do próximo automático, criado ao concluir um: soma o intervalo do pacote ao último da agenda
 * ou, se o mês dele já tem o limite de pendentes, pula para o mês seguinte, no dia da semana do
 * atendimento concluído.
 */
export function nextPackageVisitDate(next: {
  /** O último automático pendente (ultimo_visita_data_auto) ou, sem ele, a data do concluído. */
  lastScheduled: IsoDate;
  concludedDate: IsoDate;
  visitsPerMonth: PacoteRemarcacao;
  /** Automáticos pendentes no mês do lastScheduled. */
  pendingInLastScheduledMonth: number;
}): IsoDate {
  if (next.pendingInLastScheduledMonth >= next.visitsPerMonth) {
    return sameWeekdayInNextMonth(next.lastScheduled, weekdayOf(next.concludedDate));
  }
  return addDays(next.lastScheduled, GAP_DAYS[next.visitsPerMonth]);
}
