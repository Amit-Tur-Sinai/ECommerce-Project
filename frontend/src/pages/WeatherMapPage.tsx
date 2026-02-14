import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WeatherMap } from '@/components/weather/WeatherMap';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';
import { Map, Filter } from 'lucide-react';

export const WeatherMapPage = () => {
  const { user } = useAuth();
  const [storeType, setStoreType] = useState<typeof STORE_TYPES[keyof typeof STORE_TYPES]>(
    (user?.store_type as typeof STORE_TYPES[keyof typeof STORE_TYPES]) || STORE_TYPES.BUTCHER_SHOP
  );
  const [riskThreshold, setRiskThreshold] = useState(0.2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Map className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Weather Risk Map</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Explore weather risks across different locations. Click on markers to see detailed information.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Store Type
            </label>
            <select
              value={storeType}
              onChange={(e) => setStoreType(e.target.value as typeof STORE_TYPES[keyof typeof STORE_TYPES])}
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
              Risk Threshold: {(riskThreshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(parseFloat(e.target.value))}
              className="w-full accent-primary-600 dark:accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <WeatherMap storeType={storeType} riskThreshold={riskThreshold} />
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          How to use the map
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>Click on any marker to see detailed weather risk information for that city</li>
          <li>Markers are color-coded by risk level: Green (Low), Yellow (Medium), Orange (High), Red (Critical)</li>
          <li>Use the filters above to adjust store type and risk threshold</li>
          <li>Zoom and pan to explore different regions</li>
        </ul>
      </div>
    </div>
  );
};
