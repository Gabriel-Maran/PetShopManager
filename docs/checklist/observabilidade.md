# Observabilidade e logs

Quando a tarefa trata erros ou grava log. [Voltar ao índice](../checklist-perguntas.md)

- Se isso quebrar no aparelho, como vou saber antes de o usuário reclamar, ou pelo menos entender o que houve?
- Os pontos críticos de falha têm log, e no nível certo (sem poluir com `console.log` de depuração)?
- O log não guarda dado pessoal, senha ou conteúdo do banco?
- O log tem contexto suficiente para investigar (qual ação, quais ids)?

## No PetShop Manager

- O app é offline e não manda nada para fora: monitoramento, alertas, health check e correlation ID são N/A.
- Todo erro inesperado passa pelo `logError` (`src/errors/AppError.ts`), e a tela mostra só a mensagem padrão.
