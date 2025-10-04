import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  QueryRequest, 
  QueryResponse, 
  TokenValidationRequest, 
  TokenValidationResponse, 
  HealthResponse
} from '@/types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor (no auth needed - backend handles it internally)
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('api_token');
          localStorage.removeItem('token_valid');
        }
        return Promise.reject(error);
      }
    );
  }

  async askQuestion(query: string): Promise<QueryResponse> {
    try {
      const request: QueryRequest = { query, max_tokens: 600 };
      const response: AxiosResponse<QueryResponse> = await this.client.post('/ask', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Authentication failed. Please check your token.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - API took too long to respond');
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Connection error - Could not connect to API');
        }
        throw new Error(`API error: ${error.response?.status} - ${error.response?.data?.detail || error.message}`);
      }
      throw new Error(`Unexpected error: ${error}`);
    }
  }

  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      const request: TokenValidationRequest = { token };
      const response: AxiosResponse<TokenValidationResponse> = await this.client.post('/validate-token', request);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          return { valid: false, message: 'Request timeout' };
        }
        if (error.code === 'ECONNREFUSED') {
          return { valid: false, message: 'Connection error' };
        }
        return { 
          valid: false, 
          message: `Server error: ${error.response?.status || 'Unknown error'}` 
        };
      }
      return { valid: false, message: `Error: ${error}` };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response: AxiosResponse<HealthResponse> = await this.client.get('/healthz', { timeout: 5000 });
      return response.data.ok;
    } catch (error) {
      return false;
    }
  }

  setBaseURL(url: string): void {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;

