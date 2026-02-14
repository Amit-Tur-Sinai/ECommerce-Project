import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Activity, CheckCircle2, XCircle, AlertCircle, Shield } from 'lucide-react';
import { formatDateTime } from '@/utils/formatters';
import { sensorService, SensorReading, ComplianceScore } from '@/services/sensors';

export const SensorMonitoringPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [compliance, setCompliance] = useState<ComplianceScore | null>(null);

  useEffect(() => {
    loadSensorData();
    // Refresh data every 30 seconds
    const interval = setInterval(loadSensorData, 30000);
    return () => clearInterval(interval);
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

      {/* Category Scores */}
      {compliance && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {Object.entries(compliance.category_scores).map(([category, score]) => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 capitalize">
              {category.replace('_', ' ')}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{score}%</span>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Sensor Readings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Live Sensor Readings</h2>
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

      {/* Compliance Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recommendation Compliance</h2>
        <div className="space-y-3">
          {compliance && compliance.recommendations_total > 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              {compliance.recommendations_followed} out of {compliance.recommendations_total} recommendations are being followed.
              <br />
              <span className="text-sm">Detailed recommendation tracking coming soon.</span>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400">
              No recommendations tracked yet. Recommendations will appear here once generated.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
