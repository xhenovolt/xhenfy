'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [currency, setCurrency] = useState('UGX');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, plansRes] = await Promise.all([
        fetch('/api/settings').catch(() => ({ ok: false })),
        fetch('/api/plans').catch(() => ({ ok: false })),
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          setSettings(settingsData.data);
          setCurrency(settingsData.data.default_currency || 'UGX');
        }
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.success && plansData.data) {
          setPlans(plansData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = (planId, field, value) => {
    setPlans(
      plans.map((plan) =>
        plan.id === planId ? { ...plan, [field]: value } : plan
      )
    );
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save currency if changed
      if (currency !== settings.default_currency) {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'default_currency', value: currency }),
        });

        if (!response.ok) {
          throw new Error('Failed to update currency');
        }
      }

      // Save plan updates
      for (const plan of plans) {
        const response = await fetch(`/api/plans`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: plan.id,
            name: plan.name,
            price: plan.price,
            duration_minutes: plan.duration_minutes,
            currency: plan.currency,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update plan: ${plan.name}`);
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Settings Updated',
        text: 'All changes have been saved. Updates are live on the portal.',
        confirmButtonText: 'OK',
      });

      // Refresh data to confirm saves
      fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save settings',
        confirmButtonText: 'Try Again',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen transition-colors"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <div className="flex flex-col items-center gap-3" style={{ color: 'var(--primary-color)' }}>
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-medium">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Portal Settings</h1>
            <a
              href="/"
              className="font-medium transition-colors hover:underline"
              style={{ color: 'var(--primary-color)' }}
            >
              ← Back to Portal
            </a>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Manage pricing and portal configuration</p>
        </div>

        {/* Settings Card */}
        <div
          className="rounded-xl shadow-lg p-8 border transition-colors"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          {/* Currency Section */}
          <div className="mb-8 pb-8" style={{ borderColor: 'var(--border-light)', borderBottomWidth: '1px' }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></span>
              Default Currency
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="Currency code (e.g., UGX)"
                maxLength="3"
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-light)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--primary-color)',
                }}
              />
              <span className="text-sm self-center" style={{ color: 'var(--text-secondary)' }}>
                e.g., UGX, USD, KES
              </span>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary-color)' }}></span>
              Plan Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.length > 0 ? (
                plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-lg p-6 border transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-light)',
                    }}
                  >
                    <h3 className="font-semibold mb-4">{plan.name}</h3>
                    <div className="space-y-4">
                      {/* Duration */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          value={plan.duration_minutes}
                          onChange={(e) =>
                            handleUpdatePlan(plan.id, 'duration_minutes', parseInt(e.target.value) || 0)
                          }
                          min="0"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)',
                            '--tw-ring-color': 'var(--primary-color)',
                          }}
                        />
                      </div>

                      {/* Price */}
                      <div>
                        <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                          Price ({currency})
                        </label>
                        <input
                          type="number"
                          value={plan.price}
                          onChange={(e) =>
                            handleUpdatePlan(plan.id, 'price', parseInt(e.target.value) || 0)
                          }
                          min="0"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all text-lg font-semibold"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)',
                            '--tw-ring-color': 'var(--primary-color)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                  <p>No plans found. Please create plans first.</p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div
            className="rounded-lg p-4 mb-8 border transition-colors"
            style={{
              backgroundColor: 'var(--info-light)',
              borderColor: 'var(--info-color)',
              color: 'var(--info-color)',
            }}
          >
            <p className="text-sm font-medium">
              💡 Changes made here are saved to the database and reflected immediately on the captive portal. All users will see updated pricing.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex-1 px-6 py-3 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-white"
              style={{
                backgroundColor: saving ? 'var(--primary-light)' : 'var(--primary-color)',
              }}
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>
            <button
              onClick={fetchData}
              disabled={saving}
              className="px-6 py-3 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-light)',
                color: 'var(--text-primary)',
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>Portal Settings Management • Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
