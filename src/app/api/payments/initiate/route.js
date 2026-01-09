import {
  generateTransactionRef,
  validateAndFormatPhone,
  prepareMunoPayPayload,
  formatErrorResponse,
  formatSuccessResponse,
} from '@/lib/payment';
import { MUNOPAY_CONFIG, getMunoPayHeaders } from '@/config/munopay';
import {
  createTransaction,
  getTransactionByReference,
  getPlanById,
  getUserById,
} from '@/lib/paymentDb';

/**
 * POST /api/payments/initiate
 * 
 * Initiates a payment with MunoPay
 * 
 * Request body:
 * {
 *   "user_id": 1,
 *   "plan_id": 1,
 *   "phone": "256700000000" or "0700000000",
 *   "session_id": "abc-def-ghi"
 * }
 * 
 * Response on success:
 * {
 *   "success": true,
 *   "data": {
 *     "transaction_ref": "uuid",
 *     "status": "pending",
 *     "amount": 10000,
 *     "munopay_response": {...}
 *   }
 * }
 */
export async function POST(request) {
  try {
    // Parse request
    const body = await request.json();
    const { user_id, plan_id, phone, session_id } = body;

    // Validate required fields
    if (!user_id || !plan_id || !phone) {
      return Response.json(
        formatErrorResponse(
          'Missing required fields: user_id, plan_id, phone',
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    // Validate and format phone number
    const formattedPhone = validateAndFormatPhone(phone);
    if (!formattedPhone) {
      return Response.json(
        formatErrorResponse(
          'Invalid phone number format. Use 256700000000, +256700000000, or 0700000000',
          'INVALID_PHONE'
        ),
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await getUserById(user_id);
    if (!user) {
      return Response.json(
        formatErrorResponse('User not found', 'USER_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Get plan details
    const plan = await getPlanById(plan_id);
    if (!plan) {
      return Response.json(
        formatErrorResponse('Plan not found or inactive', 'PLAN_NOT_FOUND'),
        { status: 404 }
      );
    }

    // Generate unique transaction reference
    const transactionRef = generateTransactionRef();

    // Prepare MunoPay payload
    const munoPayPayload = prepareMunoPayPayload(
      formattedPhone,
      plan.price,
      transactionRef
    );

    // Create pending transaction in database first
    const transaction = await createTransaction({
      reference: transactionRef,
      user_id,
      plan_id,
      amount: plan.price,
      phone: formattedPhone,
      session_id,
    });

    // Call MunoPay API
    let munoPayResponse;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MUNOPAY_CONFIG.requestTimeout);

      const response = await fetch(MUNOPAY_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: getMunoPayHeaders(),
        body: JSON.stringify(munoPayPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('MunoPay API error:', errorData);
        throw new Error(
          errorData.message || `MunoPay API returned ${response.status}`
        );
      }

      munoPayResponse = await response.json();
    } catch (error) {
      // Log error but don't expose sensitive details to client
      console.error('MunoPay request failed:', error.message);
      
      return Response.json(
        formatErrorResponse(
          'Payment initiation failed. Please try again.',
          'MUNOPAY_REQUEST_FAILED'
        ),
        { status: 503 }
      );
    }

    // Return success response with minimal sensitive data
    return Response.json(
      formatSuccessResponse({
        transaction_ref: transactionRef,
        status: 'pending',
        amount: plan.price,
        currency: plan.currency,
        plan_name: plan.name,
        plan_duration_minutes: plan.duration_minutes,
        // Include only necessary MunoPay response fields
        munopay_request_id: munoPayResponse.request_id || munoPayResponse.id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment initiation error:', error);
    return Response.json(
      formatErrorResponse(
        'An unexpected error occurred while processing your payment',
        'INTERNAL_ERROR'
      ),
      { status: 500 }
    );
  }
}
