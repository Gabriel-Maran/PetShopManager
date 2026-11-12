# Log de decisões

Cada decisão tem data, contexto, decisão e motivo. As que ainda dependem de resposta estão em [`perguntas-em-aberto.md`](perguntas-em-aberto.md).

## 2026-11-05

**Plano em `docs/`, dentro do repositório.**
Contexto: o repositório é público e o projeto aparece no portfólio do Gabriel.
Decisão: o plano de melhorias, a arquitetura, os próximos passos, as decisões e as perguntas ficam em `docs/`, em português.
Motivo: ficam junto do código, e os parceiros acompanham pelo GitHub.

**Só documentação nesta etapa.**
Decisão: o PR do plano não muda nenhuma linha do app.
Motivo: o plano precisa ser revisado antes, e o código é de três autores.

**Prioridade em três níveis.**
Decisão: P0 é antes de divulgar, P1 é o que mais aumenta a credibilidade e P2 pode esperar.
Motivo: deixa claro o que vem primeiro quando o tempo é curto.

**Régua da auditoria.**
Decisão: a auditoria usa os padrões de código do Gabriel: camadas separadas, erros e tema centralizados, `globals` e `utils`, TypeScript estrito sem `any`, dinheiro em centavos inteiros, datas sem depender de fuso e toda entrada validada por schema.
Motivo: é a mesma régua dos outros projetos dele, e são boas práticas de React Native e TypeScript.

**Só dados reais.**
Decisão: os números dos documentos vêm do código e do histórico do Git em 2026-11-05. Bug visto só na leitura leva a marca "provável".
Motivo: o plano vai ser lido por quem pode conferir o código.

**Bug provável só é corrigido com teste.**
Decisão: antes de corrigir um bug marcado como provável, um teste o reproduz.
Motivo: confirma o problema e impede que ele volte.

**Mudanças por pull request.**
Decisão: cada parte do plano entra por um PR para o `main`, numa branch `tipo/resumo-curto`, com commits no formato Conventional Commits (`tipo(arquivos): resumo`).
Motivo: os parceiros revisam, e o histórico fica legível. Os itens grandes de arquitetura já tinham sido combinados com eles para entrar em PRs públicos.

**Instalações só com aval.**
Decisão: itens que pedem pacotes novos (lint, formatador, testes de componentes, navegação, validação) esperam a escolha do Gabriel, com versão exata e publicada há mais de 7 dias.
Motivo: regra dele para todos os projetos.

**Vulnerabilidades antes do plano.**
Contexto: o `npm audit` mostrava 31 alertas, 2 deles críticos.
Decisão: corrigir as dependências primeiro, no PR #1, e só depois seguir o plano.
Motivo: pedido do Gabriel.

**Expo SDK 58 de uma vez.**
Contexto: os alertas que sobravam no SDK 54 só saíam forçando versões que o Expo não testou. O app é pequeno, só Android, e usa poucos módulos nativos, todos do próprio Expo.
Decisão: subir direto do SDK 54 para o 58, conferindo as mudanças do SDK 55 ao 58, em vez de um SDK por vez.
Motivo: as mudanças que afetavam o app eram poucas (duas chaves do `app.json` e seis ajustes de tipo), e o teste no aparelho é um só.

**Nunca `npm audit fix --force`.**
Decisão: não usar, mesmo que o npm sugira.
Motivo: ele propõe trocar o Expo por outra versão maior ou menor, o que quebra o projeto.

**Risco aceito nas ferramentas de build.**
Contexto: até o Expo mais novo usa `glob` 13 e `minimatch` 10, ainda com alertas moderados.
Decisão: aceitar os alertas que ficam só nas ferramentas de build (Expo CLI, metro e config) até o Expo atualizar, sem `overrides`.
Motivo: nenhum deles entra no APK, como mostrou o mapa do pacote Android. Para explorá-los, alguém teria de pôr um arquivo malicioso no projeto e rodar o build. Forçar versões fora das faixas do Expo traz mais risco do que resolve.

**Permissões Android mínimas.**
Decisão: `blockedPermissions` tira `SYSTEM_ALERT_WINDOW`, `READ_EXTERNAL_STORAGE` e `WRITE_EXTERNAL_STORAGE`. Ficam `INTERNET` e `VIBRATE`.
Motivo: o app não usa as três, e o backup funciona pelo seletor de arquivos e pelo compartilhamento do sistema. `INTERNET` fica porque o desenvolvimento com o metro e builds de desenvolvimento precisam dela. `VIBRATE` é inofensiva. O `allowBackup` continua na pergunta 20.

## 2026-11-08

**`.npmrc` no projeto.**
Decisão: o repositório ganha um `.npmrc` com `ignore-scripts`, `save-exact` e `min-release-age=7`, as mesmas proteções do `~/.npmrc` do Gabriel. O `engine-strict` do portfólio fica de fora.
Motivo: sem o arquivo, os parceiros e o build da EAS instalam sem essas proteções. O `engine-strict` faria a instalação falhar quando um pacote pede outra versão do Node, e o projeto não declara `engines`. Nenhum pacote do lock tem script de instalação, então o `ignore-scripts` não quebra nada. No npm 11, o `min-release-age` vira a opção `before` (data de 7 dias atrás).

**Segurança do repositório ligada.**
Decisão: descrição e tópicos do REPO-1; Dependabot alerts e security updates, secret scanning e push protection.
Motivo: o repositório é público e está linkado no portfólio. Essas opções não mudam o fluxo dos parceiros. O ruleset no `main` muda, e por isso fica para a configuração completa do GitHub.

**GitHub configurado como o do portfólio.**
Decisão:
- `dependabot.yml` semanal, com espera de 7 dias e mensagens `chore(deps)`;
- CI com `npm run check` no Linux;
- depois do merge, merge só por squash, branch apagada depois do merge e dois rulesets no `main`: PR obrigatório, CI verde e sem bypass; sem apagar a branch nem force push.

O PR não exige aprovação mínima, como no portfólio.
Motivo: o `main` passa a receber só mudanças revisadas e verificadas, sem travar o trabalho de quem abre o PR. Com aprovação obrigatória, cada PR esperaria um dos parceiros.

**Dependabot com o SDK do Expo travado no patch.**
Decisão: `expo`, `expo-*`, `react`, `react-native`, `@types/react` e `typescript` só recebem patch, num grupo `expo-sdk`. A troca de SDK é feita à mão, com `npx expo install --fix`. As correções de segurança chegam num PR só.
Motivo: cada SDK fixa a versão desses pacotes. Uma versão minor ou major fora da lista, sozinha, quebra o app. Pacotes fora do SDK, como o `react-native-calendars`, seguem o grupo de minor e patch.

**O Dependabot não mexe no SDK do Expo** (corrige a decisão anterior, que deixava passar patch).
Contexto: no primeiro dia, o Dependabot abriu o PR #6 (`expo` 58.0.22 e `react` 19.3.1) e o PR #7 (`expo-sqlite` 58.0.15, fora do grupo do SDK).
Decisão: `expo`, `expo-*`, `react`, `react-native`, `@types/react` e `typescript` ficam fora do Dependabot, para todo tipo de versão. O SDK, inclusive de patch, é atualizado à mão com `npx expo install --fix`, que escolhe as versões que o `expo` instalado espera. Os PRs #6 e #7 são fechados sem merge.
Motivo:
- O React Native exige o `react` idêntico ao renderer dele, então o 19.3.1 quebraria o app ao abrir, e o CI não pega isso, porque não executa o app.
- O Expo Go traz as versões nativas do SDK.
- Uma versão de um pacote do SDK sozinha deixa o conjunto fora do que o `expo` espera.

**Equipe e contexto do projeto** (respostas às perguntas 1 e 5).
Decisão:
- A equipe é Gabriel Maran (`Gabriel-Maran`), João Pedro Uhry Gonçalves (`joaopug`, também "João Pedro U G") e Gustavo Grosbelli (`Grosbelli12`), com as responsabilidades divididas.
- O projeto é da disciplina de Desenvolvimento Mobile, na Unipar.
- O README cita a equipe e a disciplina. "Quem fez o quê" só entra no README se os três concordarem.

