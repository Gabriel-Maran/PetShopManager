import { Config } from "../model/Configuration";
import { configsRepository } from "../repository/ConfigsRepository";

class ConfigsService {
  async getConfigById(id: number): Promise<Config | null> {
    return configsRepository.getConfigById(id);
  }

  async updateConfig(id: number, is_ativo: number): Promise<void> {
    return configsRepository.updateConfig(id, is_ativo);
  }
}

export const configsService = new ConfigsService();
