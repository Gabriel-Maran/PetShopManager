# Segurança e privacidade

Em toda entrega que lida com entrada do usuário, arquivos, dependências ou dados pessoais. [Voltar ao índice](../checklist-perguntas.md)

- Todas as consultas usam parâmetros `?`, sem montar valor no texto do SQL?
- Texto vindo do usuário aparece sem ser interpretado (nada de montar HTML, SQL ou caminho com ele)?
- Segredos estão fora do código e do repositório (`.env` fora do Git)?
- Quais dados pessoais o app guarda, para quê, por quanto tempo e quem pode vê-los (LGPD)?
- Arquivos importados são validados (tipo, tamanho, conteúdo) antes de mexer nos dados?
- Dependências novas ou atualizadas passaram pelo `npm audit` e pela análise de segurança?
- Ações sensíveis (apagar tudo, importar backup) pedem confirmação e deixam rastro no log?

## No PetShop Manager

- Sem login, sem servidor: perguntas de token, CORS, cookie e autorização por rota são N/A. O equivalente é o que fica no aparelho e no arquivo de backup.
- O banco guarda nome, telefone, e-mail e endereço de clientes. O backup exportado é um arquivo aberto (ver SEG-1).
- O repositório é público: nada de dado real em teste, print ou exemplo.
