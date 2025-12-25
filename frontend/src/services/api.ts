/*
 * @Author: chunshengwu
 * @Date: 2025-12-22 00:37:41
 * @LastEditors: chunshengwu
 * @LastEditTime: 2025-12-22 15:20:52
 * @FilePath: /drug_serve2/frontend/src/services/api.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import type { RecognizeRequest, RecognizeResponse, HistoryResponse, HistoryRecord, DrugInfo } from '../types';

// 边缘函数API基础URL（实际部署时需要配置）
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export async function recognizeDrug(images: Array<{ base64: string; name: string; type: string }>): Promise<RecognizeResponse> {
  const requestData: RecognizeRequest = { images };
  return request<RecognizeResponse>('/recognize', {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
}

export async function getHistory(page: number = 1, limit: number = 20, search: string = ''): Promise<HistoryResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });
  
  if (search) {
    params.append('search', search);
  }
  
  return request<HistoryResponse>(`/history?${params.toString()}`, {
    method: 'GET'
  });
}

export async function getRecordDetail(id: string): Promise<{ success: boolean; data?: HistoryRecord; error?: string }> {
  return request<{ success: boolean; data?: HistoryRecord; error?: string }>(`/history/${id}`, {
    method: 'GET'
  });
}

export async function saveDrug(drugInfo: DrugInfo, recordId?: string): Promise<{ success: boolean; error?: string }> {
  return request<{ success: boolean; error?: string }>('/drugs/save', {
    method: 'POST',
    body: JSON.stringify({ drugInfo, recordId })
  });
}

