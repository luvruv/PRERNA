import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export interface PaymentResult {
  status: PaymentStatus;
  transactionRef: string;
  rawResponse: string;
}

@Injectable()
export class PaymentService {
  async processPayment(
    orderNumber: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<PaymentResult> {
    if (method === PaymentMethod.COD) {
      return {
        status: PaymentStatus.PENDING,
        transactionRef: `COD-${orderNumber}`,
        rawResponse: JSON.stringify({
          mode: 'CASH_ON_DELIVERY',
          message: 'Payment to be collected in cash upon doorstep delivery',
          timestamp: new Date().toISOString(),
        }),
      };
    }

    if (method === PaymentMethod.TEST_PAYMENT) {
      const mockTxnId = `TEST_PAY_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      return {
        status: PaymentStatus.COMPLETED,
        transactionRef: mockTxnId,
        rawResponse: JSON.stringify({
          gateway: 'PRERNA_TEST_GATEWAY_V1',
          transactionId: mockTxnId,
          amount,
          status: 'SUCCESS',
          authorizedAt: new Date().toISOString(),
        }),
      };
    }

    throw new Error(`Unsupported payment method: ${method}`);
  }
}