Motivo:
- A equipe foi confirmada pelo Gabriel. O nome completo do João Pedro está no post do projeto no LinkedIn.
- A disciplina foi informada pelo Gabriel. O repositório não a cita, e o post traz só a hashtag `#DesenvolvimentoMobile`.

**Testes num SQLite em memória** (respostas às perguntas 10 e 11).
Decisão: os testes podem rodar o SQL do app num SQLite em memória (`node:sqlite`, `:memory:`), criado e descartado pelo próprio teste, sem arquivo e sem dado real. O executor é o `node:test`. A autorização está no `CLAUDE.md` local do Gabriel, fora do Git.
Motivo: confirmar os bugs prováveis (BUG-3, BUG-4 e BKP-1) e proteger os triggers antes de mexer neles, sem instalar nada e sem risco para dados de verdade.

**Dados de exemplo (DEMO-1), adiantados para a Parte 1** (resposta à pergunta 18).
Decisão:
- Um botão "Carregar dados de exemplo" em Configurações, em todos os builds, que só aparece com o app vazio (nenhum dono, pet ou agendamento). Ele pede confirmação, e o service confere de novo dentro da transação.
- Os dados ficam em `src/config/demoData.ts`:
  - 21 donos, um deles desativado;
  - 26 pets, 8 com pacote;
  - histórico de 180 dias e agendamentos para os próximos dias, com datas relativas a hoje;
  - telefones fictícios e e-mails em `example.com`.
- Os pacotes usam o próprio trigger para gerar a agenda.
- O `inserts.txt` sai, porque estava desatualizado: tinha serviços com outros nomes e um pet de um dono inexistente.

Motivo:
- Os prints e quem instala o APK precisam ver o app com movimento.
- Só com o app vazio, os dados de exemplo nunca se misturam com clientes reais.

**Transação na conexão do app.**
Decisão: o `loadDemoData` usa o `withTransactionAsync`, e não o `withExclusiveTransactionAsync`.
Motivo: a transação exclusiva abre outra conexão, sem os `PRAGMA foreign_keys` e `recursive_triggers` que o `initDatabase` liga. Os triggers se comportariam diferente do uso normal.

**Esquema separado do Expo e testes em `.mjs`.**
Decisão:
- O SQL do esquema foi para `src/config/schema.ts`, sem mudar nenhum comando (conferido comando a comando, ignorando só a indentação). O `initDatabase` executa a lista `SCHEMA_STATEMENTS`.
- Os testes ficam em `tests/*.test.mjs`, rodam com `npm test` (`node:test` e `node:sqlite`) e entram no `npm run check` e no CI.

Motivo:
- Os testes rodam o mesmo esquema do app num SQLite em memória, como autorizado.
- São `.mjs` porque o typecheck de testes em TypeScript precisaria do `@types/node`, uma instalação ainda não autorizada. O Node 24 importa os `.ts` do app direto.
- O aviso `MODULE_TYPELESS_PACKAGE_JSON` fica desligado no script, porque pôr `"type": "module"` no `package.json` poderia afetar o Metro.

**Testes de caracterização com o SQL do próprio app (TEST-1).**
Decisão:
- Os comandos de escrita que os testes usam saíram dos repositories para `src/repository/sql/`, sem o Expo, sem mudar nenhum texto: inserir e editar pet e agendamento, concluir, ligar e desligar o pacote, ativar e desativar donos e pets, e restaurar o backup.
- Os repositories e o `BackupService` usam as mesmas constantes.
- Os testes de bug descrevem o comportamento de hoje com o nome "confirmado". A correção, na Parte 3, inverte a checagem.
- A restauração de backup é testada com um banco em memória compartilhada (`file:...?mode=memory&cache=shared`), anexado como `src`, sem arquivo.

Motivo:
- Copiar o SQL nos testes deixaria os dois se afastarem com o tempo.
- O teste prova o bug no próprio código, e a correção fica visível no diff do teste.

**Versão do esquema e migrações (DADOS-1).**
Decisão:
- A versão fica no `PRAGMA user_version`. A lista `MIGRATIONS`, em `schema.ts`, tem uma entrada por versão, em sequência a partir de 1. Na abertura do app, o `migrateDatabase` (`migrator.ts`) aplica as pendentes.
- Todas as pendentes entram numa transação só: o banco chega à última versão ou fica como estava.
- As chaves estrangeiras ficam desligadas durante as migrações. No fim, o `foreign_key_check` não pode achar mais problemas do que antes.
- A versão 1 é o esquema de antes, com `IF NOT EXISTS`, e apaga e recria os triggers.
- Um banco de versão mais nova que o app é recusado com uma mensagem.
- A falha vai para a tela de erro do `App.tsx` com uma mensagem amigável, e o erro do SQLite fica no `cause`.
- O `migrator.ts` não usa o Expo e recebe a conexão por uma interface com `execAsync` e `getFirstAsync`, que o `expo-sqlite` já tem. Nos testes, o `node:sqlite` faz esse papel.
- A lista fica em `schema.ts`, e não num arquivo próprio, porque o Node que roda os testes não resolve import sem extensão. Os arquivos que os testes importam só se ligam por `import type`.
- Os pragmas `foreign_keys` e `recursive_triggers` saíram do esquema e foram para o `getDatabase`, porque valem por conexão.

Motivo:
- Com uma transação só, o banco sempre está numa versão inteira, e o teste de falha fica simples.
- Dentro de uma transação, o `PRAGMA foreign_keys` não tem efeito. Com as chaves ligadas, reconstruir uma tabela, que é o caminho do SQLite para mudar uma coluna (DADOS-2 e DADOS-3), apagaria as filhas pelo `ON DELETE CASCADE`. A comparação com o antes evita que um dado antigo inconsistente impeça o app de abrir.
- Os aparelhos já têm o banco sem versão. Com `IF NOT EXISTS`, a versão 1 só marca a versão neles, sem perder dados. Os triggers não guardam dados, e recriá-los garante que todo banco na versão 1 tenha os mesmos.
- O app antigo, aberto num banco já migrado, gravaria dados num esquema que ele não conhece.
- Antes, um erro na criação do banco ia só para o `console.log`, e o app abria como se tudo estivesse certo (primeiro item do BUG-6).
- Os testes rodam o mesmo código de migração do app, sem copiar a lógica.

**Reset de desenvolvimento** (pedido do Gabriel).
Decisão:
- Com dados no app e só no modo de desenvolvimento (`__DEV__`), o cartão de dados de exemplo em Configurações vira "Apagar tudo e carregar exemplo", em vermelho e com confirmação. No APK, nada muda: o cartão continua aparecendo só com o app vazio.
- O `resetToDemoData`, no `DemoDataService`, confere o `__DEV__` de novo antes de apagar.
- O `recreateDatabase` (`migrator.ts`) apaga todas as tabelas e aplica todas as migrações numa transação só, e depois os dados de exemplo entram como no app vazio. As configurações, como o tema, voltam ao padrão.
- O arquivo do banco não é apagado.
- O `getDatabase` passou a guardar a promessa da conexão, e o nome `petshop.db` ficou só no `database.ts` (`DATABASE_NAME`), usado também pelo `BackupService`.

Motivo:
- Testar o app com dados novos sem limpar os dados do app nas configurações do Android.
- A checagem no service impede que outro caminho apague os dados de um aparelho de verdade.
- O `expo-sqlite` conta quantas vezes a conexão foi aberta e se recusa a apagar o arquivo enquanto alguma continua aberta. Em desenvolvimento, cada recarga do app abre a conexão de novo, então apagar o arquivo falharia justamente onde o botão existe. Apagar pelo SQL funciona com a conexão aberta, é testado no SQLite em memória e, se algo falhar, mantém os dados antigos.
- Na abertura do app, o tema e o `initDatabase` pedem o banco ao mesmo tempo e podiam abrir duas conexões.

