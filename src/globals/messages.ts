// Mensagens que o app mostra ao usuário, num lugar só (ERRO-1). Cada falha tem a sua frase, para a tela
// dizer o que corrigir. Sem depender do Expo, para os testes rodarem no Node.

export const MESSAGES = {
  /** Para qualquer erro que não é um AppError: um bug, uma falha do SQLite ou do aparelho. */
  unexpected: "Algo deu errado. Tente de novo.",

  /**
   * Entrada que o formulário não monta: tipo errado, campo ausente ou algo que nem é um cadastro. Não
   * veio do que o usuário digitou, e o detalhe vai para o log (VALID-1).
   */
  invalidInput: "Os dados chegaram num formato inesperado. Feche a tela e tente de novo.",

  date: {
    invalid: "Data inválida. Escolha a data no calendário.",
  },

  money: {
    invalid: "Valor inválido. Use só números e vírgula, como 120,00.",
  },

  /** Valor fora da lista de um campo de escolha, como o porte ou o serviço padrão. */
  invalidOption: (field: string, accepted: readonly (string | number)[]) =>
    `${field} inválido. Valores aceitos: ${accepted.join(", ")}.`,

  /** Campo de sim ou não guardado como número no banco. */
  invalidFlag: (field: string) => `${field} deve ser 0 ou 1.`,

  /** Texto acima do limite do campo, de `limits.ts`. O campo vem com o artigo: "O nome do dono". */
  textTooLong: (field: string, max: number) => `${field} pode ter até ${max} caracteres.`,

  search: {
    tooLong: (max: number) => `A busca pode ter até ${max} caracteres.`,
    invalidPage: "Página inválida. Volte para a primeira página e tente de novo.",
  },

  owner: {
    notFound: "Dono não encontrado.",
    nameRequired: "Informe o nome do dono.",
    phoneRequired: "Informe o telefone do dono.",
    phoneInvalid: "Telefone inválido. Use o DDD e o número, como (45) 99999-9999.",
    emailInvalid: "E-mail inválido. Use o formato nome@exemplo.com.",
  },

  pet: {
    notFound: "Pet não encontrado.",
    nameRequired: "Informe o nome do pet.",
    speciesRequired: "Escolha a espécie do pet.",
    ownerRequired: "Escolha o dono do pet.",
    breedRequired: "Escolha a raça do pet.",
    breedOfOtherSpecies: "A raça escolhida é de outra espécie. Escolha a raça de novo.",
    packageRequired: "Escolha o pacote de remarcação.",
    packageValueRequired: "Informe o valor do pacote, no formato 120,00.",
    packageStartRequired: "Escolha no calendário a data de início do pacote.",
    defaultTimeInvalid: "Horário padrão inválido. Use horas e minutos, como 09:30.",
  },

  appointment: {
    notFound: "Agendamento não encontrado.",
    petRequired: "Escolha o pet do agendamento.",
    serviceRequired: "Escolha o serviço do agendamento.",
    timeRequired: "Informe o horário do agendamento.",
    timeInvalid: "Horário inválido. Use horas e minutos, como 09:30.",
  },

  species: {
    notFound: "Espécie não encontrada.",
  },

  breed: {
    notFound: "Raça não encontrada.",
    speciesRequired: "Selecione a espécie do animal.",
    nameRequired: "Informe o nome da raça.",
    nameTooShort: "O nome da raça deve ter pelo menos 2 caracteres.",
    duplicate: "Já existe uma raça com este nome para esta espécie.",
  },

  database: {
    openFailed: "Não foi possível abrir os dados do app. Feche o app e abra de novo.",
    newerVersion: "Estes dados são de uma versão mais nova do app. Atualize o app para abri-los.",
    brokenForeignKey: "A migração deixou registros apontando para outros que não existem.",
    migrationFailed: (version: number) =>
      `A atualização do banco para a versão ${version} falhou, e nenhum dado foi alterado.`,
  },

  backup: {
    notABackup:
      "Este arquivo não é um backup do PetShop Manager. Escolha um arquivo exportado pelo app.",
    damaged:
      "Este backup está danificado e não pode ser importado. Exporte um backup novo pelo app.",
    newerVersion: "Este backup é de uma versão mais nova do app. Atualize o app para importá-lo.",
    wrongExtension: "Arquivo inválido. Selecione um arquivo .db válido.",
    fileNotFound: "Arquivo selecionado não encontrado ou inacessível.",
    databaseNotFound: "Banco de dados não encontrado.",
    sharingUnavailable: "Compartilhamento não disponível neste dispositivo.",
  },

  demoData: {
    notEmpty:
      "Os dados de exemplo só podem ser carregados com o app vazio, sem nenhum dono, pet ou agendamento.",
    resetDevOnly: "Apagar todos os dados só é possível no modo de desenvolvimento.",
  },
} as const;

/**
 * Os textos dos modais de confirmação. Ficam fora de MESSAGES, que só tem frases completas, porque o
 * título pode ser uma pergunta e o botão é um rótulo curto.
 */
export const DIALOGS = {
  /** Sair de um formulário pelo voltar da tela ou do Android, com dados não salvos (BUG-8). */
  leaveForm: {
    title: "Confirma voltar?",
    message: "Você perderá todos os novos dados não salvos.",
    confirmLabel: "Voltar",
  },

  /**
   * Antes de abrir o compartilhamento do backup (SEG-1). O arquivo sai da área privada do app sem
   * senha, então quem exporta precisa saber o que vai dentro dele antes de escolher o destino.
   */
  exportBackup: {
    title: "O backup tem dados pessoais",
    message:
      "O arquivo não tem senha e traz o nome, o telefone, o e-mail e o endereço dos clientes. " +
      "Guarde-o num lugar seguro e só compartilhe com quem pode ver esses dados.",
    confirmLabel: "Exportar",
  },

  /** Antes de escolher o arquivo a importar, que substitui tudo o que está no app. */
  importBackup: {
    title: "Importar banco de dados",
    message: "Isso substituirá TODOS os dados atuais. Esta ação não pode ser desfeita.",
    confirmLabel: "Importar",
  },
} as const;
