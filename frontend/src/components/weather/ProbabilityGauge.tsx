import { cn } from '@/utils/clsx';
import { formatPercentage } from '@/utils/formatters';

interface ProbabilityGaugeProps {
  probability: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProbabilityGauge = ({
  probability,
  size = 'md',
  showLabel = true,
}: ProbabilityGaugeProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const strokeWidth = {
    sm: 6,
    md: 8,
    lg: 10,
  };

  const radius = {
    sm: 28,
    md: 40,
    lg: 52,
  };

  const circumference = 2 * Math.PI * radius[size];
  const offset = circumference - (probability * circumference);

  const getColor = () => {
    if (probability >= 0.75) return 'stroke-red-500';
    if (probability >= 0.5) return 'stroke-orange-500';
    if (probability >= 0.25) return 'stroke-yellow-500';
    return 'stroke-green-500';
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className={cn('transform -rotate-90', sizeClasses[size])}>
          {/* Background circle */}
          <circle
            cx={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
            cy={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
            r={radius[size]}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
            cy={size === 'sm' ? 32 : size === 'md' ? 48 : 64}
            r={radius[size]}
            stroke="currentColor"
            strokeWidth={strokeWidth[size]}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={cn('transition-all duration-500', getColor())}
          />
        </svg>
        {showLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn(
              'font-bold text-gray-900',
              size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
            )}>
              {formatPercentage(probability)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
