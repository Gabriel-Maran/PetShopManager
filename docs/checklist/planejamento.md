# Planejamento, requisitos e escopo

Antes de escrever a primeira linha de código. Vale para toda tarefa. [Voltar ao índice](../checklist-perguntas.md)

- Qual é o problema real, para quem, e como ele é resolvido hoje (qual o workaround atual)?
- Quem pediu, quem decide e quem precisa validar a entrega? (Aqui, quase sempre o Gabriel, no aparelho.)
- O que está explicitamente fora do escopo desta entrega?
- Qual é a menor versão entregável que já gera valor?
- Quais regras de negócio e casos-limite existem, escritos com exemplos concretos?
- Quais premissas estou assumindo sem confirmar, e com quem devo validá-las?
- Já existe algo no app, nos `docs/` ou numa biblioteca já instalada que resolve isso?
- Quais dependências de outras pessoas, PRs ou instalações existem, e quando estarão disponíveis?
- Qual é o prazo real e o que acontece se atrasar?
- Qual é a maior incerteza? Precisa de uma prova de conceito antes?
- Qual decisão aqui é difícil de reverter e precisa entrar no `decisoes.md`?
- Como vou saber, depois de entregue, que deu certo?

## No PetShop Manager

- Antes de começar: `proximos-passos.md`, o item no `plano-de-melhorias.md` e as decisões ligadas no `decisoes.md`.
- Se a regra depende de algo não decidido, pergunte ao Gabriel antes de implementar (regra 5 das regras globais).
- Pacote novo só com a análise de segurança e com o Gabriel instalando.
