# Próximos passos

Atualizado em 2026-11-09, depois dos quatro agentes em paralelo (BUG-8, REPO-3, A11Y-1 e VALID-1).

> **Para o próximo chat:** o VALID-1 está em revisão no PR #32 (branch `feat/validacao-com-zod`, worktree `.claude/worktrees/validacao-zod`), e esta documentação, no PR da branch `docs/agentes-em-paralelo` (worktree `.claude/worktrees/docs-paralelos`, sem junction). Com o #32, a Parte 4 fica completa no código. O próximo passo é o Gabriel escolher o que aplicar das "Pendências entre áreas" e das "Sugestões das varreduras", abaixo, e o patch do Expo a partir de 2026-11-10.
>
> Em 2026-11-09 entraram no `main`: ERRO-1 (PR #22), importação cancelada (#23), BUG-6 (#24), BUG-5 (#25), a ordem da busca (#26), os nomes de desativar (#27), o resto do BKP-1 (#28), REPO-3 (#29), BUG-8 (#30) e A11Y-1 (#31). Os quatro últimos rodaram ao mesmo tempo, cada um numa zona de arquivos só dele (ver `decisoes.md`). A Parte 3 foi aceita com o merge do PR #21, em 2026-11-08.
>
> Os roteiros para conferir no aparelho estão nos PRs #22 (ERRO-1), #24 (BUG-6), #25 (BUG-5), #26 (ordem da busca), #28 (BKP-1), #29 (REPO-3), #30 (BUG-8), #31 (A11Y-1, com o TalkBack) e #32 (VALID-1).
>
> O clone do Gabriel está no `0b0aaf0`, atrás do `main`. O #32 muda o `package-lock.json`, que está alterado no clone desde o `audit fix` de 2026-11-08. Antes do `git pull`, descarte a mudança local com `git checkout -- package-lock.json`. Depois do pull, rode `npm i`. O `node_modules` do clone já tem o zod 4.6.7, instalado em 2026-11-09 sem mudar o `package.json`. O `@expo/config` e o `@expo/fingerprint` do `audit fix` voltam a ser conferidos no PR do patch do Expo.
>
> A branch remota `fix/contagem-de-cadastros` voltou por engano depois do merge do PR #25, com um commit que já entrou pelo PR #26. O Gabriel pode apagá-la no GitHub.
>
> Limpeza de 2026-11-09: saíram os worktrees `backup-3c`, `erros-centralizados`, `acoes-de-cadastros`, `backup-confiavel`, `limpeza`, `botao-voltar` e `acessibilidade`, todos com o PR já no `main`, e a pasta vazia `dados-1`. As branches locais ficaram. A pasta vazia `.claude/worktrees/erros-centralizados` continua presa por outro processo; apague quando ela soltar. Para tirar um worktree, primeiro a junction, com `cmd /c rmdir`, e depois `git worktree remove`.

## Pendências entre áreas (2026-11-09)

Ajustes que os agentes acharam fora da própria zona e não fizeram. Nada aplicado; o Gabriel escolhe.

1. **Voltar com modal aberto (BUG-8):** o `ConfirmModal`, o `ModalConfDelete` e o `ErrorModal` não têm `onRequestClose`. Com um deles aberto, o voltar do Android não faz nada; deveria cancelar ou fechar. O `screenBack` do `DefaultHeader` nunca é passado e é código morto.
2. **Validação (VALID-1, depois do #32):**
   - o `raceSpecieHelper.ts` ainda valida a raça à mão, sem o limite de 50; deve usar o `breedSchema`;
   - as telas escrevem o tamanho máximo à mão (`NewOrEditOwner`, `AbaInfoPet`, `NewOrEditAppointment` e `ModalCreateRacePet`); devem usar o `limits.ts`;
   - o `NewOrEditPet`, com a remarcação desligada, deve mandar `null` no pacote, no início e no valor;
   - a busca de raças do `SpeciesRepository` não escapa `%` e `_` no `LIKE`; dá para usar o `toSearchPattern`, como no BUG-5.
3. **Acessibilidade nos formulários (A11Y-1):**
   - o título da `TitleBar` como cabeçalho;
   - `tablist` nas abas do pet e do agendamento;
   - os botões Salvar com rótulo fixo e estado `busy` enquanto salvam;
   - os títulos "DADOS…" com rótulo em letra normal;
   - o `ButtonBack` com o `A11Y_LABELS.back`;
   - o `color="#FFF"` do `NewOrEditPet` trocado pela cor do tema.
4. **Limpeza (REPO-3):**
   - os métodos sem uso nas três camadas de agendamento, dono e pet, como o `getAppointmentsByDate`, que tem SQL inválido; a lista com as linhas está no relatório do PR #29;
   - o import do `OwnerBuilder`, a classe `ConfigBuilder` e o enum `ORDER`;
   - os imports e as variáveis sem uso em cerca de 20 componentes;
   - os comentários de conversa nos componentes, no `App.tsx`, no `ButtonBack` e no `NewOrEditPet`;
   - o bloco `web` do `app.json` e o comentário do template em `index.ts`.
5. **Tamanho do pacote:** o Zod somou 680 KB ao JavaScript do Android (de 2,78 MB para 3,46 MB). Cerca de 340 KB são traduções que o app não usa. Avaliar o `zod/mini` ou o tree shaking do Expo.

## Sugestões das varreduras (2026-11-09)

Também não aplicadas:

- **Navegação:**
  - pedir confirmação só quando o formulário mudou;
  - na Home, o voltar recolher a agenda em tela cheia antes de sair;
  - um `TAB_SCREENS` em `navigation.ts` para o `App.tsx` e a `AppBar`;
  - os textos do modal de voltar em `messages.ts`.
- **Acessibilidade e tema:**
  - o `Toggle` desligado tem contraste de 1,61:1 (falta uma borda ou um cinza mais escuro), e a animação não acompanha o `value` mudado por fora;
  - um `CloseButton` compartilhado para o ✕ dos três modais;
  - as cores fixas fora do tema, no `ThemeToggle`, nos cartões de Relatórios e no fundo dos modais, que deveria usar o `MODAL_BACKGROUND`;
  - um `withAlpha` no tema, no lugar de juntar "10" ao hex.
- **Validação:**
  - os enums do pet num módulo sem React Native, como o `Screen`;
  - a checagem de dia real no `isIsoDate` de `datas.ts`;
  - conferir no app que a raça é da espécie escolhida;
  - `CHECK` no banco numa versão 4 do esquema, tratando antes o dado antigo.
- **Limpeza:**
  - o `useServicos` e o `useTiposPagamento` chamam o repository direto e repetem o `useAsyncData`;
  - um tipo `Breed` no lugar dos `any[]` do `SpeciesRepository`;
  - o SQL dos relatórios com `?` em vez de valor no texto, e com testes;
  - campos dos relatórios que nenhuma tela lê;
  - ligar `noUnusedLocals` e `noUnusedParameters` no `tsconfig.json`, depois das sobras do item 4.

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
   - Em 2026-11-08, um `npm audit fix` no clone já subiu o `@expo/config` para 58.0.10 e o `@expo/fingerprint` para 0.21.8, os dois de 2026-10-31. O `package-lock.json` alterado ficou sem commit no clone. Como o PR #32 (zod) também muda esse arquivo, a mudança local é descartada antes do `git pull` (ver o topo), e o PR do patch confere se as duas versões entram.
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
- O app mudou nos PRs #1 a #3 (segurança e build), #11 (dados de exemplo), #13 (testes), #14 (migrações), #15 (reset de dev), #16 (triggers), #17 e #18 (datas e dinheiro num lugar só), #19 e #20 (versão 3 do esquema, banco e app), #21 (backup de versão anterior), #22 (erros num lugar só), #23 (importação cancelada), #24 (ações de Cadastros), #25 (busca com o mesmo filtro), #26 (ordem da busca), #27 (nomes de desativar), #28 (resto do BKP-1), #29 (REPO-3), #30 (BUG-8), #31 (A11Y-1) e #32 (VALID-1, em revisão). O PR #5 adiantou o script `typecheck` da Parte 1 e o CI da Parte 2.
- Da Parte 1, falta o que depende das perguntas em aberto. As Partes 2 e 3 estão completas e aceitas. A Parte 4 começou em 2026-11-09 e fica completa no código com o PR #32 (VALID-1); falta o Gabriel conferir no aparelho. Da Parte 6, o A11Y-1 e parte do REPO-3 foram adiantados no mesmo dia. A Parte 5 ainda não começou.
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
2. BUG-6, no `main` desde o PR #24, em 2026-11-09:
   - desativar e reativar em Cadastros passam pelo `useAsyncAction`: o item só sai da lista depois que o banco confirma, e a falha aparece no modal de erro;
   - o nome do modal de desativar vem da própria lista. Saiu a busca no banco do `handleDeleteSelected`, que podia falhar sem aviso;
   - verificado: typecheck limpo, 123 testes passando e o pacote Android gerado. Sem teste novo, porque a tela não roda no Node (os testes de componentes são o TEST-3). O roteiro para conferir no aparelho, com a falha simulada, está no PR #24.
3. BUG-5, no `main` desde o PR #25, em 2026-11-09, com as duas primeiras sugestões da varredura do PR #24, aprovadas pelo Gabriel:
   - `pagedNameSearch` (`app/repository/sql/searchSql.ts`) monta a página e a contagem com o mesmo FROM e o mesmo filtro (status e `nome_normalizado`). O repository devolve `{ items, total }` (`searchOwnersPage` e `searchPetsPage`), e saíram as buscas e contagens antigas;
   - o hook `useSearchPage` descarta a resposta atrasada e recarrega a página depois de uma ação. Vale para Cadastros e para os seletores de dono (cadastro de pet) e de pet (agendamento);
   - Cadastros recarrega depois de desativar ou reativar, volta à página 1 ao trocar o status e volta uma página se a última esvaziar;
   - o id desempata a ordem; `%` e `_` na busca são texto; o `validateNameSearch` confere status, página, limite e o texto até 100 caracteres (`app/globals/limits.ts`);
   - da varredura do PR #25, aprovado pelo Gabriel, no PR #26: com texto, a busca sai em ordem alfabética (antes, de Z a A); sem texto, os mais novos primeiro. A ordem deixou de ser parâmetro, e nada do usuário entra no texto do SQL. A aba ou o modal que fecha limpa a lista, para não reabrir com a da última vez;
   - verificado: typecheck limpo, 136 testes passando (13 novos, em `tests/busca.test.mjs`) e o pacote Android gerado. O roteiro para conferir no aparelho está no PR #25.
4. Nomes de desativar, no `main` desde o PR #27, em 2026-11-09, a terceira sugestão da varredura do PR #24, aprovada pelo Gabriel. Um pedaço do NOMES-1, adiantado:
   - `deactivateOwner`, `activateOwner`, `deactivatePet` e `activatePet` no controller, no service e no repository, no lugar de `delete*` e `active*`;
   - as listas e os botões recebem `onDeactivate` e `onActivate`, e o `ModalConfDelete`, `onConfirm`. Saiu o `type` do modal, que só era usado para desativar, e os estilos e o import sem uso;
   - os nomes dos arquivos (`ButtonExcluir`, `ModalConfDelete`, `ButtonAtivar`) e a pasta `Botões` ficam para o NOMES-1;
   - verificado: typecheck limpo, 136 testes passando e o pacote Android gerado. Sem mudança de comportamento.
5. Resto do BKP-1, em revisão no PR #28 (branch `fix/backup-confiavel`), feito em 2026-11-09:
   - `app/config/backupRestore.ts`: o `integrity_check` é a primeira leitura da cópia (mensagem nova para o backup danificado); a cópia vai pelo nome das colunas do app, e um backup sem alguma delas é recusado antes de mexer nos dados; os triggers do app saem durante a cópia e voltam iguais, na mesma transação, então o ponteiro da remarcação e a agenda entram como estão no backup; a contagem de ids também vem do backup;
   - `app/config/schema.ts`: o `trusted_schema` desligado em todas as conexões;
   - `app/service/BackupService.ts`: a exportação grava `petshop-AAAA-MM-DD.db` em `backups/`, no cache, e cada exportação apaga as cópias anteriores. Decisão do Gabriel: não apagar logo depois de compartilhar, porque o Drive ou o WhatsApp podem ler o arquivo depois que o menu fecha;
   - verificado: typecheck limpo, 142 testes passando (6 novos em `tests/backup.test.mjs`, entre eles arquivo danificado, coluna faltando e função insegura no esquema) e o pacote Android gerado. Cada correção tem um teste que falha sem ela. O roteiro para conferir no aparelho está no PR #28.
6. BUG-8, no `main` desde o PR #30, em 2026-11-09 (pergunta 16: o `BackHandler` agora):
   - o botão da tela e o do Android chamam o mesmo `requestBack()`; o destino vem do `backRouteOf` (`app/config/navigation.ts`), e o formulário em edição registra uma guarda (`useBackGuard`) que abre a confirmação. Só no Calendário o voltar fecha o app;
   - verificado: typecheck limpo, 154 testes passando (12 novos em `tests/navegacao.test.mjs`) e o pacote Android gerado. O roteiro para conferir no aparelho está no PR #30.
7. VALID-1, em revisão no PR #32 (branch `feat/validacao-com-zod`), feito em 2026-11-09 com o Zod 4.6.7 (pergunta 13):
   - um schema por entidade em `app/validation/`, chamado pelos controllers com o `parseInput`, que converte a falha no `AppError` com a mensagem de `messages.ts`; os services recebem os tipos derivados dos schemas;
   - verificado: typecheck limpo, 280 testes passando (55 novos em `tests/validacao.test.mjs`) e o pacote Android gerado, 680 KB maior. O roteiro para conferir no aparelho está no PR #32.

- ERRO-1: módulo de erros, mensagens em `globals` e hook de ação assíncrona.
- BUG-5: contagem com o mesmo filtro da lista.
- BUG-6: falhas que hoje somem passam a aparecer.
- BUG-8: `BackHandler`.
- VALID-1: schema por entidade.
- BKP-1: importação validada, colunas nomeadas e cópia temporária apagada. A versão, as tabelas e a cópia temporária entraram na 3c, e o resto no PR #28.

Pronto quando: cada caminho de erro tem teste ou foi conferido no aparelho, e os bugs da parte estão fechados.

A ordem segue o que foi sugerido no começo da parte: o ERRO-1 primeiro, porque o BUG-6, o VALID-1 e o BKP-1 usam o módulo de erros.

### Parte 5 · Demonstração (P1)

- BUILD-1: APK numa release `v1.0.0`.
- MIDIA-2: vídeo curto.
- REPO-2: README completo, com APK, vídeo e "Quem fez o quê".

Pronto quando: o APK instala num Android limpo e mostra tudo com um toque, e o portfólio pode trocar o card do PetShop por um com imagem e download.

### Parte 6 · Qualidade contínua (P1)

- TEST-2: lint, Prettier e o script `check` no CI, depois do aval das instalações.
- A11Y-1: rótulos, papéis, áreas de toque e contraste. No `main` desde o PR #31, em 2026-11-09, adiantado; falta o teste com o TalkBack e os ajustes dos formulários (ver "Pendências entre áreas").
- TEMA-1: tokens de espaço, raio, tipografia e cores de gráfico.
- REPO-3: limpeza de código, imagens e comentários. Em parte no `main` desde o PR #29, em 2026-11-09, adiantado; o resto está em "Pendências entre áreas".
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
