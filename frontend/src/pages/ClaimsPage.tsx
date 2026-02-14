import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { FileText, Plus, Filter, TrendingDown, AlertCircle } from 'lucide-react';
import { insuranceService, Claim } from '@/services/insurance';
import { formatDateTime } from '@/utils/formatters';

export const ClaimsPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClaim, setNewClaim] = useState({
    business_id: '',
    claim_amount: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [claims, statusFilter]);

  const loadClaims = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await insuranceService.getClaims();
      setClaims(data);
      setFilteredClaims(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load claims');
      console.error('Error loading claims:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (statusFilter === 'all') {
      setFilteredClaims(claims);
    } else {
      setFilteredClaims(claims.filter((c) => c.status === statusFilter));
    }
  };

  const handleCreateClaim = async () => {
    if (!newClaim.business_id || !newClaim.claim_amount || !newClaim.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await insuranceService.createClaim({
        business_id: parseInt(newClaim.business_id),
        claim_amount: parseFloat(newClaim.claim_amount),
        description: newClaim.description,
        incident_date: new Date(newClaim.incident_date).toISOString(),
      });
      setShowCreateModal(false);
      setNewClaim({
        business_id: '',
        claim_amount: '',
        description: '',
        incident_date: new Date().toISOString().split('T')[0],
      });
      await loadClaims();
    } catch (err) {
      console.error('Error creating claim:', err);
      alert('Failed to create claim');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Denied':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Under Review':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Pending':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const totalClaims = claims.length;
  const totalAmount = claims.reduce((sum, c) => sum + c.claim_amount, 0);
  const pendingClaims = claims.filter((c) => c.status === 'Pending').length;
  const avgComplianceAtIncident =
    claims.length > 0
      ? claims
          .filter((c) => c.compliance_score_at_incident !== null)
          .reduce((sum, c) => sum + (c.compliance_score_at_incident || 0), 0) /
        claims.filter((c) => c.compliance_score_at_incident !== null).length
      : 0;

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
            <FileText className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Claims Dashboard</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Claim
          </button>
        </div>
        <p className="text-gray-600">
          Track claims, link compliance scores to incidents, and monitor claim history.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Claims</div>
          <div className="text-3xl font-bold text-gray-900">{totalClaims}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Amount</div>
          <div className="text-3xl font-bold text-gray-900">${totalAmount.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-600">{pendingClaims}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Avg Compliance at Incident</div>
          <div className="text-3xl font-bold text-gray-900">{avgComplianceAtIncident.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Claims History</h2>
        </div>
        <div className="p-6">
          {filteredClaims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No claims found.</div>
          ) : (
            <div className="space-y-4">
              {filteredClaims.map((claim) => (
                <div key={claim.claim_id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{claim.claim_number}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {claim.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{claim.business_name}</p>
                      <p className="text-sm text-gray-600 mb-2">{claim.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>💰 ${claim.claim_amount.toLocaleString()}</span>
                        <span>📅 Incident: {formatDateTime(new Date(claim.incident_date))}</span>
                        <span>📋 Filed: {formatDateTime(new Date(claim.filed_date))}</span>
                        {claim.compliance_score_at_incident !== null && (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" />
                            Compliance: {claim.compliance_score_at_incident.toFixed(1)}%
                          </span>
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

      {/* Create Claim Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Claim</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business ID</label>
                <input
                  type="number"
                  value={newClaim.business_id}
                  onChange={(e) => setNewClaim({ ...newClaim, business_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Claim Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={newClaim.claim_amount}
                  onChange={(e) => setNewClaim({ ...newClaim, claim_amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Incident Date</label>
                <input
                  type="date"
                  value={newClaim.incident_date}
                  onChange={(e) => setNewClaim({ ...newClaim, incident_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newClaim.description}
                  onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateClaim}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create Claim
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
