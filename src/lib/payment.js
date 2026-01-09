import crypto from 'crypto';

/**
 * MunoPay Payment Utility Functions
 * Handles payment initiation, verification, and webhook signature validation
 */

/**
 * Generate a unique transaction reference (UUID-based)
 */
export function generateTransactionRef() {
  return crypto.randomUUID();
}

/**
 * Calculate webhook signature using HMAC-SHA256
 * @param {string} payload - JSON stringified payload
 * @param {string} secret - Webhook secret
 * @returns {string} - Hex-encoded signature
 */
export function calculateWebhookSignature(payload, secret) {
  if (typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 * @param {string} payload - JSON stringified payload
 * @param {string} signature - Signature from request header
 * @param {string} secret - Webhook secret
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = calculateWebhookSignature(payload, secret);
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Prepare MunoPay API request
 * @param {string} phone - Phone number (must include country code, e.g., 256700000000)
 * @param {number} amount - Amount in UGX
 * @param {string} reference - Unique transaction reference
 * @returns {object} - Payload for MunoPay API
 */
export function prepareMunoPayPayload(phone, amount, reference) {
  return {
    account_number: '0100123456789', // Required by MunoPay API
    reference: reference,
    phone: phone,
    amount: parseFloat(amount), // MunoPay expects decimal
    description: `Xhenfy Portal - Wi-Fi Access Payment`,
    email: 'portal@xhenfy.local',
    names: 'Portal User',
  };
}

/**
 * Format error response
 */
export function formatErrorResponse(message, code = 'PAYMENT_ERROR') {
  return {
    success: false,
    error: message,
    code: code,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format success response
 */
export function formatSuccessResponse(data) {
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate phone number (East African format)
 * Accepts: 256700000000, +256700000000, or 0700000000
 */
export function validateAndFormatPhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return null;
  }

  // Remove spaces and hyphens
  let formatted = phone.replace(/[\s\-]/g, '');

  // Handle different formats
  if (formatted.startsWith('+256')) {
    // Already in correct format
    return formatted.substring(1); // Remove + for API
  } else if (formatted.startsWith('256')) {
    // Already correct format
    return formatted;
  } else if (formatted.startsWith('0')) {
    // Local format (0700000000) -> 256700000000
    return '256' + formatted.substring(1);
  }

  return null; // Invalid format
}
