import type { ComplianceResult } from '../types/api';

export interface StreamingUpdate {
  status: 'starting' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  result?: ComplianceResult;
}
export type StreamingCallback = (update: StreamingUpdate) => void;

class StreamingService {
  async streamPolicyAnalysis(file: any, analysisMode: 'fast' | 'balanced' | 'detailed' = 'fast', onUpdate: StreamingCallback): Promise<ComplianceResult> {
    // TODO: Implement streaming for React Native
    return Promise.resolve({} as ComplianceResult);
  }
}

const streamingService = new StreamingService();
export default streamingService;
