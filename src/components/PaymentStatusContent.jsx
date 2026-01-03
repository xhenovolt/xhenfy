'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';

export function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (reference) {
      checkPaymentStatus();
      // Poll for status updates every 3 seconds for 2 minutes
      setPolling(true);
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 3000);
      const timeout = setTimeout(() => {
        setPolling(false);
        clearInterval(interval);
      }, 120000); // 2 minutes
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      setError('No transaction reference provided');
      setLoading(false);
    }
  }, [reference]);

  const checkPaymentStatus = async () => {
    try {
      const res = await fetch(`/api/payments/status/${reference}`);
      const data = await res.json();

      if (data.success && data.data) {
        setTransaction(data.data);
        if (data.data.status === 'completed') {
          setPolling(false);
        }
      } else {
        setError(data.error || 'Could not fetch payment status');
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError('Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'pending':
        return '⏳';
      default:
        return '•';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'completed':
        return 'Payment successfully completed! Your WiFi session is now active.';
      case 'failed':
        return 'Payment failed. Please try again or contact support.';
      case 'pending':
        return 'Payment is being processed. Please wait and check back in a few moments.';
      default:
        return 'Unknown status';
    }
  };

  if (loading && !transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-red-600 text-4xl mb-4 text-center">✗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <a
            href="/"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium"
          >
            Back to Portal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        {/* Status Header */}
        <div className="text-center mb-8">
          <div className={`text-5xl mb-4 ${getStatusColor(transaction?.status)}`}>
            {getStatusIcon(transaction?.status)}
          </div>
          <h2 className={`text-2xl font-bold ${getStatusColor(transaction?.status)}`}>
            {transaction?.status === 'completed'
              ? 'Payment Successful'
              : transaction?.status === 'failed'
              ? 'Payment Failed'
              : 'Payment Pending'}
          </h2>
        </div>

        {/* Status Message */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <p className="text-gray-700 text-center">{getStatusMessage(transaction?.status)}</p>
          {polling && transaction?.status === 'pending' && (
            <p className="text-xs text-gray-500 text-center mt-2">Auto-refreshing status...</p>
          )}
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 mb-8">
          <div className="border-b pb-4">
            <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
            <p className="text-sm font-mono text-gray-900 break-all">{transaction?.reference}</p>
          </div>
          <div className="border-b pb-4">
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="text-lg font-bold text-gray-900">
              {transaction?.amount} {transaction?.phone?.startsWith('256') ? 'UGX' : 'UGX'}
            </p>
          </div>
          <div className="border-b pb-4">
            <p className="text-xs text-gray-500 mb-1">Phone Number</p>
            <p className="text-sm text-gray-900">{transaction?.phone}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <p className={`text-sm font-semibold ${getStatusColor(transaction?.status)}`}>
              {transaction?.status?.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {transaction?.status === 'completed' && (
            <>
              <a
                href="/"
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center font-medium flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                Enjoy Your WiFi
              </a>
              <p className="text-xs text-gray-500 text-center">
                Your WiFi session has been activated. You can now connect to the network.
              </p>
            </>
          )}
          {transaction?.status === 'failed' && (
            <>
              <a
                href="/"
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center font-medium"
              >
                Try Again
              </a>
              <p className="text-xs text-gray-500 text-center">
                Please contact support if you continue to experience issues.
              </p>
            </>
          )}
          {transaction?.status === 'pending' && (
            <>
              <button
                onClick={checkPaymentStatus}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Refresh Status
              </button>
              <a
                href="/"
                className="w-full px-4 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition text-center font-medium"
              >
                Back to Portal
              </a>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-xs text-blue-700">
            <strong>💡 Tip:</strong> Check your email for a payment receipt and instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
