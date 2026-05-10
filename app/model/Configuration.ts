export interface Config {
  id?: number;
  config: string;
  is_ativo: number; // 0 ou 1
}

export class ConfigBuilder {
  private props: Partial<Config>;

  constructor() {
    this.props = {
      config: "",
      is_ativo: 0,
    };
  }

  public withConfig(config: string): this {
    this.props.config = config;
    return this;
  }

  public is_ativo(num: number): this {
    this.props.is_ativo = num !== 0 ? 1 : 0;
    return this;
  }

  public build(): Config {
    return { ...this.props } as Config;
  }
}
