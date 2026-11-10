# Arquitetura atual

Retrato do código em 2026-11-05, no commit `e1d5f2f` do `main`. Descreve o que existe hoje, não o que deveria existir. O que muda está em [`plano-de-melhorias.md`](plano-de-melhorias.md).

Depois desse retrato, o PR #1 subiu o projeto para o SDK 58, com React Native 0.88.1, React 19.3.0 e TypeScript 6.0.3, e o PR #5 criou o CI. As versões atuais estão no [`README`](../README.md). O resto deste documento continua valendo.

## O que é

App Android para um pet shop organizar donos, pets e a agenda de banho e tosa. Funciona offline: os dados ficam num banco SQLite gravado no próprio aparelho. Não há servidor, login nem sincronização.

## Stack

Versões do `package.json`:

- Expo SDK 54 (`expo` 54.0.33), React Native 0.81.5 e React 19.1.0, com a nova arquitetura ligada (`newArchEnabled`).
- TypeScript 5.9.2 em modo `strict`.
- `expo-sqlite` 16 para o banco, `react-native-calendars` para o calendário.
- `expo-file-system`, `expo-sharing` e `expo-document-picker` para o backup.
- Build Android pelo EAS: perfil `preview` gera APK e `production` gera AAB.

Não há lint, formatador, testes nem CI. O único script de checagem possível hoje é o `tsc --noEmit`, e ele falha num arquivo sem uso (ver BUG-1 no plano).

## Pastas

```
index.ts                  registra o App no Expo
App.tsx                   providers, abertura do banco e troca de telas
app.json, eas.json        configuração do Expo e perfis de build
app/
  config/
    database.ts           conexão única, com WAL e pragmas; initDatabase aplica as migrações, recreateAppDatabase recria o banco, e upgradeBackupFile e restoreAppDatabase importam um backup
    schema.ts             pragmas da conexão e a lista de migrações, sem o Expo (desde 2026-11-08)
    migrations/           uma versão do esquema por arquivo (v1.ts, v2.ts, v3.ts), em SQL puro
    migrator.ts           aplica as migrações pendentes numa transação e recria o banco do zero, sem o Expo (desde 2026-11-08)
    backupRestore.ts      atualiza a cópia de um backup pelas migrações e troca os dados do app pelos dela, sem o Expo (desde 2026-11-08)
    demoData.ts           dados de exemplo com datas em torno de hoje (desde 2026-11-08)
    navigation.ts         as telas (`Screen`), as abas da barra de baixo (`TAB_SCREENS`, PR #36) e o mapa de para onde cada uma volta, sem o React Native (desde 2026-11-09)
    petEnums.ts           os valores fixos do pet (serviço, pacote, espécie e porte) como objetos `as const`, sem o React Native (PR #38)
    consts.ts             tipos, imagens da barra e tamanhos; reexporta o `Screen` e os valores do pet
  model/                  interfaces das tabelas e builders; Search.ts tem a busca por nome e a página com o total (desde 2026-11-09); Breed.ts tem a raça (PR #38)
  repository/             SQL de cada tabela
    sql/                  os comandos de escrita, o SQL dos relatórios com data e a busca paginada por nome (searchSql.ts) e a de raças (breedsSql.ts, PR #34), que os testes também usam, sem o Expo (desde 2026-11-08)
    fetchPage.ts          roda a página e a contagem de uma busca (desde 2026-11-09)
  service/                repassa as chamadas ao repository, menos as regras da raça (breedRules.ts, sem o Expo, PR #38); BackupService exporta e importa o banco
  controller/             validação e regras de entrada; ScreenController guarda a tela atual e a guarda do voltar
  validation/             um schema Zod por entidade, os campos comuns (fields.ts) e o parseInput, que vira AppError, sem o Expo (desde 2026-11-09, PR #32)
  errors/
    AppError.ts           o AppError (código e mensagem), o texto da tela e o log, sem o Expo (desde 2026-11-09)
  globals/
    messages.ts           as mensagens que o app mostra ao usuário, uma por falha, e os textos dos modais de confirmação (DIALOGS, PR #34) (desde 2026-11-09)
    limits.ts             limites de entrada, como o tamanho de cada texto (desde 2026-11-09)
    accessibilityLabels.ts os rótulos do leitor de tela (A11Y_LABELS) (desde 2026-11-09)
  hooks/                  useScreen, useBackNavigation, useError, useAsyncAction, useAsyncData, useSearchPage, useFormState e buscas no banco para os formulários
  utils/
    datas.ts              o tipo IsoDate ("AAAA-MM-DD"), o "hoje" no fuso do aparelho e o texto das telas, sem o Expo (desde 2026-11-08)
    dinheiro.ts           o tipo Cents, a máscara de valor e o campo de texto ↔ centavos, sem o Expo (desde 2026-11-08)
    formatadores/         número com vírgula e normalização de nome
    relatorios/           consultas SQL dos seis relatórios
    mascarar.ts           máscara de horário e de valor
    formDirty.ts          se o formulário mudou desde que abriu, para o voltar só pedir confirmação nesse caso, sem o React Native (PR #36)
  view/
    Themes/               a paleta clara e escura (colors.ts), o ThemeProvider e o withAlpha (alpha.ts, PR #35)
    contexts/             data e mês selecionados no calendário
    pages/                telas: Home, Cadastros, Relatórios, Configurações e formulários
    components/           peças das telas, agrupadas por assunto; Acessibilidade/ tem o IconButton e as props do leitor de tela; o CloseButton é o ✕ dos modais, e Cadastro/ tem o SaveButton e o FormSectionTitle dos formulários (PR #34)
  assets/                 ícones e imagens (4,9 MB no total, desde o REPO-3)
```

