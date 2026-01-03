'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [currency, setCurrency] = useState('UGX');
  const [prices, setPrices] = useState({
    daily: 1000,
    weekly: 5000,
    monthly: 18000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data);
        setCurrency(data.data.default_currency || 'UGX');
        setPrices({
          daily: parseInt(data.data.daily_price) || 1000,
          weekly: parseInt(data.data.weekly_price) || 5000,
          monthly: parseInt(data.data.monthly_price) || 18000,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load settings',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Update all settings
      const updates = [
        { key: 'default_currency', value: currency },
        { key: 'daily_price', value: prices.daily.toString() },
        { key: 'weekly_price', value: prices.weekly.toString() },
        { key: 'monthly_price', value: prices.monthly.toString() },
      ];

      for (const update of updates) {
        const response = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });

        if (!response.ok) {
          throw new Error('Failed to update setting');
        }
      }

      Swal.fire({
        icon: 'success',
        title: 'Settings Updated',
        text: 'All settings have been saved successfully',
        confirmButtonText: 'OK',
      });
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-white">Portal Settings</h1>
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 transition font-medium"
            >
              ← Back to Portal
            </a>
          </div>
          <p className="text-gray-400">Manage pricing and portal settings</p>
        </div>

        {/* Settings Card */}
        <div className="bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700">
          {/* Currency Section */}
          <div className="mb-8 pb-8 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Default Currency
            </h2>
            <div className="flex gap-4">
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                placeholder="Currency code (e.g., UGX)"
                maxLength="3"
                className="px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-400 text-sm self-center">e.g., UGX, USD, KES</span>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Plan Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Plan */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Daily Plan</h3>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    value={prices.daily}
                    onChange={(e) =>
                      setPrices({ ...prices, daily: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  />
                  <span className="text-gray-400 text-sm">{currency}</span>
                </div>
              </div>

              {/* Weekly Plan */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Weekly Plan</h3>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    value={prices.weekly}
                    onChange={(e) =>
                      setPrices({ ...prices, weekly: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  />
                  <span className="text-gray-400 text-sm">{currency}</span>
                </div>
              </div>

              {/* Monthly Plan */}
              <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
                <h3 className="text-white font-semibold mb-2">Monthly Plan</h3>
                <div className="flex items-end gap-2">
                  <input
                    type="number"
                    value={prices.monthly}
                    onChange={(e) =>
                      setPrices({ ...prices, monthly: parseInt(e.target.value) || 0 })
                    }
                    min="0"
                    className="flex-1 px-3 py-2 bg-slate-600 border border-slate-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  />
                  <span className="text-gray-400 text-sm">{currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 border-opacity-50 rounded-lg p-4 mb-8">
            <p className="text-blue-200 text-sm">
              💡 Changes made here will be reflected immediately on the captive portal. Make sure to set correct prices before users access the portal.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Settings
                </>
              )}
            </button>
            <button
              onClick={fetchSettings}
              disabled={saving}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Portal Settings Management • Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
