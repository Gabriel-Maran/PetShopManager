// Dados de exemplo para conhecer o app sem expor clientes reais: donos, pets, pacotes e
// agendamentos inventados, com datas em torno de hoje, para o calendário e os relatórios terem
// movimento. Os telefones são fictícios, e os e-mails usam o example.com, domínio reservado para
// exemplos. O módulo não importa nada do app, para os testes rodarem o SQL num SQLite em memória.

// Os mesmos valores de petEnums.ts (TipoServico, EspeciesAtendidas e PorteAnimal).
type ServiceName = "Banho" | "Banho e Tosa" | "Banho e Higiênica";
type Species = "CAO" | "GATO";
type Size = "PEQUENO" | "MEDIO" | "GRANDE";

interface DemoOwner {
  name: string;
  address: string;
  active: boolean;
}

interface DemoPackage {
  visitsPerMonth: 2 | 4;
  /** Valor do pacote em centavos. */
  price: number;
  startDaysAgo: number;
  time: string;
}

interface DemoPet {
  name: string;
  species: Species;
  race: string;
  size: Size;
  /** Posição do dono em DEMO_OWNERS. */
  owner: number;
  service: ServiceName;
  notes: string;
  /** Com pacote, a agenda vem do trigger de remarcação. Sem ele, do histórico abaixo. */
  pkg?: DemoPackage;
  lastVisitDaysAgo?: number;
  everyDays?: number;
  active?: boolean;
}

interface DemoVisit {
  pet: string;
  daysFromToday: number;
  time: string;
  taxiDog?: boolean;
}

const DEMO_OWNERS: DemoOwner[] = [
  { name: "João Silva", address: "Rua das Acácias, 100", active: true },
  { name: "Maria Oliveira", address: "Rua dos Ipês, 215", active: true },
  { name: "Carlos Souza", address: "Av. Brasil, 1450", active: true },
  { name: "Fernanda Lima", address: "Rua Paraná, 87", active: true },
  { name: "Lucas Pereira", address: "Rua das Flores, 45", active: true },
  { name: "Juliana Costa", address: "Rua Goiás, 330", active: true },
  { name: "Ricardo Alves", address: "Av. Central, 500", active: true },
  { name: "Patrícia Gomes", address: "Rua Bahia, 712", active: true },
  { name: "André Martins", address: "Rua Minas Gerais, 58", active: true },
  { name: "Camila Rocha", address: "Alameda dos Pinheiros, 10", active: true },
  { name: "Roberto Mendes", address: "Rua Santa Catarina, 941", active: true },
  { name: "Larissa Freitas", address: "Rua das Palmeiras, 23", active: true },
  { name: "Thiago Ribeiro", address: "Av. das Américas, 1200", active: true },
  { name: "Aline Barbosa", address: "Rua São Paulo, 66", active: true },
  { name: "Marcelo Dias", address: "Rua Rio Grande, 402", active: true },
  { name: "Vanessa Teixeira", address: "Rua das Orquídeas, 19", active: true },
  { name: "Eduardo Nunes", address: "Rua Amazonas, 870", active: true },
  { name: "Bruna Castro", address: "Rua Pernambuco, 31", active: true },
  { name: "Felipe Cardoso", address: "Av. Paraná, 2050", active: true },
  { name: "Tatiane Moraes", address: "Rua Ceará, 154", active: true },
  // Um dono desativado, com o pet dele, para a lista mostrar os dois estados.
  { name: "Renata Vieira", address: "Rua Acre, 9", active: false },
];

