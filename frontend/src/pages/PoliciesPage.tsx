import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Shield, Plus, Trash2, CheckCircle, AlertTriangle, Mail, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { insuranceService, Policy, BusinessPortfolioItem } from '@/services/insurance';

export const PoliciesPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [businesses, setBusinesses] = useState<BusinessPortfolioItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sendingWarningId, setSendingWarningId] = useState<number | null>(null);
  const [policyForm, setPolicyForm] = useState({
    business_id: '',
    compliance_threshold: '75',
  });

  useEffect(() => {
    loadPolicies();
    loadBusinesses();
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

  const loadBusinesses = async () => {
    try {
      const data = await insuranceService.getPortfolio();
      setBusinesses(data.businesses);
    } catch (err) {
      console.error('Error loading businesses:', err);
    }
  };

  const openCreateModal = () => {
    setEditingPolicy(null);
    setPolicyForm({ business_id: '', compliance_threshold: '75' });
    setShowModal(true);
  };

  const openEditModal = (policy: Policy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      business_id: String(policy.business_id ?? ''),
      compliance_threshold: String(policy.compliance_threshold),
    });
    setShowModal(true);
  };

  const handleSubmitPolicy = async () => {
    try {
      if (editingPolicy) {
        // Update existing policy
        await insuranceService.updatePolicy(editingPolicy.policy_id, {
          compliance_threshold: parseFloat(policyForm.compliance_threshold),
        });
        toast.success('Policy updated successfully');
      } else {
        // Create new policy
        await insuranceService.createPolicy({
          business_id: parseInt(policyForm.business_id),
          compliance_threshold: parseFloat(policyForm.compliance_threshold),
        });
        toast.success('Policy created successfully');
      }
      setShowModal(false);
      setEditingPolicy(null);
      setPolicyForm({ business_id: '', compliance_threshold: '75' });
      await loadPolicies();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || (editingPolicy ? 'Failed to update policy' : 'Failed to create policy');
      toast.error(msg);
    }
  };

  // Businesses that don't already have a policy (for the create dropdown)
  const availableBusinesses = businesses.filter(
    (biz) => !policies.some((p) => p.business_id === biz.business_id)
  );

  const handleDeletePolicy = async (policyId: number) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    setDeletingId(policyId);
    try {
      await insuranceService.deletePolicy(policyId);
      await loadPolicies();
    } catch (err) {
      console.error('Error deleting policy:', err);
      alert('Failed to delete policy');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendWarning = async (businessId: number, businessName: string) => {
    if (!confirm(`Send a policy violation warning email to ${businessName}?`)) return;
    setSendingWarningId(businessId);
    try {
      const result = await insuranceService.sendViolationNotification(businessId);
      toast.success(
        result.simulated
          ? `Warning sent to ${businessName}`
          : `Warning email sent to ${result.recipient}`
      );
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to send warning email';
      toast.error(msg);
    } finally {
      setSendingWarningId(null);
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
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Set compliance thresholds per business. Businesses that drop below their threshold will be flagged on the Portfolio page.
        </p>
      </div>

      {/* Summary Cards */}
      {policies.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Policies</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{policies.length}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" /> Compliant
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {policies.filter(p => p.current_score !== null && !p.violated).length}
            </div>
          </div>
          <div className={`rounded-lg border p-4 ${
            policies.filter(p => p.violated).length > 0
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-red-500" /> Violated
            </div>
            <div className={`text-2xl font-bold ${
              policies.filter(p => p.violated).length > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {policies.filter(p => p.violated).length}
            </div>
          </div>
        </div>
      )}

      {/* Policies List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Policies</h2>
        </div>
        <div className="p-6">
          {policies.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No policies configured. Create a policy to set compliance thresholds for your businesses.
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.policy_id}
                  className={`border rounded-lg p-6 ${
                    policy.violated
                      ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {policy.business_name || 'Default Policy'}
                        </h3>
                        {policy.store_type && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                            {policy.store_type.replace('_', ' ')}
                          </span>
                        )}
                        {policy.city && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            📍 {policy.city}
                          </span>
                        )}
                        {/* Status Badge */}
                        {policy.current_score !== null && (
                          policy.violated ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Violated
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Compliant
                            </span>
                          )
                        )}
                      </div>

                      {/* Score vs Threshold Visual */}
                      <div className="grid md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Threshold</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {policy.compliance_threshold}%
                          </div>
                        </div>
                        {policy.current_score !== null && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Score</div>
                            <div className={`text-xl font-bold ${
                              policy.violated
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {policy.current_score}%
                            </div>
                          </div>
                        )}
                        {policy.current_score !== null && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gap</div>
                            <div className={`text-xl font-bold ${
                              policy.current_score >= policy.compliance_threshold
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {policy.current_score >= policy.compliance_threshold ? '+' : ''}
                              {(policy.current_score - policy.compliance_threshold).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Progress bar showing score relative to threshold */}
                      {policy.current_score !== null && (
                        <div className="mt-4">
                          <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                policy.violated ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(policy.current_score, 100)}%` }}
                            />
                            {/* Threshold marker */}
                            <div
                              className="absolute top-0 h-3 w-0.5 bg-gray-800 dark:bg-white"
                              style={{ left: `${Math.min(policy.compliance_threshold, 100)}%` }}
                              title={`Threshold: ${policy.compliance_threshold}%`}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">0%</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ▲ Threshold: {policy.compliance_threshold}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">100%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      {policy.violated && (
                        <button
                          onClick={() => handleSendWarning(policy.business_id!, policy.business_name!)}
                          disabled={sendingWarningId === policy.business_id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          title="Send violation warning email"
                        >
                          <Mail className="w-4 h-4" />
                          {sendingWarningId === policy.business_id ? 'Sending...' : 'Send Warning'}
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(policy)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Edit policy threshold"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(policy.policy_id)}
                        disabled={deletingId === policy.policy_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete policy"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === policy.policy_id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Policy Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingPolicy ? `Edit Policy — ${editingPolicy.business_name}` : 'Create New Policy'}
            </h2>
            <div className="space-y-4">
              {/* Business selector — only for creating, not editing */}
              {!editingPolicy && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Business
                  </label>
                  {availableBusinesses.length === 0 ? (
                    <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                      All businesses already have a policy. You can edit an existing policy instead.
                    </p>
                  ) : (
                    <select
                      value={policyForm.business_id}
                      onChange={(e) => setPolicyForm({ ...policyForm, business_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a business...</option>
                      {availableBusinesses.map((biz) => (
                        <option key={biz.business_id} value={biz.business_id}>
                          {biz.business_name} — {biz.city} ({biz.store_type.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Compliance Threshold (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={policyForm.compliance_threshold}
                  onChange={(e) => setPolicyForm({ ...policyForm, compliance_threshold: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You'll be alerted when the business drops below this score
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitPolicy}
                  disabled={!editingPolicy && (!policyForm.business_id || availableBusinesses.length === 0)}
                  className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingPolicy ? 'Save Changes' : 'Create Policy'}
                </button>
                <button
                  onClick={() => { setShowModal(false); setEditingPolicy(null); }}
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
