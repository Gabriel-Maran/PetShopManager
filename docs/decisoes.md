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
- Os dados ficam em `app/config/demoData.ts`:
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
- O SQL do esquema foi para `app/config/schema.ts`, sem mudar nenhum comando (conferido comando a comando, ignorando só a indentação). O `initDatabase` executa a lista `SCHEMA_STATEMENTS`.
- Os testes ficam em `tests/*.test.mjs`, rodam com `npm test` (`node:test` e `node:sqlite`) e entram no `npm run check` e no CI.

Motivo:
- Os testes rodam o mesmo esquema do app num SQLite em memória, como autorizado.
- São `.mjs` porque o typecheck de testes em TypeScript precisaria do `@types/node`, uma instalação ainda não autorizada. O Node 24 importa os `.ts` do app direto.
- O aviso `MODULE_TYPELESS_PACKAGE_JSON` fica desligado no script, porque pôr `"type": "module"` no `package.json` poderia afetar o Metro.

**Testes de caracterização com o SQL do próprio app (TEST-1).**
Decisão:
- Os comandos de escrita que os testes usam saíram dos repositories para `app/repository/sql/`, sem o Expo, sem mudar nenhum texto: inserir e editar pet e agendamento, concluir, ligar e desligar o pacote, ativar e desativar donos e pets, e restaurar o backup.
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
- `app/utils/dinheiro.ts` tem a máscara de digitação, a conversão entre o texto e os centavos e o formato gravado no banco.
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
- O SQL dos relatórios que faz conta com data (comparativo mensal e pets ausentes) foi para `app/repository/sql/relatoriosSql.ts`, com testes. O comparativo mensal passou a usar uma consulta só, com o intervalo como parâmetro.

Motivo:
- Com o banco em ISO, converter para outro formato no app só criaria pontos de erro. O seletor e o calendário já usavam ISO.
- O usuário digita texto, mas o controller recebe o modelo já tipado. A conversão fica na borda, num util só, e o controller valida o que vai para o banco.
- Os relatórios montavam a data com `printf` e `substr` sobre o número, e o SQL deles não tinha teste. O cálculo antigo do primeiro mês do comparativo também errava nos dias 29 a 31, porque o `setMonth` passava para o mês seguinte.

**Backup de versão anterior (3c), em 2026-11-08.**
Decisão:
- A cópia do arquivo importado é aberta numa conexão só dela e passa pelo mesmo `migrateDatabase` do banco do aparelho. Só depois ela é anexada e copiada para o app, como antes.
- Antes das migrações, a cópia precisa ter as sete tabelas do backup. Um arquivo sem elas, ou que nem abre como banco SQLite, é recusado com uma mensagem só ("não é um backup do PetShop Manager"). Um backup de versão mais nova tem mensagem própria ("Este backup é de uma versão mais nova do app"), porque a da abertura do app fala dos dados do aparelho.
- A atualização e a restauração ficam em `app/config/backupRestore.ts`, sem o Expo, e os testes rodam esse código. O `BackupService` só cuida dos arquivos. A restauração reaproveita o `withForeignKeysOff` e o `inTransaction` do `migrator.ts`, que passaram a ser exportados.
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
- A falha prevista é um `AppError` (`app/errors/AppError.ts`), com um código e uma mensagem de `app/globals/messages.ts`. Só ela aparece na tela. Qualquer outro erro mostra "Algo deu errado. Tente de novo." e vai inteiro para o log, pelo `logError`.
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
