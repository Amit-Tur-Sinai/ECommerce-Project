import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { WeatherRiskCard } from '@/components/weather/WeatherRiskCard';
import { CitySelector } from '@/components/weather/CitySelector';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { RefreshCw, Filter } from 'lucide-react';
import { STORE_TYPES, STORE_TYPE_LABELS, RISK_LEVELS } from '@/utils/constants';
import { useQueryClient } from '@tanstack/react-query';

export const RecommendationsPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [riskThreshold, setRiskThreshold] = useState(0.2); // 20% threshold for demo
  const queryClient = useQueryClient();

  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, riskThreshold);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['weather-recommendations'] });
    refetch();
  };

  const filteredRecommendations = recommendations?.filter((rec) => {
    if (riskFilter === 'all') return true;
    return rec.risk_level === riskFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Weather Recommendations</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get detailed weather risk assessments and actionable recommendations for your business.
        </p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City Location
            </label>
            <CitySelector value={city} onChange={setCity} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Store Type
            </label>
            <select
              value={storeType}
              onChange={(e) => setStoreType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {Object.entries(STORE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter by Risk Level
            </label>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Risk Levels</option>
              <option value={RISK_LEVELS.LOW}>Low Risk</option>
              <option value={RISK_LEVELS.MEDIUM}>Medium Risk</option>
              <option value={RISK_LEVELS.HIGH}>High Risk</option>
              <option value={RISK_LEVELS.CRITICAL}>Critical Risk</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Risk Threshold:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
              className="w-32 accent-primary-600 dark:accent-primary-500"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white w-12">
              {(riskThreshold * 100).toFixed(0)}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">(Lower = see more predictions)</span>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Recommendations
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <ErrorMessage
          message={
            (error as any)?.response?.data?.detail ||
            'Failed to load weather recommendations. Please try again.'
          }
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !error && filteredRecommendations && (
        <div className="space-y-6">
          {filteredRecommendations.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {riskFilter !== 'all'
                  ? `No recommendations found for ${riskFilter} risk level.`
                  : 'No active weather risks found for the selected location and store type.'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {filteredRecommendations.length} Recommendation
                  {filteredRecommendations.length !== 1 ? 's' : ''}
                </h2>
              </div>
              {filteredRecommendations.map((rec, index) => (
                <WeatherRiskCard key={index} recommendation={rec} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
