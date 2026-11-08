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