const DEMO_PETS: DemoPet[] = [
  // Pets com pacote: o trigger gera a agenda, passada e futura.
  { name: "Thor", species: "CAO", race: "Labrador Retriever", size: "GRANDE", owner: 0, service: "Banho e Tosa", notes: "Muito ativo", pkg: { visitsPerMonth: 4, price: 32000, startDaysAgo: 42, time: "08:00" } },
  { name: "Mel", species: "CAO", race: "Vira-lata (SRD)", size: "PEQUENO", owner: 2, service: "Banho", notes: "Dócil", pkg: { visitsPerMonth: 2, price: 16000, startDaysAgo: 56, time: "09:00" } },
  { name: "Max", species: "CAO", race: "Poodle", size: "MEDIO", owner: 5, service: "Banho e Tosa", notes: "Late bastante", pkg: { visitsPerMonth: 4, price: 28000, startDaysAgo: 35, time: "10:00" } },
  { name: "Toby", species: "CAO", race: "Shih Tzu", size: "MEDIO", owner: 8, service: "Banho e Tosa", notes: "Muito energético", pkg: { visitsPerMonth: 2, price: 20000, startDaysAgo: 49, time: "14:00" } },
  { name: "Julie", species: "CAO", race: "Yorkshire Terrier", size: "PEQUENO", owner: 11, service: "Banho", notes: "Sensível ao secador", pkg: { visitsPerMonth: 4, price: 24000, startDaysAgo: 28, time: "09:30" } },
  { name: "Rex", species: "CAO", race: "Golden Retriever", size: "GRANDE", owner: 13, service: "Banho e Tosa", notes: "Muito forte", pkg: { visitsPerMonth: 2, price: 36000, startDaysAgo: 63, time: "15:00" } },
  { name: "Teddy", species: "CAO", race: "Spitz Alemão (Lulu)", size: "PEQUENO", owner: 16, service: "Banho e Tosa", notes: "Pelo embaraça fácil", pkg: { visitsPerMonth: 4, price: 24000, startDaysAgo: 21, time: "11:00" } },
  { name: "Zeus", species: "CAO", race: "Border Collie", size: "GRANDE", owner: 18, service: "Banho e Higiênica", notes: "Obediente", pkg: { visitsPerMonth: 2, price: 38000, startDaysAgo: 70, time: "16:00" } },

  // Pets sem pacote: histórico de visitas a cada everyDays, a última há lastVisitDaysAgo dias.
  // Os que estão há mais de 40 dias sem vir aparecem no relatório de pets ausentes.
  { name: "Luna", species: "GATO", race: "Persa", size: "PEQUENO", owner: 1, service: "Banho", notes: "Assustada", lastVisitDaysAgo: 12, everyDays: 28 },
  { name: "Bob", species: "CAO", race: "Labrador Retriever", size: "GRANDE", owner: 3, service: "Banho e Higiênica", notes: "Agitado", lastVisitDaysAgo: 6, everyDays: 21 },
  { name: "Nina", species: "GATO", race: "Siamês", size: "PEQUENO", owner: 4, service: "Banho", notes: "Calma", lastVisitDaysAgo: 48, everyDays: 30 },
  { name: "Bella", species: "CAO", race: "Vira-lata (SRD)", size: "PEQUENO", owner: 6, service: "Banho", notes: "Precisa cortar as unhas", lastVisitDaysAgo: 3, everyDays: 14 },
  { name: "Simba", species: "GATO", race: "Persa", size: "PEQUENO", owner: 7, service: "Banho", notes: "Arisco", lastVisitDaysAgo: 65, everyDays: 35 },
  { name: "Mia", species: "GATO", race: "Siamês", size: "PEQUENO", owner: 9, service: "Banho", notes: "Quietinha", lastVisitDaysAgo: 20, everyDays: 30 },
  { name: "Fred", species: "CAO", race: "Labrador Retriever", size: "GRANDE", owner: 10, service: "Banho e Higiênica", notes: "Amigável", lastVisitDaysAgo: 9, everyDays: 21 },
  { name: "Oliver", species: "GATO", race: "Maine Coon", size: "MEDIO", owner: 12, service: "Banho", notes: "Gosta de colo", lastVisitDaysAgo: 33, everyDays: 35 },
  { name: "Lola", species: "CAO", race: "Pug", size: "PEQUENO", owner: 14, service: "Banho", notes: "Boazinha", lastVisitDaysAgo: 5, everyDays: 14 },
  { name: "Pandora", species: "GATO", race: "Ragdoll", size: "MEDIO", owner: 15, service: "Banho", notes: "Pelagem longa", lastVisitDaysAgo: 15, everyDays: 28 },
  { name: "Spike", species: "CAO", race: "Pinscher", size: "PEQUENO", owner: 17, service: "Banho e Higiênica", notes: "Corre muito", lastVisitDaysAgo: 80, everyDays: 30 },
  { name: "Kiara", species: "GATO", race: "Angorá", size: "PEQUENO", owner: 19, service: "Banho", notes: "Muito dócil", lastVisitDaysAgo: 2, everyDays: 21 },
  { name: "Amora", species: "CAO", race: "Bulldog Francês", size: "PEQUENO", owner: 0, service: "Banho", notes: "Filhote", lastVisitDaysAgo: 10, everyDays: 21 },
  { name: "Apollo", species: "CAO", race: "Golden Retriever", size: "GRANDE", owner: 2, service: "Banho e Tosa", notes: "Gosta de brincar com bola", lastVisitDaysAgo: 18, everyDays: 28 },
  { name: "Cacau", species: "CAO", race: "Basset Hound", size: "MEDIO", owner: 5, service: "Banho", notes: "Pele sensível, usar xampu neutro", lastVisitDaysAgo: 7, everyDays: 21 },
  { name: "Duke", species: "CAO", race: "Pitbull", size: "GRANDE", owner: 8, service: "Banho e Higiênica", notes: "Puxa muito a guia", lastVisitDaysAgo: 44, everyDays: 30 },
  { name: "Chico", species: "GATO", race: "Bengal", size: "PEQUENO", owner: 13, service: "Banho", notes: "Dorme muito", lastVisitDaysAgo: 25, everyDays: 35 },
  { name: "Kronos", species: "CAO", race: "Chow Chow", size: "GRANDE", owner: 20, service: "Banho", notes: "Idoso, precisa de paciência", lastVisitDaysAgo: 120, everyDays: 30, active: false },
];

