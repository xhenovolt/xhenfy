import { query } from './db';

/**
 * Database operations for payment transactions
 * Ensures ACID compliance and idempotency
 */

/**
 * Create a pending transaction
 * @returns {object} - Transaction record
 */
export async function createTransaction(data) {
  const {
    reference,
    user_id,
    plan_id,
    amount,
    phone,
    session_id,
  } = data;

  const result = await query(
    `INSERT INTO transactions (reference, user_id, plan_id, amount, phone, session_id, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', CURRENT_TIMESTAMP)
     RETURNING id, reference, user_id, plan_id, amount, phone, session_id, status, created_at`,
    [reference, user_id, plan_id, amount, phone, session_id]
  );

  return result.rows[0];
}

/**
 * Get transaction by reference
 * Used for idempotency check and webhook processing
 */
export async function getTransactionByReference(reference) {
  const result = await query(
    'SELECT * FROM transactions WHERE reference = $1',
    [reference]
  );

  return result.rows[0] || null;
}

/**
 * Update transaction status
 * Called by webhook when payment completes
 */
export async function updateTransactionStatus(reference, status, providerTxId = null) {
  const result = await query(
    `UPDATE transactions 
     SET status = $1, provider_tx_id = $2, updated_at = CURRENT_TIMESTAMP
     WHERE reference = $3
     RETURNING *`,
    [status, providerTxId, reference]
  );

  return result.rows[0] || null;
}

/**
 * Create or update Wi-Fi session after successful payment
 * @param {object} sessionData - Session details
 */
export async function activateWiFiSession(sessionData) {
  const {
    user_id,
    plan_id,
    transaction_id,
    mac_address,
    ip_address,
    duration_minutes,
  } = sessionData;

  // Calculate session expiry
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + duration_minutes);

  const result = await query(
    `INSERT INTO wifi_sessions (user_id, plan_id, transaction_id, mac_address, ip_address, status, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, 'active', $6, CURRENT_TIMESTAMP)
     RETURNING id, user_id, plan_id, transaction_id, mac_address, ip_address, status, expires_at, created_at`,
    [user_id, plan_id, transaction_id, mac_address, ip_address, expiresAt]
  );

  return result.rows[0];
}

/**
 * Get plan details
 */
export async function getPlanById(planId) {
  const result = await query(
    'SELECT id, name, price, duration_minutes, currency FROM plans WHERE id = $1 AND active = true',
    [planId]
  );

  return result.rows[0] || null;
}

/**
 * Get user by ID
 */
export async function getUserById(userId) {
  const result = await query(
    'SELECT id, phone_number, mac_address, status FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Get or create user by phone number
 */
export async function getOrCreateUserByPhone(phone) {
  // First try to get existing user
  let result = await query(
    'SELECT id, phone_number, mac_address, status FROM users WHERE phone_number = $1',
    [phone]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create new user if doesn't exist
  result = await query(
    `INSERT INTO users (phone_number, first_seen)
     VALUES ($1, CURRENT_TIMESTAMP)
     RETURNING id, phone_number, mac_address, status`,
    [phone]
  );

  return result.rows[0];
}

/**
 * Get active Wi-Fi session for user
 */
export async function getActiveSessionForUser(userId) {
  const result = await query(
    `SELECT * FROM wifi_sessions 
     WHERE user_id = $1 AND status = 'active' AND expires_at > CURRENT_TIMESTAMP
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
}

/**
 * Update user last_seen timestamp
 */
export async function updateUserLastSeen(userId) {
  return query(
    'UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  );
}
