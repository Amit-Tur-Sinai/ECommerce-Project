import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { TrendingUp, Shield, Users, Building2, Settings, AlertTriangle, AlertCircle, ArrowUpDown } from 'lucide-react';
import { sensorService, BusinessRanking, RankingResponse } from '@/services/sensors';
import { insuranceService, Policy } from '@/services/insurance';

export const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<RankingResponse | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [rankLevelFilter, setRankLevelFilter] = useState<string>('all');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rankingData, policiesData] = await Promise.all([
        sensorService.getBusinessRanking(50),
        insuranceService.getPolicies().catch(() => []),
      ]);
      setRankings(rankingData);
      setPolicies(policiesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankColor = (rank: string) => {
    if (rank === 'Excellent') return 'text-green-600 dark:text-green-400';
    if (rank === 'Good') return 'text-blue-600 dark:text-blue-400';
    if (rank === 'Fair') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Sort and filter rankings
  const sortedRankings = rankings ? [...rankings.rankings].sort((a, b) => {
    return sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
  }).filter(b => {
    if (rankLevelFilter === 'all') return true;
    return b.rank_level === rankLevelFilter;
  }) : [];

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
          Manage your insured businesses, track compliance, and monitor risk levels.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/insurance/portfolio')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Portfolio</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage insured businesses</p>
        </button>
        <button
          onClick={() => navigate('/insurance/policies')}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <Settings className="w-8 h-8 text-primary-600 dark:text-primary-400 mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Policies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Set compliance thresholds</p>
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
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{rankings.rankings.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Average Score</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.length > 0
                ? (rankings.rankings.reduce((sum, b) => sum + b.score, 0) / rankings.rankings.length).toFixed(1)
                : '0.0'}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Excellent + Good</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {rankings.rankings.filter(b => b.rank_level === 'Excellent' || b.rank_level === 'Good').length}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Policies</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{policies.length}</p>
          </div>
        </div>
      )}

      {/* Risk Distribution */}
      {rankings && rankings.rankings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risk Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Low Risk', filter: (b: BusinessRanking) => b.score >= 90, color: 'green' },
              { label: 'Medium Risk', filter: (b: BusinessRanking) => b.score >= 75 && b.score < 90, color: 'yellow' },
              { label: 'High Risk', filter: (b: BusinessRanking) => b.score >= 60 && b.score < 75, color: 'orange' },
              { label: 'Critical', filter: (b: BusinessRanking) => b.score < 60, color: 'red' },
            ].map(({ label, filter, color }) => {
              const count = rankings.rankings.filter(filter).length;
              const pct = rankings.rankings.length > 0 ? (count / rankings.rankings.length) * 100 : 0;
              return (
                <div key={label} className="text-center">
                  <div className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{count}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                    <div className={`bg-${color}-500 h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Business Rankings with sorting and filtering */}
      {rankings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">All Business Rankings</h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={rankLevelFilter}
                onChange={(e) => setRankLevelFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Levels</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Needs Improvement">Needs Improvement</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === 'desc' ? 'Best first' : 'Worst first'}
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {sortedRankings.map((business, index) => (
              <div
                key={`${business.business_name}-${index}`}
                className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-4">
                  <div className={`text-2xl font-bold w-12 text-center ${getRankColor(business.rank_level)}`}>
                    #{index + 1}
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
            
            {sortedRankings.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {rankLevelFilter !== 'all' 
                  ? `No businesses with "${rankLevelFilter}" rating.`
                  : 'No business rankings available yet.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
