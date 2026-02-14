import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { TrendingDown, Package, Users, Settings, AlertTriangle } from 'lucide-react';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { CitySelector } from '@/components/weather/CitySelector';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';

export const ImpactPredictionsPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [averageInventoryValue, setAverageInventoryValue] = useState(30000);
  const [staffCount, setStaffCount] = useState(5);

  const {
    data: recommendations,
    isLoading,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, 0.2);

  const calculateImpacts = () => {
    if (!recommendations) {
      return {
        revenueImpact: 0,
        inventoryRecommendations: [],
        staffingSuggestions: [],
        operationalAdjustments: [],
      };
    }

    const criticalRisks = recommendations.filter((r) => r.risk_level === 'critical').length;
    const highRisks = recommendations.filter((r) => r.risk_level === 'high').length;
    const totalRisks = recommendations.length;

    // Revenue Impact Estimate
    const riskFactor = (criticalRisks * 0.15 + highRisks * 0.08 + (totalRisks - criticalRisks - highRisks) * 0.03);
    const potentialRevenueLoss = monthlyRevenue * riskFactor;
    const revenueImpact = potentialRevenueLoss * 12; // Annual

    // Inventory Recommendations
    const inventoryRecommendations = [];
    if (recommendations.some((r) => r.climate_event === 'cold' || r.climate_event === 'heat')) {
      inventoryRecommendations.push({
        action: 'Increase temperature-sensitive inventory protection',
        priority: 'High',
        estimatedCost: 2000,
        impact: 'Prevent spoilage and waste',
      });
    }
    if (recommendations.some((r) => r.climate_event === 'storm')) {
      inventoryRecommendations.push({
        action: 'Secure outdoor inventory and storage areas',
        priority: 'Critical',
        estimatedCost: 1500,
        impact: 'Prevent damage from severe weather',
      });
    }
    if (recommendations.some((r) => r.climate_event === 'fog')) {
      inventoryRecommendations.push({
        action: 'Enhance visibility and safety measures',
        priority: 'Medium',
        estimatedCost: 800,
        impact: 'Improve operational safety',
      });
    }

    // Staffing Suggestions
    const staffingSuggestions = [];
    if (criticalRisks > 0) {
      staffingSuggestions.push({
        action: 'Increase staff during high-risk periods',
        priority: 'High',
        additionalStaff: Math.ceil(staffCount * 0.2),
        estimatedCost: Math.ceil(staffCount * 0.2) * 200 * 5, // 5 days at $200/day
        impact: 'Better preparedness and response capability',
      });
    }
    if (highRisks > 2) {
      staffingSuggestions.push({
        action: 'Cross-train staff on weather emergency procedures',
        priority: 'Medium',
        additionalStaff: 0,
        estimatedCost: 500,
        impact: 'Improved response efficiency',
      });
    }

    // Operational Adjustments
    const operationalAdjustments = [];
    if (recommendations.some((r) => r.climate_event === 'storm')) {
      operationalAdjustments.push({
        action: 'Implement flexible delivery schedules',
        priority: 'High',
        estimatedCost: 1000,
        impact: 'Reduce delivery delays and customer impact',
      });
    }
    if (recommendations.some((r) => r.climate_event === 'cold' || r.climate_event === 'heat')) {
      operationalAdjustments.push({
        action: 'Optimize HVAC and climate control systems',
        priority: 'High',
        estimatedCost: 3000,
        impact: 'Maintain optimal storage conditions',
      });
    }
    if (totalRisks > 5) {
      operationalAdjustments.push({
        action: 'Establish weather monitoring and alert system',
        priority: 'Medium',
        estimatedCost: 1500,
        impact: 'Proactive risk management',
      });
    }

    return {
      revenueImpact,
      inventoryRecommendations,
      staffingSuggestions,
      operationalAdjustments,
      riskFactor,
    };
  };

  const impacts = calculateImpacts();

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Weather Impact Predictions</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Predict revenue impacts and get recommendations for inventory, staffing, and operational adjustments.
        </p>
      </div>

      {/* Input Panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Metrics</h2>
        <div className="grid md:grid-cols-4 gap-4">
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
              Monthly Revenue ($)
            </label>
            <input
              type="number"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="0"
              step="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Staff Count
            </label>
            <input
              type="number"
              value={staffCount}
              onChange={(e) => setStaffCount(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Revenue Impact */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Potential Revenue Impact</h2>
        </div>
        <div className="text-4xl font-bold text-red-600 dark:text-red-400 mb-2">
          ${impacts.revenueImpact.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Estimated annual revenue at risk based on current weather patterns
        </p>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Risk Factor: {(impacts.riskFactor * 100).toFixed(1)}% of monthly revenue
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Inventory Recommendations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Recommendations</h3>
          </div>
          {impacts.inventoryRecommendations.length > 0 ? (
            <div className="space-y-4">
              {impacts.inventoryRecommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${rec.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{rec.action}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{rec.impact}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No specific inventory recommendations at this time.</p>
          )}
        </div>

        {/* Staffing Suggestions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staffing Suggestions</h3>
          </div>
          {impacts.staffingSuggestions.length > 0 ? (
            <div className="space-y-4">
              {impacts.staffingSuggestions.map((suggestion, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(suggestion.priority)}`}>
                      {suggestion.priority}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${suggestion.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{suggestion.action}</h4>
                  {suggestion.additionalStaff > 0 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Additional staff needed: {suggestion.additionalStaff}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">{suggestion.impact}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No staffing adjustments needed at this time.</p>
          )}
        </div>

        {/* Operational Adjustments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Operational Adjustments</h3>
          </div>
          {impacts.operationalAdjustments.length > 0 ? (
            <div className="space-y-4">
              {impacts.operationalAdjustments.map((adjustment, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(adjustment.priority)}`}>
                      {adjustment.priority}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      ${adjustment.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{adjustment.action}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{adjustment.impact}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No operational adjustments needed at this time.</p>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Impact Summary</h4>
        <div className="grid md:grid-cols-4 gap-4 text-sm text-blue-800 dark:text-blue-400">
          <div>
            <div className="font-semibold">Revenue at Risk</div>
            <div className="text-lg">${impacts.revenueImpact.toLocaleString()}/year</div>
          </div>
          <div>
            <div className="font-semibold">Inventory Actions</div>
            <div className="text-lg">{impacts.inventoryRecommendations.length}</div>
          </div>
          <div>
            <div className="font-semibold">Staffing Changes</div>
            <div className="text-lg">{impacts.staffingSuggestions.length}</div>
          </div>
          <div>
            <div className="font-semibold">Operational Changes</div>
            <div className="text-lg">{impacts.operationalAdjustments.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
