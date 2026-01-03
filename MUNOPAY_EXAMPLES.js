/**
 * MunoPay Integration Examples and Testing Guide
 * 
 * This file contains practical examples for testing the MunoPay payment flow
 */

// ============================================================================
// 1. PAYMENT INITIATION EXAMPLE
// ============================================================================

/**
 * Frontend: Initiate a payment
 * This would run in your Next.js component
 */
async function initiatePayment(userId, planId, phoneNumber) {
  try {
    const response = await fetch('/api/payments/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        plan_id: planId,
        phone: phoneNumber, // 256700000000, +256700000000, or 0700000000
        session_id: 'portal-' + Math.random().toString(36).substr(2, 9),
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log('Payment initiated:', result.data);
      return {
        transactionRef: result.data.transaction_ref,
        status: 'pending',
        amount: result.data.amount,
      };
    } else {
      console.error('Payment initiation failed:', result.error);
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to initiate payment:', error);
    throw error;
  }
}

// ============================================================================
// 2. PAYMENT STATUS POLLING
// ============================================================================

/**
 * Frontend: Poll payment status until completion
 */
async function pollPaymentStatus(transactionRef, maxAttempts = 120) {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`/api/payments/status/${transactionRef}`);
      const result = await response.json();

      console.log(`Status check (${attempts + 1}):`, result.data.status);

      if (result.data.status === 'completed') {
        console.log('✓ Payment successful!');
        return { success: true, transaction: result.data };
      }

      if (result.data.status === 'failed') {
        console.log('✗ Payment failed');
        return { success: false, reason: 'Payment rejected' };
      }

      // Still pending, wait 2 seconds
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      console.error('Status check failed:', error);
      attempts++;
    }
  }

  return { success: false, reason: 'Timeout waiting for payment' };
}

// ============================================================================
// 3. COMPLETE PAYMENT FLOW IN COMPONENT
// ============================================================================

/**
 * Example React component handling full payment flow
 */
function PaymentComponent() {
  // State management (pseudo-code)
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Step 1: Initiate payment
      const paymentResult = await initiatePayment(
        userId,
        selectedPlan.id,
        phone
      );

      setStatus({
        step: 'waiting',
        message: 'Enter PIN on your phone to complete payment',
        transactionRef: paymentResult.transactionRef,
      });

      // Step 2: Poll for completion
      const pollResult = await pollPaymentStatus(paymentResult.transactionRef);

      if (pollResult.success) {
        setStatus({
          step: 'success',
          message: 'Payment successful! Wi-Fi access activated.',
          accessToken: paymentResult.transactionRef,
        });

        // Step 3: Redirect to Wi-Fi portal or show access details
        // location.href = '/portal';
      } else {
        setStatus({
          step: 'error',
          message: pollResult.reason,
        });
      }
    } catch (error) {
      setStatus({
        step: 'error',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="0700000000"
      />
      <button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      {status && <div>{status.message}</div>}
    </div>
  );
}

// ============================================================================
// 4. WEBHOOK TESTING
// ============================================================================

/**
 * Test webhook signature generation and verification
 * Run in Node.js environment
 */
const crypto = require('crypto');

function testWebhookSignature() {
  const secret = '2900e03a57bfbeecfa7195f1';
  
  const payload = {
    status: 'SUCCESS',
    reference: '550e8400-e29b-41d4-a716-446655440000',
    provider_transaction_id: 'mp_tx_12345',
    phone: '256700000000',
    amount: 10000,
    timestamp: Math.floor(Date.now() / 1000),
  };

  // Calculate signature (what MunoPay would send)
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');

  console.log('Payload:', payloadStr);
  console.log('Signature:', signature);
  console.log('Header: X-Signature: ' + signature);

  // This is what you'd send to the webhook endpoint
  return { payload, signature };
}

// ============================================================================
// 5. WEBHOOK SIMULATION (Testing)
// ============================================================================

/**
 * Simulate MunoPay webhook call (for testing)
 */
async function simulateWebhook(transactionRef) {
  const crypto = require('crypto');
  const secret = process.env.MUNOPAY_WEBHOOK_SECRET;

  const payload = {
    status: 'SUCCESS',
    reference: transactionRef,
    provider_transaction_id: 'mp_tx_' + Math.random().toString(36).substr(2, 9),
    phone: '256700000000',
    amount: 10000,
    timestamp: Math.floor(Date.now() / 1000),
  };

  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadStr)
    .digest('hex');

  const response = await fetch('http://localhost:3000/api/payments/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: payloadStr,
  });

  const result = await response.json();
  console.log('Webhook response:', result);
  return result;
}

