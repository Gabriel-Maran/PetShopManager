import { getDatabase } from "../config/database";
import { PaymentsMethod } from "../model/PaymentMethod";
import { LIST_PAYMENT_METHODS_SQL } from "./sql/listsSql";

class PaymentMethodRepository {
  async getAllPaymentMethod(): Promise<PaymentsMethod[]> {
    const db = await getDatabase();

    return db.getAllAsync<PaymentsMethod>(LIST_PAYMENT_METHODS_SQL);
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
