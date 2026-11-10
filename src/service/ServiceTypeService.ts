import type { ServiceType } from "../model/ServiceType";
import { serviceTypeRepository } from "../repository/ServiceTypeRepository";

class ServiceTypeService {
  getAllServiceTypes(): Promise<ServiceType[]> {
    return serviceTypeRepository.getAllServiceTypes();
  }
}

export const serviceTypeService = new ServiceTypeService();
