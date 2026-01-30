import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CitySelector } from '@/components/weather/CitySelector';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Calendar, TrendingUp, AlertTriangle, Cloud } from 'lucide-react';
import { STORE_TYPES, STORE_TYPE_LABELS, CLIMATE_EVENT_LABELS } from '@/utils/constants';

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  const [dateRange, setDateRange] = useState('30'); // days

  // Placeholder for analytics data - would come from API
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data for demonstration - replace with actual API call
  const mockStats = {
    totalEvents: 12,
    coldEvents: 3,
    fogEvents: 2,
    stormEvents: 4,
    heatEvents: 3,
    avgRiskLevel: 'medium',
    mostCommonEvent: 'storm',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Weather Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View historical weather patterns and risk trends for your business location.
        </p>
      </div>

      {/* Filters */}
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
              <Calendar className="w-4 h-4 inline mr-1" />
              Time Period
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {/* Analytics Content */}
      {!isLoading && !error && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{mockStats.totalEvents}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500 dark:text-orange-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last {dateRange} days</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cold Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{mockStats.coldEvents}</p>
                </div>
                <span className="text-3xl">❄️</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {CLIMATE_EVENT_LABELS.cold}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Storm Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{mockStats.stormEvents}</p>
                </div>
                <span className="text-3xl">⛈️</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {CLIMATE_EVENT_LABELS.storm}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heat Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{mockStats.heatEvents}</p>
                </div>
                <span className="text-3xl">🔥</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {CLIMATE_EVENT_LABELS.heat}
              </p>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Key Insights</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-300">Most Common Event</p>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    {CLIMATE_EVENT_LABELS[mockStats.mostCommonEvent as keyof typeof CLIMATE_EVENT_LABELS]} 
                    {' '}events occurred most frequently in the last {dateRange} days
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-300">Average Risk Level</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Your location has experienced {mockStats.avgRiskLevel} risk levels on average
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Timeline Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Event Timeline</h2>
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p>Historical event timeline will be displayed here</p>
              <p className="text-sm mt-1">Connect to analytics API to view detailed timeline</p>
            </div>
          </div>

          {/* Recommendations Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recommendations Summary</h2>
            <div className="space-y-2">
              <p className="text-gray-600 dark:text-gray-400">
                Based on historical patterns, your {STORE_TYPE_LABELS[storeType as keyof typeof STORE_TYPE_LABELS]} 
                {' '}in {city} should prepare for:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                <li>Regular monitoring during {mockStats.mostCommonEvent} season</li>
                <li>Backup systems for critical operations</li>
                <li>Staff training on weather-related protocols</li>
                <li>Inventory adjustments based on weather patterns</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
