# PetShop Manager

App Android para um pet shop organizar donos, pets e a agenda de banho e tosa, com pacotes que se remarcam sozinhos. Funciona offline: os dados ficam num banco SQLite no próprio aparelho, sem servidor nem login.

Projeto acadêmico da disciplina de Desenvolvimento Mobile, na Unipar.

## Funcionalidades

- **Cadastros de donos e pets:** espécie, raça (dá para criar novas), porte e serviço padrão. Desativar um dono desativa os pets dele, e os cadastros nunca são apagados de verdade.
- **Agenda com calendário:** cada agendamento tem serviço, horário, táxi dog, valor, forma de pagamento e se foi pago.
- **Pacotes com remarcação automática:** um pet pode ter pacote de 2 ou 4 atendimentos por mês. O app gera a agenda do pacote e, ao concluir um atendimento, cria o próximo.
- **Seis relatórios com gráficos:**
  - dias e horários mais movimentados;
  - pets ausentes;
  - remarcações;
  - origem dos agendamentos;
  - comparativo mensal;
  - pacotes ativos.
- **Tema claro e escuro.**
- **Backup por arquivo:** exporta o banco pelo compartilhamento do Android e importa um arquivo `.db`.

## Stack

- Expo SDK 58 (`expo` 58.0.21), React Native 0.88.1 e React 19.3.0.
- TypeScript 6.0.3 em modo `strict`.
- `expo-sqlite` para o banco local e `react-native-calendars` para o calendário.
- `expo-file-system`, `expo-sharing` e `expo-document-picker` para o backup.
- Build Android pelo EAS: o perfil `preview` gera APK, e o `production` gera AAB.
- GitHub Actions: typecheck e pacote Android a cada pull request.

## Como funciona por dentro

- **Camadas:** telas → controllers (validação) → services → repositories (SQL com parâmetros) → SQLite.
- **Banco:**
  - oito tabelas: donos, pets, agendamentos, serviços, formas de pagamento, espécies, raças e configurações;
  - desativar é exclusão lógica;
  - a cascata e a remarcação ficam em triggers do SQLite.
- **Remarcação automática:**
  - o pacote 2 cai a cada 14 dias, e o pacote 4, a cada 7, sem passar da cota do mês;
  - quando a cota acaba, o próximo vai para o mês seguinte, no mesmo dia da semana;
  - a agenda é gerada até 224 dias à frente;
  - o valor de cada atendimento é o do pacote dividido pela quantidade.

Os detalhes estão em [`docs/arquitetura.md`](docs/arquitetura.md), e o que ainda vai melhorar, em [`docs/plano-de-melhorias.md`](docs/plano-de-melhorias.md).

## Como rodar

Requisitos:

- Node 24 e npm;
- um Android com o Expo Go compatível com o SDK 58, ou um emulador Android.

Para instalar as dependências e subir o servidor do Expo:

```bash
npm ci
npm start
```

Depois, é só ler o QR code com o Expo Go. Com um emulador aberto, `npm run android` abre o app nele.

As mesmas checagens do CI (typecheck e pacote Android) rodam com:

```bash
npm run check
```

## Equipe

Feito em equipe, com as responsabilidades divididas:

- [Gabriel Maran](https://github.com/Gabriel-Maran)
- [João Pedro Uhry Gonçalves](https://github.com/joaopug)
- [Gustavo Grosbelli](https://github.com/Grosbelli12)

## Contribuindo

O `main` só recebe mudanças por pull request, com o CI verde, e o merge é por squash. As mensagens de commit seguem o [Conventional Commits](https://www.conventionalcommits.org/pt-br/), como `fix(app.json): ...`.