**Triggers da remarcação corrigidos (BUG-3 e BUG-4), na versão 2 do esquema.**
Decisão:
- A conclusão só conta na passagem de `concluido` de 0 para 1, no `trg_remarcacao_automatica` e no `trg_ultima_visita`.
- Resposta do Gabriel: ao editar um pet com pacote, a agenda é refeita quando muda qualquer campo que entra nela: ligar o pacote, trocar o pacote, a data de início, o horário, o serviço ou o valor, ou reativar o pet. Nome, observação, raça e os outros campos não mexem na agenda.
- Ao refazer, só os automáticos pendentes de hoje em diante (`'localtime'`) são apagados e gerados de novo. Os vencidos, os concluídos e os manuais ficam como estão.
- A versão 2 traz o texto inteiro dos três triggers, com `DROP` e `CREATE`, e não reaproveita as constantes da versão 1. Um script conferiu que só as condições e os filtros mudaram.

Motivo:
- No SQLite, `AFTER UPDATE OF coluna` dispara sempre que o `UPDATE` cita a coluna, e os formulários regravam todos os campos. Só a comparação entre `OLD` e `NEW` separa uma mudança de verdade.
- Com o horário, o serviço ou o valor novos, os automáticos futuros que já existem mudam junto, em vez de a agenda ficar com valores misturados.
- O "hoje" do filtro novo já usa o fuso do aparelho, como o BUG-7 vai fazer em todo o banco.
- Uma versão publicada não muda. Constantes compartilhadas entre versões convidariam a mudar a versão 1 sem querer.

**Datas em texto junto com o dinheiro em centavos** (resposta à pergunta 15).
Decisão: o DADOS-2 (dinheiro em centavos) e o DADOS-3 (datas em texto `AAAA-MM-DD`) entram na mesma versão do esquema, junto com a parte do BUG-7 que precisa do banco (triggers e `DEFAULT` com `'localtime'`). Antes dela, duas etapas sem migração: primeiro as datas do app num lugar só, com o "hoje" no fuso do aparelho (BUG-7); depois o dinheiro num lugar só.
Motivo:
- Mudar o tipo de uma coluna no SQLite exige reconstruir a tabela, e o `DEFAULT` do `criado_em` também. Com as duas mudanças juntas, cada tabela é reconstruída uma vez só, e os triggers, que fazem conta com as datas, são reescritos uma vez só.
- Com as conversões num lugar só, a migração do banco muda poucos arquivos do app, e cada etapa fica pequena o bastante para revisar.

**Dinheiro num lugar só (etapa 2 do DADOS-2 e DADOS-3).**
Decisão:
- `src/utils/dinheiro.ts` tem a máscara de digitação, a conversão entre o texto e os centavos e o formato gravado no banco.
- O `InputInfo` deixou de aplicar a máscara de valor em todo campo com teclado numérico. Cada campo de valor usa a máscara no próprio `setItem`, como o horário e o telefone já faziam.
- Os controllers gravam o valor sempre com duas casas ("12,5" vira "12,50") e recusam um valor fora do formato, como só uma vírgula. O agendamento sem valor fica com "0,00", o padrão da tabela. O valor do pacote é obrigatório e precisa ser válido com a remarcação ligada; sem ela, fica como veio.
- O valor do pacote agora aceita até duas casas na digitação, como o do agendamento.

Motivo:
- O campo genérico decidia pelo tipo de teclado que o texto era dinheiro, inclusive no horário.
- Com os valores novos sempre no mesmo formato, a migração para centavos tem menos variações para tratar. Ela ainda converte os valores antigos como estiverem.

**Versão 3 do esquema, parte do banco (etapa 3 do DADOS-2 e DADOS-3), em 2026-11-08.**
Decisão:
- Cada tabela é trocada pelos passos que o SQLite indica: criar a nova, copiar convertendo, apagar a antiga e renomear. Os triggers saem antes e voltam depois, na ordem de criação da versão 2.
- Datas: o número `AAAAMMDD` vira `'AAAA-MM-DD'`. O que não tiver 8 dígitos fica como está, em vez de travar a migração.
- Dinheiro: o texto vira centavos pela conta no próprio texto, sem ponto flutuante. Vazio vira 0, o ponto conta como vírgula, e o que passar de duas casas é descartado. O valor do pacote nulo continua nulo.
- A contagem de ids (`sqlite_sequence`) passa para a tabela nova.
- A sobra da divisão do pacote vai para os primeiros atendimentos do mês. Na agenda gerada, a posição vem da própria sequência; no próximo criado pela conclusão, da quantidade de automáticos que o mês já tem.
- A v3 traz o texto inteiro do que cria, como a v2. Só o período da remarcação vem da v1.

Motivo:
- Uma migração que falha impede o app de abrir. Um dado estranho mantido é melhor que um app travado.
- As máscaras antigas só deixavam dígitos e vírgula, mas uma delas não limitava as casas decimais.
- Sem a contagem, um id de agendamento apagado poderia voltar a ser usado.
- Com a v3 grande, a etapa 3 foi dividida em três partes (banco, app, backup e PR), uma por conversa, para cada uma caber inteira no contexto.

**Versão 3 do esquema, parte do app (3b), em 2026-11-08.**
Decisão:
- O app usa os formatos do banco direto: o tipo `IsoDate` ("AAAA-MM-DD") em `datas.ts` e o `Cents` (centavos inteiros) em `dinheiro.ts`. Saíram as conversões de e para o número `AAAAMMDD` (`todayDb`, `dbToIso`, `dbToBr`, `isoToDb`, `brToDb`) e o `normalizeMoney`.
- Os modelos (`Appointment`, `Pet`, `Owner`) têm a data como `IsoDate` e o valor como `Cents`. Os formulários guardam o valor como o texto do campo e a data em ISO, que é o formato do seletor.
- O texto vira centavos na tela, ao salvar, pelo `parseMoneyInput`: vazio vira nulo, e um valor fora do formato lança o erro com a mensagem para o usuário. A montagem do modelo foi para dentro do `try`, para essa mensagem aparecer no `useError`.
- Os controllers conferem o resultado: data no formato `AAAA-MM-DD` (`isIsoDate`) e centavos inteiros sem sinal (`isValidCents`). O agendamento sem valor fica com 0. O pacote sem remarcação pode ficar sem valor; com ela, o valor é obrigatório.
- O SQL dos relatórios que faz conta com data (comparativo mensal e pets ausentes) foi para `src/repository/sql/relatoriosSql.ts`, com testes. O comparativo mensal passou a usar uma consulta só, com o intervalo como parâmetro.

Motivo:
- Com o banco em ISO, converter para outro formato no app só criaria pontos de erro. O seletor e o calendário já usavam ISO.
- O usuário digita texto, mas o controller recebe o modelo já tipado. A conversão fica na borda, num util só, e o controller valida o que vai para o banco.
- Os relatórios montavam a data com `printf` e `substr` sobre o número, e o SQL deles não tinha teste. O cálculo antigo do primeiro mês do comparativo também errava nos dias 29 a 31, porque o `setMonth` passava para o mês seguinte.

**Backup de versão anterior (3c), em 2026-11-08.**
Decisão:
- A cópia do arquivo importado é aberta numa conexão só dela e passa pelo mesmo `migrateDatabase` do banco do aparelho. Só depois ela é anexada e copiada para o app, como antes.
- Antes das migrações, a cópia precisa ter as sete tabelas do backup. Um arquivo sem elas, ou que nem abre como banco SQLite, é recusado com uma mensagem só ("não é um backup do PetShop Manager"). Um backup de versão mais nova tem mensagem própria ("Este backup é de uma versão mais nova do app"), porque a da abertura do app fala dos dados do aparelho.
- A atualização e a restauração ficam em `src/config/backupRestore.ts`, sem o Expo, e os testes rodam esse código. O `BackupService` só cuida dos arquivos. A restauração reaproveita o `withForeignKeysOff` e o `inTransaction` do `migrator.ts`, que passaram a ser exportados.
- O `ATTACH` recebe o caminho como parâmetro, em vez de montar o texto do comando.
- A cópia temporária e os arquivos que o SQLite cria ao lado dela (`-wal`, `-shm`, `-journal`) são apagados no fim, com qualquer resultado.

