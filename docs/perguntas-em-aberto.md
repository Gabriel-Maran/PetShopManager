# Perguntas em aberto

Perguntas para o Gabriel, de 2026-11-05. Cada resposta vira uma linha datada em [`decisoes.md`](decisoes.md) e sai daqui. Onde há recomendação, ela é só uma sugestão.

## Equipe e créditos

1. **A equipe é você, João Pedro e Gustavo Grosbelli?** O GitHub mostra três colaboradores: `Gabriel-Maran`, `joaopug` (também como "João Pedro U G") e `Grosbelli12`. O README e o portfólio precisam dos nomes certos.
2. **Qual foi a sua parte?** O histórico tem 274 commits: 152 das duas contas do João Pedro, 94 seus e 28 do Gustavo. Commit não mede trabalho, então a pergunta é o que cada um fez (banco, telas, relatórios, backup...). O README vai ter "Quem fez o quê", e o site, "Minha parte".
3. **Os parceiros concordam com os `docs/` públicos e com o ruleset no `main`** (PR obrigatório, REPO-4)?
4. **Qual licença?** MIT é a mais comum em portfólio, mas precisa do acordo dos três. Sem licença, ninguém pode reutilizar o código.
5. **Qual disciplina e período da Unipar?** Para o README dizer o contexto do projeto acadêmico.

## Produto

6. **O app foi usado por algum pet shop de verdade,** ou só na avaliação? O README só conta o que aconteceu.
7. **Foi testado só no Android?** O `app.json` tem configuração de iOS, mas o `eas.json` só configura Android.
8. **O app abre no Expo Go atual?** O projeto está no SDK 54, e o Expo Go da loja roda só o SDK mais recente. A resposta muda o "como rodar" do README.
9. **Estas regras são intencionais?**
   - A agenda automática vai até hoje + 224 dias.
   - Reativar um dono não reativa os pets dele.
   - Desativar um pet apaga o pacote, e reativá-lo não o devolve.
   - Agendamento sem horário fica às 00:00 e entra no relatório de horários.

## Decisões técnicas

10. **Posso rodar o SQL do app num banco SQLite em memória, no Node, para confirmar os bugs prováveis?** Não toca em dado nenhum, mas a sua regra pede autorização para qualquer banco. Uma linha no `CLAUDE.md` deste projeto autorizando um banco de teste isolado resolveria de vez (TEST-1).
11. **Testes:** começar com `node:test` e `node:sqlite`, que já vêm no Node 24, para regras e triggers? Recomendado: sim. Testes de tela com `jest-expo` ficam para o TEST-3, porque exigem instalação.
12. **Lint e formatação:** ESLint com a configuração do Expo e Prettier? Exigem instalação (TEST-2).
13. **Validação:** Zod (uma dependência, mas schemas legíveis e tipos derivados) ou validadores próprios? Recomendado: Zod, se a instalação for aceita (VALID-1).
14. **Remarcação:** manter nos triggers SQL ou mover para uma função TypeScript testada? Recomendado: TypeScript, deixando nos triggers só a integridade e a cascata (ARQ-2).
15. **Datas:** migrar de `YYYYMMDD` numérico para texto `YYYY-MM-DD`? Recomendado: sim, junto com a migração do dinheiro, para fazer uma migração grande só (DADOS-3).
16. **Navegação:** pilha própria com `BackHandler` agora e biblioteca depois, ou React Navigation já? Recomendado: o `BackHandler` agora (BUG-8) e a biblioteca na reorganização (ARQ-3).
17. **Pasta `app/` vira `src/`?** Evita o conflito com o expo-router e segue o padrão mais comum (ARQ-1).
18. **Dados de demonstração:** botão "Carregar dados de exemplo" só no build `preview`, ou em todos? (DEMO-1)
19. **Tema na primeira abertura:** seguir o tema do sistema? Depois, vale a escolha do usuário (TEMA-1).
20. **Backup automático do Android:** manter ligado (o Google guarda uma cópia do banco) ou desligar por causa dos dados pessoais? (SEG-1)
21. **Identificadores em inglês:** renomear tudo, em PRs pequenos, como pede a sua regra? Mexe em quase todos os arquivos dos três autores (NOMES-1).

## Repositório

22. **A descrição nova pode ser aplicada?** Texto proposto no REPO-1. Você aplica nas configurações, ou eu aplico com `gh repo edit` depois do seu aval.
23. **Quem tira os prints e roda o build do APK?** O build precisa da sua conta Expo, e os prints, do app rodando (MIDIA-1 e BUILD-1).
