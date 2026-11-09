# Próximos passos

Atualizado em 2026-11-09, depois do BUG-6, a segunda etapa da Parte 4.

> **Para o próximo chat:** o BUG-6 (desativar e reativar em Cadastros esperam o banco) está em revisão no PR #24, branch `fix/acoes-de-cadastros`, no worktree `.claude/worktrees/acoes-de-cadastros`. Se o Gabriel aprovar a varredura, os ajustes entram nessa mesma branch. Depois do merge, a próxima etapa é o BUG-5 (ver "Parte 4" em "Partes de execução"). Os roteiros para conferir no aparelho estão nos PRs #22 (ERRO-1) e #24 (BUG-6).
>
> O ERRO-1 entrou no `main` pelo PR #22, e a importação cancelada, pelo PR #23, os dois em 2026-11-09. A Parte 3 foi aceita com o merge do PR #21, em 2026-11-08.
>
> O clone do Gabriel estava no `8004a1a`, atrás do `main`. Antes de testar, `git pull` no `main`: os PRs #18 a #24 não mexem no `package-lock.json` alterado.
>
> Limpeza de 2026-11-09: saíram os worktrees `backup-3c` (PR #21) e `erros-centralizados` (PRs #22 e #23), e a pasta vazia `dados-1`. As branches locais ficaram. A pasta vazia `.claude/worktrees/erros-centralizados` continua presa por outro processo; apague quando ela soltar.

## Em andamento: segurança e configuração do repositório

Feito:

- [PR #1](https://github.com/Gabriel-Maran/PetShopManager/pull/1), no `main` desde 2026-11-05:
  - `npm audit` de 31 para 10 alertas, sem os 2 críticos;
  - Expo do SDK 54 para o 58 (`expo` 58.0.21, React Native 0.88.1, React 19.3.0, TypeScript 6.0.3);
  - BUG-1 resolvido.

  Verificado: typecheck limpo, `expo export --platform android` funcionando, assinaturas dos pacotes conferidas e nenhum alerta de malware. Dos pacotes com alerta, nenhum entra no APK.
- [PR #2](https://github.com/Gabriel-Maran/PetShopManager/pull/2), no `main` desde 2026-11-05: BUG-2 resolvido, com o `remarcacoes.ts` em minúsculo e os 415 imports batendo com os nomes do Git.
- 2026-11-08, nas configurações do GitHub (com o aval do Gabriel):
  - descrição e tópicos do REPO-1;
  - Dependabot alerts e security updates, secret scanning e push protection, do REPO-4.

- [PR #3](https://github.com/Gabriel-Maran/PetShopManager/pull/3), no `main` desde 2026-11-08: bloqueia no `app.json` as permissões Android sem uso (ficam `INTERNET` e `VIBRATE`) e cria o `.npmrc` com `ignore-scripts`, `save-exact` e `min-release-age=7`.
- [PR #4](https://github.com/Gabriel-Maran/PetShopManager/pull/4), no `main` desde 2026-11-08: este plano, em `docs/`.

- [PR #5](https://github.com/Gabriel-Maran/PetShopManager/pull/5), no `main` desde 2026-11-08: `dependabot.yml`, CI e o script `check` (`typecheck` e `export:android`).
- 2026-11-08, depois do PR #5, nas configurações do GitHub, como no portfólio:
  - merge só por squash, com o título do PR;
  - branch apagada depois do merge;
  - ruleset `main: CI`: PR obrigatório, sem aprovação mínima, check "Typecheck e pacote Android" verde e atualizado com o `main`, conversas resolvidas e sem bypass;
  - ruleset `main: histórico`: sem apagar a branch nem force push.
- O Dependabot leu o `dependabot.yml` sem erro: as rodadas de npm e de actions passaram.
  - A rodada de segurança falha de propósito: o `zod` só tem correção no 4, e o `@expo/cli` exige o 3 ("Security update not possible"). É o risco aceito em 2026-11-05.
- 2026-11-08, auditoria do repositório público, a pedido do Gabriel, nos 324 commits de todas as branches:
  - nenhuma chave, token, senha ou arquivo de credencial no código nem no histórico; o secret scanning não tem alerta;
  - o Actions não tem segredo, artefato nem release, e o repositório não tem deploy key nem webhook;
  - o `CLAUDE.md` e a pasta `.claude/` nunca foram versionados;
  - o `projectId` e o `owner` da EAS no `app.json` são identificadores públicos, que não dão acesso sem o token;
  - os dados de exemplo e os prints do README são fictícios, e os prints não têm EXIF;
  - ponto de atenção: os commits mostram o e-mail pessoal de quem os fez (Gabriel em 127, Gustavo em 28 e João Pedro em 16). Não é segredo, mas é dado pessoal público;
  - com o aval do Gabriel, no PR #20: o `.gitignore` passou a barrar qualquer `.env` (menos o `.env.example`), o banco e os backups do app (`*.db`, `*.sqlite` e os arquivos do WAL) e os builds (`*.apk` e `*.aab`).

Falta, nesta ordem:

1. Do Gabriel:
   - avisar os parceiros que o `main` agora só recebe PR, com squash e o CI verde;
   - decidir sobre os e-mails dos commits (ver a auditoria acima). O recomendado é cada um ativar no GitHub "Keep my email addresses private" e "Block command line pushes that expose my email" e usar o e-mail `noreply` no Git. Reescrever o histórico não compensa: exige force push no `main` e quebra os clones, e os e-mails antigos já podem estar em cópias.
2. A partir de 2026-11-10, quando passam da espera de 7 dias, `npm i -E expo@58.0.23 expo-sharing@58.0.22 expo-sqlite@58.0.15`.
   - Em 2026-11-08, um `npm audit fix` no clone já subiu o `@expo/config` para 58.0.10 e o `@expo/fingerprint` para 0.21.8, os dois de 2026-10-31. O `package-lock.json` alterado ficou sem commit no clone e entra no PR do patch.
   - O `@expo/config` novo deixa de usar o `deepmerge`, o que fecha um alerta.
   - Numa simulação, sobram os alertas moderados de `glob` e `minimatch` e o do `zod`, todos nas ferramentas de build, que nem o Expo mais novo corrigiu.
   - Conferido em 2026-11-08: o GitHub mostra 4 alertas abertos, os mesmos daqui (`zod` alto, `glob` e `minimatch` moderados, `deepmerge` baixo). Todos vêm do `@expo/cli`, do `@expo/config` e do Metro, e nenhum entra no APK. O do `deepmerge` fecha com este patch.
3. Do Gabriel:
   - testar no aparelho as permissões do PR #3, com o roteiro no PR;
   - conferir o tamanho do APK, porque o pacote JavaScript foi de 1,72 MB para 2,7 MB;
   - responder `perguntas-em-aberto.md`.
4. DEMO-1 adiantado para a Parte 1, no `main` desde o PR #11:
   - botão em Configurações, que só aparece com o app vazio;
   - testes num SQLite em memória;
   - esquema separado do Expo, o primeiro passo do TEST-1.
   - Pedido do Gabriel em 2026-11-08, no `main` desde o PR #15: em desenvolvimento, o mesmo cartão vira "Apagar tudo e carregar exemplo" quando o app tem dados.
5. Parte 1 do plano:
   - README (REPO-2), em andamento: a primeira versão traz só o que está confirmado no código;
   - equipe, "quem fez o quê" e licença entram depois das perguntas 1 a 5;
   - os prints (MIDIA-1) estão no README desde 2026-11-08: seis telas tiradas pelo Gabriel com os dados de exemplo. Falta, opcional, um relatório com gráfico;
   - o script `typecheck` já entrou no PR #5.

## Onde paramos no plano

- A auditoria do código foi feita sobre o commit `e1d5f2f` do `main`.
- O plano está em [`plano-de-melhorias.md`](plano-de-melhorias.md), com 35 itens: 9 P0, 16 P1 e 10 P2.
- A arquitetura de hoje está em [`arquitetura.md`](arquitetura.md), e as respostas do checklist, em [`auditoria.md`](auditoria.md).
- O app mudou nos PRs #1 a #3 (segurança e build), #11 (dados de exemplo), #13 (testes), #14 (migrações), #15 (reset de dev), #16 (triggers), #17 e #18 (datas e dinheiro num lugar só), #19 e #20 (versão 3 do esquema, banco e app), #21 (backup de versão anterior), #22 (erros num lugar só), #23 (importação cancelada) e #24 (ações de Cadastros, em revisão). O PR #5 adiantou o script `typecheck` da Parte 1 e o CI da Parte 2.
- Da Parte 1, falta o que depende das perguntas em aberto. As Partes 2 e 3 estão completas e aceitas. A Parte 4 começou em 2026-11-09, com o ERRO-1 e o BUG-6, e as Partes 5 em diante ainda não começaram.
- Falta o Gabriel responder [`perguntas-em-aberto.md`](perguntas-em-aberto.md). Várias partes abaixo dependem dessas respostas.

## Partes de execução

Cada parte é um PR para o `main`. Ao fim de cada uma, o Gabriel valida antes de começar a próxima. A ordem segue as dependências: a vitrine vem primeiro, porque o repositório já está linkado no portfólio; os testes vêm antes de qualquer correção no banco; e as migrações vêm antes de mudar triggers.

### Parte 0 · Do Gabriel, sem código

- Responder as perguntas em aberto, principalmente equipe, sua parte, licença e as autorizações (perguntas 1 a 5, 10 e 11).
- ~~Aplicar a descrição e os tópicos (REPO-1).~~ Feito em 2026-11-08.
- ~~Ligar Dependabot, secret scanning e push protection (REPO-4).~~ Feito em 2026-11-08.
- Conversar com os parceiros sobre os `docs/`, o ruleset no `main` e a licença.

### Parte 1 · Vitrine mínima (P0)

- BUG-1: modais sem uso apagados no PR #1. Falta o script `typecheck`.
- BUG-2: resolvido no PR #2.
- MIDIA-1: prints com os dados fictícios.
- REPO-2: README, com o que já estiver confirmado.

Pronto quando: `npm run typecheck` passa, um clone novo roda com os comandos do README, e o README mostra os prints.

### Parte 2 · Testes do banco e migrações (P0)

Feita em 2026-11-08, falta a validação do Gabriel:
- TEST-1 no `main` desde o PR #13: 44 testes, com BUG-3, BUG-4 e o ponteiro do BKP-1 confirmados;
- DADOS-1 no `main` desde o PR #14: `user_version`, a lista `MIGRATIONS` e 11 testes novos, 55 no total.

Validada pelo Gabriel em 2026-11-08, junto com o reset de dev (PR #15).

- TEST-1: escrever os testes de caracterização com `node:test` e `node:sqlite`. O esquema já está separado do Expo (`schema.ts`), e o `npm test` já roda no CI, desde o DEMO-1.
- Confirmar ou descartar BUG-3, BUG-4 e o problema da restauração do BKP-1.
- DADOS-1: `user_version`, lista de migrações e o esquema atual como versão 1.
- Workflow do GitHub Actions com typecheck e testes, que já não exigem instalação.

Pronto quando: `npm test` passa no CI, e cada bug provável está confirmado ou descartado no próprio teste.

### Parte 3 · Correções do banco (P0 e P1)

Em andamento desde 2026-11-08, com o aval do Gabriel:
- BUG-3 e BUG-4 no `main` desde o PR #16, como a versão 2 do esquema;
- pergunta 15 respondida: o DADOS-2 e o DADOS-3 entram juntos, em três etapas, uma por PR:
  1. datas do app num lugar só (`app/utils/datas.ts`), com o "hoje" no fuso do aparelho, a parte do BUG-7 sem migração. No `main` desde o PR #17;
  2. dinheiro do app num lugar só (`app/utils/dinheiro.ts`), sem migração. No `main` desde o PR #18;
  3. versão 3 do esquema: centavos, datas em texto, triggers e `DEFAULT` com `'localtime'` (o resto do BUG-7), e a importação de backup de versão anterior, em três partes, um chat por parte:
     - decidido pelo Gabriel em 2026-11-08: os primeiros atendimentos do mês ficam com o centavo a mais; um backup antigo é atualizado pelas migrações antes da cópia; cada versão do esquema fica num arquivo de `app/config/migrations/`;
     - 3a, o banco: a `v3.ts`, os dados de exemplo em centavos e datas em texto, e os testes. No `main` desde o PR #19, que entrou antes da 3b (ver o aviso no topo);
     - 3b, o app no formato novo. No `main` desde o PR #20:
       - `datas.ts` com o tipo `IsoDate` e `dinheiro.ts` com o `Cents`, o `parseMoneyInput` e o `formatMoneyInput`; saíram as conversões do número `AAAAMMDD`;
       - modelos, repositories, services, controllers (que validam `isIsoDate` e `isValidCents`), formulários, calendário e relatórios;
       - o SQL do comparativo mensal e dos pets ausentes foi para `app/repository/sql/relatoriosSql.ts`, com testes;
       - verificado: typecheck limpo, 105 testes passando e o pacote Android gerado. Falta o Gabriel conferir no aparelho, com o roteiro do PR;
     - 3c, backup de versão anterior. Em revisão no PR #21 (branch `feat/backup-de-versao-anterior`), feito em 2026-11-08:
       - a cópia do arquivo importado passa pelas migrações numa conexão só dela, antes de entrar no app (`app/config/backupRestore.ts`, chamado pelo `database.ts`);
       - um arquivo sem as tabelas do app, corrompido ou de versão mais nova é recusado sem mexer nos dados; a cópia temporária é apagada com qualquer resultado; o `ATTACH` recebe o caminho como parâmetro;
       - os testes do backup rodam o código do app, com backups da versão 2 e de antes das migrações, e as recusas: 111 testes no total;
       - verificado: typecheck limpo, 111 testes passando e o pacote Android gerado. Falta o Gabriel conferir no aparelho, com o roteiro do PR;
     - revisão final da etapa 3, feita em 2026-11-08: nenhum SQL do app monta data com `substr` (só a conversão da v3 e a hora), o relógio passa todo pelo `datas.ts`, e os testes cobrem a soma do pacote igual ao valor, a migração sem perda e o backup antigo. Os "Pronto quando" do BUG-7, DADOS-2 e DADOS-3 estão atendidos.

- BUG-3 e BUG-4: triggers corrigidos por migração.
- BUG-7: "hoje" num lugar só e triggers com `'localtime'`.
- DADOS-2: dinheiro em centavos, se a decisão de datas (pergunta 15) não juntar as duas migrações.

Pronto quando: os testes da Parte 2 passam com o comportamento novo, e um banco antigo migra sem perder dados. Atendido em 2026-11-08, com a 3c.

### Parte 4 · Telas, erros e validação (P1)

Em andamento desde 2026-11-09, uma etapa por PR e um chat por etapa:
1. ERRO-1, no `main` desde o PR #22:
   - `app/errors/AppError.ts`: o `AppError` (código e mensagem), o `toUserMessage` (só o `AppError` mostra a própria mensagem; o resto vira "Algo deu errado. Tente de novo.") e o `logError`;
   - `app/globals/messages.ts`: as mensagens do app, uma por falha. O dono separa nome, telefone vazio e telefone inválido; o agendamento separa pet, serviço, data, horário e valor;
   - o `showError` recebe o erro como veio. Os hooks `useAsyncAction` (salvar, importar, carregar o exemplo, cadastrar raça, com a trava do toque duplo) e `useAsyncData` (os seis relatórios) ligam o carregamento e o modal;
   - o backup, os dados de exemplo e o cadastro de raça usam o `ErrorProvider`; saiu o `handleError` copiado em 8 arquivos;
   - da varredura, aprovado pelo Gabriel, no PR #23: cancelar a escolha do arquivo na importação não leva mais ao calendário, porque o `importDatabase` devolve se importou;
   - verificado: typecheck limpo, 123 testes passando (12 novos, em `tests/erros.test.mjs`) e o pacote Android gerado. O roteiro para conferir no aparelho está no PR #22.
2. BUG-6, em revisão no PR #24 (branch `fix/acoes-de-cadastros`), feito em 2026-11-09:
   - desativar e reativar em Cadastros passam pelo `useAsyncAction`: o item só sai da lista depois que o banco confirma, e a falha aparece no modal de erro;
   - o nome do modal de desativar vem da própria lista. Saiu a busca no banco do `handleDeleteSelected`, que podia falhar sem aviso;
   - verificado: typecheck limpo, 123 testes passando e o pacote Android gerado. Sem teste novo, porque a tela não roda no Node (os testes de componentes são o TEST-3). O roteiro para conferir no aparelho, com a falha simulada, está no PR #24.
3. Próxima, sugerida: BUG-5 (contagem com o mesmo filtro da lista). Inclui atualizar o total depois de desativar ou reativar, que hoje fica parado. Não depende de pergunta.
4. Depois: o resto do BKP-1. Também não depende de pergunta.
5. O VALID-1 espera a pergunta 13 (Zod ou validadores próprios), e o BUG-8, a pergunta 16 (navegação).

- ERRO-1: módulo de erros, mensagens em `globals` e hook de ação assíncrona.
- BUG-5: contagem com o mesmo filtro da lista.
- BUG-6: falhas que hoje somem passam a aparecer.
- BUG-8: `BackHandler`.
- VALID-1: schema por entidade.
- BKP-1: importação validada, colunas nomeadas e cópia temporária apagada. A versão, as tabelas e a cópia temporária já entraram na 3c; falta o resto (ver o plano).

Pronto quando: cada caminho de erro tem teste ou foi conferido no aparelho, e os bugs da parte estão fechados.

A ordem segue o que foi sugerido no começo da parte: o ERRO-1 primeiro, porque o BUG-6, o VALID-1 e o BKP-1 usam o módulo de erros.

### Parte 5 · Demonstração (P1)

- BUILD-1: APK numa release `v1.0.0`.
- MIDIA-2: vídeo curto.
- REPO-2: README completo, com APK, vídeo e "Quem fez o quê".

Pronto quando: o APK instala num Android limpo e mostra tudo com um toque, e o portfólio pode trocar o card do PetShop por um com imagem e download.

### Parte 6 · Qualidade contínua (P1)

- TEST-2: lint, Prettier e o script `check` no CI, depois do aval das instalações.
- A11Y-1: rótulos, papéis, áreas de toque e contraste.
- TEMA-1: tokens de espaço, raio, tipografia e cores de gráfico.
- REPO-3: limpeza de código, imagens e comentários.
- REPO-4: ruleset no `main`, se os parceiros concordarem.

Pronto quando: `npm run check` passa no CI, e o teste com o TalkBack percorre o app sem botão mudo.

### Parte 7 em diante · Arquitetura (P2, com os parceiros)

Um PR por item, nesta ordem: ARQ-1 (pastas e camadas), NOMES-1 (nomes), ARQ-2 (remarcação em TypeScript), DADOS-3 e DADOS-4 (esquema), ARQ-3 (navegação), PERF-1, BUILD-2, TEST-3 e SEG-1. A ordem pode mudar conforme as respostas das perguntas 13 a 21.

## No portfólio, depois

Quando as Partes 1 e 5 estiverem no `main`, o portfólio pode:

- trocar a descrição do PetShop pelo texto do README;
- usar um print ou o vídeo no card;
- citar "Minha parte", com a resposta da pergunta 2;
- linkar o APK.