Motivo:
- Migrar a cópia, e não o banco do app, deixa os dados do aparelho intactos se o backup tiver algum problema. É o mesmo código que já migra os aparelhos, com os mesmos testes.
- Sem a checagem das tabelas, as migrações criariam o esquema vazio num arquivo qualquer, e a importação apagaria os dados do app em vez de falhar como antes.
- O resto do BKP-1 (integridade, `trusted_schema`, colunas nomeadas e o ponteiro da remarcação) continua na Parte 4.

## 2026-11-09

**Erros num lugar só (ERRO-1).**
Contexto: o mesmo `handleError` estava copiado em 8 arquivos, a conversão `e instanceof Error ? e.message : ...` aparecia 12 vezes, o backup e os dados de exemplo tinham o próprio modal, e a mensagem de qualquer erro, inclusive do SQLite, chegava à tela.
Decisão:
- A falha prevista é um `AppError` (`src/errors/AppError.ts`), com um código e uma mensagem de `src/globals/messages.ts`. Só ela aparece na tela. Qualquer outro erro mostra "Algo deu errado. Tente de novo." e vai inteiro para o log, pelo `logError`.
- O `showError` recebe o erro como veio, e não o texto: nenhuma tela monta a mensagem.
- Dois hooks: o `useAsyncAction`, para as ações com carregamento (salvar, importar, carregar o exemplo), com a trava do toque duplo; e o `useAsyncData`, para os dados que uma tela carrega ao abrir, como os relatórios.
- Cada falha de validação tem a sua frase. O dono separa nome, telefone vazio e telefone inválido; o agendamento separa pet, serviço, data, horário e valor. Um teste garante que nenhuma mensagem se repete.
- A validação da raça (espécie e nome) saiu do modal e foi para o `createRaceService`, que lança `AppError` em vez de devolver `{ success, error }`.
- As validações continuam nos controllers. O schema por entidade é o VALID-1, que depende da pergunta 13 (Zod ou validadores próprios).

Motivo:
- A regra de segurança do Gabriel: a tela não mostra SQL, nome de tabela nem detalhe interno, que ficam no log.
- Um módulo só cria, registra e trata os erros, e a mensagem de cada falha fica num lugar só, em `globals`.
- Os relatórios chamavam o `showError` durante o render. Pela leitura do código, o modal voltava a abrir a cada vez que era fechado (provável).

**Ações de Cadastros esperam o banco (BUG-6).**
Contexto: desativar e reativar chamavam o controller sem `await`, e o item saía da lista mesmo com falha. O modal de desativar buscava o registro no banco só para mostrar o nome, sem tratar erro.
Decisão:
- Desativar e reativar usam o `useAsyncAction`, como as outras ações do app. O item sai da lista só depois que o banco confirma.
- O nome do modal vem da lista que a tela já tem. A existência do registro continua conferida pelo controller, na hora de desativar.
- A lista tira o item na hora, sem recarregar. O total da paginação fica para o BUG-5, que junta contagem e lista.

Motivo:
- Uma busca a menos é um caminho de falha a menos, e a resposta do controller (`NOT_FOUND`) já cobre o registro que sumiu.
- Recarregar a lista inteira mudaria a página que o usuário está vendo, e a contagem certa depende do BUG-5.

**Lista e total da busca com o mesmo filtro (BUG-5).**
Contexto: a lista e a contagem de Cadastros eram consultas separadas, escritas à mão. A dos donos contava em `nome`, com acento, e só os ativos. Os seletores de dono e de pet repetiam o par lista mais contagem, e uma busca antiga podia chegar depois da nova e tomar o lugar dela.
Decisão:
- Uma função (`pagedNameSearch`) monta a página e a contagem com o mesmo FROM, os mesmos JOINs e o mesmo filtro, e o repository devolve `{ items, total }`. As buscas e contagens antigas saíram.
- O hook `useSearchPage` faz a busca nas três telas que pagina por nome. Só a resposta mais recente entra na tela.
- Depois de desativar ou reativar, Cadastros busca a mesma página de novo, em vez de tirar o item da lista na hora (revê o que foi decidido no BUG-6): o próximo item sobe e o total fica certo.
- O id desempata a ordem; `%` e `_` digitados são texto (`ESCAPE`); o texto da busca vai até 100 caracteres.
- Da varredura, aprovado pelo Gabriel: sem texto, os mais novos primeiro; com texto, em ordem alfabética (antes saía de Z a A). A ordem deixou de ser parâmetro, porque as três telas pediam a mesma, e assim nada vindo da tela entra no texto do SQL. A aba ou o modal que fecha limpa a lista, para não reabrir com a da última vez.

Motivo:
- A mesma função nos dois comandos é o que garante que o total bate com a lista, e o teste confere nos dois status, com e sem acento.
- Recarregar custa uma consulta local e evita manter à mão a página e o total.
- A regra de segurança do Gabriel: entrada validada no servidor e texto do usuário nunca como parte do comando.

**Nomes de desativar adiantados do NOMES-1.**
Contexto: na varredura do PR #24, o `deleteOwner`, o `deletePet` e o `onConfirmDelete` desativam, e não apagam, e o `activeOwner` e o `activePet` reativam. O Gabriel aprovou trocar os nomes antes do NOMES-1, que é da Parte 7 e envolve os parceiros.
Decisão: um PR `refactor` só com os identificadores (`deactivate*`, `activate*`, `onDeactivate`, `onActivate`, `onConfirm`) e o que ficou sem uso (o `type` do modal, estilos e um import). Os nomes dos arquivos e a pasta `Botões` ficam para o NOMES-1.
Motivo: o nome errado leva quem lê a pensar que o registro some. Renomear arquivos mexe em mais imports e combina melhor com o resto do NOMES-1, conversado com os parceiros.

**Resto do BKP-1: backup e restauração confiáveis.**
Contexto: a 3c já conferia a versão e as tabelas. Faltava a integridade do arquivo, o `trusted_schema`, a cópia pelo nome das colunas (era `SELECT *`) e o ponteiro da remarcação, que o trigger de cadastro do pet refazia na cópia. A exportação deixava a cópia no cache com nome fixo.
Decisão:
- O `PRAGMA integrity_check(1)` é a primeira leitura da cópia. Um arquivo que nem abre, ou com esquema barrado pelo `trusted_schema`, continua com a mensagem "não é um backup"; um arquivo danificado ganhou a sua ("Este backup está danificado"), e o problema achado vai para o log pelo `cause`.
- O `trusted_schema` fica desligado em todas as conexões, no `SQL_CONNECTION_PRAGMAS`, e não só na importação. O esquema do app só usa as funções do SQLite, e os 136 testes que já existiam passaram com ele desligado.
- As colunas copiadas vêm do esquema do app (`pragma_table_info('tabela', 'main')`), sem a coluna gerada. Um backup sem alguma delas é recusado antes da transação; uma coluna a mais fica de fora.
- Os triggers do app saem durante a cópia e voltam pelo comando guardado no próprio banco do app, na mesma ordem e dentro da mesma transação. Assim a agenda e o ponteiro entram como estão no backup, e uma falha no meio traz os triggers de volta com o `ROLLBACK`.
- A contagem de ids (`sqlite_sequence`) das sete tabelas também vem do backup.
- Decisão do Gabriel: a exportação grava `petshop-AAAA-MM-DD.db` numa pasta própria do cache (`backups/`), e cada exportação apaga as cópias anteriores, inclusive a de nome fixo das versões antigas. A cópia não é apagada logo depois de compartilhar.

