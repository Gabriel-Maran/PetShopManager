# Plano de melhorias

Criado em 2026-11-05, a partir da auditoria do código no commit `e1d5f2f` do `main`. Nesta etapa nada muda no app: este documento só diz o que fazer, por quê e quando está pronto. A ordem de execução fica em [`proximos-passos.md`](proximos-passos.md), e as respostas do checklist de qualidade, em [`auditoria.md`](auditoria.md).

## Como ler

- **P0** é antes de divulgar o projeto. **P1** é o que mais aumenta a credibilidade. **P2** pode esperar.
- **Provável** marca um bug visto na leitura do código, mas ainda não reproduzido. Ele só é corrigido depois de um teste que o reproduza.
- Cada item tem um código (por exemplo, `BUG-3`) para ser citado em PRs e commits.
- Os números vêm do código e do histórico do Git em 2026-11-05.
- Os links para o código apontam para o commit auditado, para a linha certa continuar valendo depois das mudanças.

## Resumo

Atualização de 2026-11-08:

- os PRs #1 e #2 já estão no `main`: corrigem as vulnerabilidades das dependências, sobem o Expo para o SDK 58 e resolvem BUG-1 e BUG-2;
- o PR #3 bloqueia as permissões Android sem uso e cria o `.npmrc`;
- o REPO-1 e a parte de segurança do REPO-4 já estão nas configurações do GitHub.

O estado e as pendências estão em `proximos-passos.md`, e as decisões, em `decisoes.md`.

