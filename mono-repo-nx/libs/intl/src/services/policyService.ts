import apiService from './api';
import type { ComplianceResult } from '../types/api';

export type AnalysisMode = 'fast' | 'balanced' | 'detailed';


class PolicyService {
  async analyzePolicy(file: any, analysisMode: AnalysisMode = 'fast'): Promise<ComplianceResult> {
    // TODO: Implement file upload for React Native
    return Promise.resolve({} as ComplianceResult);
  }

  async getUserReports(opts?: { page?: number; limit?: number; date_from?: string | null; date_to?: string | null }): Promise<{ reports?: any[]; total?: number; total_pages?: number; page?: number; limit?: number }> {
    // Backend route is mounted at /api/v1 and defines GET /user-reports
    let url = '/api/v1/user-reports';
    const qs: string[] = [];
    if (opts?.page && opts?.limit) qs.push(`page=${opts.page}`, `limit=${opts.limit}`);
    if (opts?.date_from) qs.push(`date_from=${encodeURIComponent(opts.date_from)}`);
    if (opts?.date_to) qs.push(`date_to=${encodeURIComponent(opts.date_to)}`);
    if (qs.length) url += `?${qs.join('&')}`;
    return apiService.get<{ reports?: any[]; total?: number; total_pages?: number; page?: number; limit?: number }>(url);
  }
}

const policyService = new PolicyService();
export default policyService;
