import { api } from './api';

export interface BusinessPortfolioItem {
  business_id: number;
  business_name: string;
  store_type: string;
  city: string;
  compliance_score: number;
  rank_level: string;
  risk_level: string;
  notes_count: number;
  claims_count: number;
  last_updated: string;
}

export interface BusinessNote {
  note_id: number;
  business_id: number;
  business_name: string;
  note_text: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface Policy {
  policy_id: number;
  business_id: number | null;
  business_name: string | null;
  store_type: string | null;
  compliance_threshold: number;
  requirements: Record<string, any> | null;
}

export interface RiskAssessment {
  assessment_id: number;
  assessment_date: string;
  compliance_score: number;
  risk_level: string;
  risk_factors: string[];
  recommendations: string | null;
}

export const insuranceService = {
  async getPortfolio(params?: {
    risk_level?: string;
    store_type?: string;
    min_score?: number;
    max_score?: number;
  }): Promise<{ businesses: BusinessPortfolioItem[]; total: number }> {
    const response = await api.get('/insurance/portfolio', { params });
    return response.data;
  },

  async createNote(business_id: number, note_text: string): Promise<BusinessNote> {
    const response = await api.post('/insurance/notes', { business_id, note_text });
    return response.data;
  },

  async getBusinessNotes(business_id: number): Promise<{ notes: BusinessNote[] }> {
    const response = await api.get(`/insurance/notes/${business_id}`);
    return response.data;
  },

  async deleteNote(note_id: number): Promise<void> {
    await api.delete(`/insurance/notes/${note_id}`);
  },

  async getPolicies(business_id?: number): Promise<Policy[]> {
    const response = await api.get('/insurance/policies', {
      params: business_id ? { business_id } : {},
    });
    return response.data;
  },

  async createPolicy(data: {
    business_id?: number;
    store_type?: string;
    compliance_threshold: number;
    requirements?: Record<string, any>;
  }): Promise<Policy> {
    const response = await api.post('/insurance/policies', data);
    return response.data;
  },

  async createRiskAssessment(data: {
    business_id: number;
    risk_level: string;
    risk_factors?: string[];
    recommendations?: string;
  }): Promise<RiskAssessment & { business_id: number; business_name: string }> {
    const response = await api.post('/insurance/risk-assessments', data);
    return response.data;
  },

  async getBusinessRiskAssessments(business_id: number): Promise<{ assessments: RiskAssessment[] }> {
    const response = await api.get(`/insurance/risk-assessments/${business_id}`);
    return response.data;
  },

};
