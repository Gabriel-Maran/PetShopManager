# Checklist de perguntas

Leitura obrigatória para o Claude e para quem desenvolve no projeto. Vem do checklist do Gabriel de 2026-11-10.

São as perguntas que o Gabriel faria em cada momento do trabalho. Antes de pedir a opinião dele, responda você mesmo. Se uma resposta for "não sei" ou "não", resolva ou pergunte antes de seguir.

## Quando ler

| Momento | O que ler |
| --- | --- |
| **Ao iniciar** uma tarefa | [planejamento](checklist/planejamento.md) e o arquivo do tipo da tarefa (tabela abaixo) |
| **Ao decidir por conta** (biblioteca, regra, caminho técnico) | as perguntas de premissas e de ADR do [planejamento](checklist/planejamento.md) e o arquivo da área afetada |
| **Durante** a implementação | os arquivos das áreas que o código toca |
| **Ao entregar** (antes do PR) | o arquivo do tipo, [testes](checklist/testes.md), [documentação e entrega](checklist/documentacao-e-entrega.md) e [antes do PR](checklist/antes-do-pr.md) |
| **Depois do merge** | [depois da entrega](checklist/depois-da-entrega.md) |

## Índice

Por tipo de tarefa:

- [`planejamento.md`](checklist/planejamento.md): problema real, escopo, fora do escopo, premissas e decisões difíceis de reverter. Toda tarefa começa aqui.
- [`novas-features.md`](checklist/novas-features.md): funcionalidade nova. Critério de aceite, impacto nos fluxos, toque duplo, dados vazios e como desligar.
- [`correcoes-de-bugs.md`](checklist/correcoes-de-bugs.md): fix. Causa raiz, reprodução, teste que falhava antes e dado já gravado errado.
- [`refactors.md`](checklist/refactors.md): refatoração. Ganho real, nenhuma mudança de comportamento, rede de testes e PR pequeno.

Por área que o código toca:

- [`banco-de-dados.md`](checklist/banco-de-dados.md): esquema, migração, `CHECK`, transação, datas, centavos e backup.
- [`contratos-e-integracoes.md`](checklist/contratos-e-integracoes.md): contrato entre camadas, validação de entrada, erros padronizados, paginação e o arquivo de backup.
- [`seguranca-e-privacidade.md`](checklist/seguranca-e-privacidade.md): SQL com parâmetros, segredos, dados pessoais (LGPD), arquivo importado e dependências.
- [`performance.md`](checklist/performance.md): consultas, filtro no banco, cache, volume 10x e tamanho do pacote.
- [`frontend-e-ux.md`](checklist/frontend-e-ux.md): estados da tela, mensagens, formulários, confirmação, pt-BR e acessibilidade.
- [`testes.md`](checklist/testes.md): cobertura, caminhos tristes, testes independentes e dados realistas.
- [`observabilidade.md`](checklist/observabilidade.md): logs no lugar certo, sem dados pessoais, e contexto para investigar.

Para fechar:

- [`documentacao-e-entrega.md`](checklist/documentacao-e-entrega.md): docs vivas, migração, ordem da entrega, build e notas de versão.
- [`antes-do-pr.md`](checklist/antes-do-pr.md): diff relido, PR de uma coisa só, descrição, sobras e checagens.
- [`depois-da-entrega.md`](checklist/depois-da-entrega.md): conferido no aparelho, dívida registrada e o que fazer diferente.

## Como responder

- Nem toda pergunta se aplica. O que não se aplicar vira **N/A** na descrição do PR, com o motivo em poucas palavras quando não for óbvio.
- A descrição do PR traz a seção **Checklist**, com as respostas que importam para o revisor: as que mudaram algo, as que deixaram risco e os N/A que não são óbvios.
- O app é offline, sem servidor e sem login: perguntas sobre API HTTP, token, CORS e deploy de servidor valem para o equivalente daqui (camadas, arquivo de backup, build do APK). Cada arquivo diz como.
- Este checklist complementa a varredura final das regras globais (legibilidade, design, correção, segurança e desempenho). Não substitui.
