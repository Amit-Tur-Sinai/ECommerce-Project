import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Shield, Plus, Bell, Settings } from 'lucide-react';
import { insuranceService, Policy } from '@/services/insurance';

export const PoliciesPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    business_id: '',
    store_type: '',
    compliance_threshold: '75',
    alert_enabled: true,
    alert_threshold: '60',
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await insuranceService.getPolicies();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policies');
      console.error('Error loading policies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      await insuranceService.createPolicy({
        business_id: newPolicy.business_id ? parseInt(newPolicy.business_id) : undefined,
        store_type: newPolicy.store_type || undefined,
        compliance_threshold: parseFloat(newPolicy.compliance_threshold),
        alert_enabled: newPolicy.alert_enabled,
        alert_threshold: parseFloat(newPolicy.alert_threshold),
      });
      setShowCreateModal(false);
      setNewPolicy({
        business_id: '',
        store_type: '',
        compliance_threshold: '75',
        alert_enabled: true,
        alert_threshold: '60',
      });
      await loadPolicies();
    } catch (err) {
      console.error('Error creating policy:', err);
      alert('Failed to create policy');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Policy Management</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Set compliance thresholds, customize requirements per business type, and configure automated alerts.
        </p>
      </div>

      {/* Policies List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Policies</h2>
        </div>
        <div className="p-6">
          {policies.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No policies configured. Create a policy to set compliance thresholds and alerts.
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.policy_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {policy.business_name || 'Default Policy'}
                        </h3>
                        {policy.store_type && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                            {policy.store_type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Compliance Threshold</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {policy.compliance_threshold}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Alert Threshold</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {policy.alert_threshold}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Alerts</div>
                          <div className="flex items-center gap-2">
                            {policy.alert_enabled ? (
                              <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Bell className="w-4 h-4" />
                                Enabled
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">Disabled</span>
                            )}
                          </div>
                        </div>
                        {policy.requirements && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Custom Requirements</div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">
                              {Object.keys(policy.requirements).length} requirements
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Policy Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Policy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business ID (optional - leave empty for default)
                </label>
                <input
                  type="number"
                  value={newPolicy.business_id}
                  onChange={(e) => setNewPolicy({ ...newPolicy, business_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Leave empty for default policy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Type (optional)
                </label>
                <select
                  value={newPolicy.store_type}
                  onChange={(e) => setNewPolicy({ ...newPolicy, store_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="butcher_shop">Butcher Shop</option>
                  <option value="winery">Winery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Compliance Threshold (%)
                </label>
                <input
                  type="number"
                  value={newPolicy.compliance_threshold}
                  onChange={(e) => setNewPolicy({ ...newPolicy, compliance_threshold: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alert Threshold (%)
                </label>
                <input
                  type="number"
                  value={newPolicy.alert_threshold}
                  onChange={(e) => setNewPolicy({ ...newPolicy, alert_threshold: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newPolicy.alert_enabled}
                    onChange={(e) => setNewPolicy({ ...newPolicy, alert_enabled: e.target.checked })}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable Automated Alerts</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreatePolicy}
                  className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600"
                >
                  Create Policy
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
