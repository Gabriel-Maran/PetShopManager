# Correções de bugs

Ao investigar e ao entregar um fix. [Voltar ao índice](../checklist-perguntas.md)

- Qual era a causa raiz exata, e como ela foi isolada?
- Qual cenário (dados e passos) reproduziu o bug antes da correção?
- Qual é o argumento lógico de que a correção resolve sem efeito colateral?
- Há outro lugar no código com a mesma lógica falha que também precisa da correção?
- Dado antigo, nulo, corrompido ou mal formatado que já está no banco (ou num backup) pode quebrar o fix?
- A correção resolve a origem, ou só esconde o sintoma?
- Qual é a gravidade: quantos registros foram afetados, e desde quando?
- Há dado já gravado errado que precisa de correção por migração?
- Existe um teste que falhava antes da correção e passa depois?
- Por que os testes, a revisão ou a varredura não pegaram isso antes?
- O bug depende do aparelho, da versão do Android, do fuso ou do formato regional (data, moeda, vírgula decimal)?
- Alguém precisa ser avisado (o Gabriel, os parceiros, quem usa o app)?

## No PetShop Manager

- O teste de bug segue o padrão do TEST-1: o nome descreve o comportamento, e a correção inverte a checagem.
- Correção de dado gravado é uma migração nova em `src/config/migrations/`, nunca a edição de uma já aplicada.
