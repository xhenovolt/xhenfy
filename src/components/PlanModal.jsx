'use client';

import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

// MunoPay payment links mapped by plan duration
const PAYMENT_LINKS = {
  daily: 'https://payments.munopay.com/pay?id=39c7080f218b5615',
  weekly: 'https://payments.munopay.com/pay?id=5aed9cf7445246c1',
  monthly: 'https://payments.munopay.com/pay?id=87533bd24d543fd7',
};

export default function PlanModal({ isOpen, onClose, plan, currency = 'UGX' }) {
  const getPaymentLink = () => {
    if (!plan) return PAYMENT_LINKS.daily;
    if (plan.duration_minutes === 1440) return PAYMENT_LINKS.daily; // 24 hours
    if (plan.duration_minutes === 10080) return PAYMENT_LINKS.weekly; // 7 days
    if (plan.duration_minutes === 43200) return PAYMENT_LINKS.monthly; // 30 days
    return PAYMENT_LINKS.daily; // Default to daily
  };
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('256'); // UG country code
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    setLoading(true);

    try {
      // Register user
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const userResponse = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: fullPhoneNumber,
          mac_address: null,
        }),
      });

      const userData = await userResponse.json();

      if (!userData.success) {
        throw new Error(userData.error || 'Failed to register user');
      }

      // Initiate payment with MunoPay
      const sessionId = 'portal-' + Math.random().toString(36).substr(2, 9);
      const paymentResponse = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userData.data.id,
          plan_id: plan.id,
          phone: fullPhoneNumber,
          session_id: sessionId,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Failed to initiate payment');
      }

      // Success message and redirect
      const transactionRef = paymentData.data.transaction_ref;
      Swal.fire({
        icon: 'success',
        title: 'Payment Initiated!',
        html: `
          <div class="text-left">
            <p class="mb-2"><strong>Phone:</strong> ${fullPhoneNumber}</p>
            <p class="mb-2"><strong>Plan:</strong> ${paymentData.data.plan_name}</p>
            <p class="mb-2"><strong>Amount:</strong> ${paymentData.data.amount} ${paymentData.data.currency}</p>
            <p class="mb-4 text-sm text-gray-600">You will receive an STK Pop-up on your phone. Enter your PIN to complete the payment.</p>
            <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
              <p class="text-xs text-gray-600"><strong>Transaction ID:</strong></p>
              <p class="text-xs font-mono text-gray-700 break-all">${transactionRef}</p>
            </div>
            <div class="bg-green-50 border border-green-200 rounded p-3">
              <p class="text-sm font-semibold text-green-700 mb-2">✓ Payment Recorded</p>
              <p class="text-xs text-gray-600">Your payment has been logged. You'll be redirected to track its status.</p>
            </div>
          </div>
        `,
        confirmButtonText: 'Check Status',
        allowOutsideClick: false,
      }).then(() => {
        onClose();
        setPhoneNumber('');
        // Redirect to payment status page
        window.location.href = `/payment-status?ref=${transactionRef}`;
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: err.message || 'An error occurred while processing your payment',
        confirmButtonText: 'Try Again',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
          <h2 className="text-2xl font-bold">{plan.name} Plan</h2>
          <p className="text-blue-100 mt-1">Select this plan to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Plan Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">Duration:</span>
              <span className="text-gray-900 font-semibold">{plan.duration_minutes} minutes</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-medium">Price:</span>
              <span className="text-2xl font-bold text-blue-600">
                {plan.price} {plan.currency || 'UGX'}
              </span>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="flex items-center bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
                <span className="text-gray-700 font-medium">+{countryCode}</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Format: 7XX XXXXXX (without +256)</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-lg transition duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                <>
                  <span>📱</span>
                  Pay via Phone
                </>
              )}
            </button>
            <a
              href={getPaymentLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition duration-300 text-center flex items-center justify-center gap-2"
            >
              <span>💳</span>
              Direct Payment
            </a>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
