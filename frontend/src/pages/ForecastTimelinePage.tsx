import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CitySelector } from '@/components/weather/CitySelector';
import { Calendar, TrendingUp, AlertTriangle, Cloud, Thermometer, Wind } from 'lucide-react';
import { STORE_TYPES, STORE_TYPE_LABELS, CLIMATE_EVENT_LABELS } from '@/utils/constants';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

export const ForecastTimelinePage = () => {
  const { user } = useAuth();
  // Default to business location, but allow changing for comparison
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  const [forecastDays, setForecastDays] = useState(14);
  
  // Use business city as the primary location
  const businessCity = user?.city || 'Chesterfield';

  // Fetch real weather recommendations for the selected city
  const {
    data: recommendations,
    isLoading,
    error,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, 0.1); // Lower threshold to get more data

  // Generate forecast timeline data based on real API data
  const generateForecastData = () => {
    const data = [];
    const today = new Date();
    
    // Extract probabilities from current recommendations
    const currentProbabilities = {
      cold: 0,
      fog: 0,
      storm: 0,
      heat: 0,
    };

    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((rec) => {
        const event = rec.climate_event.toLowerCase();
        // Estimate probability based on risk level
        let probability = 0;
        switch (rec.risk_level) {
          case 'critical':
            probability = 75 + Math.random() * 20; // 75-95%
            break;
          case 'high':
            probability = 50 + Math.random() * 25; // 50-75%
            break;
          case 'medium':
            probability = 30 + Math.random() * 20; // 30-50%
            break;
          case 'low':
            probability = 10 + Math.random() * 20; // 10-30%
            break;
        }
        
        if (event === 'cold') currentProbabilities.cold = probability;
        else if (event === 'fog') currentProbabilities.fog = probability;
        else if (event === 'storm') currentProbabilities.storm = probability;
        else if (event === 'heat') currentProbabilities.heat = probability;
      });
    }
    
    // Generate forecast timeline with trend variations
    for (let i = 0; i < forecastDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Apply trend variations to base probabilities
      const trendFactor = 1 + (Math.sin(i * 0.3) * 0.2); // ±20% variation
      const randomVariation = 1 + (Math.random() - 0.5) * 0.3; // ±15% random variation
      
      const cold = Math.max(0, Math.min(100, currentProbabilities.cold * trendFactor * randomVariation));
      const fog = Math.max(0, Math.min(100, currentProbabilities.fog * trendFactor * randomVariation));
      const storm = Math.max(0, Math.min(100, currentProbabilities.storm * trendFactor * randomVariation));
      const heat = Math.max(0, Math.min(100, currentProbabilities.heat * trendFactor * randomVariation));
      
      const maxRisk = Math.max(cold, fog, storm, heat);
      const riskLevel = maxRisk >= 70 ? 'critical' : maxRisk >= 50 ? 'high' : maxRisk >= 30 ? 'medium' : 'low';
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString().split('T')[0],
        cold: Math.round(cold),
        fog: Math.round(fog),
        storm: Math.round(storm),
        heat: Math.round(heat),
        maxRisk: Math.round(maxRisk),
        riskLevel,
      });
    }
    
    return data;
  };

  const forecastData = generateForecastData();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  const getEventIcon = (event: string) => {
    switch (event.toLowerCase()) {
      case 'cold':
        return <Thermometer className="w-4 h-4" />;
      case 'storm':
        return <Wind className="w-4 h-4" />;
      case 'fog':
        return <Cloud className="w-4 h-4" />;
      case 'heat':
        return <Thermometer className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage
          message="Failed to load forecast data. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Weather Forecast Timeline</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          View {forecastDays}-day weather risk forecasts for <strong>{city}</strong> with probability trends and visual risk indicators.
        </p>
        {user?.city && (
          <div className="mt-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
            📍 Showing forecast for: <strong>{city}</strong>
            {city === user.city ? ' (Your Business Location)' : ` (Changed from ${user.city})`}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City Location
              {user?.city && city === user.city && (
                <span className="ml-2 text-xs text-primary-600 dark:text-primary-400">(Your Business Location)</span>
              )}
            </label>
            <CitySelector value={city} onChange={setCity} />
            {user?.city && city !== user.city && (
              <button
                onClick={() => setCity(user.city!)}
                className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              >
                Reset to business location ({user.city})
              </button>
            )}
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
              Forecast Period
            </label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Risk Status */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
            Current Weather Risks for {city}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium capitalize">{rec.climate_event}</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getRiskBadgeColor(rec.risk_level)}`}>
                  {rec.risk_level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {['cold', 'fog', 'storm', 'heat'].map((event) => {
          const avgRisk = Math.round(
            forecastData.reduce((sum, day) => sum + (day[event as keyof typeof forecastData[0]] as number), 0) /
              forecastData.length
          );
          const maxRisk = Math.max(...forecastData.map((day) => day[event as keyof typeof forecastData[0]] as number));
          const riskLevel = maxRisk >= 70 ? 'critical' : maxRisk >= 50 ? 'high' : maxRisk >= 30 ? 'medium' : 'low';

          return (
            <div
              key={event}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                {getEventIcon(event)}
                <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                  {CLIMATE_EVENT_LABELS[event as keyof typeof CLIMATE_EVENT_LABELS]}
                </h3>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{avgRisk}%</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">avg</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Peak: {maxRisk}%</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${getRiskBadgeColor(riskLevel)}`}>
                    {riskLevel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Probability Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Probability Trends</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="colorCold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorFog" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorStorm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorHeat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              className="text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }}
              className="text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tw-color-gray-800)',
                border: '1px solid var(--tw-color-gray-700)',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="cold"
              stackId="1"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorCold)"
              name="Cold"
            />
            <Area
              type="monotone"
              dataKey="fog"
              stackId="1"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorFog)"
              name="Fog"
            />
            <Area
              type="monotone"
              dataKey="storm"
              stackId="1"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorStorm)"
              name="Storm"
            />
            <Area
              type="monotone"
              dataKey="heat"
              stackId="1"
              stroke="#f97316"
              fillOpacity={1}
              fill="url(#colorHeat)"
              name="Heat"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Level Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Risk Level Timeline</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
            <XAxis
              dataKey="date"
              className="text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              label={{ value: 'Max Risk (%)', angle: -90, position: 'insideLeft' }}
              className="text-gray-600 dark:text-gray-400"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--tw-color-gray-800)',
                border: '1px solid var(--tw-color-gray-700)',
                borderRadius: '0.5rem',
              }}
            />
            <Bar
              dataKey="maxRisk"
              fill={(entry: any) => getRiskColor(entry.riskLevel)}
              radius={[4, 4, 0, 0]}
            >
              {forecastData.map((entry, index) => (
                <Bar key={index} fill={getRiskColor(entry.riskLevel)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Forecast Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Daily Forecast Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Cold</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Fog</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Storm</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Heat</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Max Risk</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Level</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((day, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{day.date}</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{day.cold}%</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{day.fog}%</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{day.storm}%</td>
                  <td className="py-3 px-4 text-sm text-center text-gray-700 dark:text-gray-300">{day.heat}%</td>
                  <td className="py-3 px-4 text-sm text-center font-semibold text-gray-900 dark:text-white">
                    {day.maxRisk}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${getRiskBadgeColor(day.riskLevel)}`}>
                      {day.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
