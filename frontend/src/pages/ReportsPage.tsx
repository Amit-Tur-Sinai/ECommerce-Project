import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Download, FileText, FileSpreadsheet, Calendar, Settings } from 'lucide-react';
import { exportToCSV, exportToPDF, generateReport } from '@/utils/exportUtils';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { CitySelector } from '@/components/weather/CitySelector';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  const [reportType, setReportType] = useState<'summary' | 'detailed' | 'compliance'>('summary');
  const reportRef = useRef<HTMLDivElement>(null);

  const {
    data: recommendations,
    isLoading,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, 0.2);

  const handleExportCSV = () => {
    if (!recommendations) return;

    const csvData = recommendations.map((rec, index) => ({
      'Risk #': index + 1,
      'Climate Event': rec.climate_event,
      'Risk Level': rec.risk_level,
      'Recommendations': rec.recommendations.join('; '),
      'Explanation': rec.explanation,
    }));

    exportToCSV(csvData, `weather_report_${city}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      await exportToPDF(
        'report-content',
        `weather_report_${city}_${new Date().toISOString().split('T')[0]}.pdf`,
        `Weather Risk Report - ${city}`
      );
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!recommendations) return;

    const reportData = {
      title: `Weather Risk Report - ${city}`,
      data: recommendations.map((rec, index) => ({
        'Risk #': index + 1,
        'Climate Event': rec.climate_event,
        'Risk Level': rec.risk_level,
        'Recommendations': rec.recommendations.join('; '),
        'Explanation': rec.explanation,
      })),
      columns: ['Risk #', 'Climate Event', 'Risk Level', 'Recommendations', 'Explanation'],
    };

    await generateReport(reportData);
  };

  const getRiskStats = () => {
    if (!recommendations) return { total: 0, critical: 0, high: 0, medium: 0, low: 0 };

    return {
      total: recommendations.length,
      critical: recommendations.filter((r) => r.risk_level === 'critical').length,
      high: recommendations.filter((r) => r.risk_level === 'high').length,
      medium: recommendations.filter((r) => r.risk_level === 'medium').length,
      low: recommendations.filter((r) => r.risk_level === 'low').length,
    };
  };

  const stats = getRiskStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Export & Reports</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Generate and export comprehensive weather risk reports in PDF or CSV format.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="summary">Summary Report</option>
              <option value="detailed">Detailed Report</option>
              <option value="compliance">Compliance Report</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Options</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <button
            onClick={handleExportCSV}
            disabled={isLoading || !recommendations}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Export CSV</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Download data as CSV</div>
            </div>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isLoading || !recommendations}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Export PDF</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Generate PDF report</div>
            </div>
          </button>

          <button
            onClick={handleGenerateReport}
            disabled={isLoading || !recommendations}
            className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <div className="text-left">
              <div className="font-semibold text-gray-900 dark:text-white">Full Report</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Comprehensive PDF</div>
            </div>
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div
        id="report-content"
        ref={reportRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Weather Risk Report - {city}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Generated on {new Date().toLocaleDateString()} | Store Type: {STORE_TYPE_LABELS[storeType as keyof typeof STORE_TYPE_LABELS]}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Risks</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="text-sm text-red-600 dark:text-red-400">Critical</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="text-sm text-orange-600 dark:text-orange-400">High</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.high}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Medium</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.medium}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="text-sm text-green-600 dark:text-green-400">Low</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.low}</div>
          </div>
        </div>

        {/* Recommendations List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading...</div>
        ) : recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Weather Risks</h3>
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {rec.climate_event} - {rec.risk_level} Risk
                  </h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Risk #{index + 1}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{rec.explanation}</p>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recommendations:
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {rec.recommendations.map((recItem, idx) => (
                      <li key={idx}>{recItem}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No active weather risks detected for {city}.
          </div>
        )}
      </div>
    </div>
  );
};
