import { cn } from '@/utils/clsx';
import { RISK_LEVEL_LABELS, RiskLevel } from '@/utils/constants';

interface RiskLevelBadgeProps {
  level: RiskLevel;
  className?: string;
}

const getBadgeClasses = (level: RiskLevel): string => {
  switch (level) {
    case 'low':
      return 'bg-risk-low/10 text-risk-low border-risk-low/20';
    case 'medium':
      return 'bg-risk-medium/10 text-risk-medium border-risk-medium/20';
    case 'high':
      return 'bg-risk-high/10 text-risk-high border-risk-high/20';
    case 'critical':
      return 'bg-risk-critical/10 text-risk-critical border-risk-critical/20';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const RiskLevelBadge = ({ level, className }: RiskLevelBadgeProps) => {
  const label = RISK_LEVEL_LABELS[level];

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
        getBadgeClasses(level),
        className
      )}
    >
      {label}
    </span>
  );
};
