// O que o leitor de tela (TalkBack) fala nos controles sem texto visível, num lugar só (A11Y-1), como
// as mensagens de MESSAGES. Sem depender do Expo, para os testes rodarem no Node.

export const A11Y_LABELS = {
  close: "Fechar",
  search: "Pesquisar",
  back: "Voltar",
  goToCalendar: "Ir para o calendário",
  datePickerHint: "Abre o calendário",

  /** Campo com o nome e o valor escolhido, como "Espécie: Cão". */
  field: (name: string, value: string) => `${name}: ${value}`,

  /** Interruptor com a pergunta de apoio, como "Pagamento: Cliente pagou?". */
  toggle: (title: string, question?: string) => (question ? `${title}: ${question}` : title),

  /** Botão de trocar o registro escolhido num campo, como "Trocar dono". */
  changeSelection: (field: string) => `Trocar ${field.toLowerCase()}`,

  theme: {
    darkMode: "Modo escuro",
  },

  registry: {
    addOwner: "Cadastrar novo dono",
    addPet: "Cadastrar novo pet",
    edit: (name: string) => `Editar ${name}`,
    deactivate: (name: string) => `Desativar ${name}`,
    activate: (name: string) => `Reativar ${name}`,
    openOwnerHint: "Mostra os dados do dono",
    openPetHint: "Mostra os dados do pet",
    newBreed: "Cadastrar nova raça",
  },

  filter: {
    toggle: "Filtrar por status",
    group: "Status",
  },

  pagination: {
    previous: "Página anterior",
    next: "Próxima página",
    page: (page: number) => `Página ${page}`,
  },

  appointments: {
    add: "Novo agendamento",
    expand: "Ampliar a lista de agendamentos",
    collapse: "Reduzir a lista de agendamentos",
    /** A linha da agenda: o risco de concluído só aparece na tela, então ele vai escrito no fim. */
    item: (appointment: {
      pet: string;
      owner: string;
      service: string;
      time: string;
      done: boolean;
    }) =>
      `${appointment.pet}, de ${appointment.owner}, ${appointment.service} às ${appointment.time}` +
      (appointment.done ? ", concluído" : ""),
  },

  /** Uma barra do gráfico, como "Segunda: 12 agendamentos". */
  chartBar: (label: string, value: string) => `${label}: ${value}`,
} as const;
