import { query } from '@/lib/db';
import { getMunoPayHeaders } from '@/config/munopay';
import {
  prepareMunoPayPayload,
  generateTransactionRef,
  validateAndFormatPhone,
  formatErrorResponse,
  formatSuccessResponse,
} from '@/lib/payment';
import {
  createTransaction,
  getPlanById,
  getUserById,
  updateTransactionStatus,
} from '@/lib/paymentDb';

/**
 * POST /api/debug/test-payment
 * Debug endpoint to test payment flow and optionally initiate a MunoPay deposit
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, plan_id, phone: inputPhone, amount: inputAmount, reference: inputRef, fallback_phone } = body;

    console.log('Test payment request:', { user_id, plan_id, inputPhone, inputAmount, inputRef, fallback_phone });

    // Get user and plan from DB
    const user = user_id ? await getUserById(user_id) : null;
    const plan = plan_id ? await getPlanById(plan_id) : null;

    // Determine phone: prefer explicit inputPhone, then user's phone
    let phone = null;
    if (inputPhone) phone = validateAndFormatPhone(String(inputPhone));
    if (!phone && user && user.phone_number) phone = validateAndFormatPhone(String(user.phone_number));
    if (!phone && fallback_phone) phone = validateAndFormatPhone(String(fallback_phone));

    if (!phone) {
      return Response.json(formatErrorResponse('No valid phone number provided or found'), { status: 400 });
    }

    // Determine amount: prefer explicit amount, then plan price
    let amount = null;
    if (typeof inputAmount === 'number' && !Number.isNaN(inputAmount)) amount = inputAmount;
    else if (plan && typeof plan.price !== 'undefined') amount = Number(plan.price);

    if (!amount || amount <= 0) {
      return Response.json(formatErrorResponse('No valid amount specified and plan has no price'), { status: 400 });
    }

    // Reference
    const reference = inputRef || generateTransactionRef();

    // Create a pending transaction record
    const tx = await createTransaction({
      reference,
      user_id: user_id || null,
      plan_id: plan_id || null,
      amount,
      phone,
      session_id: null,
    });

    // Prepare payload and headers
    const payload = prepareMunoPayPayload(phone, amount, reference);
    const headers = getMunoPayHeaders();

    // Helper to call MunoPay deposit endpoint
    async function callDeposit(payloadToSend) {
      const res = await fetch('https://payments.munopay.com/api/v1/deposit', {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadToSend),
      });

      const json = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, json };
    }

    // First attempt
    let attempt = await callDeposit(payload);

    // If first attempt failed and a fallback_phone is provided, try again with fallback
    if ((!attempt.ok || (attempt.json && attempt.json.status !== 'success')) && fallback_phone) {
      const fb = validateAndFormatPhone(String(fallback_phone));
      if (fb) {
        // update transaction phone in DB
        await query('UPDATE transactions SET phone = $1, updated_at = CURRENT_TIMESTAMP WHERE reference = $2', [fb, reference]);
        const fallbackPayload = prepareMunoPayPayload(fb, amount, reference);
        attempt = await callDeposit(fallbackPayload);
      }
    }

    // Update transaction based on provider response
    if (attempt.ok && attempt.json && attempt.json.status === 'success') {
      await updateTransactionStatus(reference, 'initiated', attempt.json.transaction_id || null);
      return Response.json(formatSuccessResponse({ provider: 'munopay', provider_response: attempt.json, transaction: tx }));
    }

    // If we reach here, provider call failed
    const errMsg = attempt.json && attempt.json.message ? attempt.json.message : `MunoPay request failed with status ${attempt.status}`;
    await updateTransactionStatus(reference, 'failed', null);
    return Response.json(formatErrorResponse(errMsg, 'MUNOPAY_FAILURE'), { status: 502 });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
