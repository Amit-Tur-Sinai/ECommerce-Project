import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { TrendingUp, Plus, X, BarChart3 } from 'lucide-react';
import { insuranceService, BusinessComparison, BusinessPortfolioItem } from '@/services/insurance';

export const ComparisonPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolio, setPortfolio] = useState<BusinessPortfolioItem[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);
  const [comparison, setComparison] = useState<BusinessComparison[]>([]);

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (selectedBusinesses.length > 0) {
      loadComparison();
    } else {
      setComparison([]);
    }
  }, [selectedBusinesses]);

  const loadPortfolio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await insuranceService.getPortfolio();
      setPortfolio(data.businesses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      console.error('Error loading portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComparison = async () => {
    if (selectedBusinesses.length === 0) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await insuranceService.compareBusinesses(selectedBusinesses);
      setComparison(data.comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
      console.error('Error loading comparison:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBusiness = (businessId: number) => {
    if (selectedBusinesses.includes(businessId)) {
      setSelectedBusinesses(selectedBusinesses.filter((id) => id !== businessId));
    } else {
      if (selectedBusinesses.length >= 5) {
        alert('Maximum 5 businesses can be compared at once');
        return;
      }
      setSelectedBusinesses([...selectedBusinesses, businessId]);
    }
  };

  const getRankColor = (rank: string) => {
    if (rank === 'Excellent') return 'text-green-600';
    if (rank === 'Good') return 'text-blue-600';
    if (rank === 'Fair') return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading && comparison.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Comparison</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Compare multiple businesses side-by-side and analyze trends over time.
        </p>
      </div>

      {/* Business Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Businesses to Compare (max 5)</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {portfolio.map((business) => (
            <button
              key={business.business_id}
              onClick={() => toggleBusiness(business.business_id)}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedBusinesses.includes(business.business_id)
                  ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{business.business_name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{business.city}</div>
                </div>
                {selectedBusinesses.includes(business.business_id) && (
                  <X className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </div>
            </button>
          ))}
        </div>
        {selectedBusinesses.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Selected: {selectedBusinesses.length}/5</span>
            <button
              onClick={() => setSelectedBusinesses([])}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {comparison.length > 0 && (
        <>
          {/* Side-by-Side Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Side-by-Side Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Business</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Store Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">City</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Compliance Score</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Rank Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Recommendations</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((biz) => (
                    <tr key={biz.business_id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{biz.business_name}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{biz.store_type.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{biz.city}</td>
                      <td className="py-3 px-4">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {biz.current_score.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${getRankColor(biz.rank_level)}`}>
                          {biz.rank_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {biz.recommendations_followed}/{biz.recommendations_total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trend Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Trend Analysis (Last 7 Days)</h2>
            <div className="space-y-4">
              {comparison.map((biz) => (
                <div key={biz.business_id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{biz.business_name}</h3>
                  <div className="flex items-end gap-2 h-32">
                    {biz.trend.map((point, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-primary-600 dark:bg-primary-500 rounded-t transition-all"
                          style={{ height: `${point.score}%` }}
                          title={`${point.score.toFixed(1)}%`}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">D{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    Current: {biz.current_score.toFixed(1)}% | Trend: {biz.trend.length > 1 && biz.trend[biz.trend.length - 1].score > biz.trend[0].score ? '📈 Improving' : biz.trend[biz.trend.length - 1].score < biz.trend[0].score ? '📉 Declining' : '➡️ Stable'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedBusinesses.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Select businesses from the list above to compare them.</p>
        </div>
      )}
    </div>
  );
};
