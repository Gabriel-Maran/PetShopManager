# Documentação, build e entrega

Ao fechar a tarefa. [Voltar ao índice](../checklist-perguntas.md)

- Qual documentação precisa mudar: README, `arquitetura.md`, `decisoes.md`, `plano-de-melhorias.md`, `proximos-passos.md`?
- Há variável de ambiente ou configuração nova que precisa entrar no `.env.example` ou no `app.json`?
- Há migração do banco? Ela roda sozinha ao abrir o app, sem perder dado, inclusive num backup antigo?
- A mudança aumenta o tamanho do APK, o uso de memória ou o armazenamento no aparelho?
- A ordem de merge importa (um PR depende de outro)?
- Existe um roteiro para conferir no aparelho e para desfazer, se der errado?
- Quem precisa ser avisado antes e depois do merge (o Gabriel, os parceiros)?
- As notas de versão ou o README mostram o que mudou para quem usa?

## No PetShop Manager

- Não há servidor: janela de manutenção, homologação e custo de nuvem são N/A. A entrega é o merge no `main` e, na Parte 5, o APK da release.
- Decisão tomada na conversa vai para o `decisoes.md`, com data, contexto, decisão e motivo.
