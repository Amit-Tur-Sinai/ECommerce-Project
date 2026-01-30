import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { DollarSign, TrendingUp, Shield, AlertTriangle, Calculator } from 'lucide-react';
import { useWeatherRecommendations } from '@/hooks/useWeather';
import { CitySelector } from '@/components/weather/CitySelector';
import { STORE_TYPES, STORE_TYPE_LABELS } from '@/utils/constants';

export const CostSavingsPage = () => {
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city || 'Chesterfield');
  const [storeType, setStoreType] = useState(user?.store_type || STORE_TYPES.BUTCHER_SHOP);
  
  // Business inputs
  const [monthlyRevenue, setMonthlyRevenue] = useState(50000);
  const [currentInsurancePremium, setCurrentInsurancePremium] = useState(2000);
  const [averageLossPerEvent, setAverageLossPerEvent] = useState(5000);
  const [eventsPerYear, setEventsPerYear] = useState(3);

  const {
    data: recommendations,
    isLoading,
  } = useWeatherRecommendations(city, storeType as any, !!city, false, 0.2);

  // Calculate savings
  const calculateSavings = () => {
    if (!recommendations) return { totalSavings: 0, roi: 0, premiumReduction: 0, lossPrevention: 0 };

    const criticalRisks = recommendations.filter((r) => r.risk_level === 'critical').length;
    const highRisks = recommendations.filter((r) => r.risk_level === 'high').length;
    const totalRisks = recommendations.length;

    // Loss prevention estimate (preventing events)
    const preventionRate = Math.min(0.8, 0.3 + (totalRisks * 0.05)); // Up to 80% prevention
    const preventedEvents = eventsPerYear * preventionRate;
    const lossPrevention = preventedEvents * averageLossPerEvent;

    // Insurance premium reduction (better compliance = lower premiums)
    const complianceScore = Math.max(0, 100 - (criticalRisks * 10) - (highRisks * 5));
    const premiumReduction = currentInsurancePremium * (complianceScore / 100) * 0.15; // Up to 15% reduction

    // Revenue protection (avoiding downtime)
    const downtimeDays = preventedEvents * 2; // Assume 2 days downtime per event
    const dailyRevenue = monthlyRevenue / 30;
    const revenueProtection = downtimeDays * dailyRevenue * 0.7; // 70% of revenue protected

    // Total savings
    const totalSavings = lossPrevention + premiumReduction + revenueProtection;
    
    // ROI calculation (assuming cost of following recommendations)
    const recommendationCost = totalRisks * 200; // $200 per recommendation implementation
    const roi = recommendationCost > 0 ? ((totalSavings - recommendationCost) / recommendationCost) * 100 : 0;

    return {
      totalSavings,
      roi,
      premiumReduction,
      lossPrevention,
      revenueProtection,
      preventedEvents,
      complianceScore,
      recommendationCost,
    };
  };

  const savings = calculateSavings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cost Savings Calculator</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Estimate potential savings from following weather risk recommendations and calculate ROI.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Information</h2>
            
            <div className="space-y-4">
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
                  Current Insurance Premium ($/month)
                </label>
                <input
                  type="number"
                  value={currentInsurancePremium}
                  onChange={(e) => setCurrentInsurancePremium(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Average Loss Per Weather Event ($)
                </label>
                <input
                  type="number"
                  value={averageLossPerEvent}
                  onChange={(e) => setAverageLossPerEvent(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  step="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Weather Events Per Year
                </label>
                <input
                  type="number"
                  value={eventsPerYear}
                  onChange={(e) => setEventsPerYear(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Total Savings Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Estimated Annual Savings</h2>
            </div>
            <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
              ${savings.totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on current risk profile and business metrics
            </p>
          </div>

          {/* ROI Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Return on Investment (ROI)</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {savings.roi > 0 ? '+' : ''}{savings.roi.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">ROI Percentage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  ${savings.recommendationCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Implementation Cost</div>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Loss Prevention</h4>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                ${savings.lossPrevention.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Preventing {savings.preventedEvents.toFixed(1)} events/year
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Premium Reduction</h4>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                ${savings.premiumReduction.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {savings.complianceScore.toFixed(0)}% compliance score
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Revenue Protection</h4>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                ${savings.revenueProtection.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Avoiding downtime losses
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Active Risks</h4>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {recommendations?.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current weather risks detected
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Calculation Summary</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-disc list-inside">
              <li>
                Loss Prevention: Preventing {savings.preventedEvents.toFixed(1)} weather events × ${averageLossPerEvent.toLocaleString()} = ${savings.lossPrevention.toLocaleString()}
              </li>
              <li>
                Insurance Premium: {savings.complianceScore.toFixed(0)}% compliance × ${currentInsurancePremium.toLocaleString()}/month × 15% reduction = ${savings.premiumReduction.toLocaleString()}/year
              </li>
              <li>
                Revenue Protection: {savings.preventedEvents.toFixed(1)} events × 2 days downtime × ${(monthlyRevenue / 30).toLocaleString()}/day × 70% = ${savings.revenueProtection.toLocaleString()}
              </li>
              <li className="font-semibold mt-2">
                Total Annual Savings: ${savings.totalSavings.toLocaleString()}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
