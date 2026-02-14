import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Calendar, TrendingUp, AlertTriangle, Cloud, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { CLIMATE_EVENT_LABELS } from '@/utils/constants';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { exportToCSV, exportToPDF } from '@/utils/exportUtils';

export const AnalyticsPage = () => {
  const { user } = useAuth();
  const city = user?.city || '';
  const storeType = user?.store_type || 'butcher_shop';
  const [dateRange, setDateRange] = useState('30'); // days
  const reportRef = useRef<HTMLDivElement>(null);

  const {
    data: recommendations,
    isLoading,
    error,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, 0.2);

  // Build exportable data from recommendations
  const exportData = recommendations?.map((rec, index) => ({
    '#': index + 1,
    'Climate Event': rec.climate_event,
    'Risk Level': rec.risk_level,
    'Recommendations': rec.recommendations.join('; '),
    'Date': new Date().toLocaleDateString(),
    'City': city,
    'Store Type': storeType.replace('_', ' '),
  })) || [];

  const handleExportCSV = () => {
    if (exportData.length === 0) return;
    exportToCSV(exportData, `canopy_risk_history_${city}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF('analytics-report', `canopy_risk_report_${city}_${new Date().toISOString().split('T')[0]}.pdf`, 'Canopy Risk Report');
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  };

  // Summary stats derived from current data
  const stats = {
    totalEvents: recommendations?.length || 0,
    coldEvents: recommendations?.filter(r => r.climate_event === 'cold').length || 0,
    stormEvents: recommendations?.filter(r => r.climate_event === 'storm').length || 0,
    heatEvents: recommendations?.filter(r => r.climate_event === 'heat').length || 0,
    mostCommonEvent: (() => {
      if (!recommendations || recommendations.length === 0) return null;
      const counts: Record<string, number> = {};
      recommendations.forEach(r => { counts[r.climate_event] = (counts[r.climate_event] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    })(),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">History & Documentation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View historical weather events, past recommendations, and export records for insurance claims and compliance documentation.
        </p>
      </div>

      {/* Export Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Export Records</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Download your risk history for insurance claims or compliance review.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              disabled={!recommendations || recommendations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!recommendations || recommendations.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Time Period Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Period:</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing data for <span className="font-semibold">{city}</span>
          </span>
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
          message={(error as any)?.response?.data?.detail || 'Failed to load analytics data.'}
          onRetry={() => {}}
        />
      )}

      {/* Analytics Content */}
      {!isLoading && !error && (
        <div id="analytics-report" ref={reportRef} className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalEvents}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500 dark:text-orange-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Last {dateRange} days</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cold Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.coldEvents}</p>
                </div>
                <span className="text-3xl">❄️</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{CLIMATE_EVENT_LABELS.cold}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Storm Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.stormEvents}</p>
                </div>
                <span className="text-3xl">⛈️</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{CLIMATE_EVENT_LABELS.storm}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Heat Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.heatEvents}</p>
                </div>
                <span className="text-3xl">🔥</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{CLIMATE_EVENT_LABELS.heat}</p>
            </div>
          </div>

          {/* Insights Section */}
          {stats.mostCommonEvent && (
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
                      {CLIMATE_EVENT_LABELS[stats.mostCommonEvent as keyof typeof CLIMATE_EVENT_LABELS]}{' '}
                      events occurred most frequently in the last {dateRange} days
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historical Recommendations Table */}
          {recommendations && recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Risk History</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Use this data to support insurance claims or compliance audits
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Event</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Risk Level</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Recommendations</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((rec, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-3 px-4 capitalize font-medium text-gray-900 dark:text-white">
                          {rec.climate_event}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            rec.risk_level === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            rec.risk_level === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            rec.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {rec.risk_level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-md">
                          <ul className="list-disc list-inside space-y-1">
                            {rec.recommendations.slice(0, 3).map((r, i) => (
                              <li key={i} className="truncate">{r}</li>
                            ))}
                            {rec.recommendations.length > 3 && (
                              <li className="text-gray-400 dark:text-gray-500">+{rec.recommendations.length - 3} more</li>
                            )}
                          </ul>
                        </td>
                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date().toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Data State */}
          {(!recommendations || recommendations.length === 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 shadow-sm text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
              <p className="text-gray-600 dark:text-gray-400 font-medium">No Risk Events Recorded</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                No weather risk events have been recorded for {city} in the selected time period.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
