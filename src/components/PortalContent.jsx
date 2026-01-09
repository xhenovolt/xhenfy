'use client';

import { useState, useEffect } from 'react';
import PlanModal from '@/components/PlanModal';

// Fallback plans if API fails
const FALLBACK_PLANS = [
  { id: 1, name: '1 Hour', price: 500, duration_minutes: 60, currency: 'UGX' },
  { id: 2, name: '6 Hours', price: 600, duration_minutes: 360, currency: 'UGX' },
  { id: 3, name: '12 Hours', price: 700, duration_minutes: 720, currency: 'UGX' },
  { id: 4, name: 'Weekly', price: 5500, duration_minutes: 10080, currency: 'UGX' },
  { id: 5, name: 'Monthly', price: 25000, duration_minutes: 43200, currency: 'UGX' },
];

const mockSession = {
  expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
  macAddress: 'AA:BB:CC:DD:EE:FF',
  ipAddress: '192.168.1.100',
};

/**
 * Plan Card Component
 */
function PlanCard({ plan, isPopular, onSelect }) {
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
    if (minutes < 43200) return `${Math.floor(minutes / 10080)}w`;
    return `${Math.floor(minutes / 43200)}mo`;
  };

  const getFeatures = () => {
    const commonFeatures = ['Fast speeds', 'Instant activation', 'Secure payment'];
    const durationFeatures = {
      '1 Hour': ['Perfect for quick browsing'],
      '6 Hours': ['Stream videos', 'Work sessions'],
      '12 Hours': ['Extended usage', 'Better value'],
      'Weekly': ['Full week access', 'Save 30%'],
      'Monthly': ['Unlimited access', 'Save 45%'],
    };
    return [...commonFeatures, ...(durationFeatures[plan.name] || [])];
  };

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 hover:shadow-xl ${
        isPopular
          ? 'ring-2 ring-blue-500 dark:ring-blue-400 scale-105 shadow-lg dark:shadow-blue-900/30 md:col-span-2 lg:col-span-1'
          : 'shadow-sm dark:shadow-slate-900/50'
      } bg-white dark:bg-slate-800`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
          🏆 Best Value
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Plan Name and Duration */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
            {formatDuration(plan.duration_minutes)}
          </div>
        </div>

        {/* Price */}
        <div className="my-8 pb-8 border-b-2 border-gray-100 dark:border-slate-700">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900 dark:text-white">
              {typeof plan.price === 'number' ? plan.price.toLocaleString() : plan.price}
            </span>
            <span className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
              {plan.currency || 'UGX'}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="mb-8 space-y-3">
          {getFeatures().map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan)}
          className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 text-center ${
            isPopular
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-400 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white shadow-md hover:shadow-lg active:scale-95'
              : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-600 active:scale-95'
          }`}
        >
          Get {plan.name} Access
        </button>
      </div>
    </div>
  );
}

/**
 * Main Portal Component
 */
export function PortalContent() {
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState('UGX');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionTime, setSessionTime] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Detect system dark mode preference
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(isDark);

    // Update the HTML element
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    fetchData();
    const timer = setInterval(updateSessionTime, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [plansRes, settingsRes] = await Promise.all([
        fetch('/api/plans').catch(() => ({ ok: false })),
        fetch('/api/settings').catch(() => ({ ok: false })),
      ]);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.success && plansData.data) {
          setPlans(plansData.data);
        } else {
          setPlans(FALLBACK_PLANS);
        }
      } else {
        setPlans(FALLBACK_PLANS);
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          setCurrency(settingsData.data.default_currency || 'UGX');
        }
      }

      updateSessionTime();
    } catch (error) {
      console.error('Error fetching data:', error);
      setPlans(FALLBACK_PLANS);
    } finally {
      setLoading(false);
    }
  };

  const updateSessionTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    setSessionTime(`${hours}:${minutes}:${seconds}`);
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const popularPlanId = plans.find(p => p.name === 'Monthly')?.id;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode
        ? 'dark bg-slate-950'
        : 'bg-gradient-to-br from-slate-50 to-slate-100'
    }`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        isDarkMode
          ? 'dark bg-slate-900/80 border-slate-800'
          : 'bg-white/80 border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'dark bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c4.296-4.295 11.26-4.295 15.556 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Xhenfy WiFi</h1>
                <p className={`text-xs font-medium ${isDarkMode ? 'dark text-gray-400' : 'text-gray-600'}`}>
                  Fast. Reliable. Secure.
                </p>
              </div>
            </div>
            <div className={`text-sm font-bold tabular-nums ${isDarkMode ? 'dark text-blue-300' : 'text-blue-600'}`}>
              {sessionTime}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent">
              Stay Connected
            </span>
            <br />
            <span className="text-gray-800 dark:text-gray-100">Choose Your Plan</span>
          </h2>
          <p className={`text-lg md:text-xl max-w-2xl mx-auto ${
            isDarkMode ? 'dark text-gray-300' : 'text-gray-700'
          }`}>
            Instant access with secure Mobile Money payment. No hidden fees, transparent pricing.
          </p>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className={`flex flex-col items-center gap-3 ${isDarkMode ? 'dark text-blue-400' : 'text-blue-500'}`}>
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-medium">Loading plans...</span>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {!loading && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isPopular={plan.id === popularPlanId}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && plans.length === 0 && (
          <div className="text-center py-12">
            <svg className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'dark text-gray-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-lg ${isDarkMode ? 'dark text-gray-400' : 'text-gray-600'}`}>
              No plans available
            </p>
          </div>
        )}

        {/* Trust Section */}
        <section className={`rounded-2xl p-8 md:p-12 border transition-colors ${
          isDarkMode
            ? 'dark bg-slate-800 border-slate-700'
            : 'bg-white border-slate-200'
        }`}>
          <h3 className="text-2xl md:text-3xl font-bold mb-12 text-center text-gray-900 dark:text-white">
            Why Choose Xhenfy?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Trust Item 1 */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                isDarkMode ? 'dark bg-green-900/30' : 'bg-green-100'
              }`}>
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Secure Payment</h4>
              <p className={`text-sm ${isDarkMode ? 'dark text-gray-400' : 'text-gray-600'}`}>
                All payments encrypted with Mobile Money
              </p>
            </div>

            {/* Trust Item 2 */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                isDarkMode ? 'dark bg-blue-900/30' : 'bg-blue-100'
              }`}>
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Access</h4>
              <p className={`text-sm ${isDarkMode ? 'dark text-gray-400' : 'text-gray-600'}`}>
                Immediate activation after payment
              </p>
            </div>

            {/* Trust Item 3 */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
                isDarkMode ? 'dark bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">24/7 Support</h4>
              <p className={`text-sm ${isDarkMode ? 'dark text-gray-400' : 'text-gray-600'}`}>
                Always here to help when you need us
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`mt-20 border-t transition-colors ${
        isDarkMode
          ? 'dark border-slate-800 bg-slate-900/50'
          : 'border-slate-200 bg-white/50'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <p className={`text-sm ${isDarkMode ? 'dark text-gray-500' : 'text-gray-600'}`}>
            © 2026 Xhenfy WiFi Portal. Fast. Reliable. Secure.
          </p>
        </div>
      </footer>

      {/* Modal */}
      {isModalOpen && selectedPlan && (
        <PlanModal
          plan={selectedPlan}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
