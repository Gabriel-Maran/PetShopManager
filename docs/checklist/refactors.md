# Refactors e engenharia de código

Ao planejar e ao entregar uma refatoração. [Voltar ao índice](../checklist-perguntas.md)

- Qual é o ganho real (legibilidade, desempenho, modularidade, testabilidade)?
- Qual parte da arquitetura, padrão ou acoplamento mudou?
- Nenhum comportamento mudou para o usuário? Refactor não muda a lógica externa.
- Sobrou código duplicado, código morto, comentário velho ou lixo de desenvolvimento?
- Quebrou algum contrato (assinatura usada por outra camada, formato do banco ou do backup)?
- Há testes cobrindo o comportamento atual antes de refatorar?
- Dá para fazer em passos pequenos, um PR cada, em vez de um PR gigante?
- O refactor está misturado com mudança de comportamento? Se estiver, separe.
- Vale o custo agora, ou é melhor registrar como dívida no plano?
- O padrão novo segue o resto do código e as decisões do `decisoes.md`?

## No PetShop Manager

- Mover arquivo: confira que nenhum caminho antigo sobrou, inclusive em `docs/`, `app.json` e nos testes.
- Renomear: busque o nome antigo no projeto inteiro antes de entregar.
