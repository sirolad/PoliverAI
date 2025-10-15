// Minimal API service for React Native/Nx
const API_BASE_URL = '';

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

class ApiService {
  private baseUrl: string;
  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }
  private getAuthHeaders(): Record<string, string> {
    // TODO: Integrate with Nx store
    return {};
  }
  async get<T>(url: string): Promise<T> {
    const response = await fetch(this.baseUrl + url, { headers: this.getAuthHeaders() });
    if (!response.ok) throw new Error('API error');
    return response.json();
  }
  async post<T>(url: string, body: any): Promise<T> {
    const response = await fetch(this.baseUrl + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.getAuthHeaders() },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('API error');
    return response.json();
  }
}

const apiService = new ApiService();
export default apiService;
