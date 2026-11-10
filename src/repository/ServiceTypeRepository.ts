import { ServiceType } from "../model/ServiceType";
import { getDatabase } from "../config/database";
import { LIST_SERVICE_TYPES_SQL } from "./sql/listsSql";

class ServiceTypeRepository {
  async getAllServiceTypes(): Promise<ServiceType[]> {
    const db = await getDatabase();

    return db.getAllAsync<ServiceType>(LIST_SERVICE_TYPES_SQL);
  }
}

export const serviceTypeRepository = new ServiceTypeRepository();
