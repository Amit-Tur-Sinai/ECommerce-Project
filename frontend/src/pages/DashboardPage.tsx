import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { WeatherRiskCard } from '@/components/weather/WeatherRiskCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { AlertCircle, Shield, Activity, CheckCircle2, AlertTriangle, ChevronRight, X, Info, TrendingUp } from 'lucide-react';
import { sensorService, ComplianceScore, SensorReading } from '@/services/sensors';

// Detailed info for each compliance category
const CATEGORY_INFO: Record<string, { title: string; icon: string; description: string; howWeMeasure: string[]; howToImprove: string[] }> = {
  temperature_control: {
    title: 'Temperature Control',
    icon: '🌡️',
    description: 'Measures how well your business maintains safe temperature levels across refrigeration, storage, and display areas.',
    howWeMeasure: [
      'Temperature sensors monitor refrigeration units, freezers, and display counters in real time',
      'Readings are classified as normal, warning, or critical based on safe thresholds for your business type',
      'The score reflects the percentage of temperature sensors in the "normal" range over the last 24 hours',
      'For butcher shops: refrigeration should be 0–5°C, freezers -20 to -15°C, display counters 2–6°C',
      'For wineries: fermentation tanks 12–18°C, wine cellars 10–15°C',
    ],
    howToImprove: [
      'Schedule regular maintenance for refrigeration and cooling units',
      'Install backup thermometers to cross-verify sensor readings',
      'Set up automated alerts for when temperatures leave the safe range',
      'Ensure door seals on refrigerators and freezers are intact',
      'Avoid frequent opening of cold storage during peak hours',
    ],
  },
  equipment_maintenance: {
    title: 'Equipment Maintenance',
    icon: '⚙️',
    description: 'Tracks the operational health of critical equipment like backup generators, cooling systems, and power supplies.',
    howWeMeasure: [
      'Only Power sensors are used (backup generators, cooling systems)',
      'Readings below the normal threshold (e.g., generator below 80%) trigger warnings',
      'The score is the percentage of power/equipment sensors reporting normal operation',
      'Critical alerts are triggered when equipment drops below safety thresholds',
    ],
    howToImprove: [
      'Establish a monthly preventive maintenance schedule for all critical equipment',
      'Keep spare parts on hand for generators and cooling systems',
      'Test backup generators weekly under load to ensure they start reliably',
      'Log all maintenance activities to build a compliance history',
      'Replace aging equipment before it becomes unreliable',
    ],
  },
  safety_protocols: {
    title: 'Safety Protocols',
    icon: '🛡️',
    description: 'Evaluates how well your business follows recommended safety procedures during weather events.',
    howWeMeasure: [
      'Based on the percentage of weather risk recommendations you have implemented',
      'Each recommendation (e.g., "secure outdoor equipment during storms") is tracked as Implemented or Pending',
      'Implementing more recommendations directly increases this score',
      'Recommendations are tailored to your business type and local weather conditions',
    ],
    howToImprove: [
      'Review and act on all pending recommendations in your dashboard',
      'Create a written emergency plan covering cold, heat, and storm scenarios',
      'Train staff regularly on weather-related safety procedures',
      'Document every safety action taken — this builds your compliance record',
      'Assign a team member to be responsible for weather-related protocols',
    ],
  },
  inventory_management: {
    title: 'Inventory Management',
    icon: '📦',
    description: 'Assesses how well your inventory is protected from weather-related damage through proper storage and monitoring.',
    howWeMeasure: [
      'Only Humidity sensors are used (storage areas, barrel rooms, vineyard stations)',
      'Humidity levels outside the normal range (e.g., above 70–85% for storage) reduce the score',
      'The score is the percentage of humidity sensors in the "normal" range',
      'Evaluates if storage conditions meet weather-adjusted standards',
    ],
    howToImprove: [
      'Install dehumidifiers in storage areas prone to moisture buildup',
      'Rotate stock based on weather forecasts (e.g., increase cold-weather items before a cold snap)',
      'Adjust delivery schedules to avoid extreme weather windows',
      'Monitor humidity sensors and respond quickly to warnings',
      'Keep inventory logs to document weather-related adjustments for insurance',
    ],
  },
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const city = user?.city || '';
  const storeType = user?.store_type || 'butcher_shop';
  const riskThreshold = 0.2; // 20% threshold for demo

  const [compliance, setCompliance] = useState<ComplianceScore | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recItems, setRecItems] = useState<Array<{
    tracking_id: number;
    climate_event: string;
    recommendation_text: string;
    status: string;
    risk_level: string;
  }>>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

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

  const openRecommendationsModal = async () => {
    setShowRecommendations(true);
    if (recItems.length > 0) return; // already loaded
    setIsLoadingRecs(true);
    try {
      const data = await sensorService.getRecommendations();
      setRecItems(data.recommendations);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  // Limit recommendations: max 5 for high/critical risk, max 1 for low risk
  const limitedRecommendations = recommendations?.filter((rec) => {
    return rec.risk_level !== 'low' || recommendations.filter(r => r.risk_level === 'low').indexOf(rec) === 0;
  }).slice(0, 5) ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back, {user?.business_name || user?.email}! Here's your weather risk overview for <span className="font-semibold">{city}</span>.
        </p>
      </div>

      {/* Top: Summary Widgets */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Compliance Score Widget */}
        {compliance && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Compliance Score</h3>
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
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Risks</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {limitedRecommendations.length}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">risks</span>
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Based on today's weather forecast
          </div>
        </div>

        {/* Sensor Status Widget */}
        {sensors.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Sensors</h3>
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

        {/* Recommendations Followed Widget — clickable */}
        {compliance && (
          <button
            onClick={openRecommendationsModal}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm text-left hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Recommendations</h3>
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
            <div className="mt-2 text-xs text-primary-500 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        )}
      </div>

      {/* Middle: Compliance by Category -- clickable to sensors page */}
      {compliance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance by Category</h3>
            <Link
              to="/sensors"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
            >
              View all sensors <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(compliance.category_scores).map(([category, score]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
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
                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors flex items-center gap-1">
                  View details <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom: Active Recommendations */}
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
          {limitedRecommendations.length === 0 ? (
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
                  Active Recommendations ({limitedRecommendations.length})
                </h2>
              </div>
              {limitedRecommendations.map((rec, index) => (
                <WeatherRiskCard key={index} recommendation={rec} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Category Detail Modal */}
      {selectedCategory && CATEGORY_INFO[selectedCategory] && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const info = CATEGORY_INFO[selectedCategory];
              const score = compliance?.category_scores[selectedCategory as keyof typeof compliance.category_scores] ?? 0;
              return (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{info.title}</h2>
                        <span className={`text-sm font-semibold ${
                          score >= 80 ? 'text-green-600 dark:text-green-400' :
                          score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                          score >= 40 ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          Current score: {score}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {info.description}
                    </p>

                    {/* How We Measure */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-blue-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">How We Measure It</h3>
                      </div>
                      <ul className="space-y-2">
                        {info.howWeMeasure.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-blue-500 mt-1 flex-shrink-0">&#8226;</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* How to Improve */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">How to Improve</h3>
                      </div>
                      <ul className="space-y-2">
                        {info.howToImprove.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="text-green-500 mt-1 flex-shrink-0">&#8226;</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      to="/sensors"
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
                      onClick={() => setSelectedCategory(null)}
                    >
                      View all sensors <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {showRecommendations && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowRecommendations(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Recommendations</h2>
                  {compliance && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {compliance.recommendations_followed} of {compliance.recommendations_total} implemented
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowRecommendations(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {isLoadingRecs ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : recItems.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No recommendations found.
                </p>
              ) : (
                <div className="space-y-2">
                  {recItems.map((rec) => {
                    const isImplemented = rec.status === 'Implemented';
                    return (
                      <div
                        key={rec.tracking_id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          isImplemented
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }`}
                      >
                        {isImplemented ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{rec.recommendation_text}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs font-medium ${
                              isImplemented
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {isImplemented ? 'Implemented' : 'Not implemented'}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {rec.climate_event.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                            <span className={`text-xs capitalize ${
                              rec.risk_level === 'high' ? 'text-red-500' :
                              rec.risk_level === 'medium' ? 'text-orange-500' :
                              'text-yellow-500'
                            }`}>
                              {rec.risk_level} risk
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
