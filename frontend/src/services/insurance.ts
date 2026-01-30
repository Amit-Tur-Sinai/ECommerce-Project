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

export interface Claim {
  claim_id: number;
  business_id: number;
  business_name: string;
  claim_number: string;
  claim_amount: number;
  status: string;
  description: string;
  incident_date: string;
  filed_date: string;
  compliance_score_at_incident: number | null;
  risk_assessment_id: number | null;
}

export interface Policy {
  policy_id: number;
  business_id: number | null;
  business_name: string | null;
  store_type: string | null;
  compliance_threshold: number;
  requirements: Record<string, any> | null;
  alert_enabled: boolean;
  alert_threshold: number;
}

export interface RiskAssessment {
  assessment_id: number;
  assessment_date: string;
  compliance_score: number;
  risk_level: string;
  risk_factors: string[];
  recommendations: string | null;
}

export interface BusinessComparison {
  business_id: number;
  business_name: string;
  store_type: string;
  city: string;
  current_score: number;
  rank_level: string;
  recommendations_followed: number;
  recommendations_total: number;
  trend: Array<{ date: string; score: number }>;
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

  async getClaims(params?: { business_id?: number; status?: string }): Promise<Claim[]> {
    const response = await api.get('/insurance/claims', { params });
    return response.data;
  },

  async createClaim(data: {
    business_id: number;
    claim_amount: number;
    description: string;
    incident_date: string;
  }): Promise<Claim> {
    const response = await api.post('/insurance/claims', data);
    return response.data;
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
    alert_enabled: boolean;
    alert_threshold: number;
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

  async compareBusinesses(business_ids: number[]): Promise<{ comparison: BusinessComparison[] }> {
    const response = await api.get('/insurance/compare', {
      params: { business_ids: business_ids.join(',') },
    });
    return response.data;
  },
};
