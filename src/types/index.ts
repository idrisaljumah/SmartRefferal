// Core domain types

export interface ReferralOutput {
  id: string;
  timestamp: number;
  specialty: string;
  reason: string;
  acuteness: 'routine' | 'urgent' | 'emergency';
  timeframe: string;
  duration: string;
  clinicalSummary: string;
  attachments: string[];
  confidence: number;
  modelUsed: string;
  language: 'en' | 'ar';
}

export interface ModelMetadata {
  id: string;
  name: string;
  type: 'llm' | 'stt';
  version: string;
  size: number;
  quantization: string;
  capabilities: string[];
  license: string;
  redistributable: boolean;
  checksum: string;
  signature?: string;
  url?: string;
  isSeed: boolean;
}

export interface ModelManifest {
  version: string;
  models: ModelMetadata[];
  lastUpdated: number;
}

export interface DeviceCapabilities {
  hasWebAssembly: boolean;
  hasWebGPU: boolean;
  availableMemoryGB: number;
  cpuCores: number;
  isMobile: boolean;
  recommendedModel: string;
}

export interface InferenceRequest {
  input: string;
  language: 'en' | 'ar';
  modelId?: string;
  maxTokens?: number;
}

export interface InferenceResponse {
  output: ReferralOutput;
  tokensUsed: number;
  inferenceTimeMs: number;
  modelUsed: string;
}

export interface STTRequest {
  audioBlob: Blob;
  language: 'en' | 'ar';
  modelId?: string;
}

export interface STTResponse {
  transcription: string;
  confidence: number;
  language: string;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

export interface DownloadProgress {
  modelId: string;
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  status: 'pending' | 'downloading' | 'verifying' | 'complete' | 'error';
  error?: string;
}

export interface EncryptedData {
  iv: string;
  data: string;
  salt: string;
}

// FHIR ReferralRequest (simplified)
export interface FHIRReferralRequest {
  resourceType: 'ReferralRequest';
  id: string;
  status: 'draft' | 'active' | 'completed';
  intent: 'proposal' | 'plan' | 'order';
  priority: 'routine' | 'urgent' | 'asap' | 'stat';
  subject: {
    reference: string;
  };
  occurrencePeriod?: {
    start: string;
    end: string;
  };
  authoredOn: string;
  reasonCode?: Array<{
    text: string;
  }>;
  description?: string;
  supportingInfo?: Array<{
    reference: string;
  }>;
}