// ============================================================================
// 6. TESTING CHECKLIST
// ============================================================================

/**
 * Run these tests to verify integration
 */

/*
✓ Test 1: Payment Initiation
  curl -X POST http://localhost:3000/api/payments/initiate \
    -H "Content-Type: application/json" \
    -d '{"user_id":1,"plan_id":1,"phone":"256700000000","session_id":"test-1"}'
  
  Expected: 200 OK with transaction_ref UUID

✓ Test 2: Invalid Phone
  curl -X POST http://localhost:3000/api/payments/initiate \
    -H "Content-Type: application/json" \
    -d '{"user_id":1,"plan_id":1,"phone":"invalid","session_id":"test"}'
  
  Expected: 400 with INVALID_PHONE error

✓ Test 3: Missing User
  curl -X POST http://localhost:3000/api/payments/initiate \
    -H "Content-Type: application/json" \
    -d '{"user_id":99999,"plan_id":1,"phone":"256700000000","session_id":"test"}'
  
  Expected: 404 with USER_NOT_FOUND error

✓ Test 4: Check Status
  curl http://localhost:3000/api/payments/status/{transaction_ref}
  
  Expected: 200 with status: pending/completed/failed

✓ Test 5: Webhook Signature Verification
  // Generate valid signature
  PAYLOAD='{"status":"SUCCESS","reference":"550e8400...",...}'
  SECRET='2900e03a57bfbeecfa7195f1'
  SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)
  
  curl -X POST http://localhost:3000/api/payments/webhook \
    -H "X-Signature: $SIGNATURE" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
  
  Expected: 200 OK with success message

✓ Test 6: Invalid Webhook Signature
  curl -X POST http://localhost:3000/api/payments/webhook \
    -H "X-Signature: invalid" \
    -H "Content-Type: application/json" \
    -d '{"status":"SUCCESS",...}'
  
  Expected: 401 UNAUTHORIZED with INVALID_SIGNATURE error

✓ Test 7: Idempotent Webhook
  Send the same webhook payload twice
  
  Expected: 
    - First call: 200 with status "completed"
    - Second call: 200 with message "Webhook already processed"
*/

// ============================================================================
// 7. PRODUCTION CONSIDERATIONS
// ============================================================================

/*
RATE LIMITING:
- Limit /api/payments/initiate to 5 requests per phone per minute
- Limit /api/payments/webhook to prevent replay attacks

MONITORING:
- Log all payment initiation requests (excluding sensitive data)
- Monitor webhook delivery times
- Alert on failed webhooks
- Track payment completion rates

RECONCILIATION:
- Daily job to check for abandoned transactions (pending > 1 hour)
- Retry failed webhooks exponentially
- Generate reconciliation reports

SECURITY:
- Rotate webhook secret quarterly
- IP whitelist MunoPay servers
- Encrypt sensitive fields in database
- Implement request signing for additional verification
*/

// ============================================================================
// 8. WIFI SESSION MANAGEMENT
// ============================================================================

/**
 * After payment completion, manage Wi-Fi access
 */
async function getWiFiSessionDetails(transactionRef) {
  try {
    // Get transaction
    const txResponse = await fetch(`/api/payments/status/${transactionRef}`);
    const txResult = await txResponse.json();

    if (txResult.data.status !== 'completed') {
      throw new Error('Payment not completed');
    }

    // In real system, fetch from wifi_sessions table
    // Return details like:
    return {
      access_granted: true,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
      access_token: transactionRef,
      plan_name: 'Basic Plan',
      duration_minutes: 60,
      // Network details for display
      ssid: 'XHENFY-PORTAL',
      redirect_url: 'http://portal.xhenfy.local/auth',
    };
  } catch (error) {
    console.error('Failed to get Wi-Fi session:', error);
    throw error;
  }
}

// ============================================================================
// Export for use in other modules
// ============================================================================

module.exports = {
  initiatePayment,
  pollPaymentStatus,
  testWebhookSignature,
  simulateWebhook,
  getWiFiSessionDetails,
};
