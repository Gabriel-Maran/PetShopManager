# Performance e escalabilidade

Quando a tarefa mexe em listas, relatórios, consultas, imagens ou dependências. [Voltar ao índice](../checklist-perguntas.md)

- Qual é o tempo de resposta esperado, e qual foi o medido?
- Há uma consulta por item da lista, loop com chamada ao banco ou coluna buscada sem uso (`SELECT *`)?
- Agregação e filtro rodam no banco, e não em memória na tela?
- O que pode ficar em cache, e quando esse cache é invalidado?
- Algo pesado pode rodar depois, sem travar a tela?
- Como o app se comporta com 10 vezes o volume de dados de hoje?
- O pacote carrega só o necessário (tamanho do JavaScript, imagens no tamanho de exibição)?
- Gráficos e listas grandes continuam fluidos com muitos itens?

## No PetShop Manager

- O tamanho do pacote Android aparece no `npm run export:android`. Uma dependência nova diz quanto somou.
- Os dados de exemplo (`demoData.ts`) servem de volume realista para medir.