Motivo:
- Desligar os triggers é o que o plano pedia ("triggers de remarcação sem efeito durante a restauração") e vale para qualquer trigger novo. Corrigir só o ponteiro depois da cópia dependeria de saber o que cada trigger mexe, e a agenda gerada à toa ainda gastava ids.
- Ler as colunas do esquema do app evita uma lista escrita à mão, que esqueceria uma coluna nova numa próxima versão. Nenhum nome do arquivo importado entra no texto do SQL.
- Com a contagem de ids do backup, um id apagado no aparelho de origem não volta a ser usado, como na v3.
- No Android, o `shareAsync` termina quando o menu de compartilhar fecha, mas o Drive ou o WhatsApp podem ler o arquivo depois disso. Apagar na hora poderia fazer o envio falhar; o cache é privado do app.

**Quatro agentes em paralelo.**
Contexto: o Gabriel pediu vários agentes ao mesmo tempo, cada um na sua branch e com o seu PR, sem um mexer no código do outro.
Decisão:
- Um worktree e uma branch por item: BUG-8 (PR #30), REPO-3 (#29), A11Y-1 (#31) e VALID-1 (#32).
- Cada agente tem uma zona de arquivos só dele. O que precisava mudar fora da zona foi anotado para o coordenador, e não feito.
- A documentação vem num PR próprio, para os quatro não disputarem os mesmos arquivos de `docs/`.
Motivo: PRs independentes, que o Gabriel revisa e mescla em qualquer ordem. Nenhum arquivo apareceu em dois PRs, e o VALID-1 entrou sobre os outros três sem conflito.

**Validação com Zod (VALID-1, pergunta 13).**
Contexto: parte da entrada era validada à mão nos controllers, parte não (horário "9", e-mail sem formato, texto sem `trim`).
Decisão do Gabriel: Zod. A versão é a 4.6.7, instalada em 2026-11-09 com a liberação dele, só daquela vez. Conferido antes:
- licença MIT, sem dependências e sem script de instalação;
- assinatura do registro e proveniência SLSA do GitHub Actions do próprio repositório do Zod;
- nenhum alerta do GitHub para a 4.6.7 (o alerta alto do Zod vai até a 4.6.5);
- o zod 3 continua só dentro do `expo`, que ainda exige essa versão.

Decisão do PR #32:
- Os schemas ficam em `src/validation/`, um por entidade, montados com os campos de `fields.ts` (texto com `trim` e tamanho máximo, id, data real, horário `HH:MM`, centavos, sim ou não). O `parseInput` converte a falha no `AppError` com a mensagem de `messages.ts`. Nenhuma mensagem do Zod chega à tela.
- A validação fica no controller, que já validava. No service, a consulta de existência viria antes, e um pet sem dono mostraria "Dono não encontrado" em vez de "Escolha o dono do pet".
- Os services recebem os tipos derivados dos schemas (`OwnerData`, `PetData`, `AppointmentData`). Os modelos de `src/model/` não mudam, porque descrevem a linha do banco, que pode ter dado antigo.
- Id fora do formato responde como "não encontrado". Tipo errado ou campo ausente mostram a mensagem genérica de entrada inválida, e o erro do Zod vai para o log pelo `cause`.
- O `createPetSchemas` recebe os enums do pet, porque o `consts.ts` importa o React Native e não roda no Node.
- E-mail, endereço e observações vazios passam a gravar `null`, e o horário padrão vazio vira `00:00`.

Motivo: a regra do Gabriel pede schema em toda entrada, tipos derivados da fonte e mensagem por falha em `globals`. O preço é o pacote: o JavaScript do Android foi de 2,78 MB para 3,46 MB, e cerca de 340 KB são as traduções do Zod, que o app não usa.

**Voltar do Android (BUG-8, pergunta 16).**
Contexto: a navegação é própria e não tratava o `BackHandler`, então o voltar do sistema fechava o app em qualquer tela.
Decisão do Gabriel: o `BackHandler` agora, e a biblioteca de navegação no ARQ-3.

Decisão do PR #30:
- O mapa de qual tela volta para qual fica em `src/config/navigation.ts` (`backRouteOf`), e a `TitleBar` deixou de receber o destino.
- Há um listener só, na raiz (`useAndroidBackButton`, no `App.tsx`). O botão da tela e o do Android chamam o mesmo `requestBack()` do `ScreenController`.
- O formulário em edição registra uma guarda (`useBackGuard`), que abre a mesma confirmação nos dois botões. Sem guarda, vale o mapa. No Calendário, o voltar fecha o app.
- O `Screen` virou objeto `as const`, para os testes do Node lerem o mapa.
- O `ButtonBack` ganhou papel e rótulo, sem `hitSlop`, porque já mede 50 dp.

Motivo: um caminho só para os dois botões. Os relatórios ficam sem a `TitleBar` enquanto carregam, e o listener na raiz cobre esse momento. A guarda tem o mesmo papel do `usePreventRemove` do React Navigation, o que facilita o ARQ-3.

**Acessibilidade (A11Y-1).**
Contexto: botões de ícone sem nome para o leitor de tela, o `Toggle` mudo, áreas de toque de 38 dp e o texto branco sobre o verde com contraste de 3,4:1.
Decisão do PR #31:
- Botão só com ícone usa o `IconButton` (ou o `ActionIconButton`, que juntou editar, desativar e reativar), com papel, rótulo obrigatório e área de 48 dp.
- Os rótulos ficam em `src/globals/accessibilityLabels.ts` (`A11Y_LABELS`), e os enfeites usam `HIDDEN_FROM_SCREEN_READER`.
- Os verdes do tema claro escureceram até passar de 4,5:1. No tema escuro, o texto sobre cor cheia usa a cor de fundo. Texto cinza usa o `TEXT_MUTED`, nunca cor de borda nem opacidade.
- A paleta saiu do `ThemeProvider` para `src/view/Themes/colors.ts`, para o teste conferir o contraste no Node. Um par novo de texto e fundo entra na lista do teste.

Motivo: as diretrizes de acessibilidade do Android (48 dp e 4,5:1), num padrão só, que um teste protege.

**Limpeza (REPO-3).**
Decisão do PR #29:
- Sai só o que nada usa, conferido por busca no repositório inteiro, com o `app.json` e os testes.
- Os métodos de repository que um service ainda chama ficam até saírem das três camadas juntos.
- As sobras em arquivos de outras áreas ficaram anotadas em `proximos-passos.md`.

Motivo: sem mudar comportamento, e sem mexer nos arquivos dos outros três PRs que rodavam ao mesmo tempo.

**Pendências entre áreas dos PRs #29 a #32.**
Contexto: os quatro agentes anotaram o que acharam fora da própria zona, em cinco itens, mais as sugestões das varreduras.
Decisão do Gabriel: os itens 1 a 3 (voltar com modal aberto, validação e acessibilidade dos formulários) num PR só, com três sugestões: os textos do modal de voltar em `messages.ts`, o contraste do `Toggle` desligado e um `CloseButton` para os três modais. A limpeza (item 4) e o tamanho do pacote com o Zod (item 5) ficam para depois.

Decisão do PR #34:
- Os três modais do item 1 já tinham `onRequestClose` desde o PR #31; saiu só o `screenBack` morto do `DefaultHeader`.
- Os textos do voltar ficam em `DIALOGS`, no `messages.ts`, e não em `MESSAGES`: o teste do ERRO-1 exige que toda mensagem de `MESSAGES` seja uma frase terminada em ponto, e o título do modal é uma pergunta e o botão é um rótulo.
- A busca de raças ganhou um SQL só para a página e a contagem (`breedsSql.ts`). Sem texto, o padrão `%%` traz todas as raças, e o repository ficou com dois métodos em vez de quatro.
- Com a remarcação desligada, o pacote, o início e o valor do pet vão como `null`, como o trigger de desativar o pet já faz com o início.
- O `CloseButton` usa o círculo do seletor de lista, e o ✕ do calendário e o da nova raça mudaram de cara.
- O trilho do `Toggle` desligado (`DESATIVADO`) chegou a 3:1 com o fundo nos dois temas, o mínimo da WCAG para o que não é texto (critério 1.4.11). O teste de contraste ganhou uma lista de pares de 3:1.
- Os botões Salvar dos três formulários viraram o `SaveButton`, e os títulos "DADOS…", o `FormSectionTitle`.

Motivo: as regras do Gabriel pedem limites e textos num lugar só, entrada validada por schema e código repetido extraído. Um componente por botão e por título faz os ajustes de acessibilidade valerem nos três formulários de uma vez.

**Segunda rodada de quatro agentes em paralelo (PRs #35 a #38).**
Contexto: o Gabriel escolheu quatro frentes das pendências e das sugestões das varreduras: limpeza (REPO-3), tema e `Toggle`, validação e raças, e navegação.
Decisão:
- Como na primeira rodada, cada frente teve um worktree, uma branch e uma zona de arquivos só dela. A novidade: a limpeza de imports, variáveis e comentários sem uso dentro de um arquivo coube ao dono da zona, e não ao agente de limpeza. Assim nenhum arquivo apareceu em dois PRs.
- O coordenador juntou as quatro branches num worktree local e rodou o conjunto: typecheck limpo, 331 testes passando, e o `tsc --noUnusedLocals --noUnusedParameters` sem nenhum erro. Essas flags ficam para depois do merge dos quatro, porque cada branch sozinha ainda falha nas zonas dos outros.
- Esta documentação vem num PR próprio, como na primeira rodada.

Decisões dos PRs:
- PR #35, tema: no tema escuro, a bolinha do `Toggle` ligado ficou escura (`#0F1115`), como no Material 3, porque nem o branco passa de 2,54:1 sobre o verde. O `withAlpha` lança erro com cor ou opacidade inválida, porque isso é bug de código e não entrada do usuário.
- PR #36, navegação: o formulário compara o estado atual com o que abriu, campo a campo, e `null`, `undefined` e `""` contam como o mesmo vazio. O nome do dono e o da raça ficam fora da comparação, porque a tela os busca pelo id ao abrir. A prop `confirmReturn` do `TitleBar` virou `hasUnsavedChanges`.
- PR #37, limpeza: o `ConfigBuilder` e oito métodos sem uso de agendamento e dono saíram, entre eles o `getAppointmentsByDate`, que tinha SQL inválido. O `OwnerBuilder` continua, porque o formulário de dono usa. O `CONCLUDE_APPOINTMENT_SQL` também saiu, e os testes de remarcação concluem o agendamento pelo `UPDATE_APPOINTMENT_SQL`, como o app faz. Por isso a lista de 2026-11-08 ("concluir") não vale mais.
- PR #38, validação e raças:
  - a raça repetida é comparada no código, pelo nome sem acento, e não pela coluna `nome_raca_normalized`. Motivo: a carga inicial tirou a pontuação dessa coluna ("vira-lata srd"), e o app não tira. Assim não foi preciso migração;
  - os valores do pet saíram para `petEnums.ts`, como objetos `as const`, que rodam no Node. O `createPetSchemas` deixou de receber os enums, e a nota do PR #32 sobre isso não vale mais;
  - o enum `ORDER` saiu.

Motivo: a mesma da primeira rodada. Os PRs são independentes, e o Gabriel revisa e mescla em qualquer ordem.

**Pendências da segunda rodada, num PR de integração.**
Contexto: os agentes dos PRs #35 a #38 anotaram sete ajustes fora da própria zona, e a varredura final achou mais dois.
Decisão do Gabriel: o coordenador faz todos num PR só, depois do merge dos quatro.
Decisão do PR:
- O formulário do pet ganhou um tipo (`PetForm`), e as abas recebem o `updateField` tipado pelo `UpdateField<T>` do `useFormState`. Antes, cada aba tinha uma cópia parcial do formulário, e o `any` escondia campos com o tipo errado (o porte era `string`).
- O `PacoteRemarcacao` deixou de imitar o enum numérico, e o pacote salvo é conferido pelo `isPacoteRemarcacao`. Assim ele fica igual aos outros valores do pet.
- Limpar a raça ao trocar a espécie e recomeçar o pacote ao ligar a remarcação saíram de `useEffect` e foram para o handler do toque. O efeito rodava também ao abrir a tela e dependia de uma ref para pular o primeiro render.
- O `UPDATE_PET_REMARCACAO_SQL` foi para o teste, que é o único que o usa. O app grava o pet inteiro.
Motivo: as regras pedem TypeScript estrito, sem `any`, e campos explícitos nas consultas. Com tudo no `main`, as flags de sobras do `tsconfig.json` já passam.

**Arquitetura sem os parceiros (perguntas 14, 17, 19, 20 e 21).**
Contexto: a Parte 7 mexe em quase todos os arquivos, e o plano previa combinar com o João Pedro e o Gustavo. O Gabriel avisou que os dois não estão mexendo no código e não vão mexer: a refatoração é feita só por ele e pelo Claude, e os dois sabem que ela vai para o portfólio dos três.
Decisão do Gabriel, nas recomendações do Claude:
- P17 (ARQ-1): a pasta `app/` vira `src/`.
- P21 (NOMES-1): identificadores em inglês, depois do ARQ-1, um PR por camada.
- P14 (ARQ-2): a remarcação sai dos triggers e vira uma função TypeScript testada; os triggers ficam com a integridade e a cascata.
- P20 (SEG-1): o backup automático do Android é desligado; fica a exportação manual do app.
- P19 (TEMA-1): na primeira abertura, o app segue o tema do sistema; depois, vale a escolha do usuário.
- A Parte 7 não espera mais a conversa com os parceiros. O React Navigation do ARQ-3 entra com a análise de segurança de costume, e quem instala é o Gabriel.
Motivo: sem outra pessoa no código, mover pastas e renomear não gera conflito. A pasta `src/` evita o conflito com o expo-router; os nomes em inglês seguem a regra do Gabriel; a regra da remarcação fica legível e testável; e o banco, com nome, telefone e endereço de clientes, não vai para o Drive sem ninguém pedir.

## 2026-11-10

**Checklist de perguntas por momento do trabalho.**
Contexto: o Gabriel trouxe o checklist que usa ao desenvolver, com perguntas por tipo de entrega, e pediu que o Claude o use como o próprio julgamento, antes de entregar.
Decisão (PR #43):
- `docs/checklist-perguntas.md` é o índice: o que ler ao iniciar, ao decidir por conta, durante, ao entregar e depois do merge, com uma linha de descrição por arquivo.
- `docs/checklist/` tem um arquivo por tipo de tarefa (planejamento, features, bugs, refactors) e por área, com uma nota de como cada pergunta vale no app, que não tem API, login nem servidor.
- O `CLAUDE.md` local manda ler o índice nesses três momentos, e os agentes recebem a mesma instrução. As respostas que importam vão para a seção "Checklist" do PR.
Motivo: as perguntas do Gabriel passam a ser respondidas antes de ele precisar fazê-las.

**Terceira rodada de agentes em paralelo (PRs #44 a #47).**
Contexto: o Gabriel pediu vários agentes ao mesmo tempo, cada um na sua branch e com PR para o `main`, sem mexer no código do outro.
Decisão:
- Quatro frentes já decididas e com arquivos separados: PERF-1 (imagens), SEG-1 (backup), relatórios pelo service e ARQ-2. O NOMES-1 ficou de fora, porque mexe em todos os arquivos, e o tema do sistema (P19) também, porque precisaria de uma migração, como o ARQ-2.
- `messages.ts` e o helper dos testes tiveram um dono só. As pendências fora da zona foram para a seção "Pendências entre áreas" do PR, e o coordenador conferiu o diff de cada branch: nenhuma saiu da zona.
- Problema: os agentes partiram da branch do ARQ-1 (PR #42) antes do merge. Com o squash, os PRs ficaram em conflito ou com o CI vermelho. O coordenador reaplicou cada commit em cima do `main` (`git rebase --onto`), conferiu as quatro juntas (409 testes) e atualizou as branches.
Motivo: frentes separadas por arquivo não geram conflito entre si. Daqui em diante, os agentes partem só do `main` atualizado.

Decisões dos PRs:
- PR #45, SEG-1:
  - os textos dos dois modais do backup (exportar e importar) ficam em `DIALOGS`;
  - um estado só (`pendingDialog`) garante que os dois modais nunca abrem juntos;
  - a transferência direta entre celulares no Android 12 ou mais novo continua possível, porque bloqueá-la exigiria um config plugin próprio, e é o próprio dono levando os dados;
  - o backup com senha não foi feito: virou a pergunta 24.
- PR #46, relatórios:
  - as telas de relatório e os hooks das listas de serviço e pagamento chamam o service direto, sem controller, porque não há entrada do usuário para validar, como o backup e os dados de exemplo;
  - os campos que nenhuma tela lia saíram das consultas, entre eles o telefone do dono nos pets ausentes;
  - o resultado dos 12 gráficos foi comparado antes e depois, sobre os dados de exemplo, e saiu idêntico.
- PR #47, ARQ-2:
  - ficam dois triggers que só apagam (`trg_pet_remarcacao_desativar` e `trg_pet_desativar_limpar_remarcacao`), porque entram em "integridade e cascata" da pergunta 14;
  - a agenda dos dados de exemplo usa o mesmo "hoje" do `buildDemoDataSql`, e não o relógio do SQLite;
  - um segundo toque com uma gravação em andamento falha no `BEGIN IMMEDIATE` antes de gravar e mostra a mensagem padrão. Antes, os dois cadastros entravam. O `useAsyncAction` já barra o toque duplo na tela.

**Varredura da terceira rodada (PRs #48 e #49).**
Decisão do Gabriel: aplicar as quatro sugestões.
- PR #48: o tipo `BarChartItem` saiu do componente para `utils/relatorios/graficos.ts`, porque o service não pode depender da tela; as contas de calendário do ARQ-2 foram para `src/utils/datas.ts`, para as datas ficarem num lugar só; o ícone do pacote virou um PNG de 84 px.
- PR #49: a versão 5 do esquema troca o horário padrão nulo por `00:00`. Um pet antigo com pacote e sem horário não conseguia concluir o automático, porque a `hora` do agendamento é `NOT NULL`. Era assim nos triggers, e o ARQ-2 manteve de propósito, para não misturar refactor com correção. O `NOT NULL` na coluna fica para o DADOS-4, que recria a tabela.
Motivo: as regras pedem camadas na direção certa, datas num módulo só e dado antigo tratado por migração.


**DADOS-4: integridade no esquema, versão 6 (PRs #53, #56 e #57).**
Contexto: o PR #53 pôs `CHECK`, `NOT NULL` e chaves estrangeiras no esquema e trocou o serviço e a forma de pagamento do texto pelo id. A revisão apontou que o id sozinho faz o histórico acompanhar a lista (renomear "PIX" mudaria o que foi cobrado em meses fechados), que a conversão do dado antigo descartava valores sem avisar e que a lista passaria a oferecer nomes que nunca foram da lista. O Gabriel decidiu as correções em 2026-11-10.
Decisão:
- **Versão 6 editada no lugar, sem versão 7.** Só vale porque a v6 não rodou em nenhum aparelho: o PR #53 foi mesclado, mas nenhum build com ela foi aberto. O cabeçalho do arquivo registra isso, e a v6 está congelada daqui em diante. Se algum aparelho tiver aberto o app pelo `main` desde o PR #53, o banco dele já está na v6 antiga e precisa de "Apagar tudo" ou de reinstalar.
- **1. Nome da época no agendamento.** `servico_nome` (obrigatório) e `tipo_pgto_nome`, com o `CHECK` de que id e nome do pagamento são nulos juntos. A leitura mostra o nome gravado, sem JOIN. Editar sem trocar mantém o id, mesmo depois de renomear o item.
- **O pagamento segue a mesma regra do serviço.** É histórico financeiro, os itens ocultos valem para os dois e uma regra só é mais simples de manter e de testar.
- **O pet não ganha nome gravado.** O serviço padrão é configuração de hoje, e não histórico.
- **2. Valor antigo na observação.** O que a conversão joga fora vai numa nota no fim da `observacoes` do pet ou da `observacao` do agendamento: `Porte antigo`, `Serviço padrão antigo`, `Horário padrão antigo`, `Valor do pacote antigo`, `Horário antigo` e `Valor antigo`, com o valor citado em até 40 caracteres e o dinheiro em reais. A observação que já existia fica intacta. A normalização (`9:30` para `09:30`, `Médio` para `MEDIO`) e o nulo ou vazio não ganham nota.
- **3. Nomes fora da lista ficam ocultos.** `is_ativo` em `service_type` e `payment_methods`. O nome que algum agendamento usa e que não estava na lista entra oculto: o formulário não o oferece, o histórico o mostra, e o agendamento que o tem gravado pode ser editado sem trocá-lo. Na criação ou na troca, só item ativo.
- **4. Serviços padrão garantidos.** Banho, Banho e Tosa e Banho e Higiênica (os três de `TipoServico`) estão sempre na lista e ativos, antes de manter os desconhecidos, para um "Banho" que só existe no texto dos agendamentos não entrar oculto.
- **5. Dinheiro sem negativo.** `CHECK (valor >= 0)` no agendamento e `CHECK (valor_pacote >= 0)` no pet (o nulo continua passando). O dado negativo vira 0, e não o valor absoluto: 0 é o `DEFAULT` e o "sem valor" do app, o `abs()` inventaria uma cobrança que ninguém fez, e o original fica na nota.
- **Pet com serviço padrão fora dos três.** O formulário do pet só oferece os três, então outro serviço é valor inválido, como o porte, e segue a regra do item 2: o pet passa a apontar para o "Banho", com a nota `Serviço padrão antigo`. O nome só continua na lista, oculto, se algum agendamento o usa. Assim o seletor do pet e a regra de escolha do `petSchema` não mudam.
- **Limites de tamanho só no que mudou.** A nota engorda a observação para além de `MAX_NOTES_LENGTH` (250), e um nome oculto pode passar de `MAX_LIST_ITEM_LENGTH` (50). Quem edita sem trocar não pode ser recusado. Na edição, os controllers do pet e do agendamento passam o registro gravado ao schema (`petSchemaFor` e `appointmentSchemaFor`), e os limites de observação, serviço e forma de pagamento valem só para o que difere do gravado, com o teto de `MAX_STORED_TEXT_LENGTH` (1000) contra entrada gigante. Na criação, nada muda. O campo da tela abre a observação já gravada inteira (o `maxLength` é o maior entre o limite e o tamanho carregado), porque o `TextInput` do Android corta o valor que passa do `maxLength` ao carregar.
Motivo: o histórico financeiro não pode mudar quando a lista muda; o dado que o usuário digitou não pode sumir em silêncio; e o formulário só deve oferecer o que o app trata hoje. A pergunta (a) do PR #56, sobre o pet com serviço oculto, deixou de existir com a decisão do pet fora dos três. Segue em aberto a (b): o próximo automático copia a observação do concluído, então a nota da migração se repete nos automáticos.
Entrega: o #56 foi mesclado só com o primeiro commit, porque o segundo, com o pet fora dos três e os limites, chegou depois do merge. Esse segundo commit virou o PR #57, a partir do `main`.

## 2026-11-11

**NOMES-1 inteiro num PR, com as colunas do banco (versão 7) e o tema do sistema (P19).**
Contexto: o plano dividia o NOMES-1 em um PR por camada. O Gabriel pediu tudo de uma vez, já que ninguém usa o app hoje, e aprovou renomear também as colunas do banco.
Decisão:
- Identificadores, arquivos e pastas em inglês em todas as camadas, telas e testes; comentários e mensagens seguem em português. A pasta `Botões` virou `registry/buttons`, e os hooks ganharam o `use` (`useOwners`, `useBreeds`, `useCalendar`, `useAppointmentForm`).
- Versão 7 do esquema: tabelas, colunas e códigos em inglês (`breeds`, `services`, `settings`; `owner_id`, `is_active`...; `DOG`, `SMALL`...). O campo do modelo é igual à coluna. As versões 1 a 6 ficam como estão, congeladas.
- O pacote de 4 por mês se chamava `Mensal`, mas é semanal: virou `PackageFrequency.Weekly`, e o de 2, `Biweekly`.
- A `configs` virou a `settings` (chave e valor). Sem tema gravado, o app segue o do sistema (`userInterfaceStyle: automatic`); o escuro ligado na v6 vira a escolha `dark`.
- Os testes das versões antigas montam os bancos com o SQL da época; o helper lê esses bancos com os nomes de hoje.
Motivo: o código passa a ter um idioma só, e o critério do item ("nenhum identificador em português") vale também para o banco. Juntar a v7 dos nomes com a do tema evita duas reconstruções de tabela seguidas.

**O resto do plano em três blocos.**
Contexto: o Gabriel quer entregar muito por PR e gastar menos com idas e voltas.
Decisão: o que falta vira três blocos (qualidade e arquitetura, entrega e o que é só dele), listados no topo do `plano-de-melhorias.md`. O PR #58 também levou as sugestões da varredura: imagens com nomes em inglês, seletores sem `any`, o formulário do pet em camelCase e a stack atualizada na arquitetura.
Motivo: menos PRs e menos troca de contexto. Os itens de cada bloco mexem nos mesmos arquivos e dependem das mesmas instalações.

## 2026-11-12

**Bloco de qualidade e arquitetura num PR.**
Contexto: o primeiro bloco do plano, com os pacotes que o Gabriel instalou.
Decisão:
- Pacotes só o necessário: React Navigation (4) e ESLint, `eslint-config-expo` e Prettier. Ficaram de fora o Jest e a biblioteca de testes de componentes (TEST-3) e o `eslint-config-prettier`, que teve versões comprometidas em 2025.
- Navegação: pilha nativa. A aba recomeça a pilha sobre o Calendário, como o voltar de antes; formulários entram no topo. O voltar do Android é o da biblioteca, com a guarda só na tela em foco.
- Lint: as regras do Expo, os hooks como erro, sem `any` e a ordem das camadas (`import/no-restricted-paths`), com zero aviso. O `set-state-in-effect` ficou desligado, porque zerar a lista quando o filtro muda é de propósito.
- O ARQ-1 fica com a regra de camadas, sem mover as pastas por assunto, e o `zod/mini` saiu: os dois custam muito para o que trazem hoje.
- O commit das imagens, dos tipos e do porte do pet, que ficou fora do merge do #58, entrou aqui.
Motivo: entregar o bloco inteiro de uma vez, com o `check` cobrindo lint e formato daqui em diante.

**Sem vídeo na entrega (MIDIA-2 fora do plano).**
Contexto: a Parte 5 previa um vídeo curto da remarcação para o README e o portfólio.
Decisão: o Gabriel não vai gravar vídeo. O README e o card do portfólio usam os prints do MIDIA-1.
Motivo: os prints já mostram as telas, e o vídeo dependia de uma gravação que não vai acontecer.

**Tema lido depois das migrações, e a causa do erro no log.**
Contexto: o aparelho do Gabriel parou na abertura com "a atualização do banco para a versão 7 falhou". O log não mostrava o motivo, porque o console do React Native não exibe o `cause`. Reproduzido em memória: o banco dele estava na v6 do PR #53, que foi editada nos #56 e #57 depois de rodar no aparelho, e a v7 não acha o `is_ativo` das listas. Na mesma abertura, o tema lia a `settings` antes de a v7 criá-la.
Decisão:
- o `DatabaseGate` (App.tsx) roda as migrações antes do `ThemeProvider`; a carga e o erro usam o tema do sistema;
- o `logError` registra o `cause` à parte;
- sem migração de reparo: a v6 antiga só existiu em aparelhos de desenvolvimento entre os dois PRs, e o app não tem release. O aparelho afetado limpa os dados do app.
Motivo: sem a ordem certa, quem tinha o tema escuro na v6 perdia a escolha na primeira abertura da v7, e o log escondia a causa de qualquer falha de migração. Fica a lição: uma migração que já rodou no aparelho de alguém, mesmo de desenvolvimento, não muda mais.

**Respostas às perguntas em aberto** (perguntas 2 a 4, 6 a 9, 12, 23 e 24, mais a nota da v6 e os e-mails dos commits).
Contexto: o bloco de entrega (Parte 5) dependia destas respostas para o README, a release e o portfólio.
Decisão:
- **Parceiros (3):** concordam com os `docs/` públicos e com o ruleset no `main`. O REPO-4 está completo.
- **Licença (4):** nenhuma, por enquanto. O código fica com todos os direitos reservados aos três autores, e ninguém pode reutilizá-lo sem pedir.
- **Quem fez o quê (2):** entra no README, curto e por área, tirado dos commits, sem explicar muito.
- **Uso real (6):** o app foi feito para o uso interno de um pet shop, seguindo os requisitos dele, como a remarcação automática. O nome do pet shop não é divulgado.
- **Plataforma (7 e 8):** só Android. O app abre no Expo Go atual, e o "como rodar" do README continua com ele.
- **Regras (9):** as quatro são intencionais: a agenda até hoje + 224 dias, reativar o dono sem reativar os pets, desativar o pet apagando o pacote sem devolvê-lo ao reativar e o agendamento sem horário às 00:00, no relatório de horários.
- **Nota da v6:** fica como está. O próximo automático copia a observação do concluído, e com ela a nota da migração.
- **Lint (12):** respondida pelo PR #59.
- **Prints e APK (23):** o Gabriel tira os prints e roda o build, com a conta Expo dele.
- **Backup com senha (24):** não agora. Fica o aviso ao exportar, do SEG-1.
- **E-mails dos commits:** ficam como estão, sem mudar configuração nem histórico.

Motivo:
- O README só conta o que aconteceu, e o Gabriel preferiu não expor o cliente.
- As regras e a nota da v6 ficam sem mudança no banco. A nota só aparece no dado com valor inválido convertido pela v6, e repeti-la mantém o valor antigo à vista nos próximos atendimentos.
- O backup com senha cresce o APK, exige build novo e perde o arquivo se a senha for esquecida, sem ganho para a `v1.0.0`.

**Bloqueio de instalação no Claude Code, versionado.**
Contexto: o Gabriel criou o `.claude/settings.json`, que nega ao Claude Code os comandos que instalam, atualizam ou removem pacotes, como garantia da regra de que só ele instala.
Decisão:
- o `.claude/settings.json` vai para o Git; o `settings.local.json` e os worktrees do Claude Code ficam no `.gitignore`;
- a lista cobre também o comando sem argumentos (`npm install`, `npm ci`), os apelidos do npm (`add`, `it`, `cit`, `x`), o `npm audit fix`, o `npm exec` e os outros gerenciadores (`yarn`, `pnpm` e `bun`).
Motivo: a regra vale para qualquer sessão do Claude Code no projeto, inclusive nos worktrees, e o arquivo não tem segredo. O `.npmrc` continua sendo a proteção de quem instala.

**Sem APK publicado (BUILD-1 fora do plano) e plano concluído.**
Contexto: a Parte 5 previa o APK numa release `v1.0.0`, linkado no README e no portfólio.
Decisão:
- o Gabriel não vai publicar o APK. O app está pronto para o build, e o README traz o comando (`eas build -p android --profile preview`);
- o README fica completo sem o download: pet shop real sem o nome, só Android, Expo Go atual, "Quem fez o quê", stack atualizada e a licença (nenhuma);
- os itens que já estavam feitos no código, mas sem nota no plano (TEMA-1, REPO-3, DADOS-4 e BUILD-2), foram marcados como feitos, com os PRs.
Motivo: o APK não é necessário para mostrar o projeto, e quem quiser instalar gera o build. Com isso, o plano está concluído; sobra só a conferência no aparelho, que é do Gabriel, e o card do portfólio, que fica no outro repositório.
