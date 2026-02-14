import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Activity, CheckCircle2, XCircle, Shield, X, Info, TrendingUp, ChevronRight, Calculator } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';
import { sensorService, SensorReading, ComplianceScore } from '@/services/sensors';

// Detailed info for each compliance category
const CATEGORY_INFO: Record<string, {
  title: string;
  icon: string;
  description: string;
  basedOn: 'sensors' | 'recommendations';
  relevantSensorTypes: string[];
  howWeMeasure: string[];
  howToImprove: string[];
}> = {
  temperature_control: {
    title: 'Temperature Control',
    icon: '🌡️',
    basedOn: 'sensors',
    relevantSensorTypes: ['Temperature'],
    description: 'Measures how well your business maintains safe temperature levels across refrigeration, storage, and display areas.',
    howWeMeasure: [
      'Only Temperature sensors are used (refrigeration units, freezers, display counters)',
      'Readings are classified as normal, warning, or critical based on safe thresholds for your business type',
      'Severity is weighted: normal = 100 pts, warning = 50 pts, critical = 0 pts',
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
    basedOn: 'sensors',
    relevantSensorTypes: ['Power'],
    description: 'Tracks the operational health of critical equipment like backup generators, cooling systems, and power supplies.',
    howWeMeasure: [
      'Only Power sensors are used (backup generators, cooling systems)',
      'Readings below the normal threshold (e.g., generator below 80%) trigger warnings',
      'Severity is weighted: normal = 100 pts, warning = 50 pts, critical = 0 pts',
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
    basedOn: 'recommendations',
    relevantSensorTypes: [],
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
    basedOn: 'sensors',
    relevantSensorTypes: ['Humidity'],
    description: 'Assesses how well your inventory is protected from weather-related damage through proper storage and monitoring.',
    howWeMeasure: [
      'Only Humidity sensors are used (storage areas, barrel rooms, vineyard stations)',
      'Humidity levels outside the normal range (e.g., above 70–85% for storage) reduce the score',
      'Severity is weighted: normal = 100 pts, warning = 50 pts, critical = 0 pts',
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

export const SensorMonitoringPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [compliance, setCompliance] = useState<ComplianceScore | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadSensorData();
    // Sensor data is updated once daily -- no need for frequent polling
  }, []);

  const loadSensorData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sensorsData, complianceData] = await Promise.all([
        sensorService.getSensorReadings(),
        sensorService.getComplianceScore(),
      ]);
      setSensors(sensorsData.sensors);
      setCompliance(complianceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sensor data');
      console.error('Error loading sensor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600';
    }
  };

  const getRankColor = (rank: string) => {
    if (rank === 'Excellent') return 'text-green-600';
    if (rank === 'Good') return 'text-blue-600';
    if (rank === 'Fair') return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Severity weights (must match backend STATUS_WEIGHTS)
  const STATUS_WEIGHTS: Record<string, number> = { normal: 100, warning: 50, critical: 0 };

  // Derive intermediate calculation values from raw data, filtered by relevant sensor types
  const getCalculationDetails = (category: string) => {
    const info = CATEGORY_INFO[category];
    const relevantTypes = info?.relevantSensorTypes ?? [];

    // Filter sensors to only those relevant for this category
    const filtered = relevantTypes.length > 0
      ? sensors.filter(s => relevantTypes.includes(s.sensor_type))
      : sensors;

    const totalSensors = filtered.length;
    const normalCount = filtered.filter(s => s.status === 'normal').length;
    const warningCount = filtered.filter(s => s.status === 'warning').length;
    const criticalCount = filtered.filter(s => s.status === 'critical').length;

    // Weighted score: normal=100, warning=50, critical=0
    const totalPoints = filtered.reduce((sum, s) => sum + (STATUS_WEIGHTS[s.status] ?? 0), 0);
    const sensorScore = totalSensors > 0 ? totalPoints / totalSensors : 0;

    const recsFollowed = compliance?.recommendations_followed ?? 0;
    const recsTotal = compliance?.recommendations_total ?? 0;
    const recScore = recsTotal > 0 ? (recsFollowed / recsTotal) * 100 : 0;

    // The sensor names involved (for display)
    const sensorNames = filtered.map(s => `${s.sensor_id} (${s.location})`);

    return { totalSensors, normalCount, warningCount, criticalCount, sensorScore, recsFollowed, recsTotal, recScore, sensorNames, relevantTypes };
  };

  if (isLoading && !compliance) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sensor Monitoring & Compliance</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your sensor devices and track compliance with weather risk recommendations.
        </p>
      </div>

      {/* Compliance Score Card */}
      {compliance && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-primary-200 dark:border-gray-600 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Score</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {user?.business_name || 'Your business'} is following {compliance.recommendations_followed} out of {compliance.recommendations_total} recommendations
              </p>
              <div className="flex items-baseline gap-4">
                <div className="text-5xl font-bold text-primary-600 dark:text-primary-400">
                  {compliance.overall_score}%
                </div>
                <div className={`text-2xl font-semibold ${getRankColor(compliance.rank)}`}>
                  {compliance.rank}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ranking</div>
              <div className={`text-3xl font-bold ${getRankColor(compliance.rank)}`}>
                {compliance.rank}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Scores - Clickable */}
      {compliance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compliance by Category</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">Click a category for details</span>
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
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getBarColor(score)}`}
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

      {/* Sensor Readings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sensor Readings</h2>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {formatDateTime(new Date())}
            </span>
          </div>
        </div>
        <div className="p-6">
          {sensors.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sensor readings available. Start the demo sensor device to generate data.
            </div>
          ) : (
            <div className="space-y-4">
              {sensors.map((sensor) => (
              <div
                key={sensor.sensor_id}
                className={`border rounded-lg p-4 ${getStatusColor(sensor.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{sensor.sensor_id}</h3>
                      <span className="text-xs px-2 py-1 bg-white/50 dark:bg-gray-700/50 rounded-full text-gray-900 dark:text-white">
                        {sensor.sensor_type}
                      </span>
                      {sensor.recommendation_compliance ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{sensor.location}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {sensor.reading_value}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{sensor.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium mb-1 capitalize ${getStatusColor(sensor.status).split(' ')[0]}`}>
                      {sensor.status}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDateTime(new Date(sensor.timestamp))}
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
              const calc = getCalculationDetails(selectedCategory);

              const isSensorBased = info.basedOn === 'sensors';
              const baseScore = isSensorBased ? calc.sensorScore : calc.recScore;
              const sensorTypeLabel = calc.relevantTypes.join(' / ') || 'All';
              const finalScore = Math.floor(baseScore);

              return (
                <>
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{info.title}</h2>
                        <span className={`text-sm font-semibold ${getScoreColor(score)}`}>
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

                    {/* Calculation Breakdown */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-4 h-4 text-purple-500" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">Calculation Breakdown</h3>
                      </div>

                      {/* Formula */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-3 mb-3 border border-purple-200 dark:border-purple-800">
                        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">Formula</div>
                        {isSensorBased ? (
                          <div className="font-mono text-sm text-purple-800 dark:text-purple-300 space-y-1">
                            <p>score = (normal×100 + warning×50 + critical×0) / total sensors</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">
                              Weights: normal = 100pts, warning = 50pts, critical = 0pts
                            </p>
                          </div>
                        ) : (
                          <p className="font-mono text-sm text-purple-800 dark:text-purple-300">
                            score = (implemented / total recommendations) × 100
                          </p>
                        )}
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                        {/* Calculation with actual values */}
                        {isSensorBased ? (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Your Data
                            </div>
                            {/* Sensor breakdown with points */}
                            <div className="space-y-1.5 mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                <span>{calc.normalCount} normal</span>
                                <span className="text-gray-400">×</span>
                                <span>100</span>
                                <span className="text-gray-400">=</span>
                                <span className="font-semibold">{calc.normalCount * 100} pts</span>
                              </div>
                              {calc.warningCount > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
                                  <span>{calc.warningCount} warning</span>
                                  <span className="text-gray-400">×</span>
                                  <span>50</span>
                                  <span className="text-gray-400">=</span>
                                  <span className="font-semibold">{calc.warningCount * 50} pts</span>
                                </div>
                              )}
                              {calc.criticalCount > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                  <span>{calc.criticalCount} critical</span>
                                  <span className="text-gray-400">×</span>
                                  <span>0</span>
                                  <span className="text-gray-400">=</span>
                                  <span className="font-semibold">0 pts</span>
                                </div>
                              )}
                            </div>
                            {/* Total calculation */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                  ({calc.normalCount * 100}{calc.warningCount > 0 ? ` + ${calc.warningCount * 50}` : ''}{calc.criticalCount > 0 ? ' + 0' : ''}) / {calc.totalSensors}
                                </span>
                                <span className="text-gray-400">=</span>
                                <span className={`text-lg font-bold ${getScoreColor(finalScore)}`}>{finalScore}%</span>
                              </div>
                            </div>
                            {/* Sensors used */}
                            {calc.sensorNames.length > 0 && (
                              <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                                <span className="font-medium text-gray-500 dark:text-gray-400">Sensors used: </span>
                                {calc.sensorNames.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Your Data
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                                ({calc.recsFollowed} / {calc.recsTotal}) × 100
                              </span>
                              <span className="text-gray-400">=</span>
                              <span className={`text-lg font-bold ${getScoreColor(finalScore)}`}>{finalScore}%</span>
                            </div>
                            <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {calc.recsFollowed} implemented, {calc.recsTotal - calc.recsFollowed} pending out of {calc.recsTotal} total
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

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
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
