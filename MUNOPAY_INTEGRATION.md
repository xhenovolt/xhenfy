# MunoPay Payment Integration - Xhenfy

## Overview

This implementation integrates **MunoPay Uganda** for real Mobile Money payments (MTN MoMo / Airtel Money) with STK Push functionality into Xhenfy's captive portal system.

## Architecture

### Payment Flow

```
1. Client → /api/payments/initiate
   ├─ Validates phone, plan_id, user_id, session_id
   ├─ Creates PENDING transaction (UUID reference)
   ├─ Calls MunoPay API with STK Push
   └─ Returns transaction_ref to client

2. MunoPay processes payment
   ├─ User receives STK Pop-up on phone
   ├─ User enters PIN to complete
   ├─ Payment succeeds or fails

3. MunoPay → /api/payments/webhook (callback)
   ├─ Verifies HMAC-SHA256 signature
   ├─ Checks idempotency (prevents double-processing)
   ├─ Updates transaction status (PENDING → COMPLETED/FAILED)
   ├─ On SUCCESS: Activates Wi-Fi session
   └─ Returns 200 OK

4. Client polls or listens for transaction status
   ├─ Checks transaction.status in database
   └─ Displays Wi-Fi access details if COMPLETED
```

### Key Security Features

1. **Signature Verification**: All webhooks verified using HMAC-SHA256
2. **Idempotency**: Transaction references are UUIDs, multiple webhook calls are safely handled
3. **API Key Protection**: Never exposed to frontend, only used server-side
4. **Timestamp Validation**: All timestamps are server-generated
5. **Input Validation**: Phone numbers validated, amounts from database only
6. **Error Obfuscation**: No sensitive details exposed to clients

## Environment Variables

Create `.env.local` in project root:

```env
MUNOPAY_API_KEY=Mp_key-e1c998a08b4f96bd9a276052b5b290a8-X
MUNOPAY_WEBHOOK_SECRET=2900e03a57bfbeecfa7195f1
MUNOPAY_API_URL=https://api.munopay.com/v1/payments
NEON_DB_URL=postgresql://user:password@host/dbname
```

## API Endpoints

### 1. POST `/api/payments/initiate`

Initiates a payment with MunoPay.

**Request:**
```javascript
{
  "user_id": 1,
  "plan_id": 1,
  "phone": "256700000000",  // or "+256700000000" or "0700000000"
  "session_id": "portal-session-token"
}
```

**Response (Success):**
```javascript
{
  "success": true,
  "data": {
    "transaction_ref": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "amount": 10000,
    "currency": "UGX",
    "plan_name": "1 Hour",
    "plan_duration_minutes": 60,
    "munopay_request_id": "mp_req_12345"
  },
  "timestamp": "2024-01-02T10:30:45.123Z"
}
```

**Response (Error):**
```javascript
{
  "success": false,
  "error": "Invalid phone number format. Use 256700000000, +256700000000, or 0700000000",
  "code": "INVALID_PHONE",
  "timestamp": "2024-01-02T10:30:45.123Z"
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Missing required fields
- `INVALID_PHONE` - Phone format invalid
- `USER_NOT_FOUND` - User ID doesn't exist
- `PLAN_NOT_FOUND` - Plan ID doesn't exist or inactive
- `MUNOPAY_REQUEST_FAILED` - MunoPay API error
- `INTERNAL_ERROR` - Server error

### 2. POST `/api/payments/webhook`

MunoPay sends payment status updates to this endpoint.

**MunoPay Request:**
```javascript
POST /api/payments/webhook
X-Signature: <hmac-sha256-signature>
Content-Type: application/json

{
  "status": "SUCCESS",
  "reference": "550e8400-e29b-41d4-a716-446655440000",
  "provider_transaction_id": "mp_tx_98765",
  "phone": "256700000000",
  "amount": 10000,
  "timestamp": 1704192645,
  "failure_reason": null
}
```

**Response (Success):**
```javascript
{
  "success": true,
  "data": {
    "message": "Payment processed successfully",
    "transaction_ref": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "wifi_session_activated": true
  },
  "timestamp": "2024-01-02T10:30:45.123Z"
}
```

**Webhook Signature Verification:**

```javascript
// MunoPay sends: X-Signature: <signature>
// Calculate expected signature:
const expectedSignature = HMAC-SHA256(rawBody, WEBHOOK_SECRET)
// Verify: expectedSignature == signature (timing-safe)
```

## Database Schema

### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  reference UUID UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  amount INTEGER NOT NULL,
  phone VARCHAR(20) NOT NULL,
  session_id VARCHAR(255),
  mac_address VARCHAR(17),
  ip_address VARCHAR(45),
  provider_tx_id VARCHAR(255),
  status VARCHAR(50),  -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### WiFi Sessions Table
```sql
CREATE TABLE wifi_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  transaction_id INTEGER REFERENCES transactions(id),
  mac_address VARCHAR(17),
  ip_address VARCHAR(45),
  status VARCHAR(50),  -- active, expired, revoked
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Payment Status States

### Transaction Status
- **pending**: Payment initiated, awaiting user action
- **completed**: Payment successful, Wi-Fi session activated
- **failed**: Payment rejected or cancelled

### WiFi Session Status
- **active**: User has valid internet access
- **expired**: Session duration exceeded
- **revoked**: Admin or user terminated access

## Integration Steps

