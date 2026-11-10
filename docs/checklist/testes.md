# Qualidade, cobertura e testes

Em toda entrega com código. [Voltar ao índice](../checklist-perguntas.md)

- Que testes cobrem as linhas e os caminhos que foram criados ou alterados?
- Nenhum teste está falhando, intermitente ou pulado (`.skip`, `todo`)?
- Os caminhos tristes estão testados: entrada inválida, vazia, nula, valor-limite e falha no meio?
- Os mocks não escondem o comportamento real (o teste roda o SQL e o código do app)?
- Os testes conferem o comportamento (o quê), e não detalhes de implementação (como)?
- Testei o fluxo completo como o usuário faria? Se não dá no Node, há um roteiro para o aparelho?
- Os testes são independentes e passam em qualquer ordem? Cada um cria os próprios dados?
- Os dados de teste são realistas: acentos, caracteres especiais, zero, negativos e limites?
- Alguém além de mim testou? (O Gabriel, no aparelho, pelo roteiro do PR.)

## No PetShop Manager

- `npm run check` roda typecheck, testes e o pacote Android. Os três passam antes do push.
- Toda parte nova tem teste do caminho feliz e de entrada inválida ou maliciosa.
