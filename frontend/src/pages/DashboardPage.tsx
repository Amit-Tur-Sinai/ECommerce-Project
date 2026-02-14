import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { WeatherRiskCard } from '@/components/weather/WeatherRiskCard';
import { CitySelector } from '@/components/weather/CitySelector';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { RefreshCw, AlertCircle, Shield, Activity, TrendingUp, CheckCircle2, AlertTriangle, Thermometer } from 'lucide-react';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';
import { useQueryClient } from '@tanstack/react-query';
import { sensorService, ComplianceScore, SensorReading } from '@/services/sensors';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  const [riskThreshold, setRiskThreshold] = useState(0.2); // 20% threshold for demo
  const [compliance, setCompliance] = useState<ComplianceScore | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: recommendations,
    isLoading,
    error,
    refetch,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, riskThreshold);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user?.business_id) return;
    
    setIsLoadingData(true);
    try {
      const [complianceData, sensorsData] = await Promise.all([
        sensorService.getComplianceScore(),
        sensorService.getSensorReadings(),
      ]);
      setCompliance(complianceData);
      setSensors(sensorsData.sensors);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['weather-recommendations'] });
    refetch();
    loadDashboardData();
  };

  const getRankColor = (rank: string) => {
    if (rank === 'Excellent') return 'text-green-600 dark:text-green-400';
    if (rank === 'Good') return 'text-blue-600 dark:text-blue-400';
    if (rank === 'Fair') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusCounts = () => {
    const counts = { normal: 0, warning: 0, critical: 0 };
    sensors.forEach(sensor => {
      if (sensor.status === 'normal') counts.normal++;
      else if (sensor.status === 'warning') counts.warning++;
      else if (sensor.status === 'critical') counts.critical++;
    });
    return counts;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.business_name || user?.email}! Here's your weather risk overview.
        </p>
      </div>

      {/* Summary Widgets */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Compliance Score Widget */}
        {compliance && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Score</h3>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${getRankColor(compliance.rank)}`}>
                {compliance.overall_score.toFixed(0)}%
              </span>
              <span className={`text-sm font-semibold ${getRankColor(compliance.rank)}`}>
                {compliance.rank}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {compliance.recommendations_followed}/{compliance.recommendations_total} recommendations followed
            </div>
          </div>
        )}

        {/* Active Risks Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Risks</h3>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {recommendations?.length || 0}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">risks</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Above {riskThreshold * 100}% threshold
          </div>
        </div>

        {/* Sensor Status Widget */}
        {sensors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sensors</h3>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {sensors.length}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">active</span>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              {(() => {
                const counts = getStatusCounts();
                return (
                  <>
                    <span className="text-green-600 dark:text-green-400">{counts.normal} normal</span>
                    {counts.warning > 0 && <span className="text-yellow-600 dark:text-yellow-400">{counts.warning} warning</span>}
                    {counts.critical > 0 && <span className="text-red-600 dark:text-red-400">{counts.critical} critical</span>}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Recommendations Followed Widget */}
        {compliance && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommendations</h3>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {compliance.recommendations_followed}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                / {compliance.recommendations_total}
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {compliance.recommendations_total > 0 
                ? `${Math.round((compliance.recommendations_followed / compliance.recommendations_total) * 100)}% compliance`
                : 'No recommendations'}
            </div>
          </div>
        )}
      </div>

      {/* Category Breakdown Widget */}
      {compliance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Compliance by Category</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(compliance.category_scores).map(([category, score]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {category.replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      score >= 80 ? 'bg-green-500' :
                      score >= 60 ? 'bg-yellow-500' :
                      score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="grid md:grid-cols-2 gap-4">
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
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
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

      {!isLoading && !error && recommendations && (
        <>
          {recommendations.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 dark:text-green-300 font-medium">No Active Risks</p>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                  Great news! There are no weather risks above the threshold for {city} at this time.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Active Weather Risks ({recommendations.length})
                </h2>
              </div>
              {recommendations.map((rec, index) => (
                <WeatherRiskCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
