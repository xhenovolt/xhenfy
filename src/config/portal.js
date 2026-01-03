// Configuration file for the captive portal
// This file contains all configurable settings

export const PORTAL_CONFIG = {
  // Portal branding
  name: 'Xhenfy',
  tagline: 'Fast, Reliable WiFi Access',
  description: 'Ultra-fast fiber optic connection with secure encrypted connections',

  // Default settings
  defaults: {
    currency: 'UGX',
    countryCode: '256', // Uganda
    sessionDuration: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },

  // API endpoints
  api: {
    plans: '/api/plans',
    settings: '/api/settings',
    registerUser: '/api/users/register',
    createSession: '/api/sessions',
    getSession: '/api/sessions',
    payment: '/api/payments',
  },

  // Plan feature descriptions
  planFeatures: {
    Daily: [
      'Perfect for travelers',
      'Flexible timing',
      'Quick setup',
    ],
    Weekly: [
      'Best for short stays',
      '20% savings',
      'Reliable connection',
    ],
    Monthly: [
      'Best value',
      '40% savings',
      'Priority support',
    ],
  },

  // Portal features
  features: [
    {
      icon: '⚡',
      title: 'Ultra-fast',
      description: 'Ultra-fast fiber optic connection',
    },
    {
      icon: '🔒',
      title: 'Secure',
      description: 'Secure encrypted connections',
    },
    {
      icon: '🌐',
      title: 'Support',
      description: '24/7 technical support',
    },
  ],

  // Setup steps
  setupSteps: [
    'Select your preferred plan',
    'Enter your phone number',
    'Complete payment and enjoy WiFi',
  ],

  // SweetAlert2 configuration
  sweetAlert: {
    theme: 'dark',
    showConfirmButton: true,
    allowOutsideClick: false,
    backdrop: 'rgba(0,0,0,0.7)',
  },
};

export default PORTAL_CONFIG;