## Camadas

```mermaid
flowchart LR
  Telas --> Hooks
  Telas --> Controllers
  Hooks --> Controllers
  Hooks -. "às vezes direto" .-> Repositories
  Controllers --> Services --> Repositories --> SQLite[(SQLite no aparelho)]
  Relatorios["utils/relatorios"] --> SQLite
  Tema["ThemeProvider"] --> Controllers
```

- **Telas e componentes** chamam os controllers, quase sempre dentro de `useEffect`, e passam o erro como veio ao `showError` do `useError`. As ações com carregamento usam o `useAsyncAction`, os relatórios carregam pelo `useAsyncData`, e as buscas paginadas por nome, pelo `useSearchPage`, que descarta a resposta atrasada.
- **Controllers** validam a entrada e lançam `AppError` com uma mensagem de `globals/messages.ts` para cada falha. Desde o PR #32, a validação é o schema da entidade em `app/validation/`, pelo `parseInput`: texto com `trim` e tamanho máximo, id, data real, horário `HH:MM`, centavos, e-mail e telefone. O service recebe o tipo que sai do schema.
- **Formulários** guardam o valor como o texto do campo ("80,00") e a data como `AAAA-MM-DD`. Ao salvar, o `parseMoneyInput` converte o texto em centavos, e um valor fora do formato vira a mensagem de erro da tela.
- **Services** quase só repassam a chamada ao repository. A exceção são as regras da raça (PR #38): o `SpeciesService` recusa a raça repetida pelo nome sem acento e a espécie que não existe, e o `PetService` confere que a raça do pet é da espécie escolhida.
- **Repositories** fazem o SQL com parâmetros `?` e devolvem os registros com `SELECT *`. A busca paginada por nome devolve a página e o total juntos, montados pela mesma função, com o mesmo filtro.
- **Relatórios** ficam em `utils/relatorios` e consultam o banco direto, sem passar pelas outras camadas.
- Os hooks `useServicos` e `useTiposPagamento` chamam o repository direto.
- `config/consts.ts` importa um tipo de `view/` (`BarChartItem`), então a configuração depende da interface.

## Navegação

Não usa biblioteca de navegação. O `ScreenController` é um singleton que guarda a tela atual e os parâmetros e avisa os ouvintes. O hook `useScreen` assina essas mudanças, e o `App.tsx` escolhe a tela num `switch`.

- Não há histórico: o destino do voltar de cada tela vem de um mapa só, o `backRouteOf` de `config/navigation.ts` (desde 2026-11-09, BUG-8).
- O botão voltar da tela e o do Android chamam o mesmo `requestBack()` do `ScreenController`. O `BackHandler` tem um listener só, na raiz (`useAndroidBackButton`, no `App.tsx`). Um formulário em edição registra uma guarda (`useBackGuard`), que abre a confirmação no lugar de voltar. No Calendário, o voltar fecha o app.
- A barra de navegação inferior (`AppBar`) aparece só nas quatro telas principais.

## Estado global

Três contextos do React:

- **Tema:** `isDark` vem da tabela `configs` (registro 1, "Modo Escuro"). O tema não segue o do sistema.
- **Erro:** `showError(erro)` abre um modal único, com o texto do `toUserMessage` (ver "Erros").
- **Agendamentos:** data e mês selecionados no calendário e a lista do dia.

Os formulários usam `useFormState` (um objeto de estado com `updateField`).

## Banco de dados

Arquivo `petshop.db` (`DATABASE_NAME`), aberto por `getDatabase()` com `journal_mode = WAL`, `foreign_keys` e `recursive_triggers`. Esses dois pragmas valem por conexão, então ficam na abertura, e não no esquema. O `getDatabase()` guarda a promessa da conexão, para as chamadas simultâneas da abertura do app (o tema e o `initDatabase`) receberem a mesma.

Desde 2026-11-08 (DADOS-1), o esquema tem versão, guardada no `PRAGMA user_version`:

- `MIGRATIONS`, em `schema.ts`, tem uma entrada por versão, em sequência a partir de 1. Uma versão publicada não muda mais: a mudança entra como a seguinte.
- O `initDatabase()` chama o `migrateDatabase()` (`migrator.ts`), que aplica as pendentes numa transação só. Se uma falhar, nada muda, e o erro vai para a tela de erro do `App.tsx`.
- Durante as migrações, as chaves estrangeiras ficam desligadas, para reconstruir uma tabela sem o `ON DELETE CASCADE` apagar as filhas. No fim, o `foreign_key_check` não pode achar mais problemas que antes.
- A versão 1 é o esquema de antes das migrações, com `IF NOT EXISTS`, e recria os triggers. Num banco antigo sem versão, ela só marca a versão e troca os triggers pelos de hoje.
- A versão 2 corrige os triggers da remarcação (BUG-3 e BUG-4).
- A versão 3 reconstrói `owners`, `pets` e `appointments`: dinheiro em centavos (`INTEGER`), datas em texto `AAAA-MM-DD` e o relógio dos triggers e do `criado_em` no fuso do aparelho (`'localtime'`). Os dados antigos são convertidos na cópia, e a contagem de ids continua de onde parou.
- Um banco de versão mais nova que o app é recusado.
- O `migrator.ts` não usa o Expo: os testes rodam o mesmo código com o `node:sqlite`.

Reset de desenvolvimento (desde 2026-11-08): com dados no app e só com `__DEV__`, o cartão de dados de exemplo em Configurações vira "Apagar tudo e carregar exemplo". O `resetToDemoData` (`DemoDataService`) confere o `__DEV__`, chama o `recreateDatabase`, que apaga todas as tabelas e aplica todas as migrações na mesma transação, e depois carrega os dados de exemplo.

### Tabelas

| Tabela | Para que serve |
| --- | --- |
| `configs` | preferências; hoje só o modo escuro |
| `service_type` | serviços: Banho, Banho e Tosa, Banho e Higiênica |
| `payment_methods` | formas de pagamento: crédito, débito, dinheiro, PIX e outro |
| `species` | espécies: cão, gato e outro |
| `race` | raças por espécie, 23 de partida, e o usuário pode criar mais |
| `owners` | donos: nome, telefone, e-mail, endereço e ativo |
| `pets` | pets: espécie, raça, porte, dono, serviço padrão e os dados do pacote de remarcação |
| `appointments` | agendamentos: pet, serviço, data, hora, táxi dog, concluído, automático, valor, forma de pagamento e pago |

Convenções:

- Datas são texto `AAAA-MM-DD` (desde a versão 3). O texto se compara e se ordena como data e entra direto nas funções de data do SQLite. No app, o tipo é o `IsoDate`.
- Horas são texto `HH:MM`, com `00:00` quando não há horário.
- Flags são `INTEGER` 0 ou 1, sem `CHECK`.
- Dinheiro é `INTEGER` em centavos (desde a versão 3). No app, o tipo é o `Cents`, e só os campos das telas usam o texto com vírgula.
- Serviço e forma de pagamento são gravados como texto no agendamento, não como id.
- Desativar é exclusão lógica (`is_ativo = 0`). Nada é apagado de verdade, exceto agendamentos automáticos pendentes.
- `appointments.dia_semana` é uma coluna gerada, usada pelo relatório de dias mais movimentados.
- São 12 índices, pensados para os relatórios e as buscas por nome normalizado.

### Triggers

| Trigger | Quando dispara | O que faz |
| --- | --- | --- |
| `trg_ultima_visita` | `concluido` de 0 para 1 (desde a versão 2) | grava a data como última visita do pet |
| `trg_remarcacao_automatica` | `concluido` de 0 para 1 num agendamento automático (desde a versão 2) | cria o próximo agendamento automático do pacote |
| `trg_pet_remarcacao_insert` | insert de pet com remarcação | gera a agenda do pacote, da data de início até hoje + 224 dias |
| `trg_pet_remarcacao_ativar` | mudança de fato num campo da agenda (pacote ligado, pacote, início, horário, serviço, valor ou `is_ativo`), com remarcação ligada (desde a versão 2) | apaga os automáticos pendentes de hoje em diante e gera de novo só a partir de hoje |
| `trg_pet_remarcacao_desativar` | remarcação de 1 para 0 | apaga os automáticos pendentes a partir de amanhã |
| `trg_owner_desativar_pets` | dono desativado | desativa os pets do dono |
| `trg_pet_ativar_owner` | pet ativado | reativa o dono, se estiver inativo |
| `trg_pet_desativar_limpar_remarcacao` | pet desativado | apaga os automáticos futuros e desliga o pacote |

### Remarcação automática

É a regra mais elaborada do app, e vive inteira nos triggers:

- Pacote 2 é a cada 14 dias (até 2 por mês). Pacote 4 é a cada 7 dias (até 4 por mês).
- Quando a cota do mês acaba, o próximo cai no mês seguinte, no mesmo dia da semana da data de início.
- A agenda é gerada até hoje + 224 dias (`PERIODO_REMARCACAO`). Datas que já passaram entram como agendamento manual.
- O valor de cada atendimento é o valor do pacote dividido pela quantidade do pacote.
- Ao concluir um agendamento automático, o trigger cria o seguinte.

A mesma lógica de calendário aparece em três lugares do SQL: duas vezes no CTE recursivo dos triggers de pet e uma vez no trigger de conclusão.

## Relatórios

Seis relatórios, cada um com uma tela em `view/pages/Relatorios` e a consulta em `utils/relatorios`:

- Dias e horários mais movimentados (agendamentos concluídos por dia da semana e por hora).
- Pets ausentes: dias desde a última visita, com o telefone do dono, separados entre pets com e sem pacote.
- Remarcações: pets ativos com e sem pacote.
- Origem dos agendamentos: manuais e automáticos, concluídos e pendentes.
- Comparativo mensal: concluídos nos últimos 12 meses e agendados nos próximos.
- Pacotes ativos: pets em 2x e 4x por mês, com a lista.

Os gráficos são um componente próprio (`BarChart`), sem biblioteca.

## Backup

Fica em Configurações (`DatabaseTransfer` e `BackupService`):

- **Exportar:** consolida o WAL, copia o `petshop.db` para `backups/petshop-AAAA-MM-DD.db`, no cache, e abre o compartilhamento do sistema. Cada exportação apaga as cópias anteriores; a última fica no cache privado do app até a próxima, porque o app de destino pode ler o arquivo depois que o menu fecha.
- **Importar:** o usuário escolhe um arquivo `.db`, que é copiado para a pasta dos bancos do app. Desde 2026-11-08 (etapa 3c), a cópia é aberta numa conexão só dela e passa pelas mesmas migrações do banco do aparelho (`backupRestore.ts`): um backup de versão anterior chega no formato de hoje, e um arquivo danificado (`integrity_check`), sem as sete tabelas do app ou de versão mais nova é recusado antes de mexer nos dados. Depois, o app anexa a cópia com `ATTACH` e confere se ela tem todas as colunas do app. Numa transação, com as chaves estrangeiras e os triggers do app desligados, apaga e copia as sete tabelas pelo nome das colunas, e a contagem de ids. A cópia e os arquivos do SQLite ao lado dela são apagados no fim, com qualquer resultado.
- Todas as conexões abrem com o `trusted_schema` desligado (`SQL_CONNECTION_PRAGMAS`), para o esquema de um arquivo de fora não rodar função com efeito colateral.

## Tema e estilo

As cores ficam em `view/Themes/colors.ts`, num objeto `light` e outro `dark`, e os componentes montam o estilo com `useThemedStyles(styles)`, do `ThemeProvider`. Desde 2026-11-09 (A11Y-1), um teste confere o contraste de 4,5:1 de cada par de texto e fundo nos dois temas. Tamanhos de fonte, espaços e raios são escritos em cada componente. Desde o PR #35, as cores do interruptor do tema, do destaque dos relatórios, da bolinha do `Toggle`, da sombra e do fundo dos modais também estão no tema, e a transparência sai do `withAlpha`. Ainda ficam fora algumas sombras `#000` e o fundo do filtro ativo (ver `proximos-passos.md`).

Acessibilidade: botão só com ícone usa o `IconButton` (ou o `ActionIconButton`), com papel, rótulo de `A11Y_LABELS` e área de toque de 48 dp, e os enfeites usam `HIDDEN_FROM_SCREEN_READER`.

## Erros

Desde 2026-11-09 (ERRO-1), num lugar só, em `app/errors/AppError.ts`:

- **Criar:** a falha prevista é um `AppError`, com um código (`VALIDATION`, `NOT_FOUND`, `CONFLICT`, `INVALID_BACKUP`, `DATABASE` ou `UNAVAILABLE`) e uma mensagem de `app/globals/messages.ts`. O motivo de verdade, quando há, fica no `cause`.
- **Mostrar:** o `toUserMessage` devolve a mensagem do `AppError`. Qualquer outro erro (um bug, o SQLite, o Expo) vira "Algo deu errado. Tente de novo.", para a tela não mostrar SQL nem detalhe interno.
- **Registrar:** o `logError` manda para o log o erro inesperado inteiro e o `AppError` com `cause`. A falha de validação é prevista e não vai para o log.
- **Nas telas:** o `showError` do `ErrorProvider` recebe o erro como veio e faz as duas coisas. O `useAsyncAction` liga o carregamento, barra o toque duplo e mostra a falha; o `useAsyncData` carrega os dados de uma tela ao abrir e mostra a falha uma vez só.
- O backup, os dados de exemplo e o cadastro de raça usam o mesmo modal das outras telas.
- A falha na abertura do banco aparece na tela de erro do `App.tsx`, com a mensagem do `AppError` ou a de "não foi possível abrir os dados do app".
- Os erros de programação (migração fora de ordem, hook fora do provider) continuam como `Error`, porque não são do usuário.

## Build e release

- `app.json`: nome "PetShop Manager", pacote `com.gabriel98989898.PetShopManager`, retrato, ícone e splash próprios.
- `eas.json`: `preview` gera APK, `production` gera AAB. Sem versão mínima do EAS CLI e sem incremento automático de versão.
- O app não tem suporte a web. O script `web` saiu do `package.json` no REPO-3, mas o bloco `web` do `app.json` continua.
- Não há release publicada no GitHub.