| Código | Item | Prioridade |
| --- | --- | --- |
| REPO-1 | Descrição e tópicos do repositório | P0 |
| REPO-2 | README | P0 |
| MIDIA-1 | Prints do app | P0 |
| BUG-1 | Typecheck quebrado (resolvido no PR #1) | P0 |
| BUG-2 | Arquivo com maiúscula diferente do import (resolvido no PR #1) | P0 |
| BUG-3 | Remarcação duplicada ao salvar agendamento concluído (provável) | P0 |
| BUG-4 | Editar pet com pacote refaz a agenda (provável) | P0 |
| DADOS-1 | Versão de esquema e migrações | P0 |
| TEST-1 | Testes das regras e dos triggers | P0 |
| BUG-5 | Total errado na paginação de Cadastros | P1 |
| BUG-6 | Erros que somem sem aviso | P1 |
| BUG-7 | Fuso horário misturado nas datas | P1 |
| BUG-8 | Botão voltar do Android fecha o app (provável) | P1 |
| BKP-1 | Backup e restauração confiáveis | P1 |
| VALID-1 | Validação de entrada completa | P1 |
| ERRO-1 | Tratamento de erros centralizado | P1 |
| DADOS-2 | Dinheiro em centavos inteiros | P1 |
| TEST-2 | Lint, formatação e CI | P1 |
| A11Y-1 | Acessibilidade | P1 |
| TEMA-1 | Tema completo | P1 |
| REPO-3 | Limpeza do repositório | P1 |
| REPO-4 | Segurança e regras do GitHub | P1 |
| DEMO-1 | Dados de demonstração | P1 |
| BUILD-1 | APK de demonstração | P1 |
| MIDIA-2 | Vídeo curto | P1 |
| ARQ-1 | Reorganizar pastas e camadas | P2 |
| ARQ-2 | Remarcação em TypeScript | P2 |
| ARQ-3 | Navegação com histórico | P2 |
| DADOS-3 | Datas em texto ISO | P2 |
| DADOS-4 | Integridade no esquema | P2 |
| NOMES-1 | Identificadores em inglês | P2 |
| PERF-1 | Imagens e buscas mais leves | P2 |
| BUILD-2 | Atualizar SDK e configuração do EAS (SDK 58 no PR #1; falta o EAS e a API nova do `expo-file-system`) | P2 |
| TEST-3 | Testes de componentes | P2 |
| SEG-1 | Dados pessoais no aparelho e no backup | P2 |

## P0 · Antes de divulgar

### REPO-1 · Descrição e tópicos do repositório

- **Por quê:** a descrição diz que o app guarda os dados "em memoria", mas eles ficam num banco SQLite gravado no aparelho. É a primeira frase que um recrutador lê.
- **O que muda:** a descrição passa a ser "App Android offline para gestão de pet shop: donos, pets, agenda e remarcação automática de pacotes. React Native (Expo), TypeScript e SQLite no aparelho. Projeto acadêmico da Unipar." Entram os tópicos `react-native`, `expo`, `typescript`, `sqlite`, `android` e `offline-first`.
- **Pronto quando:** a descrição e os tópicos aparecem no GitHub. É uma mudança de configuração, feita pelo Gabriel ou com o aval dele.

### REPO-2 · README

- **Por quê:** o repositório não tem README. Quem abre o código não sabe o que o app faz, como rodar nem quem fez.
- **O que muda:** um `README.md` na raiz com:
  - o que é, em duas frases, e o aviso de projeto acadêmico;
  - prints (MIDIA-1) e, depois, o vídeo (MIDIA-2);
  - funcionalidades reais: cadastros com desativação em cascata, agenda com calendário, pacotes de 2 ou 4 atendimentos por mês com remarcação automática, seis relatórios, tema claro e escuro e backup por arquivo;
  - como funciona por dentro: camadas, banco local e o resumo dos triggers, com link para `docs/arquitetura.md`;
  - stack com as versões;
  - como rodar: requisitos, `npm ci` e `npm start`, testado num clone limpo;
  - download do APK, quando existir (BUILD-1);
  - equipe e a parte de cada um, depois da confirmação (ver `perguntas-em-aberto.md`);
  - licença, se os três autores decidirem por uma.
- **Pronto quando:** o README tem todas as seções, e os comandos de "como rodar" funcionam num clone novo.

### MIDIA-1 · Prints do app

Feito em 2026-11-08: seis prints em `docs/imagens/`, com os dados de exemplo, comprimidos (540 px, cerca de 54 KB cada) e sem metadados, na seção Telas do README. Falta, opcional, um print de relatório com gráfico.

- **Por quê:** o README e o card do portfólio precisam de imagem. Sem ela, ninguém vê o app sem instalar.
- **O que muda:** de 4 a 6 prints com os dados de exemplo do DEMO-1: calendário com agendamentos, lista de pets, cadastro de pet com pacote, um relatório, o tema escuro e o backup. Ficam em `docs/imagens/`, comprimidos.
- **Pronto quando:** as imagens estão no repositório, nenhuma mostra dado real, e o README as exibe.

### BUG-1 · Typecheck quebrado

- **Por quê:** `tsc --noEmit` falha em [`PetListModal.tsx:2`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/view/components/Cadastro/Modal/PetListModal.tsx#L2), que importa o tipo `PetWithSpecieAndRace`, que não existe mais. O `PetListModal` e o `OwnerListModal` não são usados em lugar nenhum.
- **O que muda:** apagar os dois componentes e criar o script `typecheck` no `package.json`.
- **Pronto quando:** `npm run typecheck` passa sem erros.

### BUG-2 · Arquivo com maiúscula diferente do import

- **Por quê:** o Git guarda `src/utils/relatorios/Remarcacoes.ts`, mas [`RemarcacoesIntervals.tsx:12`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/view/pages/Relatorios/RemarcacoesIntervals.tsx#L12) importa `remarcacoes`. No Windows funciona. No Linux, que diferencia maiúsculas (servidor do EAS, CI, clone de outra pessoa), o import não acha o arquivo.
- **O que muda:** renomear no Git com `git mv` para `remarcacoes.ts`.
- **Pronto quando:** um clone novo num sistema que diferencia maiúsculas resolve o import (o CI do TEST-2 passa a garantir isso).

### BUG-3 · Remarcação duplicada ao salvar agendamento concluído

Confirmado em 2026-11-08 por teste (`tests/remarcacao.test.mjs`): marcar como pago um automático já concluído cria mais um agendamento.

Corrigido em 2026-11-08 na versão 2 do esquema: o `trg_remarcacao_automatica` e o `trg_ultima_visita` só agem na passagem de `concluido` de 0 para 1.

- **Por quê:** o `trg_remarcacao_automatica` ([`database.ts:274`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/config/database.ts#L274)) dispara em `UPDATE OF concluido` sempre que o valor novo é 1. No SQLite, isso vale para todo `UPDATE` que cita a coluna, mesmo sem mudar o valor. O `updateAppointment` sempre cita `concluido`. Então, editar um agendamento automático já concluído (por exemplo, para marcar como pago) deve criar mais um agendamento futuro.
- **O que muda:** primeiro, um teste que reproduz (TEST-1). Depois, a condição passa a ser `OLD.concluido = 0 AND NEW.concluido = 1`, aplicada por migração (DADOS-1), porque os aparelhos já têm o trigger antigo. O mesmo ajuste vale para o `trg_ultima_visita`.
- **Pronto quando:** o teste mostra que salvar de novo um concluído não cria agendamento, e que concluir um pendente ainda cria o próximo.

### BUG-4 · Editar pet com pacote refaz a agenda

Confirmado em 2026-11-08 por teste (`tests/remarcacao.test.mjs`): mudar só a observação apaga e gera de novo os automáticos pendentes, perde o horário ajustado à mão e cria outra vez as datas passadas como manuais.

Corrigido em 2026-11-08 na versão 2 do esquema: o `trg_pet_remarcacao_ativar` só refaz a agenda quando muda de fato um campo que entra nela (pacote ligado, pacote, início, horário, serviço, valor ou reativação). Ao refazer, apaga e gera só os automáticos pendentes de hoje em diante.

- **Por quê:** o `trg_pet_remarcacao_ativar` ([`database.ts:477`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/config/database.ts#L477)) dispara quando o `UPDATE` cita os campos do pacote, e o `updatePet` sempre os cita. Então, qualquer edição de um pet com pacote (mudar a observação, por exemplo) apaga os agendamentos automáticos pendentes e gera tudo de novo a partir da data de início. Efeitos esperados: horários ajustados à mão se perdem, e datas passadas não concluídas são criadas outra vez como manuais, duplicadas.
- **O que muda:** teste que reproduz (TEST-1). Depois, o trigger só refaz a agenda quando um campo do pacote muda de fato (`OLD.campo IS NOT NEW.campo`) e não recria datas que já passaram. Aplicado por migração (DADOS-1).
- **Pronto quando:** os testes mostram que editar outro campo não mexe na agenda, e que trocar o pacote refaz só os pendentes futuros.

### DADOS-1 · Versão de esquema e migrações

Feito em 2026-11-08: a versão fica no `PRAGMA user_version`, e a lista `MIGRATIONS` (`src/config/schema.ts`) é aplicada pelo `migrateDatabase` (`src/config/migrator.ts`) numa transação só. A versão 1 é o esquema de antes e recria os triggers. São 11 testes em `tests/migracoes.test.mjs`, e o bloco de `DROP` saiu do `database.ts`.

- **Por quê:** o banco é criado com `IF NOT EXISTS` e não tem versão. Um trigger corrigido no código não chega aos aparelhos que já têm o antigo, e o backup importado não diz de qual versão veio. Hoje, mudar o esquema exige colar um bloco de `DROP` no `database.ts`, o que apaga os dados.
- **O que muda:** a versão fica em `PRAGMA user_version`. Uma lista ordenada de migrações roda numa transação na abertura do app, cada uma subindo uma versão. A versão 1 é o esquema atual, e as correções de trigger viram migrações seguintes. O bloco de `DROP` comentado sai.
- **Pronto quando:** um banco da versão atual abre na versão nova sem perder dados, coberto por teste, e o `database.ts` não tem mais SQL para colar à mão.

### TEST-1 · Testes das regras e dos triggers

Feito em 2026-11-08: 44 testes com `node:test` e `node:sqlite`, rodando no CI. Cobrem a agenda dos pacotes 2 e 4, a virada de mês, a conclusão de automático, a edição de pet, a cascata, a restauração de backup e as funções de data, máscara, valor e normalização. Os testes usam o mesmo SQL do app (`src/config/schema.ts` e `src/repository/sql/`). BUG-3, BUG-4 e o ponteiro do BKP-1 ficaram confirmados.

Achado novo: no campo de horário, um quinto dígito apaga o campo inteiro (`mascararHorario("09300")` devolve vazio), em vez de ser ignorado.

- **Por quê:** o projeto não tem nenhum teste. A regra mais importante, a remarcação automática, vive em SQL e não tem verificação. Os bugs prováveis acima só podem ser confirmados assim.
- **O que muda:** testes com o `node:test` e o `node:sqlite` do Node 24, que não exigem instalar pacotes. Para isso, o SQL do esquema sai do `database.ts` para um módulo sem imports do Expo. Primeiro vêm os testes de caracterização (o comportamento de hoje), depois os das correções. Casos mínimos: agenda gerada para pacote 2 e 4, virada de mês, conclusão de automático, edição de pet, desativação em cascata e as funções de data, máscara e normalização.
- **Pronto quando:** `npm test` roda os testes, e cada bug provável está confirmado ou descartado. Depende da autorização do Gabriel para rodar SQL num banco de teste em memória (ver `perguntas-em-aberto.md`).

## P1 · Credibilidade

### BUG-5 · Total errado na paginação de Cadastros

Feito em 2026-11-09, no PR #25, com o ajuste da ordem no PR #26: a página e a contagem saem da mesma função (`pagedNameSearch`), com o mesmo FROM e o mesmo filtro, e o repository devolve os dois juntos. Os seletores de dono e de pet usam a mesma busca, e uma resposta atrasada é descartada. Há teste nos dois status, com e sem acento. Falta o Gabriel conferir no aparelho, com o roteiro do PR.

- **Por quê:** em [`Cadastros.tsx:60`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/view/pages/Cadastros.tsx#L60), a contagem ignora o filtro de ativos e inativos e não roda de novo quando ele muda. A contagem de donos busca em `nome` ([`OwnerRepository.ts:65`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/repository/OwnerRepository.ts#L65)), enquanto a lista busca em `nome_normalizado`. Resultado: na aba de inativos, o total é o de ativos; e uma busca por "joao" lista o João, mas conta zero e esconde a paginação.
- **O que muda:** contagem e lista usam o mesmo filtro (ativo e nome normalizado), de preferência na mesma função do repository.
- **Pronto quando:** total e páginas batem com a lista nos dois filtros e em buscas com e sem acento, com teste.

### BUG-6 · Erros que somem sem aviso

O primeiro item foi resolvido no DADOS-1, em 2026-11-08: uma falha na abertura do banco agora chega à tela de erro do `App.tsx`.

Conferido no ERRO-1, em 2026-11-09: o `console.log` da validação do pet já não existe, e as buscas do dono e da raça na aba do pet, que só iam para o `console.error`, passaram a mostrar a falha.

O resto foi feito em 2026-11-09, no PR #24: desativar e reativar em Cadastros passam pelo `useAsyncAction`, e o item só sai da lista depois que o banco confirma. O `handleDeleteSelected` deixou de ir ao banco: o nome do modal vem da própria lista. Falta o Gabriel conferir no aparelho, com o roteiro do PR.

- **Por quê:**
  - `initDatabase` captura qualquer erro com `console.log` ([`database.ts:687`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/config/database.ts#L687)), e o app abre como se o banco estivesse certo.
  - Em Cadastros, desativar e reativar chamam o controller sem `await` ([`Cadastros.tsx:92`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/view/pages/Cadastros.tsx#L92)). O `try` não pega a falha, e o item sai da lista mesmo se der erro.
  - `handleDeleteSelected` não trata erro nenhum.
  - Sobrou um `console.log` na validação do pet.
- **O que muda:** a falha na abertura do banco mostra a tela de erro que já existe no `App.tsx`. As ações aguardam o resultado antes de mexer na lista e mostram o erro pelo `useError`.
- **Pronto quando:** uma falha simulada em cada caminho aparece para o usuário, e a lista só muda quando a ação deu certo.

### BUG-7 · Fuso horário misturado nas datas

Parte do app feita em 2026-11-08: o "hoje" e as conversões de data estão em `src/utils/datas.ts`, no fuso do aparelho, e o SQL do app recebe o "hoje" como parâmetro. Há um teste com o relógio às 22h. Os triggers e o `DEFAULT` do `criado_em` passaram a usar `'localtime'` na versão 3 do esquema (PR #19), e o app passou a ler o formato novo na etapa 3b (PR #20).

- **Por quê:** o SQLite usa `'now'` (UTC) em uns lugares e `'now', 'localtime'` em outros, e o app usa o fuso de São Paulo fixo em três lugares. Entre 21h e meia-noite no horário de Brasília, o "hoje" do SQL já é amanhã. Isso afeta a data de cadastro (`criado_em`), se um agendamento de hoje entra como automático ou manual e os dias de ausência.
- **O que muda:** o "hoje" é calculado num lugar só, no fuso do aparelho, e passado ao SQL como parâmetro. Os triggers e o `DEFAULT` de `criado_em` passam a usar `'localtime'` (por migração).
- **Pronto quando:** um teste com o relógio às 22h mostra a mesma data no app e no banco.

### BUG-8 · Botão voltar do Android fecha o app (provável)

Feito em 2026-11-09, no PR #30 (pergunta 16: o `BackHandler` agora). O botão da tela e o do Android chamam o mesmo `requestBack()`. O destino vem de um mapa só (`backRouteOf`, em `src/config/navigation.ts`), e o formulário em edição registra uma guarda (`useBackGuard`) que abre a confirmação. Verificado: typecheck limpo, 154 testes passando (12 novos em `tests/navegacao.test.mjs`) e o pacote Android gerado. Falta o Gabriel conferir no aparelho, com o roteiro do PR. Os modais ainda não fecham com o voltar (ver `proximos-passos.md`).

- **Por quê:** a navegação é própria e não trata o `BackHandler`. No Android, o botão voltar sai do app em qualquer tela, inclusive no meio de um formulário, sem a confirmação que o botão da tela já pede.
- **O que muda:** o botão voltar segue o mesmo caminho do botão da `TitleBar`, com confirmação nos formulários, e só sai do app na tela inicial. A troca por uma biblioteca de navegação é o ARQ-3.
- **Pronto quando:** testado num aparelho: voltar num formulário pede confirmação, e nas abas principais leva ao calendário.

### BKP-1 · Backup e restauração confiáveis

Confirmado em 2026-11-08 por teste (`tests/backup.test.mjs`): na restauração, a agenda volta igual à do backup, mas o `ultimo_visita_data_auto` dos pets com pacote é refeito pelo trigger de cadastro, e fica além do último automático pendente. O copiar com `SELECT *` funciona entre bancos da mesma versão: o SQLite pula a coluna gerada `dia_semana`.

Adiantado na etapa 3c, em 2026-11-08: a cópia do backup passa pelas migrações antes de entrar, então os dois bancos ficam na mesma versão. Um arquivo sem as tabelas do app, corrompido ou de versão mais nova é recusado sem mexer nos dados, e a cópia temporária é apagada com qualquer resultado.

Feito em 2026-11-09, no PR #28 (Parte 4):
- o `PRAGMA integrity_check` confere a cópia antes de tudo, e um arquivo danificado tem mensagem própria;
- o `trusted_schema` fica desligado em todas as conexões (`SQL_CONNECTION_PRAGMAS`): um backup com função de efeito colateral num trigger, `CHECK` ou coluna gerada é recusado sem rodar a função;
- a cópia usa as colunas do app pelo nome, e um backup sem alguma delas é recusado antes de mexer nos dados;
- os triggers do app saem durante a cópia e voltam iguais no fim, dentro da transação. O ponteiro da remarcação volta igual ao do backup, e a contagem de ids (`sqlite_sequence`) também;
- a exportação grava `petshop-AAAA-MM-DD.db` numa pasta própria do cache, e cada exportação apaga as cópias anteriores. A cópia não é apagada logo depois do compartilhamento, porque o app de destino pode ler o arquivo depois que o menu fecha (decisão do Gabriel, ver `decisoes.md`);
- verificado: typecheck limpo, 142 testes passando (6 novos em `tests/backup.test.mjs`) e o pacote Android gerado. Falta o Gabriel conferir no aparelho, com o roteiro do PR.

- **Por quê:**
  - A importação aceita qualquer arquivo terminado em `.db` e copia com `SELECT *`, que depende da ordem das colunas. Um backup de outra versão falha ou grava dados nas colunas erradas.
  - Ao importar, o insert dos pets dispara o `trg_pet_remarcacao_insert`, que recalcula `ultimo_visita_data_auto` com uma agenda que depois é apagada. O valor restaurado fica diferente do original, e a próxima remarcação pode cair na data errada (provável).
  - A cópia exportada fica no cache depois de compartilhada.
- **O que muda:** antes de importar, checar `PRAGMA integrity_check`, a versão (DADOS-1) e as tabelas esperadas, com `trusted_schema` desligado. Copiar com as colunas nomeadas e com os triggers de remarcação sem efeito durante a restauração. Apagar a cópia temporária depois do compartilhamento. O nome do arquivo exportado leva a data.
- **Pronto quando:** testes mostram que exportar e importar devolve o mesmo banco, e que um arquivo inválido é recusado com uma mensagem clara.

### VALID-1 · Validação de entrada completa

Feito em 2026-11-09, no PR #32, com o Zod 4.6.7 (pergunta 13). Os schemas ficam em `src/validation/`, e os controllers chamam o `parseInput`, que converte a falha no `AppError` com a mensagem de `messages.ts`. Os limites de tamanho ficam em `globals/limits.ts`. Verificado: typecheck limpo, 280 testes passando (55 novos em `tests/validacao.test.mjs`) e o pacote Android gerado, que cresceu 680 KB com o Zod. Falta o Gabriel conferir no aparelho, com o roteiro do PR. O cadastro de raça pelo `raceSpecieHelper` e os limites escritos à mão nas telas ainda não usam os schemas (ver `proximos-passos.md`).

- **Por quê:** parte da entrada é validada, parte não. O horário aceita "9" (sem minutos), a data só é checada por ser número, o valor pode ficar vazio, o e-mail não tem formato conferido e os textos não levam `trim` em todo lugar. O salvamento do dono não protege contra toque duplo, ao contrário dos de pet e agendamento.
- **O que muda:** um schema por entidade (dono, pet, agendamento, raça) com os formatos (`HH:MM`, data real, valor, e-mail, telefone), `trim` e tamanho máximo, usado pelo serviço antes de gravar. As mensagens ficam em `globals` (ver ERRO-1). A escolha entre Zod e validadores próprios está em `perguntas-em-aberto.md`.
- **Anotado em 2026-11-08, depois da versão 3 do esquema:** as colunas novas não conferem o formato. Avaliar um `CHECK` no banco, como `data = date(data)` nas datas e `valor >= 0` nos centavos, numa versão nova do esquema. Antes, a migração precisa tratar o dado antigo que não passaria na regra, para o app não travar ao abrir. A v3 deixou o `CHECK` de fora por isso.
- **Pronto quando:** cada regra tem teste com entrada válida, inválida e nos limites.

### ERRO-1 · Tratamento de erros centralizado

Feito em 2026-11-09: o `AppError`, o `toUserMessage` e o `logError` ficam em `src/errors/AppError.ts`, e as mensagens, em `src/globals/messages.ts`, uma por falha. O `showError` recebe o erro como veio, e os hooks `useAsyncAction` e `useAsyncData` ligam o carregamento e o modal de erro. O backup, os dados de exemplo e o cadastro de raça passaram a usar o `ErrorProvider`. Um erro que não é `AppError` mostra a mensagem genérica, e o detalhe vai só para o log. Os relatórios deixaram de chamar o `showError` durante o render: pela leitura do código, o modal voltava a abrir a cada vez que era fechado (provável).

- **Por quê:** o mesmo `handleError` foi copiado em 8 arquivos, e a conversão `e instanceof Error ? e.message : ...` aparece 12 vezes. O `DatabaseTransfer` tem o próprio modal de erro. As mensagens ficam espalhadas pelos controllers, e uma delas diz "Nome e telefone são obrigatórios" também quando o telefone só é inválido.
- **O que muda:** um módulo de erros com um `AppError` (código e mensagem), as mensagens em `globals/messages`, uma função que converte qualquer erro em texto para o usuário e um hook (por exemplo, `useAsyncAction`) que já liga o carregamento e o `showError`. O backup passa a usar o `ErrorProvider`.
- **Pronto quando:** nenhuma tela monta a mensagem de erro sozinha, e cada falha de validação tem a sua mensagem.

### DADOS-2 · Dinheiro em centavos inteiros

Preparado em 2026-11-08, sem migração: a máscara e a conversão para centavos estão em `src/utils/dinheiro.ts`. As colunas viraram centavos na versão 3 do esquema (PR #19), com a sobra da divisão do pacote nos primeiros atendimentos do mês. Na etapa 3b (PR #20), os modelos passaram a usar centavos, e o texto com vírgula ficou só nos campos das telas. Na etapa 3c, um backup de versão anterior passa pelas migrações antes de entrar.

- **Por quê:** valores são texto com vírgula (`"12,50"`), e o trigger divide o valor do pacote em `REAL`. Com um pacote de 99,99 em 4 vezes, cada atendimento vira 25,00 e a soma dá 100,00.
- **O que muda:** colunas `INTEGER` em centavos, com migração dos dados (DADOS-1), e a divisão do pacote distribui a sobra de centavos. A conversão para "12,50" acontece só na tela, num util.
- **Pronto quando:** a soma dos atendimentos é igual ao valor do pacote em todos os testes, e os valores antigos são migrados sem perda.

### TEST-2 · Lint, formatação e CI

- **Por quê:** não há lint nem formatador, e os hooks têm dependências faltando nos `useEffect`, o que o lint de hooks pegaria. Não há CI para barrar um PR quebrado.
- **O que muda:** ESLint com a configuração do Expo e o plugin de hooks, Prettier, e um script `check` que roda typecheck, lint, formatação e testes. Um workflow do GitHub Actions roda o `check` em cada PR. Lint e Prettier exigem instalação, que precisa do aval do Gabriel.
- **Pronto quando:** `npm run check` passa localmente e no CI.

### A11Y-1 · Acessibilidade

Feito em 2026-11-09, no PR #31:
- botão de ícone pelo `IconButton` ou `ActionIconButton`, com papel, rótulo de `A11Y_LABELS` e área de 48 dp;
- `Toggle` como interruptor e enfeites escondidos do leitor;
- verdes do tema claro escurecidos para 4,5:1, com a paleta em `Themes/colors.ts` e o contraste conferido por teste nos dois temas.

Verificado: typecheck limpo, 213 testes passando (71 novos em `tests/acessibilidade.test.mjs`) e o pacote Android gerado. Falta o teste com o TalkBack, pelo roteiro do PR. Os formulários `NewOrEdit*` e a `TitleBar` ainda têm ajustes (ver `proximos-passos.md`).

- **Por quê:** há 53 botões tocáveis e só 4 propriedades de acessibilidade no app. Botões só com ícone (adicionar, expandir, editar, excluir, voltar, filtro) não têm nome para o leitor de tela. O interruptor próprio (`Toggle`) não é anunciado como interruptor. Botões de ícone com 38 dp ficam abaixo dos 48 dp recomendados no Android. O texto branco sobre o verde `#1D9E75` dos botões tem contraste de cerca de 3,4:1, abaixo dos 4,5:1 pedidos para texto normal. Os emojis do backup são lidos em voz alta.
- **O que muda:** `accessibilityLabel` e `accessibilityRole` em todo botão de ícone, `Toggle` com papel de `switch` e estado `checked` (ou o `Switch` nativo), área de toque mínima de 48 dp com `hitSlop`, cores de texto revisadas no tema e imagens decorativas escondidas do leitor.
- **Pronto quando:** um teste com o TalkBack percorre as quatro abas e os formulários sem botão mudo, e as cores do tema passam no contraste.

### TEMA-1 · Tema completo

- **Por quê:** as cores estão centralizadas, mas há 43 cores escritas fora do tema (overlays, gráfico, relatórios, interruptor do tema) e 88 tamanhos de fonte soltos, além de espaços e raios. O `useColorScheme` é importado e não é usado.
- **O que muda:** o tema ganha tokens de espaço, raio, tipografia, overlay e cores de gráfico, num arquivo separado do provider. Os componentes usam só esses valores. Na primeira abertura, o tema pode seguir o do sistema (ver `perguntas-em-aberto.md`).
- **Pronto quando:** uma busca por cor ou `fontSize` literal fora do tema não acha nada.

### REPO-3 · Limpeza do repositório

Em parte feito em 2026-11-09, no PR #29:
- saíram o `ScreenService`, 11 imagens sem uso (1,6 MB; as do plano, mais `crud/personAdd.png` e `setas/setaDireita.png`), o script `web`, funções sem uso do `useFormState` e os comentários de conversa de `utils` e `hooks`;
- o `intParaHifen`, os `PetListModal`/`OwnerListModal` e o `inserts.txt` já tinham saído antes.

Falta, porque estava na área de outros PRs:
- os métodos sem uso nas três camadas (o `getAppointmentsByDate` e outros, que um service ainda chama);
- os comentários e imports que sobram nas telas e nos componentes.

A lista está em `proximos-passos.md`.

- **Por quê:** quem abre o código encontra sobras do desenvolvimento.
- **O que muda:**
  - Código sem uso: `ScreenService`, `PetListModal`, `OwnerListModal`, `intParaHifen` e os métodos de repository que nenhuma tela chama, como `getAppointmentsByDate`, que tem SQL inválido ([`AppointmentsRepository.ts:22`](https://github.com/Gabriel-Maran/PetShopManager/blob/e1d5f2f/src/repository/AppointmentsRepository.ts#L22)).
  - Imagens sem uso, cerca de 1,6 MB: as duas cópias `"- Copy.png"`, `moon.png`, `sun.png`, `editCampo.png` e a pasta `default_react`.
  - Comentários de conversa ("ESSE BICHÃO", "CORRIGIDO: estava sem []", "era o que faltava") viram comentários de porquê, ou saem.
  - O `inserts.txt` vira o carregador do DEMO-1.
  - O script `web` sai do `package.json`, porque o app não roda na web.
  - Commits novos seguem Conventional Commits.
- **Pronto quando:** nenhum arquivo, função ou imagem fica sem uso, conferido por busca.

### REPO-4 · Segurança e regras do GitHub

- **Por quê:** Dependabot, varredura de segredos e proteção de push estão desligados, e o `main` não tem regra: qualquer colaborador pode enviar direto. O repositório não tem licença, então ninguém pode reutilizar o código legalmente.
- **O que muda:** ligar Dependabot alerts, security updates, secret scanning e push protection. Criar um ruleset no `main` com PR obrigatório e CI verde (TEST-2), se os parceiros concordarem. Escolher a licença com os três autores.
- **Pronto quando:** as opções aparecem ligadas nas configurações, e o `main` só recebe mudanças por PR.

### DEMO-1 · Dados de demonstração

- **Por quê:** um APK vazio não mostra nada a quem o instala, e hoje os dados fictícios só entram colando o `inserts.txt` no código.
- **O que muda:** os dados de `inserts.txt` viram uma função de seed, com datas relativas a hoje para o calendário e os relatórios terem movimento. Ela é chamada por um botão "Carregar dados de exemplo" em Configurações, só no build de demonstração (ver `perguntas-em-aberto.md`).
- **Pronto quando:** num aparelho limpo, um toque preenche calendário, cadastros e os seis relatórios.

### BUILD-1 · APK de demonstração

- **Por quê:** recrutadores e tech leads podem testar sem montar o ambiente. O perfil `preview` do `eas.json` já gera APK.
- **O que muda:** o Gabriel roda `eas build -p android --profile preview` (precisa da conta Expo). O APK vai para uma release `v1.0.0` no GitHub, com o SHA-256, as notas do que testar e o aviso de instalação fora da loja.
- **Pronto quando:** o APK instala e abre num Android sem o app, e o link está no README e no portfólio.

### MIDIA-2 · Vídeo curto

- **Por quê:** a remarcação automática é o ponto alto, e ela aparece melhor em movimento do que em print.
- **O que muda:** um vídeo de 30 a 45 segundos com os dados de exemplo: cadastrar um pet com pacote de 4 por mês, ver o calendário marcado, concluir um agendamento, ver o próximo surgir e abrir um relatório.
- **Pronto quando:** o vídeo está no README, e uma versão curta serve para o card do portfólio.

## P2 · Pode esperar

Os itens de arquitetura (ARQ-1, ARQ-2, DADOS-3 e NOMES-1) mudam muitos arquivos e foram combinados com os parceiros para entrar em pull requests públicos, um por vez.

### ARQ-1 · Reorganizar pastas e camadas

Feito em 2026-11-10, no PR #42, como decidido na pergunta 17: a pasta `app/` virou `src/`, sem mudar nenhum conteúdo. Das exceções de camada, os relatórios em `utils` e os hooks que chamavam o repository saíram no PR #46, e a regra da agenda foi para `src/domain/` no PR #47. As pastas por assunto (`features/`, `data/`, `shared/`) e a regra de lint de imports ficam para depois do NOMES-1 e do TEST-2.

- **Por quê:**
  - Os services só repassam chamadas, e a validação está nos controllers. Uma chamada atravessa três arquivos sem nenhuma regra no meio.
  - Os relatórios consultam o banco de dentro de `utils`, e alguns hooks chamam o repository direto.
  - `config/consts.ts` mistura enums, tipos, imagens e telas, e importa um tipo da interface.
  - A pasta raiz `app/` tem o mesmo nome da pasta de rotas do expo-router, o que conflita se ele for adotado.
- **O que muda:** proposta para discutir com os parceiros:
  - `src/` no lugar de `app/`;
  - `src/features/<assunto>/` com telas, componentes e hooks de cada assunto (agenda, cadastros, relatórios, configurações);
  - `src/domain/` com regras e validação puras, sem React nem SQLite;
  - `src/data/` com conexão, esquema, migrações e repositories, inclusive os dos relatórios;
  - `src/shared/` com tema, componentes comuns e `utils`;
  - `src/globals/` com mensagens e constantes.
  - Os controllers saem, e a tela chama um serviço que valida e aplica a regra.
  - Os utils de data viram um módulo só (hoje há `DataHifenPraBarra` e `hifen_para_br` iguais, e três funções de "hoje").
- **Pronto quando:** cada camada só importa a de baixo, conferido por uma regra de lint de imports, e os testes continuam passando.

### ARQ-2 · Remarcação em TypeScript

Feito em 2026-11-10, no PR #47: a regra pura em `src/domain/packageSchedule.ts`, o `PackageScheduleService` grava numa transação, e a versão 4 do esquema tira os três triggers da conta de calendário. Um teste de equivalência compara a versão 3 e a 4 linha a linha. Verificado: typecheck limpo e 386 testes passando. Falta conferir no aparelho, pelo roteiro do PR.

- **Por quê:** a lógica de calendário da remarcação está repetida em três triggers SQL, cada uma com dezenas de conversões `substr`. É difícil de ler, testar e mudar.
- **O que muda:** uma função pura `gerarAgenda(pacote, inicio, ate)` no domínio, testada, chamada pelo serviço dentro de uma transação. Os triggers ficam só para integridade e cascata (última visita e desativação). A decisão está em `perguntas-em-aberto.md`.
- **Pronto quando:** os testes de caracterização do TEST-1 passam com a nova implementação, e a regra existe num lugar só.

### ARQ-3 · Navegação com histórico

- **Por quê:** a navegação própria não tem pilha, não tipa os parâmetros por tela e exige que cada tela saiba para onde voltar.
- **O que muda:** React Navigation ou expo-router, com parâmetros tipados, ou uma pilha própria no `ScreenController`. A biblioteca exige instalação.
- **Pronto quando:** voltar funciona por histórico em todas as telas, e os parâmetros de cada tela têm tipo.

### DADOS-3 · Datas em texto ISO

Adiantado para a Parte 3 em 2026-11-08, junto com o DADOS-2: as datas viraram texto na versão 3 do esquema (PR #19), e o app passou a usar o mesmo texto na etapa 3b (PR #20), sem conversor de formato. Na etapa 3c, um backup de versão anterior passa pelas migrações antes de entrar.

- **Por quê:** guardar datas como `INTEGER YYYYMMDD` obriga o SQL a montar o texto com `substr` a cada uso, e o app tem quatro conversores de formato.
- **O que muda:** colunas de data em texto `YYYY-MM-DD`, que o SQLite entende direto e que continua ordenando certo. Migração dos dados (DADOS-1).
- **Pronto quando:** nenhum SQL monta data com `substr`, e os relatórios dão o mesmo resultado antes e depois.

### DADOS-4 · Integridade no esquema

- **Por quê:** flags, porte e horário não têm `CHECK`. Serviço e forma de pagamento são gravados como texto no agendamento, então renomear um quebra os registros antigos. `tipo_pgto` é `TEXT` com `DEFAULT 0`. O índice `idx_appointments_pet_id` repete o começo de outros dois.
- **O que muda:** `CHECK` nos flags (0 ou 1), no porte e no formato da hora; serviço e pagamento por id, com chave estrangeira; índice redundante removido. Tudo por migração.
- **Pronto quando:** o banco recusa valores fora do domínio, com teste.

### NOMES-1 · Identificadores em inglês

Feito em 2026-11-11, num PR só (ver `decisoes.md`): identificadores, arquivos, pastas e testes em inglês, e a versão 7 do esquema com tabelas, colunas e códigos em inglês. O mesmo PR fez o tema do sistema na primeira abertura (P19). Falta o lint de hooks, que vem com o TEST-2.

Adiantado em 2026-11-09, no PR #27: as ações de desativar e reativar de donos e pets e as props das listas, dos botões e do modal de Cadastros têm o nome do que fazem. Os nomes dos arquivos e a pasta `Botões` continuam para este item.

- **Por quê:** o código mistura idiomas (`pegarRacasBanco`, `DataNumberPraString`, `isTaPago`, `Agendamentos` ao lado de `Appointments`). Dois hooks diferentes se chamam `useAgendamentos`, e `pegarRacasBanco` e `pegarDonosBanco` são hooks sem o prefixo `use`, o que esconde deles as regras dos hooks. O nome `PacoteRemarcacao.Mensal = 4` contradiz o relatório, que chama esse pacote de "Semanal (4x/mês)". A pasta `Botões` tem acento, o que atrapalha ferramentas.
- **O que muda:** identificadores em inglês, comentários e mensagens em português; hooks com `use`; nomes de pacote que digam a frequência; pastas sem acento. Em PRs pequenos, por assunto.
- **Pronto quando:** uma busca não acha identificador em português, e o lint de hooks passa.

### PERF-1 · Imagens e buscas mais leves

Feito em 2026-11-10: os ícones e fundos foram reduzidos para 3 vezes o tamanho exibido no PR #44 (`src/assets` de 5,0 MB para 724 KB), e o ícone do pacote virou PNG no PR #48. A busca que descarta a resposta atrasada entrou no BUG-5 (PR #25), e o `getDatabase` já guardava a promessa da conexão. Falta conferir a nitidez no aparelho.

- **Por quê:** os ícones dos campos aparecem com 28 dp, mas vêm de imagens grandes (`servicos.png` tem 2048×2102 px; `iconNome.png`, 1686×1680 px), o que pesa no APK e na memória. A busca espera 600 ms depois da digitação, mas não confere a ordem das respostas: uma resposta antiga que chegue atrasada sobrescreve a nova. Duas chamadas simultâneas a `getDatabase` podem abrir duas conexões.
- **O que muda:** ícones redimensionados para três vezes o tamanho de exibição; buscas que ignoram respostas desatualizadas; `getDatabase` guardando a promessa da conexão.
- **Pronto quando:** a pasta de imagens cai de tamanho de forma visível, e um teste do hook de busca mostra que só o último resultado entra na tela.

### BUILD-2 · Atualizar SDK e configuração do EAS

- **Por quê:** o backup usa `expo-file-system/legacy`, a API antiga. O `eas.json` não fixa a versão do EAS CLI nem controla o `versionCode`.
- **O que muda:** atualizar o Expo SDK seguindo o guia de cada versão, migrar para a API nova do `expo-file-system`, e adicionar `cli.version` e `appVersionSource` ao `eas.json`.
- **Pronto quando:** o app builda e passa no `check` na versão nova do SDK.

### TEST-3 · Testes de componentes

- **Por quê:** o TEST-1 cobre regras e banco, mas não telas e hooks.
- **O que muda:** `jest-expo` e Testing Library para React Native nos hooks de busca, nos formulários e na paginação. Exige instalação.
- **Pronto quando:** os caminhos principais de cada formulário têm teste, inclusive os de erro.

### SEG-1 · Dados pessoais no aparelho e no backup

Feito em 2026-11-10, no PR #45, como decidido na pergunta 20: `android.allowBackup: false` e um aviso ao exportar, dizendo que o arquivo não tem senha e traz os dados pessoais dos clientes. O backup com senha ficou como pergunta 24 em `perguntas-em-aberto.md`. Falta conferir no aparelho, num build novo.

- **Por quê:** o banco guarda nome, telefone, e-mail e endereço dos clientes. Ele fica protegido na área privada do app, mas o backup exportado é um arquivo aberto, compartilhado por qualquer app, e o backup automático do Android pode copiar o banco para a nuvem.
- **O que muda:** aviso no exportar de que o arquivo tem dados pessoais; decidir se o `allowBackup` do Android fica ligado; avaliar backup com senha (exige biblioteca).
- **Pronto quando:** as decisões estão registradas em `decisoes.md` e aplicadas.

## O que já está bom

Para não se perder na reorganização:

- Todas as consultas com dados do usuário usam parâmetros `?`. Não há injeção de SQL.
- Desativar é exclusão lógica, com cascata de dono para pets.
- Busca por nome normalizado (sem acento e em minúsculas), com índice e espera de 600 ms depois da digitação.
- Cores centralizadas em dois temas, com `useThemedStyles`.
- Paginação nas listas e índices pensados para os relatórios.
- Proteção contra toque duplo nos salvamentos de pet e agendamento, e confirmação antes de sair de um formulário.
- Exportação com checkpoint do WAL e importação dentro de transação, com rollback.
- Nenhum segredo no código nem no histórico do Git (busca feita em 2026-11-05).
