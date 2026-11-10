# Frontend e UX

Quando a tarefa mexe numa tela, num componente ou num texto. [Voltar ao índice](../checklist-perguntas.md)

- A tela segue o padrão visual e usa os componentes que o app já tem?
- Todos os estados estão tratados: carregando, vazio, erro e sucesso?
- Funciona nos tamanhos de tela que os usuários usam, nos temas claro e escuro?
- As mensagens de erro dizem o que aconteceu e o que o usuário pode fazer?
- O formulário valida com clareza, preserva o que foi preenchido no erro e evita salvar duas vezes?
- Ações destrutivas pedem confirmação ou permitem desfazer?
- Números, datas e moedas aparecem no formato pt-BR?
- Rótulos e papéis para o leitor de tela, área de toque de 48 dp e contraste estão certos?
- O voltar do Android e o da tela levam ao mesmo lugar, e perguntam antes de perder dados?

## No PetShop Manager

- Cores, fontes e espaços só do tema (`src/view/Themes/`). Nada de valor solto no componente.
- Textos e mensagens em `src/globals/`; rótulos de acessibilidade em `A11Y_LABELS`.
- A tela não roda no Node: o que não tem teste ganha um roteiro para conferir no aparelho, no PR.
