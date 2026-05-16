export interface Owner {
  id?: number;
  nome: string;
  telefone: string;
  email?: string | null;
  endereco?: string | null;
  is_ativo: number; // 0 ou 1
  criado_em?: number;
}

export class OwnerBuilder {
  private props: Partial<Owner>;

  constructor() {
    this.props = {
      nome: "",
      telefone: "",
      is_ativo: 1,
    };
  }

  public withNome(nome: string): this {
    this.props.nome = nome;
    return this;
  }

  public withTelefone(telefone: string): this {
    this.props.telefone = telefone;
    return this;
  }

  public withEmail(email: string | null): this {
    this.props.email = email;
    return this;
  }

  public withEndereco(endereco: string | null): this {
    this.props.endereco = endereco;
    return this;
  }

  public is_ativo(num: number): this {
    this.props.is_ativo = num !== 0 ? 1 : 0;
    return this;
  }

  public build(): Owner {
    return { ...this.props } as Owner;
  }
}
