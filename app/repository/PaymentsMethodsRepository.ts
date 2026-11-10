import { getDatabase } from "../config/database";
import { PaymentsMethod } from "../model/PaymentMethod";

class PaymentMethodRepository {
  async getAllPaymentMethod() {
    const db = await getDatabase();

    return db.getAllAsync<PaymentsMethod>(
      `SELECT * FROM payment_methods ORDER BY id ASC`,
    );
  }
}

export const paymentMethodRepository = new PaymentMethodRepository();
