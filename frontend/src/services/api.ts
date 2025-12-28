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

// 调试：输出API_BASE_URL（仅在开发环境）
if (import.meta.env.DEV) {
  console.log('[API] VITE_API_BASE_URL:', API_BASE_URL);
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // 构建完整的请求URL
  const fullUrl = API_BASE_URL ? `${API_BASE_URL}${url}` : url;
  
  // 计算请求体大小（用于调试）
  let requestBodySize = 0;
  if (options?.body) {
    if (typeof options.body === 'string') {
      requestBodySize = new Blob([options.body]).size;
    } else if (options.body instanceof Blob) {
      requestBodySize = options.body.size;
    } else if (options.body instanceof FormData) {
      // FormData 没有 size 属性，跳过大小计算
      requestBodySize = 0;
    }
  }
  
  // 调试：输出请求信息
  console.log('[API] 请求URL:', fullUrl);
  if (requestBodySize > 0) {
    console.log(`[API] 请求体大小: ${(requestBodySize / 1024).toFixed(2)}KB`);
    if (requestBodySize > 200 * 1024) {
      console.warn(`[API] ⚠️ 请求体较大(${(requestBodySize / 1024).toFixed(2)}KB)，可能导致超时`);
    }
  }
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '无法读取错误信息');
      
      // 特殊处理504超时错误
      if (response.status === 504) {
        throw new Error(`网关超时(504): 边缘函数执行时间过长。建议：
1. 检查边缘函数超时设置（建议≥90秒）
2. 减少图片数量或大小
3. 查看边缘函数日志确认具体超时位置`);
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response.json();
  } catch (e) {
    // 改进错误信息
    if (e instanceof TypeError && e.message.includes('Failed to fetch')) {
      throw new Error(`网络请求失败: 无法连接到服务器。请检查：
1. API地址是否正确: ${fullUrl}
2. 边缘函数是否正常运行
3. 网络连接是否正常`);
    }
    throw e;
  }
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

