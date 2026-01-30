import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { TrendingUp, Shield, Users, Building2, FileText, Settings, BarChart3, AlertTriangle, AlertCircle, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { sensorService, BusinessRanking, RankingResponse } from '@/services/sensors';
import { insuranceService, Claim, Policy } from '@/services/insurance';

export const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<RankingResponse | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);

  useEffect(() => {
    loadAllData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rankingData, claimsData, policiesData] = await Promise.all([
        sensorService.getBusinessRanking(50),
        insuranceService.getClaims().catch(() => []),
        insuranceService.getPolicies().catch(() => []),
      ]);
      setRankings(rankingData);
      setClaims(claimsData);
      setPolicies(policiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    if (rank === 'Excellent') return 'text-green-600';
    if (rank === 'Good') return 'text-blue-600';
    if (rank === 'Fair') return 'text-yellow-600';
    return 'text-red-600';
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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Insurance Company Dashboard</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your insured businesses, track compliance, handle claims, and monitor risk levels.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => navigate('/insurance/portfolio')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Portfolio</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage insured businesses</p>
        </button>
        <button
          onClick={() => navigate('/insurance/claims')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Claims</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Track and manage claims</p>
        </button>
        <button
          onClick={() => navigate('/insurance/policies')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Policies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Set compliance thresholds</p>
        </button>
        <button
          onClick={() => navigate('/insurance/compare')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <BarChart3 className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Compare</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Compare businesses</p>
        </button>
      </div>

      {/* Summary Stats */}
      {rankings && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Businesses</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.length + (rankings.your_business && user?.role === 'Business' ? 1 : 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Average Score</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {(() => {
                const hasYourBusiness = rankings.your_business && user?.role === 'Business';
                const totalBusinesses = rankings.rankings.length + (hasYourBusiness ? 1 : 0);
                if (totalBusinesses === 0) return '0.0';
                const totalScore = rankings.rankings.reduce((sum, b) => sum + b.score, 0) + (hasYourBusiness ? (rankings.your_business?.score || 0) : 0);
                return (totalScore / totalBusinesses).toFixed(1);
              })()}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Excellent Rating</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.filter((b) => b.rank_level === 'Excellent').length +
                (rankings.your_business && user?.role === 'Business' && rankings.your_business?.rank_level === 'Excellent' ? 1 : 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Good Rating</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.filter((b) => b.rank_level === 'Good').length +
                (rankings.your_business && user?.role === 'Business' && rankings.your_business?.rank_level === 'Good' ? 1 : 0)}
            </p>
          </div>
        </div>
      )}

      {/* Additional Stats Row */}
      {rankings && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Fair Rating</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.filter((b) => b.rank_level === 'Fair').length +
                (rankings.your_business && user?.role === 'Business' && rankings.your_business?.rank_level === 'Fair' ? 1 : 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Needs Improvement</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.filter((b) => b.rank_level === 'Needs Improvement').length +
                (rankings.your_business && user?.role === 'Business' && rankings.your_business?.rank_level === 'Needs Improvement' ? 1 : 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Claims</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {claims.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {claims.filter(c => c.status === 'Pending').length} pending
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Policies</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {policies.length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {policies.filter(p => p.alert_enabled).length} with alerts
            </p>
          </div>
        </div>
      )}

      {/* Risk Distribution & Claims Summary */}
      {rankings && (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Risk Distribution Widget */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              {(() => {
                const hasYourBusiness = rankings.your_business && user?.role === 'Business';
                const allBusinesses = [...rankings.rankings];
                if (hasYourBusiness && rankings.your_business) {
                  allBusinesses.push(rankings.your_business);
                }
                const riskCounts = {
                  Low: allBusinesses.filter(b => b.score >= 90).length,
                  Medium: allBusinesses.filter(b => b.score >= 75 && b.score < 90).length,
                  High: allBusinesses.filter(b => b.score >= 60 && b.score < 75).length,
                  Critical: allBusinesses.filter(b => b.score < 60).length,
                };
                const total = allBusinesses.length || 1;
                
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Low Risk</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{riskCounts.Low}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(riskCounts.Low / total) * 100}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Medium Risk</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{riskCounts.Medium}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(riskCounts.Medium / total) * 100}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">High Risk</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{riskCounts.High}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(riskCounts.High / total) * 100}%` }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Critical Risk</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{riskCounts.Critical}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(riskCounts.Critical / total) * 100}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Claims Summary Widget */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Claims Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {claims.filter(c => c.status === 'Pending').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {claims.filter(c => c.status === 'Approved').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Denied</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {claims.filter(c => c.status === 'Denied').length}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Claim Amount</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ${claims.reduce((sum, c) => sum + c.claim_amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers Widget */}
      {rankings && rankings.rankings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top 5 Performers</h3>
          <div className="space-y-3">
            {rankings.rankings.slice(0, 5).map((business, index) => (
              <div
                key={business.rank}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' :
                    index === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                    index === 2 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                    'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{business.business_name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {business.recommendations_followed}/{business.recommendations_total} recommendations
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${getRankColor(business.rank_level)}`}>
                    {business.score.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{business.rank_level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Business Rankings */}
      {rankings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All Business Rankings</h2>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Updated in real-time
            </div>
          </div>
          
          {/* Include user's business in the list if it exists (only for Business users) */}
          <div className="space-y-3">
            {rankings.your_business && user?.role === 'Business' && (
              <div
                className="flex items-center justify-between p-4 rounded-lg border bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold w-12 text-center ${getRankColor(rankings.your_business.rank_level)}`}>
                    #{rankings.your_business.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {rankings.your_business.business_name}
                      <span className="ml-2 text-xs px-2 py-1 bg-primary-600 dark:bg-primary-500 text-white rounded-full">
                        Your Business
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {rankings.your_business.recommendations_followed}/{rankings.your_business.recommendations_total} recommendations followed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getRankColor(rankings.your_business.rank_level)}`}>
                    {rankings.your_business.score.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{rankings.your_business.rank_level}</div>
                </div>
              </div>
            )}
            
            {rankings.rankings.map((business) => (
              <div
                key={business.rank}
                className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold w-12 text-center ${getRankColor(business.rank_level)}`}>
                    #{business.rank}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {business.business_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {business.recommendations_followed}/{business.recommendations_total} recommendations followed
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getRankColor(business.rank_level)}`}>
                    {business.score.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{business.rank_level}</div>
                </div>
              </div>
            ))}
            
            {rankings.rankings.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No business rankings available yet. Start the demo sensor device to generate data.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
