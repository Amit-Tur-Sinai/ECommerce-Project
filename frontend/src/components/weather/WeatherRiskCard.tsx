import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Recommendation } from '@/services/weather';
import { CLIMATE_EVENT_ICONS, CLIMATE_EVENT_LABELS } from '@/utils/constants';
import { RiskLevelBadge } from './RiskLevelBadge';
import { ProbabilityGauge } from './ProbabilityGauge';
import { RecommendationList } from './RecommendationList';
import { cn } from '@/utils/clsx';

interface WeatherRiskCardProps {
  recommendation: Recommendation;
  probability?: number;
}

export const WeatherRiskCard = ({
  recommendation,
  probability,
}: WeatherRiskCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const eventType = recommendation.climate_event;
  const icon = CLIMATE_EVENT_ICONS[eventType as keyof typeof CLIMATE_EVENT_ICONS] || '🌤️';
  const label = CLIMATE_EVENT_LABELS[eventType as keyof typeof CLIMATE_EVENT_LABELS] || eventType;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="p-6 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="text-4xl">{icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{label}</h3>
                <RiskLevelBadge level={recommendation.risk_level as any} />
              </div>
              {probability !== undefined && (
                <div className="mb-3">
                  <ProbabilityGauge probability={probability} size="sm" />
                </div>
              )}
            </div>
          </div>
          <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
            {expanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Risk Assessment</h4>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {recommendation.explanation}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Actions</h4>
              <RecommendationList recommendations={recommendation.recommendations} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
