# Próximos passos

Atualizado em 2026-11-08, depois do BUG-3 e do BUG-4.

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

Falta, nesta ordem:

1. Do Gabriel: avisar os parceiros que o `main` agora só recebe PR, com squash e o CI verde.
2. A partir de 2026-11-10, quando passam da espera de 7 dias, `npm i -E expo@58.0.23 expo-sharing@58.0.22 expo-sqlite@58.0.15`.
   - Em 2026-11-08, um `npm audit fix` no clone já subiu o `@expo/config` para 58.0.10 e o `@expo/fingerprint` para 0.21.8, os dois de 2026-10-31. O `package-lock.json` alterado ficou sem commit no clone e entra no PR do patch.
   - O `@expo/config` novo deixa de usar o `deepmerge`, o que fecha um alerta.
   - Numa simulação, sobram os alertas moderados de `glob` e `minimatch` e o do `zod`, todos nas ferramentas de build, que nem o Expo mais novo corrigiu.
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
- O app mudou nos PRs #1 a #3 (segurança e build), #11 (dados de exemplo), #13 (testes), #14 (migrações) e #15 (reset de dev). O PR #5 adiantou o script `typecheck` da Parte 1 e o CI da Parte 2.
- Da Parte 1, falta o que depende das perguntas em aberto. A Parte 2 está completa, a Parte 3 está em andamento, e as Partes 4 em diante ainda não começaram.
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
- BUG-3 e BUG-4 em revisão no PR "Triggers da remarcação", como a versão 2 do esquema;
- depois, o BUG-7;
- o DADOS-2 espera a resposta da pergunta 15 (datas em texto junto com o dinheiro em centavos).

- BUG-3 e BUG-4: triggers corrigidos por migração.
- BUG-7: "hoje" num lugar só e triggers com `'localtime'`.
- DADOS-2: dinheiro em centavos, se a decisão de datas (pergunta 15) não juntar as duas migrações.

Pronto quando: os testes da Parte 2 passam com o comportamento novo, e um banco antigo migra sem perder dados.

### Parte 4 · Telas, erros e validação (P1)

- ERRO-1: módulo de erros, mensagens em `globals` e hook de ação assíncrona.
- BUG-5: contagem com o mesmo filtro da lista.
- BUG-6: falhas que hoje somem passam a aparecer.
- BUG-8: `BackHandler`.
- VALID-1: schema por entidade.
- BKP-1: importação validada, colunas nomeadas e cópia temporária apagada.

Pronto quando: cada caminho de erro tem teste ou foi conferido no aparelho, e os bugs da parte estão fechados.

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
