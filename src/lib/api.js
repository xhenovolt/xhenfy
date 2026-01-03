// API Helper utilities for captive portal

export const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      'Content-Type': 'application/json',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Call Failed [${url}]:`, error);
    throw error;
  }
};

export const getPlansList = async () => {
  return apiCall('/api/plans');
};

export const getSettings = async () => {
  return apiCall('/api/settings');
};

export const updateSetting = async (key, value) => {
  return apiCall('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
};

export const registerUser = async (phoneNumber, macAddress = null) => {
  return apiCall('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: phoneNumber,
      mac_address: macAddress,
    }),
  });
};

export const createSession = async (userId, planId, ipAddress = null) => {
  return apiCall('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      plan_id: planId,
      ip_address: ipAddress,
    }),
  });
};

export const getSessionStatus = async (sessionId) => {
  return apiCall(`/api/sessions?id=${sessionId}`);
};

export const processPayment = async (userId, planId, amount, provider = 'mtn') => {
  return apiCall('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      plan_id: planId,
      amount,
      provider,
    }),
  });
};

export default {
  apiCall,
  getPlansList,
  getSettings,
  updateSetting,
  registerUser,
  createSession,
  getSessionStatus,
  processPayment,
};
