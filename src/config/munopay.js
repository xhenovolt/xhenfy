/**
 * MunoPay Configuration
 * Environment variables must be set in .env.local
 */

export const MUNOPAY_CONFIG = {
  // API endpoint for payment initiation (correct endpoint from MunoPay docs)
  apiEndpoint: process.env.MUNOPAY_API_URL || 'https://payments.munopay.com/api/v1/deposit',
  
  // API key for authorization (API Secret Key)
  apiKey: process.env.MUNOPAY_API_KEY,
  
  // Webhook secret for signature verification
  webhookSecret: process.env.MUNOPAY_WEBHOOK_SECRET,
  
  // Timeout for external API calls (milliseconds)
  requestTimeout: 30000,
  
  // Currency code
  currency: 'UGX',
};

/**
 * Validate configuration on startup
 */
export function validateMunoPayConfig() {
  const requiredVars = ['MUNOPAY_API_KEY', 'MUNOPAY_WEBHOOK_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

/**
 * Get MunoPay API headers
 */
export function getMunoPayHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MUNOPAY_CONFIG.apiKey}`,
  };
}
