import {
  verifyWebhookSignature,
  formatErrorResponse,
  formatSuccessResponse,
} from '@/lib/payment';
import { MUNOPAY_CONFIG } from '@/config/munopay';
import {
  getTransactionByReference,
  updateTransactionStatus,
  activateWiFiSession,
  getPlanById,
} from '@/lib/paymentDb';

/**
 * POST /api/payments/webhook
 * 
 * Webhook endpoint for MunoPay payment status notifications
 * 
 * MunoPay will POST to this endpoint when payment completes/fails:
 * {
 *   "status": "SUCCESS" | "FAILED",
 *   "reference": "transaction-ref-uuid",
 *   "provider_transaction_id": "munopay-tx-id",
 *   "phone": "256700000000",
 *   "amount": 10000,
 *   "timestamp": 1234567890
 * }
 * 
 * Header:
 * X-Signature: <hmac-sha256 signature of raw body>
 */
export async function POST(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Get signature from headers
    const signature = request.headers.get('x-signature') || 
                     request.headers.get('x-munopay-signature');

    if (!signature) {
      console.warn('Webhook received without signature');
      return Response.json(
        formatErrorResponse('Signature required', 'MISSING_SIGNATURE'),
        { status: 401 }
      );
    }

    // Verify signature
    try {
      verifyWebhookSignature(rawBody, signature, MUNOPAY_CONFIG.webhookSecret);
    } catch (error) {
      console.warn('Webhook signature verification failed:', error.message);
      return Response.json(
        formatErrorResponse('Invalid signature', 'INVALID_SIGNATURE'),
        { status: 401 }
      );
    }

    // Parse verified payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      return Response.json(
        formatErrorResponse('Invalid JSON payload', 'PARSE_ERROR'),
        { status: 400 }
      );
    }

    // Validate payload structure
    const requiredFields = ['status', 'reference', 'amount'];
    const missing = requiredFields.filter(f => !(f in payload));
    if (missing.length > 0) {
      return Response.json(
        formatErrorResponse(
          `Missing required fields: ${missing.join(', ')}`,
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Normalize status
    const status = String(payload.status).toUpperCase();
    if (!['SUCCESS', 'FAILED', 'PENDING'].includes(status)) {
      return Response.json(
        formatErrorResponse('Invalid status value', 'INVALID_STATUS'),
        { status: 400 }
      );
    }

    // Idempotency check: Get existing transaction
    const existingTransaction = await getTransactionByReference(payload.reference);

    if (!existingTransaction) {
      console.warn(`Webhook: Transaction not found for reference ${payload.reference}`);
      return Response.json(
        formatErrorResponse('Transaction not found', 'TRANSACTION_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Idempotency: If already processed, return success (idempotent)
    if (existingTransaction.status !== 'pending') {
      console.log(
        `Webhook: Duplicate notification for ${payload.reference}, current status: ${existingTransaction.status}`
      );
      // Return 200 OK to acknowledge receipt even if already processed
      return Response.json(
        formatSuccessResponse({
          message: 'Webhook already processed',
          status: existingTransaction.status,
        }),
        { status: 200 }
      );
    }

    // Process based on payment status
    if (status === 'SUCCESS') {
      // Update transaction to completed
      const updatedTransaction = await updateTransactionStatus(
        payload.reference,
        'completed',
        payload.provider_transaction_id
      );

      // Activate Wi-Fi session
      let wifiSession = null;
      try {
        // Get plan to access duration
        const plan = await getPlanById(existingTransaction.plan_id);
        if (!plan) {
          throw new Error('Plan not found');
        }

        wifiSession = await activateWiFiSession({
          user_id: existingTransaction.user_id,
          plan_id: existingTransaction.plan_id,
          transaction_id: existingTransaction.id,
          mac_address: existingTransaction.mac_address,
          ip_address: existingTransaction.ip_address,
          duration_minutes: plan.duration_minutes,
        });
      } catch (error) {
        console.error('Failed to activate Wi-Fi session:', error);
        // Don't fail the webhook, but log the error
        // The payment is confirmed, session activation can be retried
      }

      // Log success
      console.log(
        `Payment successful: ${payload.reference} for user ${existingTransaction.user_id}`
      );

      return Response.json(
        formatSuccessResponse({
          message: 'Payment processed successfully',
          transaction_ref: payload.reference,
          status: 'completed',
          wifi_session_activated: !!wifiSession,
        }),
        { status: 200 }
      );
    } else if (status === 'FAILED') {
      // Update transaction to failed
      await updateTransactionStatus(
        payload.reference,
        'failed',
        payload.provider_transaction_id
      );

      console.log(
        `Payment failed: ${payload.reference} - ${payload.failure_reason || 'Unknown reason'}`
      );

      return Response.json(
        formatSuccessResponse({
          message: 'Payment failure recorded',
          transaction_ref: payload.reference,
          status: 'failed',
        }),
        { status: 200 }
      );
    }

    // For PENDING status, acknowledge without updating
    return Response.json(
      formatSuccessResponse({
        message: 'Payment status acknowledged',
        transaction_ref: payload.reference,
        status: 'pending',
      }),
      { status: 200 }
    );
  } catch (error) {
    // Webhook errors should not expose internal details
    console.error('Webhook processing error:', error);
    return Response.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}