// Agendamentos avulsos de hoje e dos próximos dias, além do histórico e dos pacotes.
const DEMO_UPCOMING: DemoVisit[] = [
  { pet: "Bob", daysFromToday: 0, time: "08:30" },
  { pet: "Kiara", daysFromToday: 0, time: "10:00" },
  { pet: "Fred", daysFromToday: 0, time: "13:30", taxiDog: true },
  { pet: "Mia", daysFromToday: 0, time: "15:00" },
  { pet: "Pandora", daysFromToday: 0, time: "16:30" },
  { pet: "Luna", daysFromToday: 2, time: "09:00" },
  { pet: "Nina", daysFromToday: 3, time: "10:30" },
  { pet: "Oliver", daysFromToday: 4, time: "14:00" },
  { pet: "Spike", daysFromToday: 6, time: "08:30", taxiDog: true },
  { pet: "Cacau", daysFromToday: 8, time: "11:00" },
  { pet: "Duke", daysFromToday: 9, time: "15:30" },
  { pet: "Amora", daysFromToday: 11, time: "09:30" },
  { pet: "Chico", daysFromToday: 13, time: "16:00" },
];

/** Até quantos dias para trás o histórico dos pets sem pacote começa. */
const HISTORY_DAYS = 180;

// Preço de cada serviço, em centavos.
const SERVICE_PRICE: Record<ServiceName, number> = {
  Banho: 6000,
  "Banho e Tosa": 9500,
  "Banho e Higiênica": 7500,
};

// Os nomes de payment_methods, que o agendamento grava como texto.
const PAYMENT_METHODS = ["PIX", "Cartão de Débito", "Dinheiro", "Cartão de Crédito"];

// Horários do histórico. A ordem fixa espalha as visitas pelo dia sem precisar de sorteio.
const HISTORY_TIMES = ["08:00", "09:00", "10:30", "14:00", "08:30", "11:00", "15:30", "09:30", "16:30", "13:30"];

// O app está vazio quando não tem nenhum dono, pet ou agendamento. As tabelas de apoio (serviços,
// espécies, raças) não contam, porque já vêm preenchidas desde a primeira abertura.
export const COUNT_USER_DATA_SQL = `
  SELECT (SELECT COUNT(*) FROM owners)
       + (SELECT COUNT(*) FROM pets)
       + (SELECT COUNT(*) FROM appointments) AS total
`;

export const DEMO_DATA_SUMMARY = {
  owners: DEMO_OWNERS.length,
  pets: DEMO_PETS.length,
  packages: DEMO_PETS.filter((pet) => pet.pkg).length,
};

interface DemoDataOptions {
  /** O dia que vira "hoje" nos dados. */
  today: Date;
  /** A mesma normalização dos cadastros (normalizeForSearch), para a busca por nome funcionar. */
  normalize: (value: string) => string;
}

