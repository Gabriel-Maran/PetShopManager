import { Config } from "../model/Configuration";
import { configsService } from "../service/ConfigsService";
import { configUpdateSchema } from "../validation/configSchema";
import { parseInput } from "../validation/parseInput";

class ConfigsController {
  async getConfigById(id: number): Promise<Config | null> {
    return configsService.getConfigById(id);
  }

  async updateConfig(id: number, is_ativo: number): Promise<void> {
    const config = parseInput(configUpdateSchema, { id, is_ativo });
    return configsService.updateConfig(config.id, config.is_ativo);
  }
}

export const configsController = new ConfigsController();
