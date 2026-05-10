import { ServiceType } from "../model/ServiceType";
import { getDatabase } from "../config/database";

class ServiceTypeRepository {
  async getAllServiceTypes() {
    const db = await getDatabase();

    return db.getAllAsync<ServiceType>(
      `SELECT * FROM service_type ORDER BY servico ASC`,
    );
  }
}

export const serviceTypeRepository = new ServiceTypeRepository