/** Monta o SQL que preenche o app vazio. Roda numa transação só, dentro do DemoDataService. */
export function buildDemoDataSql({ today, normalize }: DemoDataOptions): string {
  const todayDate = text(toIsoDate(today));
  const nowTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
  const phoneOf = (ownerIndex: number) => `(44) 99911-${1111 + ownerIndex}`;
  const ownerId = (ownerIndex: number) => `(SELECT id FROM owners WHERE telefone = ${text(phoneOf(ownerIndex))})`;
  const petId = (petName: string) => `(SELECT id FROM pets WHERE nome_normalizado = ${text(normalize(petName))})`;

  const owners = DEMO_OWNERS.map((owner, index) => {
    const email = `${normalize(owner.name).replaceAll(" ", ".")}@example.com`;
    return `(${text(owner.name)}, ${text(normalize(owner.name))}, ${text(phoneOf(index))}, ${text(email)}, ${text(owner.address)}, ${flag(owner.active !== false)})`;
  });

  const pets = DEMO_PETS.map((pet) => {
    const speciesId = `(SELECT id FROM species WHERE nome = ${text(pet.species)})`;
    const raceId = `(SELECT id FROM race WHERE especie_id = ${speciesId} AND nome_raca = ${text(pet.race)})`;
    const pkg = pet.pkg;
    return `INSERT INTO pets (nome, nome_normalizado, especie, porte, raca, observacoes, dono_id, servico_padrao,
      remarcacao_ativa, pacote_remarcacao, valor_pacote, data_inicio_pacote, horario_padrao, is_ativo)
      VALUES (${text(pet.name)}, ${text(normalize(pet.name))}, ${speciesId}, ${text(pet.size)}, ${raceId},
      ${text(pet.notes)}, ${ownerId(pet.owner)}, ${text(pet.service)}, ${flag(Boolean(pkg))},
      ${pkg ? pkg.visitsPerMonth : "NULL"}, ${pkg ? pkg.price : 0},
      ${pkg ? text(toIsoDate(addDays(today, -pkg.startDaysAgo))) : "NULL"}, ${text(pkg ? pkg.time : "00:00")},
      ${flag(pet.active !== false)});`;
  });

  const appointments: string[] = [];
  let paymentIndex = 0;
  const appointment = (pet: DemoPet, date: Date, time: string, done: boolean, taxiDog: boolean) => {
    const payment = done ? PAYMENT_METHODS[paymentIndex++ % PAYMENT_METHODS.length] : "";
    appointments.push(
      `(${petId(pet.name)}, ${text(pet.service)}, ${text(toIsoDate(date))}, ${text(time)}, ${flag(taxiDog)}, ${flag(done)}, NULL, 0, ${SERVICE_PRICE[pet.service]}, ${text(payment)}, ${flag(done)})`,
    );
  };

  DEMO_PETS.forEach((pet, petIndex) => {
    if (pet.pkg || pet.lastVisitDaysAgo === undefined || pet.everyDays === undefined) return;
    let visitIndex = 0;
    for (let daysAgo = pet.lastVisitDaysAgo; daysAgo <= HISTORY_DAYS; daysAgo += pet.everyDays) {
      const time = HISTORY_TIMES[(petIndex * 3 + visitIndex) % HISTORY_TIMES.length];
      appointment(pet, avoidSunday(addDays(today, -daysAgo), -1), time, true, visitIndex % 4 === 3);
      visitIndex++;
    }
  });

  DEMO_UPCOMING.forEach((visit) => {
    const pet = DEMO_PETS.find((candidate) => candidate.name === visit.pet);
    if (!pet) throw new Error(`Pet de exemplo inexistente: ${visit.pet}`);
    const date = visit.daysFromToday === 0 ? today : avoidSunday(addDays(today, visit.daysFromToday), 1);
    // Hoje, o que já passou do horário aparece como concluído.
    const done = visit.daysFromToday === 0 && visit.time < nowTime;
    appointment(pet, date, visit.time, done, visit.taxiDog === true);
  });

  return `
    INSERT INTO owners (nome, nome_normalizado, telefone, email, endereco, is_ativo) VALUES
      ${owners.join(",\n      ")};

    ${pets.join("\n\n    ")}

    INSERT INTO appointments (pet_id, servico, data, hora, entregar_pet, concluido, observacao,
      is_auto_agen, valor, tipo_pgto, ta_pago) VALUES
      ${appointments.join(",\n      ")};

    -- Os atendimentos passados dos pacotes, que o trigger gera como manuais, ficam concluídos e pagos.
    UPDATE appointments
    SET concluido = 1, ta_pago = 1,
        tipo_pgto = CASE id % 4 WHEN 0 THEN 'PIX' WHEN 1 THEN 'Cartão de Débito' WHEN 2 THEN 'Dinheiro' ELSE 'Cartão de Crédito' END
    WHERE concluido = 0 AND is_auto_agen = 0 AND data < ${todayDate};

    -- A última visita de cada pet é a data do último atendimento concluído.
    UPDATE pets
    SET current_ultima_visita_data = (
      SELECT MAX(data) FROM appointments a WHERE a.pet_id = pets.id AND a.concluido = 1
    );
  `;
}

/** Texto entre aspas simples para o SQL, com as aspas internas dobradas. */
function text(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function flag(value: boolean): 0 | 1 {
  return value ? 1 : 0;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Data no formato do banco ("AAAA-MM-DD"), pelo calendário do aparelho. */
function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

/** O pet shop não abre no domingo: a visita vai para o dia anterior (-1) ou seguinte (1). */
function avoidSunday(date: Date, direction: -1 | 1): Date {
  return date.getDay() === 0 ? addDays(date, direction) : date;
}
