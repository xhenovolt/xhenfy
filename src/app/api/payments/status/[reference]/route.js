import { getTransactionByReference } from '@/lib/paymentDb';

/**
 * GET /api/payments/status/:reference
 * 
 * Check payment status by transaction reference
 * 
 * Returns:
 * {
 *   "success": true,
 *   "data": {
 *     "reference": "uuid",
 *     "status": "pending|completed|failed",
 *     "amount": 10000,
 *     "phone": "256700000000",
 *     "created_at": "2024-01-02T10:30:45Z",
 *     "updated_at": "2024-01-02T10:35:22Z"
 *   }
 * }
 */
export async function GET(request, { params }) {
  try {
    const { reference } = params;

    if (!reference) {
      return Response.json(
        { success: false, error: 'Reference is required', code: 'MISSING_REFERENCE' },
        { status: 400 }
      );
    }

    const transaction = await getTransactionByReference(reference);

    if (!transaction) {
      return Response.json(
        { success: false, error: 'Transaction not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        phone: transaction.phone,
        plan_id: transaction.plan_id,
        created_at: transaction.created_at.toISOString(),
        updated_at: transaction.updated_at.toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return Response.json(
      { success: false, error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
