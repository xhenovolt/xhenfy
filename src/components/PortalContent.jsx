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
 * Feature Icon Component
 */
function FeatureIcon({ icon, label, title }) {
  return (
    <div className="group relative flex flex-col items-center gap-2">
      <div className="text-2xl transition-transform group-hover:scale-110">
        {icon}
      </div>
      <span className="text-xs text-center font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
        {label}
      </span>
      {title && (
        <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold rounded whitespace-nowrap z-10">
          {title}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Plan Card Component - Redesigned for clarity
 */
function PlanCard({ plan, isPopular, onSelect }) {
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
    if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
    if (minutes < 43200) return `${Math.floor(minutes / 10080)}w`;
    return `${Math.floor(minutes / 43200)}mo`;
  };

  const getFeatureIcons = () => {
    return [
      { icon: '⚡', label: 'Fast Speeds', title: 'High-speed connection' },
      { icon: '⏱️', label: 'Instant', title: 'Instant activation' },
      { icon: '🔒', label: 'Secure', title: 'Secure payment' },
    ];
  };

  const getPlanSummary = () => {
    const summaries = {
      '1 Hour': 'Quick\nbrowsing',
      '6 Hours': 'Stream &\nwork',
      '12 Hours': 'Extended\nusage',
      'Weekly': 'Full week\naccess',
      'Monthly': 'Unlimited\naccess',
    };
    return summaries[plan.name] || 'Premium\nplan';
  };

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 ${
        isPopular
          ? 'ring-2 shadow-xl'
          : 'shadow-sm hover:shadow-lg'
      }`}
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: isPopular ? 'var(--primary-color)' : 'var(--card-border)',
        borderWidth: isPopular ? '2px' : '1px',
        transform: isPopular ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {isPopular && (
        <div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap text-white"
          style={{ backgroundColor: 'var(--primary-color)' }}
        >
          🏆 Best Value
        </div>
      )}

      <div className="p-5 md:p-6 flex flex-col h-full">
        {/* Header: Plan Name + Duration + Price */}
        <div className="mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
          <h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {plan.name}
          </h3>
          <div className="flex items-center justify-between">
            <span
              className="text-xs md:text-sm font-semibold px-2 py-1 rounded-lg"
              style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-dark)',
              }}
            >
              {formatDuration(plan.duration_minutes)}
            </span>
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {typeof plan.price === 'number' ? plan.price.toLocaleString() : plan.price}
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {plan.currency || 'UGX'}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Summary - Multi-line text */}
        <div className="mb-6 text-center">
          <p
            className="text-sm md:text-base font-semibold leading-relaxed whitespace-pre-line"
            style={{ color: 'var(--text-primary)' }}
          >
            {getPlanSummary()}
          </p>
        </div>

        {/* Feature Icons - Compact with Hover Tooltips */}
        <div className="mb-6 flex justify-around px-2">
          {getFeatureIcons().map((feature, idx) => (
            <FeatureIcon key={idx} {...feature} />
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelect(plan)}
          className="w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 text-center mt-auto text-white"
          style={{
            backgroundColor: isPopular ? 'var(--primary-color)' : 'var(--bg-tertiary)',
            color: isPopular ? 'white' : 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            e.target.style.filter = 'brightness(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.filter = 'brightness(1)';
          }}
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

  useEffect(() => {
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

  const popularPlanId = plans.find(p => p.name === '12 Hours')?.id || plans.find(p => p.name === 'Monthly')?.id;

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b transition-colors"
        style={{
          backgroundColor: 'rgba(var(--bg-secondary), 0.8)',
          borderColor: 'var(--border-light)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--primary-light)',
                }}
              >
                <svg className="w-6 h-6" style={{ color: 'var(--primary-color)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c4.296-4.295 11.26-4.295 15.556 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Xhenfy WiFi</h1>
                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Fast. Reliable. Secure.
                </p>
              </div>
            </div>
            <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--primary-color)' }}>
              {sessionTime}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            <span style={{ color: 'var(--primary-color)' }}>Stay Connected</span>
            <br />
            <span style={{ color: 'var(--text-primary)' }}>Choose Your Plan</span>
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Instant access with secure Mobile Money payment. No hidden fees, transparent pricing.
          </p>
        </section>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-3" style={{ color: 'var(--primary-color)' }}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-16">
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
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              No plans available
            </p>
          </div>
        )}

        {/* Trust Section */}
        <section
          className="rounded-2xl p-8 md:p-12 border transition-colors"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-12 text-center">
            Why Choose Xhenfy?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Trust Item 1 */}
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ backgroundColor: 'var(--accent-light)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--accent-color)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Secure Payment</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                All payments encrypted with Mobile Money
              </p>
            </div>

            {/* Trust Item 2 */}
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ backgroundColor: 'var(--info-light)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--info-color)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">Instant Access</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Immediate activation after payment
              </p>
            </div>

            {/* Trust Item 3 */}
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ backgroundColor: 'var(--secondary-light)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--secondary-color)' }} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">24/7 Support</h4>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Always here to help when you need us
              </p>
            </div>
          </div>
        </section>
      </main>

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
