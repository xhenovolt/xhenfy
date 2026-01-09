'use client';

import { useState } from 'react';
import Swal from 'sweetalert2';

export default function MunoPayTestPage() {
  const [phone, setPhone] = useState('+256741341483');
  const [amount] = useState(4000);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handlePayment = async () => {
    if (!phone.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a phone number',
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      // Call the test endpoint
      const res = await fetch('/api/test-munopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          amount: amount,
        }),
      });

      const data = await res.json();
      setResponse(data);

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'STK Push Sent!',
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>Phone:</strong> ${phone}</p>
              <p class="mb-2"><strong>Amount:</strong> ${amount} UGX</p>
              <p class="mb-4 text-sm text-gray-600">Check your phone for STK Pop-up</p>
              <div class="bg-blue-50 border border-blue-200 rounded p-3">
                <p class="text-xs text-gray-600"><strong>Transaction ID:</strong></p>
                <p class="text-xs font-mono text-gray-700 break-all">${data.data?.request_id || 'N/A'}</p>
              </div>
            </div>
          `,
          confirmButtonText: 'OK',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Payment Failed',
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>Error:</strong> ${data.error || 'Unknown error'}</p>
              <p class="mb-2"><strong>Code:</strong> ${data.code || 'N/A'}</p>
            </div>
          `,
          confirmButtonText: 'Try Again',
        });
      }
    } catch (error) {
      console.error('Test payment error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Request Failed',
        text: error.message || 'Failed to send STK push',
        confirmButtonText: 'Try Again',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">MunoPay Test</h1>
          <p className="text-gray-600 mb-6">Test STK Push Payment</p>

          <div className="space-y-4">
            {/* Amount Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Test Amount</p>
              <p className="text-3xl font-bold text-blue-600">{amount} UGX</p>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+256700000000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: +256XXXXXXXXX or 256XXXXXXXXX
              </p>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? 'Processing...' : 'Send STK Push (4000 UGX)'}
            </button>

            {/* Response Display */}
            {response && (
              <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                <p className="text-sm font-bold text-gray-700 mb-2">API Response:</p>
                <pre className="text-xs text-gray-700 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> This page directly tests the MunoPay API. If the STK push is sent successfully, you will receive a payment prompt on your phone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
