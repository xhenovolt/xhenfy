'use client';

import { useState, useEffect } from 'react';
import PlanModal from '@/components/PlanModal';

// MunoPay payment links mapped by plan duration
const PAYMENT_LINKS = {
  daily: 'https://payments.munopay.com/pay?id=39c7080f218b5615',
  weekly: 'https://payments.munopay.com/pay?id=5aed9cf7445246c1',
  monthly: 'https://payments.munopay.com/pay?id=87533bd24d543fd7',
};

const mockSession = {
  expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  macAddress: 'AA:BB:CC:DD:EE:FF',
  ipAddress: '192.168.1.100',
};

export default function PortalPage() {
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState('UGX');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionTime, setSessionTime] = useState('');

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => {
      updateSessionTime();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch plans and settings in parallel
      const [plansRes, settingsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/settings'),
      ]);

      const plansData = await plansRes.json();
      const settingsData = await settingsRes.json();

      if (plansData.success) {
        setPlans(plansData.data);
      }

      if (settingsData.success) {
        setCurrency(settingsData.data.default_currency || 'UGX');
      }

      updateSessionTime();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionTime = () => {
    const now = new Date();
    const timeDiff = mockSession.expiryTime - now;

    if (timeDiff <= 0) {
      setSessionTime('Session Expired');
      return;
    }

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    setSessionTime(`${hours}h ${minutes}m ${seconds}s`);
  };

  const getPaymentLink = (plan) => {
    if (plan.duration_minutes === 1440) return PAYMENT_LINKS.daily; // 24 hours
    if (plan.duration_minutes === 10080) return PAYMENT_LINKS.weekly; // 7 days
    if (plan.duration_minutes === 43200) return PAYMENT_LINKS.monthly; // 30 days
    return PAYMENT_LINKS.daily; // Default to daily
  };

  const openPlanModal = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const closePlanModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="text-white text-lg font-medium">Loading Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black bg-opacity-30 backdrop-blur-md border-b border-white border-opacity-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">Xhenfy Portal</h1>
                <p className="text-gray-300">Fast, Reliable WiFi Access</p>
              </div>
              <a
                href="/settings"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition transform hover:scale-105 flex items-center gap-2"
              >
                <span>⚙️</span>
                Settings
              </a>
            </div>
          </div>
        </header>

        {/* Session Info Bar */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-white border-opacity-10 px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Session Expiry</p>
                <p className="text-white font-semibold">{sessionTime}</p>
              </div>
              <div>
                <p className="text-gray-400">MAC Address</p>
                <p className="text-white font-mono text-xs sm:text-sm">{mockSession.macAddress}</p>
              </div>
              <div>
                <p className="text-gray-400">IP Address</p>
                <p className="text-white font-mono text-xs sm:text-sm">{mockSession.ipAddress}</p>
              </div>
              <div>
                <p className="text-gray-400">Currency</p>
                <p className="text-white font-semibold">{currency}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Welcome Section */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Welcome to Xhenfy WiFi
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Choose your plan and get instant access to high-speed internet. No hidden charges,
              transparent pricing.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="group bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl border border-white border-opacity-10 overflow-hidden hover:border-opacity-30 transition duration-300 transform hover:scale-105 hover:shadow-2xl"
              >
                {/* Plan Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-blue-100 text-sm">Uninterrupted Access</p>
                </div>

                {/* Plan Body */}
                <div className="px-6 py-8">
                  {/* Duration */}
                  <div className="mb-6 pb-6 border-b border-white border-opacity-10">
                    <p className="text-gray-400 text-sm mb-1">Duration</p>
                    <p className="text-2xl font-bold text-white">
                      {plan.duration_minutes === 1440
                        ? '24 Hours'
                        : plan.duration_minutes === 10080
                        ? '7 Days'
                        : '30 Days'}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <p className="text-gray-400 text-sm mb-2">Price</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-xl text-gray-300 font-semibold">{currency}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.name === 'Daily' && (
                      <>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Perfect for travelers
                        </p>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Flexible timing
                        </p>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Quick setup
                        </p>
                      </>
                    )}
                    {plan.name === 'Weekly' && (
                      <>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Best for short stays
                        </p>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> 20% savings
                        </p>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Reliable connection
                        </p>
                      </>
                    )}
                    {plan.name === 'Monthly' && (
                      <>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Best value
                        </p>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> 40% savings
                        </p>
                        <p className="text-gray-300 flex items-center gap-2">
                          <span className="text-green-400">✓</span> Priority support
                        </p>
                      </>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => openPlanModal(plan)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition duration-300 transform hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <span>🚀</span>
                      Get {plan.name}
                    </button>
                    <a
                      href={getPaymentLink(plan)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg transition duration-300 transform hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 text-center"
                    >
                      <span>💳</span>
                      Pay Now
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Info Section */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 bg-opacity-30 border border-white border-opacity-10 rounded-xl p-8 backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold text-white mb-4">Why Xhenfy?</h4>
                <ul className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl mt-1">⚡</span>
                    <span>Ultra-fast fiber optic connection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl mt-1">🔒</span>
                    <span>Secure encrypted connections</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400 text-xl mt-1">🌐</span>
                    <span>24/7 technical support</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-4">Quick Setup</h4>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-400">1.</span>
                    <span>Select your preferred plan</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-400">2.</span>
                    <span>Enter your phone number</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-blue-400">3.</span>
                    <span>Complete payment and enjoy WiFi</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-black bg-opacity-40 backdrop-blur-md border-t border-white border-opacity-10 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-400 text-sm">
              <p>© 2026 Xhenfy Portal. All prices displayed in {currency}</p>
              <p className="mt-2 text-gray-500">
                <span className="text-yellow-400">⚠️</span> This is a mock payment system. No real transactions are processed.
              </p>
            </div>
          </div>
        </footer>
      </div>

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={closePlanModal}
        plan={selectedPlan}
        currency={currency}
      />
    </div>
  );
}
   