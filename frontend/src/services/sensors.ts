import { api } from './api';

export interface SensorReading {
  sensor_id: string;
  sensor_type: string;
  location: string;
  reading_value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  timestamp: string;
  recommendation_compliance: boolean;
}

export interface ComplianceScore {
  overall_score: number;
  category_scores: {
    temperature_control: number;
    equipment_maintenance: number;
    safety_protocols: number;
    inventory_management: number;
  };
  recommendations_followed: number;
  recommendations_total: number;
  rank: string;
}

export interface BusinessRanking {
  rank: number;
  business_name: string;
  score: number;
  rank_level: string;
  recommendations_followed: number;
  recommendations_total: number;
}

export interface RankingResponse {
  rankings: BusinessRanking[];
  your_business: BusinessRanking;
}

export const sensorService = {
  async getSensorReadings(): Promise<{ sensors: SensorReading[] }> {
    const response = await api.get('/sensors/readings');
    return response.data;
  },

  async getComplianceScore(): Promise<ComplianceScore> {
    const response = await api.get('/sensors/compliance');
    return response.data;
  },

  async getBusinessRanking(limit: number = 10): Promise<RankingResponse> {
    const response = await api.get('/sensors/compliance/ranking', {
      params: { limit },
    });
    return response.data;
  },

  async getRecommendations(): Promise<{
    recommendations: Array<{
      tracking_id: number;
      climate_event: string;
      recommendation_text: string;
      status: string;
      risk_level: string;
      created_at: string | null;
      updated_at: string | null;
    }>;
  }> {
    const response = await api.get('/sensors/recommendations');
    return response.data;
  },
};