### 1. Install Dependencies

Already in `package.json`:
- `pg` - PostgreSQL driver
- `axios` - HTTP client (optional, using fetch instead)

### 2. Set Environment Variables

```bash
# .env.local
MUNOPAY_API_KEY=your-api-key
MUNOPAY_WEBHOOK_SECRET=your-webhook-secret
MUNOPAY_API_URL=https://api.munopay.com/v1/payments
```

### 3. Update Database

```bash
npm run db:setup
```

This will create the new `transactions` and `wifi_sessions` tables.

### 4. Configure MunoPay Webhook

In your MunoPay dashboard, set webhook URL to:
```
https://your-domain.com/api/payments/webhook
```

MunoPay will POST payment updates here with signature in `X-Signature` header.

### 5. Frontend Integration

**Initiate Payment:**
```javascript
// 1. User selects plan and enters phone
async function initiatePayment() {
  const response = await fetch('/api/payments/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: 1,
      plan_id: selectedPlan.id,
      phone: userPhone,
      session_id: portalSessionToken
    })
  });
  
  const result = await response.json();
  if (result.success) {
    const transactionRef = result.data.transaction_ref;
    // User receives STK Push on phone
    // Poll for status...
  }
}

// 2. Poll transaction status
async function checkPaymentStatus(transactionRef) {
  const response = await fetch(`/api/payments/status/${transactionRef}`);
  const result = await response.json();
  
  if (result.status === 'completed') {
    // Activate Wi-Fi access UI
    // Redirect to portal or show access token
  }
}
```

### 6. Captive Portal Integration

**Access Control Options:**

After payment completion, activate Wi-Fi access using one of these methods:

**Option A: MAC Address Binding**
```javascript
// After payment success, use wifi_session.mac_address
// Configure Captive Portal to whitelist MAC
const session = await getActiveSessionForUser(userId);
addMACToWhitelist(session.mac_address, session.expires_at);
```

**Option B: IP Address Binding**
```javascript
// Use wifi_session.ip_address for temporary rules
const session = await getActiveSessionForUser(userId);
addIPToWhitelist(session.ip_address, session.expires_at);
```

**Option C: Session Token**
```javascript
// Generate JWT or opaque token from transaction_ref
const token = generateAccessToken(transaction.reference, expiresAt);
// Client includes token in subsequent requests
// Portal validates token against database
```

## Security Checklist

- [x] API key never exposed to frontend
- [x] Webhook signatures verified (HMAC-SHA256)
- [x] Idempotent webhook handling (UUID + database unique constraint)
- [x] Timestamps server-generated
- [x] Phone numbers validated and formatted
- [x] Amounts from database only (not client input)
- [x] No sensitive data in error messages
- [x] Timing-safe signature comparison
- [x] Transaction reference globally unique (UUID)
- [x] Error logging without exposing internals

## Testing

### Test Payment Initiation
```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "plan_id": 1,
    "phone": "256700000000",
    "session_id": "test-session"
  }'
```

### Test Webhook (with valid signature)
```bash
# Calculate signature
PAYLOAD='{"status":"SUCCESS","reference":"550e8400-e29b-41d4-a716-446655440000",...}'
SECRET='2900e03a57bfbeecfa7195f1'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/payments/webhook \
  -H "X-Signature: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
```

## Troubleshooting

**MunoPay API Returns 401 Unauthorized**
- Verify API key in `MUNOPAY_API_KEY`
- Check format: `Bearer {MUNOPAY_API_KEY}`

**Webhook Signature Invalid**
- Verify raw body is used (not parsed JSON)
- Verify webhook secret is correct
- Check header case: `x-signature`, `X-Signature`

**Transaction Not Found on Webhook**
- Ensure `/api/payments/initiate` completes before webhook fires
- Check transaction.reference UUID format

**Wi-Fi Session Not Activated**
- Verify plan.duration_minutes is set
- Check user_id and plan_id foreign keys exist
- Review error logs in webhook response

## Production Checklist

- [ ] Use HTTPS for all API endpoints
- [ ] Rate limit `/api/payments/initiate` (prevent brute force)
- [ ] Rate limit `/api/payments/webhook` (prevent replay attacks)
- [ ] Monitor webhook delivery times
- [ ] Set up alerts for failed payments
- [ ] Implement payment reconciliation job (daily)
- [ ] Add request logging (exclude sensitive data)
- [ ] Encrypt sensitive fields in database (optional)
- [ ] Configure MunoPay IP whitelist
- [ ] Test webhook retry logic
- [ ] Monitor database transaction size

## Files Created/Modified

1. **New Files:**
   - `/src/lib/payment.js` - Payment utilities
   - `/src/config/munopay.js` - MunoPay configuration
   - `/src/lib/paymentDb.js` - Database operations
   - `/src/app/api/payments/webhook/route.js` - Webhook endpoint

2. **Modified Files:**
   - `/src/app/api/payments/route.js` - Payment initiation endpoint
   - `/scripts/setupDb.js` - Database schema with new tables

## Next Steps

1. Add payment status endpoint: `GET /api/payments/status/:reference`
2. Add transaction history endpoint: `GET /api/payments/transactions/:userId`
3. Implement Wi-Fi session management UI
4. Add payment reconciliation job for failed webhooks
5. Integrate with specific captive portal solution (Mikrotik, OpenWRT, etc.)
