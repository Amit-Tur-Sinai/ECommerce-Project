import { api } from './api';

export interface RegisterData {
  email: string;
  password: string;
  role: string; // "Business" or "Insurance"
  business_name?: string;
  store_type?: string;
  city?: string;
  industry?: string;
  size?: string;
  insurance_company_id?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  user_id: number;
  email: string;
  role: string;
  business_id: number;
  business_name?: string;
  store_type?: string;
  city?: string;
  insurance_company_id?: number;
  insurance_company_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  async deleteAccount(): Promise<void> {
    const response = await api.delete('/users/account');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },
};
