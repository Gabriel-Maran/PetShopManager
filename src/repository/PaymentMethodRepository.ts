import { getDatabase } from "../config/database";
import { PaymentMethod } from "../model/PaymentMethod";
import { LIST_PAYMENT_METHODS_SQL } from "./sql/listsSql";

class PaymentMethodRepository {
  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    const db = await getDatabase();

    return db.getAllAsync<PaymentMethod>(LIST_PAYMENT_METHODS_SQL);
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
