// A remarcação automática dos pacotes (ARQ-2): grava o pet ou o agendamento e, na mesma transação,
// a agenda que a regra pura (domain/packageSchedule.ts) calcula. Até a versão 3 do esquema, isso
// eram três triggers SQL. Sem depender do Expo: recebe quem abre a conexão, para o app (PetService e
// AppointmentsService) e os testes rodarem o mesmo código. Os imports levam a extensão .ts porque o
// Node dos testes exige.
import { inTransaction } from "../config/migrator.ts";
import {
  isAutoVisitConclusion,
  nextPackageVisitDate,
  packagePlanOf,
  scheduleClockOf,
  scheduleForNewPet,
  scheduleFromToday,
  shouldRebuildSchedule,
  visitCents,
  type PetPackage,
} from "../domain/packageSchedule.ts";
import {
  PackageScheduleRepository,
  type AppointmentState,
  type PetWrite,
  type ScheduleDatabase,
} from "../repository/PackageScheduleRepository.ts";
import type { Appointment } from "../model/Appointment.ts";
import { monthOf, type IsoDate } from "../utils/datas.ts";

export class PackageScheduleService {
  // Campo declarado à parte, e não no construtor, porque o Node dos testes só apaga os tipos.
  private readonly openDatabase: () => Promise<ScheduleDatabase>;

  constructor(openDatabase: () => Promise<ScheduleDatabase>) {
    this.openDatabase = openDatabase;
  }

  /** Cadastra o pet e, com o pacote ligado, gera a agenda desde a data de início. Devolve o id. */
  async createPet(pet: PetWrite, now: Date): Promise<number> {
    let id = 0;
    await this.inTransaction(async (repository) => {
      id = await repository.insertPet(pet);
      const saved = await repository.findPetPackage(id);
      const clock = scheduleClockOf(now);
      const plan = saved && packagePlanOf(saved, clock.today);
      if (!saved || !plan) return;

      const visits = scheduleForNewPet(plan, clock, saved.horario_padrao);
      await repository.insertVisits(
        visits.map((visit) => ({ ...visit, ...defaultVisitOf(id, saved) })),
      );
      await repository.refreshLastAutoVisit(id);
    });
    return id;
  }

  /** Salva o formulário do pet e refaz a agenda se um campo dela mudou de fato (BUG-4). */
  updatePet(id: number, pet: PetWrite, now: Date): Promise<void> {
    return this.changePet(id, now, (repository) => repository.updatePet(id, pet));
  }

  /** Reativa o pet; se ele estava com o pacote ligado, a agenda volta a partir de hoje. */
  activatePet(id: number, now: Date): Promise<void> {
    return this.changePet(id, now, (repository) => repository.activatePet(id));
  }

  /** Salva o agendamento. Concluir um automático cria o próximo da agenda. */
  updateAppointment(id: number, appointment: Appointment): Promise<void> {
    return this.inTransaction(async (repository) => {
      const before = await repository.findAppointmentState(id);
      await repository.updateAppointment(id, appointment);
      const after = await repository.findAppointmentState(id);
      if (before && after && isAutoVisitConclusion(before, after)) {
        await scheduleNextVisit(repository, after);
      }
    });
  }

  // O pet é lido antes e depois de gravar, como o OLD e o NEW do trigger: assim a comparação vale
  // para qualquer comando, inclusive o que só reativa o pet.
  private changePet(
    id: number,
    now: Date,
    write: (repository: PackageScheduleRepository) => Promise<void>,
  ): Promise<void> {
    return this.inTransaction(async (repository) => {
      const before = await repository.findPetPackage(id);
      await write(repository);
      const after = await repository.findPetPackage(id);
      if (before && after && shouldRebuildSchedule(before, after)) {
        await rebuildSchedule(repository, id, after, scheduleClockOf(now).today);
      }
    });
  }

  private async inTransaction(
    work: (repository: PackageScheduleRepository) => Promise<void>,
  ): Promise<void> {
    const db = await this.openDatabase();
    await inTransaction(db, () => work(new PackageScheduleRepository(db)));
  }
}

/** O que todo atendimento gerado pelo pacote leva do pet: serviço e horário padrão, sem táxi dog. */
const defaultVisitOf = (petId: number, pet: PetPackage) => ({
  petId,
  service: pet.servico_padrao,
  time: pet.horario_padrao,
  deliverPet: 0,
  notes: null,
});

/**
 * Apaga os automáticos pendentes de hoje em diante e gera a agenda de novo, só a partir de hoje. O
 * que já passou e os concluídos ficam como estão.
 */
async function rebuildSchedule(
  repository: PackageScheduleRepository,
  petId: number,
  pet: PetPackage,
  today: IsoDate,
): Promise<void> {
  const plan = packagePlanOf(pet, today);
  if (!plan) return;
  await repository.deletePendingAutoFrom(petId, today);
  const concludedDates = await repository.concludedDatesFrom(petId, today);
  const visits = scheduleFromToday(plan, today, concludedDates);
  await repository.insertVisits(
    visits.map((visit) => ({ ...visit, ...defaultVisitOf(petId, pet), auto: true })),
  );
  await repository.refreshLastAutoVisit(petId);
}

/**
 * Cria o próximo automático depois do último da agenda, com o serviço, o táxi dog e a observação do
 * concluído. Só para o pet ativo com o pacote ligado.
 */
async function scheduleNextVisit(
  repository: PackageScheduleRepository,
  concluded: AppointmentState,
): Promise<void> {
  const petId = concluded.pet_id;
  const pet = await repository.findPetPackage(petId);
  if (!pet || pet.is_ativo !== 1 || pet.remarcacao_ativa !== 1) return;

  const visitsPerMonth = pet.pacote_remarcacao;
  if (visitsPerMonth != null) {
    const lastScheduled = pet.ultimo_visita_data_auto ?? concluded.data;
    const date = nextPackageVisitDate({
      lastScheduled,
      concludedDate: concluded.data,
      visitsPerMonth,
      pendingInLastScheduledMonth: await repository.countPendingAutoInMonth(petId, monthOf(lastScheduled)),
    });
    const positionInMonth = 1 + (await repository.countAutoInMonth(petId, monthOf(date)));
    await repository.insertVisits([
      {
        petId,
        service: concluded.servico,
        date,
        time: pet.horario_padrao,
        deliverPet: concluded.entregar_pet,
        notes: concluded.observacao,
        auto: true,
        cents: visitCents(pet.valor_pacote ?? 0, visitsPerMonth, positionInMonth),
      },
    ]);
  }
  await repository.refreshLastAutoVisit(petId);
}
