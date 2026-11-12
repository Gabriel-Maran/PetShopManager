# Perguntas em aberto

Perguntas para o Gabriel, de 2026-11-05. Cada resposta vira uma linha datada em [`decisoes.md`](decisoes.md) e sai daqui. Onde há recomendação, ela é só uma sugestão.

Todas respondidas em 2026-11-12. Pergunta nova entra no fim, com o próximo número.

## Equipe e créditos

1. ~~A equipe é você, João Pedro e Gustavo Grosbelli?~~ Respondida em 2026-11-08: sim (ver `decisoes.md`).
2. ~~Qual foi a sua parte?~~ Respondida em 2026-11-08, para o portfólio. Em 2026-11-12: o README terá "Quem fez o quê", curto, tirado dos commits (ver `decisoes.md`).
3. ~~Os parceiros concordam com os `docs/` públicos e com o ruleset no `main`?~~ Respondida em 2026-11-12: sim (REPO-4, ver `decisoes.md`).
4. ~~Qual licença?~~ Respondida em 2026-11-12: nenhuma, por enquanto (ver `decisoes.md`).
5. ~~Qual disciplina e período da Unipar?~~ Respondida em 2026-11-08: Desenvolvimento Mobile (ver `decisoes.md`). O período não foi informado.

## Produto

6. ~~O app foi usado por algum pet shop de verdade?~~ Respondida em 2026-11-12: sim, feito para o uso interno de um pet shop, com os requisitos dele; o nome não é divulgado (ver `decisoes.md`).
7. ~~Foi testado só no Android?~~ Respondida em 2026-11-12: sim, só Android.
8. ~~O app abre no Expo Go atual?~~ Respondida em 2026-11-12: sim.
9. ~~Estas regras são intencionais?~~ Respondida em 2026-11-12: sim, as quatro (ver `decisoes.md`).

## Decisões técnicas

10. ~~Posso rodar o SQL do app num banco SQLite em memória?~~ Respondida em 2026-11-08: sim, só em memória e sem dado real (ver `decisoes.md`).
11. ~~Testes com `node:test` e `node:sqlite`?~~ Respondida em 2026-11-08: sim, junto com a 10.
12. ~~Lint e formatação: ESLint com a configuração do Expo e Prettier?~~ Respondida: entraram no PR #59 (TEST-2, ver `decisoes.md`).
13. ~~Validação: Zod ou validadores próprios?~~ Respondida em 2026-11-09: Zod (ver `decisoes.md`).
14. ~~Remarcação: manter nos triggers SQL ou mover para uma função TypeScript testada?~~ Respondida em 2026-11-09: TypeScript, com os triggers só na integridade e na cascata (ARQ-2, ver `decisoes.md`).
15. ~~Datas: migrar de `YYYYMMDD` numérico para texto `YYYY-MM-DD`?~~ Respondida em 2026-11-08: sim, na mesma migração do dinheiro em centavos (ver `decisoes.md`).
16. ~~Navegação: `BackHandler` agora ou React Navigation já?~~ Respondida em 2026-11-09: o `BackHandler` agora (BUG-8) e a biblioteca no ARQ-3 (ver `decisoes.md`).
17. ~~Pasta `app/` vira `src/`?~~ Respondida em 2026-11-09: sim (ARQ-1, ver `decisoes.md`).
18. ~~Dados de demonstração só no build `preview`, ou em todos?~~ Respondida em 2026-11-08: em todos, mas o botão só aparece com o app vazio (ver `decisoes.md`).
19. ~~Tema na primeira abertura: seguir o tema do sistema?~~ Respondida em 2026-11-09: sim; depois, vale a escolha do usuário (TEMA-1, ver `decisoes.md`).
20. ~~Backup automático do Android: manter ligado ou desligar?~~ Respondida em 2026-11-09: desligar; fica a exportação manual do app (SEG-1, ver `decisoes.md`).
21. ~~Identificadores em inglês: renomear tudo, em PRs pequenos?~~ Respondida em 2026-11-09: sim, depois do ARQ-1, um PR por camada (NOMES-1, ver `decisoes.md`).
25. ~~A nota da migração v6 se repete nos agendamentos automáticos seguintes. Fica assim?~~ Respondida em 2026-11-12: sim (ver `decisoes.md`).

## Repositório

22. ~~A descrição nova pode ser aplicada?~~ Aplicada em 2026-11-08.
23. ~~Quem tira os prints e roda o build do APK?~~ Respondida em 2026-11-12: o Gabriel (MIDIA-1 e BUILD-1).
26. ~~Os e-mails pessoais nos commits ficam?~~ Respondida em 2026-11-12: sim, sem mudar nada (ver `decisoes.md`).

## Segurança

24. ~~Backup com senha?~~ Respondida em 2026-11-12: não agora; fica o aviso ao exportar do SEG-1 (ver `decisoes.md`).
