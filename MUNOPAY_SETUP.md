# MunoPay Integration - Setup Guide

## Quick Start

### 1. Configure Environment Variables

Copy the example file and fill in your MunoPay credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
MUNOPAY_API_KEY=Mp_key-e1c998a08b4f96bd9a276052b5b290a8-X
MUNOPAY_WEBHOOK_SECRET=2900e03a57bfbeecfa7195f1
NEON_DB_URL=postgresql://user:password@db.neon.tech/xhenfy
```

### 2. Set Up Database

The database schema includes new tables for payment tracking:

```bash
npm run db:setup
```

This creates:
- `transactions` - Payment records with MunoPay integration
- `wifi_sessions` - Active Wi-Fi access sessions
- Indexes for performance optimization

### 3. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### 4. Configure MunoPay Webhook

In MunoPay Dashboard:

1. Go to **Settings → Webhooks**
2. Add new webhook:
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `payment.success`, `payment.failed`
3. Copy webhook secret to `.env.local`
4. Save and activate

### 5. Test Integration

#### A. Test Payment Initiation

```bash
curl -X POST http://localhost:3000/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "plan_id": 1,
    "phone": "0700000000",
    "session_id": "test-session"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "transaction_ref": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "amount": 10000,
    "currency": "UGX"
  }
}
```

#### B. Check Payment Status

```bash
curl http://localhost:3000/api/payments/status/550e8400-e29b-41d4-a716-446655440000
```

#### C. Simulate Webhook (Testing Only)

In Node.js REPL:
```javascript
const crypto = require('crypto');
const secret = '2900e03a57bfbeecfa7195f1';

const payload = {
  status: 'SUCCESS',
  reference: '550e8400-e29b-41d4-a716-446655440000',
  provider_transaction_id: 'mp_tx_test',
  phone: '256700000000',
  amount: 10000,
  timestamp: Math.floor(Date.now() / 1000)
};

const payloadStr = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', secret)
  .update(payloadStr)
  .digest('hex');

console.log('Signature:', signature);
```

Then send webhook:
```bash
curl -X POST http://localhost:3000/api/payments/webhook \
  -H "X-Signature: <signature>" \
  -H "Content-Type: application/json" \
  -d '{"status":"SUCCESS","reference":"...",...}'
```

## File Structure

```
xhenfy/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── payments/
│   │   │       ├── route.js                    # POST /payments/initiate
│   │   │       ├── webhook/
│   │   │       │   └── route.js                # POST /payments/webhook
│   │   │       └── status/
│   │   │           └── [reference]/
│   │   │               └── route.js            # GET /payments/status/:ref
│   ├── config/
│   │   └── munopay.js                          # MunoPay config
│   └── lib/
│       ├── payment.js                          # Payment utilities
│       ├── paymentDb.js                        # Database operations
│       └── db.js                               # Database connection
├── scripts/
│   └── setupDb.js                              # Database schema (updated)
├── .env.local                                  # Environment variables
├── .env.local.example                          # Template
├── MUNOPAY_INTEGRATION.md                      # Full documentation
├── MUNOPAY_EXAMPLES.js                         # Code examples
└── MUNOPAY_SETUP.md                            # This file
```

## Key Files

### Payment Initiation
**File**: [src/app/api/payments/route.js](src/app/api/payments/route.js)

Handles payment initiation:
- Validates phone and plan
- Creates transaction record
- Calls MunoPay API
- Returns transaction reference

### Webhook Handler
**File**: [src/app/api/payments/webhook/route.js](src/app/api/payments/webhook/route.js)

Processes MunoPay callbacks:
- Verifies signature
- Checks idempotency
- Updates transaction status
- Activates Wi-Fi session

### Utilities
**File**: [src/lib/payment.js](src/lib/payment.js)

Helper functions:
- Phone number validation and formatting
- Signature generation/verification
- Error formatting
- Transaction reference generation

### Database Operations
**File**: [src/lib/paymentDb.js](src/lib/paymentDb.js)

Database transactions:
- Create/update transactions
- Manage Wi-Fi sessions
- User and plan lookups
- Idempotency support

## Security Features

### ✓ Implemented

1. **Signature Verification** - HMAC-SHA256 on all webhooks
2. **Idempotency** - UUID references prevent duplicate processing
3. **API Key Protection** - Never exposed to frontend
4. **Input Validation** - Phone numbers, amounts from database
5. **Error Obfuscation** - No sensitive details in responses
6. **Timing-Safe Comparison** - Prevents timing attacks
7. **Server-Side Timestamps** - All dates generated server-side
8. **Foreign Key Constraints** - Database integrity
9. **Transaction Atomicity** - ACID compliance via PostgreSQL

### ⚠ To Implement in Production

1. **Rate Limiting** - Use middleware to limit requests
   ```javascript
   // Example: limit to 5 payments per phone per minute
   ```

2. **HTTPS Only** - Enforce TLS 1.2+

3. **Request Logging** - Log all transactions (exclude sensitive data)

4. **Monitoring** - Alert on:
   - Failed webhooks
   - Unusual payment patterns
   - API errors
   - Database issues

5. **Reconciliation Job** - Daily payment reconciliation
   ```bash
   node scripts/reconcilePayments.js
   ```

6. **Database Backups** - Automated daily backups

7. **IP Whitelisting** - Only allow MunoPay servers to hit webhook

8. **Secret Rotation** - Rotate webhook secret quarterly

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
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_user ON transactions(user_id);
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
  status VARCHAR(50),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wifi_sessions_user ON wifi_sessions(user_id);
CREATE INDEX idx_wifi_sessions_status ON wifi_sessions(status);
CREATE INDEX idx_wifi_sessions_expires ON wifi_sessions(expires_at);
```

