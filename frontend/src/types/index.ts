export interface DrugInfo {
  name: string;
  brand: string;
  manufacturer: string;
  production_date: string;
  expiry_date: string;
  batch_number: string;
  dosage_form: string;
  strength: string;
}

export interface RecognitionResult {
  imageIndex: number;
  rawText: string;
  extractedData: DrugInfo;
}

export interface ImageInfo {
  name: string;
  size: number;
  type: string;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  images: ImageInfo[];
  recognitionResults: RecognitionResult[];
  mergedData: DrugInfo;
  status: 'processing' | 'completed' | 'failed';
}

export interface RecognizeRequest {
  images: Array<{
    base64: string;
    name: string;
    type: string;
  }>;
}

export interface RecognizeResponse {
  success: boolean;
  data?: {
    id: string;
    mergedData: DrugInfo;
    recognitionResults: RecognitionResult[];
    timestamp: number;
  };
  error?: string;
}

export interface HistoryResponse {
  success: boolean;
  data?: {
    records: HistoryRecord[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

