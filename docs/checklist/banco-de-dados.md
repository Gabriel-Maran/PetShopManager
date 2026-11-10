# Banco de dados e modelagem

Quando a tarefa mexe no esquema, nas consultas ou nos dados. [Voltar ao índice](../checklist-perguntas.md)

- O modelo reflete a regra de negócio (chaves, relacionamentos, cardinalidade)?
- A integridade está garantida no próprio banco (`NOT NULL`, `UNIQUE`, `FOREIGN KEY`, `CHECK`), e não só no código?
- As consultas novas têm índice adequado? Conferi o `EXPLAIN QUERY PLAN` com volume realista?
- Operações que mexem em várias tabelas estão numa transação?
- Duas ações ao mesmo tempo (toque duplo, tela que recarrega) podem gravar o mesmo registro?
- A migração preserva os dados e funciona com um banco de qualquer versão anterior, inclusive vindo de backup?
- Datas sem hora não dependem do fuso, e dinheiro está em centavos inteiros, nunca float?
- Exclusão lógica ou física? Como isso afeta relatórios, unicidade e dados pessoais?
- Como fica o volume dessa tabela em um ano? Precisa de paginação?
- Existe backup dos dados afetados, e a restauração foi testada?

## No PetShop Manager

- Uma versão nova do esquema é um arquivo novo em `src/config/migrations/`, registrado na lista do `schema.ts`. Nunca edite uma migração já aplicada.
- O teste roda o SQL do app num SQLite em memória (`tests/helpers/database.mjs`). Nada de arquivo `.db` nem de banco de aparelho.
- O backup importado passa pelas mesmas migrações (`backupRestore.ts`): a mudança precisa funcionar com ele.
