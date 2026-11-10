# Perguntas em aberto

Perguntas para o Gabriel, de 2026-11-05. Cada resposta vira uma linha datada em [`decisoes.md`](decisoes.md) e sai daqui. Onde há recomendação, ela é só uma sugestão.

## Equipe e créditos

1. ~~A equipe é você, João Pedro e Gustavo Grosbelli?~~ Respondida em 2026-11-08: sim (ver `decisoes.md`).
2. ~~Qual foi a sua parte?~~ Respondida em 2026-11-08, para o portfólio. Fica em aberto se o README terá "Quem fez o quê", o que depende do acordo dos três.
3. **Os parceiros concordam com os `docs/` públicos e com o ruleset no `main`** (PR obrigatório, REPO-4)?
4. **Qual licença?** MIT é a mais comum em portfólio, mas precisa do acordo dos três. Sem licença, ninguém pode reutilizar o código.
5. ~~Qual disciplina e período da Unipar?~~ Respondida em 2026-11-08: Desenvolvimento Mobile (ver `decisoes.md`). O período não foi informado.

## Produto

6. **O app foi usado por algum pet shop de verdade,** ou só na avaliação? O README só conta o que aconteceu.
7. **Foi testado só no Android?** O `app.json` tem configuração de iOS, mas o `eas.json` só configura Android.
8. **O app abre no Expo Go atual?** O projeto está no SDK 58, e o Expo Go da loja roda só o SDK mais recente. A resposta muda o "como rodar" do README.
9. **Estas regras são intencionais?**
   - A agenda automática vai até hoje + 224 dias.
   - Reativar um dono não reativa os pets dele.
   - Desativar um pet apaga o pacote, e reativá-lo não o devolve.
   - Agendamento sem horário fica às 00:00 e entra no relatório de horários.

## Decisões técnicas

10. ~~Posso rodar o SQL do app num banco SQLite em memória?~~ Respondida em 2026-11-08: sim, só em memória e sem dado real (ver `decisoes.md`).
11. ~~Testes com `node:test` e `node:sqlite`?~~ Respondida em 2026-11-08: sim, junto com a 10.
12. **Lint e formatação:** ESLint com a configuração do Expo e Prettier? Exigem instalação (TEST-2).
13. ~~Validação: Zod ou validadores próprios?~~ Respondida em 2026-11-09: Zod (ver `decisoes.md`).
14. ~~Remarcação: manter nos triggers SQL ou mover para uma função TypeScript testada?~~ Respondida em 2026-11-09: TypeScript, com os triggers só na integridade e na cascata (ARQ-2, ver `decisoes.md`).
15. ~~Datas: migrar de `YYYYMMDD` numérico para texto `YYYY-MM-DD`?~~ Respondida em 2026-11-08: sim, na mesma migração do dinheiro em centavos (ver `decisoes.md`).
16. ~~Navegação: `BackHandler` agora ou React Navigation já?~~ Respondida em 2026-11-09: o `BackHandler` agora (BUG-8) e a biblioteca no ARQ-3 (ver `decisoes.md`).
17. ~~Pasta `app/` vira `src/`?~~ Respondida em 2026-11-09: sim (ARQ-1, ver `decisoes.md`).
18. ~~Dados de demonstração só no build `preview`, ou em todos?~~ Respondida em 2026-11-08: em todos, mas o botão só aparece com o app vazio (ver `decisoes.md`).
19. ~~Tema na primeira abertura: seguir o tema do sistema?~~ Respondida em 2026-11-09: sim; depois, vale a escolha do usuário (TEMA-1, ver `decisoes.md`).
20. ~~Backup automático do Android: manter ligado ou desligar?~~ Respondida em 2026-11-09: desligar; fica a exportação manual do app (SEG-1, ver `decisoes.md`).
21. ~~Identificadores em inglês: renomear tudo, em PRs pequenos?~~ Respondida em 2026-11-09: sim, depois do ARQ-1, um PR por camada (NOMES-1, ver `decisoes.md`).

## Repositório

22. ~~A descrição nova pode ser aplicada?~~ Aplicada em 2026-11-08.
23. **Quem tira os prints e roda o build do APK?** O build precisa da sua conta Expo, e os prints, do app rodando (MIDIA-1 e BUILD-1).
