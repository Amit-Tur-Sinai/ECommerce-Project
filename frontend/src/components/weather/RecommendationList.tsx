import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/clsx';

interface RecommendationListProps {
  recommendations: string[];
  maxVisible?: number;
}

export const RecommendationList = ({
  recommendations,
  maxVisible = 5,
}: RecommendationListProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? recommendations : recommendations.slice(0, maxVisible);
  const hasMore = recommendations.length > maxVisible;

  return (
    <div className="space-y-2">
      {displayItems.map((rec, index) => (
        <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-white">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <span>{rec}</span>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium mt-2"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {recommendations.length - maxVisible} more recommendations
            </>
          )}
        </button>
      )}
    </div>
  );
};
