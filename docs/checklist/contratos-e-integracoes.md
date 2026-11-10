# Contratos e integrações

O app não tem API HTTP. Aqui, o contrato é a assinatura entre as camadas (tela → controller → service → repository) e o arquivo de backup, que é a única integração com fora. [Voltar ao índice](../checklist-perguntas.md)

- O contrato (função, parâmetros, retorno, erros) está definido antes de ligar a tela e o banco?
- A mudança quebra quem já chama essa função, ou um backup exportado por uma versão anterior?
- Toda entrada é validada pelo schema da camada de baixo (tipo, tamanho, formato), e não só na tela?
- Os erros seguem o formato padrão (`AppError` com mensagem de `messages.ts`), sem mostrar stack ou detalhe interno?
- O erro certo para cada caso: entrada inválida, registro que não existe, conflito, falha inesperada?
- Listas têm paginação, filtro e limite máximo?
- Uma ação repetida (toque duplo, voltar e salvar de novo) é segura?
- Quando algo de fora falha (escolher arquivo, compartilhar, permissão negada), o usuário recebe uma mensagem e os dados ficam como estavam?