## API Endpoints

### Initiate Payment
```
POST /api/payments/initiate
Content-Type: application/json

{
  "user_id": 1,
  "plan_id": 1,
  "phone": "256700000000",
  "session_id": "portal-token"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "transaction_ref": "uuid",
    "status": "pending",
    "amount": 10000
  }
}
```

### Check Status
```
GET /api/payments/status/:reference

Response: 200 OK
{
  "success": true,
  "data": {
    "reference": "uuid",
    "status": "pending|completed|failed",
    "amount": 10000
  }
}
```

### Webhook (MunoPay)
```
POST /api/payments/webhook
X-Signature: <hmac-sha256>
Content-Type: application/json

{
  "status": "SUCCESS",
  "reference": "uuid",
  "provider_transaction_id": "mp_tx_123",
  "phone": "256700000000",
  "amount": 10000,
  "timestamp": 1704192645
}

Response: 200 OK
```

## Troubleshooting

### Payment Initiation Fails

**401 Unauthorized from MunoPay**
- Check `MUNOPAY_API_KEY` in `.env.local`
- Verify API key format (should be: `Mp_key-...`)

**404 User/Plan Not Found**
- Ensure user and plan exist in database
- Check user_id and plan_id match

**Invalid Phone Format**
- Use format: `256700000000`, `+256700000000`, or `0700000000`
- Must be valid E.164 format

### Webhook Fails

**Signature Mismatch**
- Verify raw request body is used (not parsed)
- Check webhook secret in `.env.local`
- Ensure header is `X-Signature` (case-sensitive)

**Transaction Not Found**
- Ensure payment initiation succeeded first
- Check transaction.reference UUID matches

**Session Activation Failed**
- Verify plan.duration_minutes is set
- Check foreign key constraints

## Performance Considerations

### Indexing Strategy
```sql
-- Already created by setupDb.js
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_wifi_sessions_user ON wifi_sessions(user_id);
CREATE INDEX idx_wifi_sessions_expires ON wifi_sessions(expires_at);
```

### Query Optimization
- Use indexes for transaction lookups
- Batch expire expired sessions
- Archive old transactions quarterly

### Caching
- Cache plan details (stable, long TTL)
- Don't cache transaction status (volatile)
- Use Redis for session tokens if needed

## Monitoring & Alerting

### Key Metrics
```
- Payment success rate (target: > 95%)
- Webhook delivery latency (target: < 1s)
- Failed transactions (alert if > 5%)
- API error rate (alert if > 1%)
```

### Logs to Monitor
```
[INFO] Payment initiated: {reference}
[WARN] Payment failed: {reference} - {reason}
[ERROR] Webhook delivery failed: {error}
[ERROR] Database error: {message}
```

## Next Steps

1. ✓ Review [MUNOPAY_INTEGRATION.md](MUNOPAY_INTEGRATION.md)
2. ✓ Review [MUNOPAY_EXAMPLES.js](MUNOPAY_EXAMPLES.js)
3. Set up `.env.local` with credentials
4. Run `npm run db:setup`
5. Test endpoints with curl/Postman
6. Integrate with frontend
7. Configure MunoPay webhook
8. Deploy to production
9. Set up monitoring and alerts
10. Configure rate limiting

## Support

For issues or questions:
1. Check [MUNOPAY_INTEGRATION.md](MUNOPAY_INTEGRATION.md) for detailed docs
2. Review [MUNOPAY_EXAMPLES.js](MUNOPAY_EXAMPLES.js) for code samples
3. Check logs for error details
4. Contact MunoPay support for API issues

---

**Status**: Production Ready  
**Last Updated**: January 2, 2026
