import { api } from './api';
import { StoreType } from '@/utils/constants';

export interface Recommendation {
  climate_event: string;
  risk_level: string;
  recommendations: string[];
  explanation: string;
}

export interface WeatherProbabilities {
  cold: number;
  storm: number;
  heat: number;
}

export const weatherService = {
  async getRecommendations(
    cityName: string,
    storeType?: StoreType,
    useHistorical: boolean = false,
    riskThreshold: number = 0.2
  ): Promise<Recommendation[]> {
    const params: any = {};
    if (storeType) {
      params.store_type = storeType;
    }
    if (riskThreshold !== 0.5) {
      params.risk_threshold = riskThreshold;
    }
    const response = await api.get(`/recommend/${cityName}`, { params });
    return response.data;
  },

  async getProbabilities(cityName: string): Promise<WeatherProbabilities> {
    // This would be a separate endpoint if available
    // For now, we'll extract from recommendations
    const recommendations = await this.getRecommendations(cityName);
    // Extract probabilities from recommendations if available
    // This is a placeholder - adjust based on actual API response
    return {
      cold: 0,
      storm: 0,
      heat: 0,
    };
  },
};
