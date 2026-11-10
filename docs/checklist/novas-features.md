# Novas funcionalidades

Ao planejar e ao entregar uma feature. [Voltar ao índice](../checklist-perguntas.md)

- Qual problema do usuário essa funcionalidade resolve?
- Qual é o critério de aceite (o "pronto quando") que valida a entrega?
- Qual é o impacto direto ou indireto nas outras partes e fluxos do app?
- Como ela chega ao usuário: num build novo, atrás de uma opção, aos poucos?
- Qual é o plano de volta se ela se comportar mal no aparelho?
- Abre alguma brecha de segurança ou vaza dado pessoal (LGPD)?
- Traz dependência nova que aumenta a superfície de ataque ou o tamanho do pacote sem necessidade?
- Pode sobrecarregar o banco (consulta pesada, uma consulta por item da lista)?
- Deixou de lado a acessibilidade (rótulos, papéis, área de toque, contraste)?
- Quem pode usar a funcionalidade? (Aqui não há login: vale o que o aparelho mostra, como o botão de dados de exemplo que só aparece com o app vazio.)
- Como ela se comporta com dados vazios, com volume grande e na primeira abertura?
- O que acontece com toque duplo, com o voltar do Android no meio da ação e com a tela fechada antes de o banco responder?
- Dá para desligar sem um build novo, se der problema? Se não, isso é aceitável?
- Como o usuário vai descobrir e aprender a usar (texto na tela, README, notas de versão)?

Leia também: [frontend e UX](frontend-e-ux.md), [testes](testes.md) e, se mexer no banco, [banco de dados](banco-de-dados.md).
