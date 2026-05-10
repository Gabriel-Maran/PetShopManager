import { Config } from "../model/Configuration";
import { configsService } from "../service/ConfigsService";

class ConfigsController {
  async getConfigById(id: number): Promise<Config | null> {
    return configsService.getConfigById(id);
  }

  async updateConfig(id: number, is_ativo: number): Promise<void> {
    return configsService.updateConfig(id, is_ativo);
  }
}

export const configsController = new ConfigsController();
