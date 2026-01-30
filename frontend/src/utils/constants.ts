export const STORE_TYPES = {
  BUTCHER_SHOP: 'butcher_shop',
  WINERY: 'winery',
} as const;

export type StoreType = typeof STORE_TYPES[keyof typeof STORE_TYPES];

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  [STORE_TYPES.BUTCHER_SHOP]: 'Butcher Shop',
  [STORE_TYPES.WINERY]: 'Winery',
};

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  [RISK_LEVELS.LOW]: 'risk-low',
  [RISK_LEVELS.MEDIUM]: 'risk-medium',
  [RISK_LEVELS.HIGH]: 'risk-high',
  [RISK_LEVELS.CRITICAL]: 'risk-critical',
};

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RISK_LEVELS.LOW]: 'Low Risk',
  [RISK_LEVELS.MEDIUM]: 'Medium Risk',
  [RISK_LEVELS.HIGH]: 'High Risk',
  [RISK_LEVELS.CRITICAL]: 'Critical Risk',
};

export const CLIMATE_EVENTS = {
  COLD: 'cold',
  FOG: 'fog',
  STORM: 'storm',
  HEAT: 'heat',
} as const;

export type ClimateEvent = typeof CLIMATE_EVENTS[keyof typeof CLIMATE_EVENTS];

export const CLIMATE_EVENT_LABELS: Record<ClimateEvent, string> = {
  [CLIMATE_EVENTS.COLD]: 'Cold Weather',
  [CLIMATE_EVENTS.FOG]: 'Fog',
  [CLIMATE_EVENTS.STORM]: 'Storm',
  [CLIMATE_EVENTS.HEAT]: 'Heat Wave',
};

export const CLIMATE_EVENT_ICONS: Record<ClimateEvent, string> = {
  [CLIMATE_EVENTS.COLD]: '❄️',
  [CLIMATE_EVENTS.FOG]: '🌫️',
  [CLIMATE_EVENTS.STORM]: '⛈️',
  [CLIMATE_EVENTS.HEAT]: '🔥',
};

// In development, use proxy. In production, use full URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : 'http://localhost:8000');
