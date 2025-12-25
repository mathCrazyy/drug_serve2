export interface DrugInfo {
  name: string;
  brand: string;
  manufacturer: string;
  production_date: string;
  expiry_date: string;
  batch_number: string;
  dosage_form: string;
  strength: string;
  // 新增字段
  category?: string; // 药品分类：感冒、发烧、止痛等
  edited?: boolean; // 是否被编辑过
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
  // 新增字段
  saved?: boolean; // 是否已保存到家庭药品清单
  category?: string; // 药品分类
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

// 药品统计信息
export interface DrugStatistics {
  total: number;
  expiring: number; // 临期药品数量（30天内过期）
  expired: number; // 过期药品数量
  byCategory: Record<string, number>; // 按分类统计
}

// 保存药品请求
export interface SaveDrugRequest {
  drugInfo: DrugInfo;
  recordId?: string; // 如果是更新已有记录
}

