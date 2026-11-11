import type { PaymentMethod } from "../model/PaymentMethod";
import { paymentMethodRepository } from "../repository/PaymentMethodRepository";

class PaymentMethodService {
  getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return paymentMethodRepository.getAllPaymentMethods();
  }
}

export const paymentMethodService = new PaymentMethodService();
