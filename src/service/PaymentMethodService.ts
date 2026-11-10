import type { PaymentsMethod } from "../model/PaymentMethod";
import { paymentMethodRepository } from "../repository/PaymentsMethodsRepository";

class PaymentMethodService {
  getAllPaymentMethods(): Promise<PaymentsMethod[]> {
    return paymentMethodRepository.getAllPaymentMethod();
  }
}

export const paymentMethodService = new PaymentMethodService();
