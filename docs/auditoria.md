# Auditoria de 2026-11-05

Respostas ao checklist de qualidade usado nos projetos do Gabriel, aplicado ao código do commit `e1d5f2f` do `main`. O que fazer com cada ponto está em [`plano-de-melhorias.md`](plano-de-melhorias.md), pelo código do item.

## Números do código

- 171 arquivos no Git, sendo 10.596 linhas de TypeScript em `.ts` e `.tsx`.
- 274 commits, de 2026-04-24 a 2026-06-04, de três autores.
- 8 tabelas, 12 índices e 8 triggers.
- 0 testes, sem lint, sem formatador e sem CI.
- `tsc --noEmit`: 1 erro.
- 46 usos de `any`, nenhum `@ts-ignore`.
- 53 botões tocáveis e 4 propriedades de acessibilidade.
- 43 cores e 88 tamanhos de fonte escritos fora do tema.
- 6,7 MB de imagens, das quais cerca de 1,6 MB sem uso.

## Onde isso pode melhorar?

- **Correção da regra principal.** A remarcação automática deve duplicar agendamentos em dois casos comuns: salvar de novo um agendamento concluído e editar um pet com pacote (BUG-3 e BUG-4).
- **Evolução do banco.** Sem versão de esquema, nenhuma correção de trigger chega a quem já instalou (DADOS-1).
- **Confiança.** Sem testes, cada mudança no SQL é às cegas (TEST-1).
- **Primeira impressão.** Sem README, com descrição errada, typecheck quebrado e um import que falha no Linux (REPO-1, REPO-2, BUG-1 e BUG-2).
- **Erros.** Algumas falhas não chegam ao usuário, e as que chegam passam por código copiado em 8 lugares (BUG-6 e ERRO-1).
- **Datas e dinheiro.** Fuso horário misturado entre UTC e local, e dinheiro como texto dividido em ponto flutuante (BUG-7 e DADOS-2).
- **Acessibilidade.** Botões de ícone sem nome para o leitor de tela e contraste baixo nos botões verdes (A11Y-1).

## O que poderia ser feito de forma mais simples?

- **Camadas.** Controller, service e repository para cada chamada, com o service só repassando. Uma camada de serviço que valida e chama o repository basta (ARQ-1).
- **Remarcação.** A mesma lógica de calendário em três triggers SQL. Uma função TypeScript pura e testada faria o mesmo (ARQ-2).
- **Datas.** Guardar `YYYYMMDD` como número obriga a montar o texto com `substr` em todo SQL de data. Texto ISO dispensa isso (DADOS-3).
- **Builders.** `PetBuilder`, `OwnerBuilder` e os outros só atribuem campos e terminam num `as`. Um objeto literal com o tipo certo, validado pelo schema, é mais curto e mais seguro (VALID-1).
- **Navegação.** `ScreenController` e `ScreenService` fazem a mesma coisa, e o segundo nem é usado (REPO-3).
- **Modais de seleção.** `abrirModalSelecao` guarda a lista no estado e precisa de `useEffect` para sincronizar a cada busca. O modal pode receber a lista direto do hook de busca.

## Há repetição que deveria virar uma função, um schema ou um módulo?

- `handleError` em 8 arquivos, e `e instanceof Error ? e.message : ...` 12 vezes: um módulo de erros e um hook (ERRO-1).
- A escolha do ícone pela espécie (cão, gato ou outro) em 3 arquivos: um util `speciesIcon(especie)`.
- O "hoje" no fuso de São Paulo em 3 lugares: uma função só (BUG-7).
- Conversores de data em dois arquivos, com funções iguais: `hifen_para_br` e `DataHifenPraBarra`; `intParaHifen` e `DataNumberPraStringHifen` (ARQ-1).
- O CTE recursivo da agenda, quase idêntico em dois triggers, e a conversão de data repetida dezenas de vezes no SQL (ARQ-2).
- Busca paginada com contagem para donos, pets e raças, cada uma com o próprio par de `useEffect`: um hook `usePagedSearch` (ARQ-1).
- O layout de formulário (cabeçalho, `TitleBar`, abas e botão salvar) repetido nas telas de dono, pet e agendamento: um componente de tela de formulário.
- Overlay `rgba(0,0,0,0.45)` em 3 modais: um token do tema (TEMA-1).
- Validação de pet e de remarcação feita à mão no controller: um schema por entidade (VALID-1).

## Checklist

### Legibilidade

- **O código é autoexplicativo?** Em parte. As camadas e os nomes de arquivo ajudam. O SQL dos triggers depende dos comentários para ser entendido, e alguns comentários são de conversa ("ESSE BICHÃO", "truque sensacional") e não de porquê.
- **Os nomes são descritivos?** Em parte. Mistura de português e inglês, dois hooks com o nome `useAgendamentos`, hooks sem o prefixo `use` e `PacoteRemarcacao.Mensal` para o pacote semanal (NOMES-1).
- **A formatação segue o padrão?** Quase sempre, mas sem Prettier há diferenças de indentação e ponto e vírgula entre arquivos (TEST-2).
- **Um júnior consegue manter?** Telas e repositories, sim. Os triggers de remarcação, não sem ajuda: são a parte mais crítica e a menos legível.

### Design

- **Cada função ou classe tem uma responsabilidade?** Em parte. `database.ts` faz conexão, esquema, dados iniciais e regras. `config/consts.ts` mistura enums, tipos, telas e imagens. As telas de formulário fazem busca, estado, validação de máscara e layout.
- **Existe duplicação?** Sim, listada acima.
- **É fácil de testar?** Não. A regra principal está no SQL, junto da conexão do Expo. Os repositories são singletons que abrem o banco sozinhos, sem como trocar por um banco de teste.
- **Pensado para escala e manutenção?** Para o tamanho de um pet shop, os índices e a paginação dão conta. Para manutenção, falta versão de esquema: mudar o banco hoje apaga os dados.

### Correção

- **Resolve o problema por completo?** Os fluxos principais existem: cadastros, agenda, pacotes, relatórios e backup. A remarcação tem dois bugs prováveis que afetam o uso real (BUG-3 e BUG-4).
- **Casos de borda tratados?** Em parte. Faltam horário incompleto, valor vazio, filtro de inativos na contagem, busca com acento na contagem, virada de dia entre 21h e meia-noite e backup de outra versão.
- **O erro é amigável e controlado?** Na maioria das telas, sim, pelo modal de erro. Não na abertura do banco nem ao desativar e reativar em Cadastros (BUG-6).
- **Há testes?** Não (TEST-1).

### Segurança e desempenho

- **Abre alguma vulnerabilidade?** Não há injeção de SQL: toda entrada do usuário vai por parâmetro, e o que é interpolado no SQL são constantes e enums do próprio código. Não há WebView, então não há XSS. O ponto sensível são os dados pessoais dos clientes no arquivo de backup, que sai sem proteção (SEG-1), e a importação de um `.db` sem checagem (BKP-1).
- **Há credenciais no código?** Não. O `projectId` do EAS no `app.json` é um identificador público, não um segredo. A busca por senhas, tokens e chaves no histórico do Git não achou nada.
- **Memória e processamento otimizados?** Para o volume de um pet shop, sim: listas paginadas de 20 itens, `FlatList` e índices. Os pontos fracos são imagens enormes para ícones pequenos e respostas de busca fora de ordem (PERF-1).
- **Conexões são fechadas?** O app usa uma conexão para a vida toda, o que é o normal com SQLite no celular. No backup, `ATTACH` e `DETACH` ficam num `finally`. O risco é abrir duas conexões em chamadas simultâneas ao `getDatabase` (PERF-1).
