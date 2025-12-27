// 药品识别边缘函数 - 修复版本（兼容ESA环境）

// ========== 配置 ==========
// 在ESA边缘函数中，环境变量可能通过不同的方式访问
// 如果 process.env 不可用，请使用控制台配置的环境变量
function getEnv(key, defaultValue) {
  // 尝试多种方式获取环境变量
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  // 临时方案：如果环境变量未配置，使用代码中的默认值
  // ⚠️ 注意：生产环境建议在控制台配置环境变量，而不是在代码中硬编码
  const hardcodedDefaults = {
    'EDGE_KV_NAMESPACE': 'drug-storage',  // 临时默认值，建议在控制台配置
    'DOUBAO_API_BASE_URL': 'https://api.chatfire.site/v1/chat/completions',
    'DOUBAO_API_KEY': 'sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid',
    'DOUBAO_MODEL': 'doubao-seed-1-6-vision-250815',
    'DOUBAO_MAX_TOKENS': '1000',
    'DOUBAO_TEMPERATURE': '0.1',
    'STORAGE_PREFIX': 'drug_record:',
    'STORAGE_INDEX_PREFIX': 'drug_index:'
  };
  
  // 如果环境变量未配置，使用硬编码的默认值
  if (hardcodedDefaults.hasOwnProperty(key)) {
    return hardcodedDefaults[key];
  }
  
  // 如果 process 不可用，返回默认值（需要在控制台配置环境变量）
  return defaultValue;
}

const config = {
  doubaoApi: {
    baseUrl: getEnv('DOUBAO_API_BASE_URL', 'https://api.chatfire.site/v1/chat/completions'),
    apiKey: getEnv('DOUBAO_API_KEY', 'sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid'),
    model: getEnv('DOUBAO_MODEL', 'doubao-seed-1-6-vision-250815'),
    maxTokens: parseInt(getEnv('DOUBAO_MAX_TOKENS', '1000')),
    temperature: parseFloat(getEnv('DOUBAO_TEMPERATURE', '0.1'))
  },
  storage: {
    prefix: getEnv('STORAGE_PREFIX', 'drug_record:'),
    indexPrefix: getEnv('STORAGE_INDEX_PREFIX', 'drug_index:')
  }
};

// ========== 工具函数 ==========

// 生成唯一ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 标准化日期
function normalizeDate(dateStr) {
  try {
    dateStr = dateStr.replace('年', '-').replace('月', '-').replace('日', '');
    dateStr = dateStr.replace(/\//g, '-');
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    } else if (parts.length === 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      if (year && month) {
        return `${year}-${String(month).padStart(2, '0')}-01`;
      }
    } else if (parts.length === 1) {
      const year = parseInt(parts[0]);
      if (year) {
        return `${year}-01-01`;
      }
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

// 解析SSE响应
function parseSseResponse(responseText) {
  const contentParts = [];
  const lines = responseText.trim().split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('data: ')) {
      const jsonStr = trimmedLine.substring(6);
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          const chunk = JSON.parse(jsonStr);
          if (chunk.choices && chunk.choices.length > 0) {
            const delta = chunk.choices[0].delta || {};
            if (delta.content) {
              contentParts.push(delta.content);
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  return contentParts.join('');
}

// 使用正则表达式提取药品信息
function extractWithRegex(text) {
  const drugInfo = {
    name: '', brand: '', manufacturer: '', production_date: '',
    expiry_date: '', batch_number: '', dosage_form: '', strength: ''
  };
  
  // 提取药品名称
  const namePatterns = [
    /药品名称[：:]\s*([^\n\r]+)/i,
    /通用名[：:]\s*([^\n\r]+)/i,
    /商品名[：:]\s*([^\n\r]+)/i,
    /^([^0-9\n\r]{2,20})\s*[片胶囊粒]/,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.name = match[1].trim(); break; }
  }
  
  // 提取生产日期
  const datePatterns = [
    /生产日期[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /生产[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)\s*生产/i,
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.production_date = normalizeDate(match[1]); break; }
  }
  
  // 提取有效期
  const expiryPatterns = [
    /有效期[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /有效期至[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)\s*前使用/i,
  ];
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.expiry_date = normalizeDate(match[1]); break; }
  }
  
  // 提取批号
  const batchPatterns = [
    /批号[：:]\s*([A-Za-z0-9]+)/i,
    /生产批号[：:]\s*([A-Za-z0-9]+)/i,
    /批号\s*([A-Za-z0-9]+)/i,
  ];
  for (const pattern of batchPatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.batch_number = match[1].trim(); break; }
  }
  
  // 提取生产厂家
  const manufacturerPatterns = [
    /生产厂家[：:]\s*([^\n\r]+)/i,
    /生产企业[：:]\s*([^\n\r]+)/i,
    /制造商[：:]\s*([^\n\r]+)/i,
  ];
  for (const pattern of manufacturerPatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.manufacturer = match[1].trim(); break; }
  }
  
  // 提取剂型
  const dosagePatterns = [
    /([片胶囊粒支瓶袋]剂?)/,
    /剂型[：:]\s*([^\n\r]+)/i,
  ];
  for (const pattern of dosagePatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.dosage_form = match[1].trim(); break; }
  }
  
  // 提取规格/强度
  const strengthPatterns = [
    /(\d+mg)/i,
    /(\d+\.?\d*[mg]?[g]?)/i,
    /规格[：:]\s*([^\n\r]+)/i,
  ];
  for (const pattern of strengthPatterns) {
    const match = text.match(pattern);
    if (match) { drugInfo.strength = match[1].trim(); break; }
  }
  
  return drugInfo;
}

// 解析药品信息
function parseDrugInfo(text) {
  const drugInfo = {
    name: '', brand: '', manufacturer: '', production_date: '',
    expiry_date: '', batch_number: '', dosage_form: '', strength: ''
  };
  
  try {
    if (!text) return drugInfo;
    if (typeof text !== 'string') text = String(text);
    
    // 清理文本：移除markdown代码块标记和其他格式
    text = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^[\s\n]*/, '')
      .replace(/[\s\n]*$/, '')
      .trim();
    
    // 尝试解析JSON格式
    let jsonData = null;
    if (text.includes('{')) {
      try {
        // 尝试提取JSON部分（可能包含其他文本）
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[0]);
        } else if (text.trim().startsWith('{')) {
          // 直接解析整个文本
          jsonData = JSON.parse(text);
        }
      } catch (e) {
        // JSON解析失败，继续
      }
    }
    
    // 如果成功解析JSON，使用JSON数据
    if (jsonData && typeof jsonData === 'object') {
      for (const key in drugInfo) {
        if (jsonData.hasOwnProperty(key)) {
          const value = String(jsonData[key] || '').trim();
          // 只过滤明确的无效值，保留其他所有值（包括"无"可能是真实值）
          if (value && value !== 'null' && value !== 'undefined') {
            drugInfo[key] = value;
          }
        }
      }
    }
    
    // 使用正则表达式提取（补充JSON中可能缺失的字段）
    const regexResult = extractWithRegex(text);
    for (const key in regexResult) {
      // 如果JSON中没有该字段，或者JSON中的值为空，使用正则提取的值
      if (regexResult[key] && (!drugInfo[key] || drugInfo[key].trim() === '')) {
        drugInfo[key] = regexResult[key];
      }
    }
    
    return drugInfo;
  } catch (e) {
    // 出错时至少尝试正则表达式
    try {
      return extractWithRegex(text || '');
    } catch (e2) {
      return drugInfo;
    }
  }
}

// ========== 豆包API调用 ==========
async function recognizeDrugFromImage(imageBase64, retryCount = 0) {
  const maxRetries = 2;
  const headers = {
    'Authorization': `Bearer ${config.doubaoApi.apiKey}`,
    'Content-Type': 'application/json'
  };
  
  // 检查base64数据大小（大约估算：base64比原始数据大约33%）
  const base64Size = imageBase64 ? imageBase64.length : 0;
  const estimatedSizeMB = (base64Size * 3 / 4) / (1024 * 1024);
  
  // 降低大小限制，避免超时（从5MB降低到2MB）
  if (estimatedSizeMB > 2) {
    return { 
      success: false, 
      error: `图片过大（约${estimatedSizeMB.toFixed(2)}MB），请压缩后重试（建议小于2MB）`, 
      raw_text: '', 
      extracted_data: {} 
    };
  }
  
  const payload = {
    model: config.doubaoApi.model,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请识别这张药品图片中的以下信息：1.药品名称 2.生产日期 3.截止日期（有效期）。请严格按照JSON格式返回，只返回JSON对象，不要添加任何其他文字说明。格式：{"name": "药品名称", "production_date": "生产日期", "expiry_date": "截止日期"}。如果某个字段找不到，返回空字符串""。'
        },
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
        }
      ]
    }],
    max_tokens: 500, // 减少token数量，只识别3个字段
    temperature: config.doubaoApi.temperature
  };
  
  try {
    // 添加超时控制（60秒，因为图片识别可能需要更长时间）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    let response;
    try {
      response = await fetch(config.doubaoApi.baseUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          // 超时，如果还有重试次数，则重试
          if (retryCount < maxRetries) {
            // 等待2秒后重试
            await new Promise(resolve => setTimeout(resolve, 2000));
            return recognizeDrugFromImage(imageBase64, retryCount + 1);
          }
          return { success: false, error: '请求超时（60秒），请稍后重试', raw_text: '', extracted_data: {} };
        }
      throw fetchError;
    }
    
    if (response.status === 200) {
      let content = '';
      try {
        // 简化逻辑：统一使用text()方法读取响应（参考Python脚本的做法）
        // Python脚本使用response.text直接读取，即使对于SSE流式响应也是如此
        let responseText = '';
        let result = null;
        
        // 记录开始读取时间
        const readStartTime = Date.now();
        
        try {
          // 先读取为文本，添加超时保护
          const readTimeout = 45000; // 45秒读取超时
          const readPromise = response.text();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('读取响应超时（45秒）')), readTimeout);
          });
          
          responseText = await Promise.race([readPromise, timeoutPromise]);
          
          const readDuration = Date.now() - readStartTime;
          // 记录读取耗时（用于调试）
          if (readDuration > 10000) {
            console.log(`警告：响应读取耗时 ${readDuration}ms`);
          }
        } catch (textError) {
          // 如果text()失败，说明连接有问题
          const errorMsg = textError.message;
          
          // 检查是否是连接相关错误
          if (errorMsg.includes('connection') || errorMsg.includes('ECONNRESET') || errorMsg.includes('timeout')) {
            // 连接错误，如果还有重试次数，则重试
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              return recognizeDrugFromImage(imageBase64, retryCount + 1);
            }
          }
          
          throw new Error(`读取响应失败: ${errorMsg}`);
        }
        
        if (!responseText || responseText.trim() === '') {
          return { 
            success: false, 
            error: 'API返回空响应', 
            raw_text: '', 
            extracted_data: {} 
          };
        }
        
        // 检查是否是SSE流式响应
        const contentType = response.headers.get('Content-Type') || '';
        const isStream = contentType.includes('text/event-stream') || contentType.includes('event-stream') || responseText.includes('data: ');
        
        if (isStream) {
          // SSE流式响应：解析SSE格式
          content = parseSseResponse(responseText);
        } else {
          // 普通JSON响应：解析JSON
          try {
            result = JSON.parse(responseText);
          } catch (jsonError) {
            // JSON解析失败，尝试作为SSE格式解析（有些API可能返回SSE但Content-Type不正确）
            content = parseSseResponse(responseText);
            if (!content || content.trim() === '') {
              throw new Error(`JSON解析失败: ${jsonError.message}`);
            }
          }
          
          // 处理JSON响应
          if (result) {
            if (!result.choices || result.choices.length === 0) {
              return { success: false, error: '响应格式不正确：choices数组为空', raw_text: responseText, extracted_data: {} };
            }
            const choice = result.choices[0];
            if (choice.message && choice.message.content) {
              content = choice.message.content;
            } else if (choice.delta && choice.delta.content) {
              content = choice.delta.content;
            } else {
              return { success: false, error: '响应格式不正确：缺少content字段', raw_text: responseText, extracted_data: {} };
            }
          }
        }
        
        if (!content || content.trim() === '') {
          return { 
            success: false, 
            error: 'API返回内容为空', 
            raw_text: responseText.substring(0, 500), 
            extracted_data: {} 
          };
        }
        
        return { success: true, raw_text: content, extracted_data: {}, confidence: 'high' };
      } catch (parseError) {
        // 解析响应失败，检查错误类型
        const errorMsg = parseError.message;
        const isConnectionError = errorMsg.includes('connection') || 
                                 errorMsg.includes('ECONNRESET') || 
                                 errorMsg.includes('timeout') ||
                                 errorMsg.includes('读取响应失败');
        
        // 如果是连接错误且还有重试次数，则重试
        if (isConnectionError && retryCount < maxRetries) {
          // 等待2秒后重试
          await new Promise(resolve => setTimeout(resolve, 2000));
          return recognizeDrugFromImage(imageBase64, retryCount + 1);
        }
        
        return { 
          success: false, 
          error: `解析响应失败: ${errorMsg}${retryCount >= maxRetries ? '（已重试' + maxRetries + '次）' : ''}`, 
          raw_text: '', 
          extracted_data: {} 
        };
      }
    } else {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `HTTP ${response.status}`;
      }
      
      // 如果是5xx错误且还有重试次数，则重试
      if (response.status >= 500 && retryCount < maxRetries) {
        // 等待1秒后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        return recognizeDrugFromImage(imageBase64, retryCount + 1);
      }
      
      return { 
        success: false, 
        error: `API请求失败: ${response.status} ${errorText.substring(0, 200)}`, 
        raw_text: errorText, 
        extracted_data: {} 
      };
    }
  } catch (e) {
    // 网络错误，如果还有重试次数，则重试
    if (retryCount < maxRetries && (e.message.includes('connection') || e.message.includes('network'))) {
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      return recognizeDrugFromImage(imageBase64, retryCount + 1);
    }
    
    return { 
      success: false, 
      error: `网络请求异常: ${e.message}`, 
      raw_text: '', 
      extracted_data: {} 
    };
  }
}

// ========== 边缘存储操作 ==========
// 阿里云ESA边缘存储API封装
// 支持多种可能的API实现方式

// 尝试获取边缘存储对象（根据ESA实际提供的API调整）
function getEdgeStorage() {
  // 方式1: ESA EdgeKV API（推荐）
  // 根据官方文档：https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api
  // 需要先创建NameSpace，然后通过 EdgeKV 类使用
  const edgeKvNamespace = getEnv('EDGE_KV_NAMESPACE', '');
  if (edgeKvNamespace) {
    try {
      // 尝试多种方式访问 EdgeKV
      let EdgeKVClass = null;
      
      // 方式1.1: 全局 EdgeKV 类
      if (typeof EdgeKV !== 'undefined') {
        EdgeKVClass = EdgeKV;
      }
      // 方式1.2: 通过 globalThis 访问
      else if (typeof globalThis !== 'undefined' && globalThis.EdgeKV) {
        EdgeKVClass = globalThis.EdgeKV;
      }
      // 方式1.3: 通过 self 访问（Worker环境）
      else if (typeof self !== 'undefined' && self.EdgeKV) {
        EdgeKVClass = self.EdgeKV;
      }
      
      if (EdgeKVClass) {
        const edgeKv = new EdgeKVClass({ namespace: edgeKvNamespace });
        console.log(`[getEdgeStorage] 使用EdgeKV API, namespace: ${edgeKvNamespace}`);
        
        return {
          async set(key, value) {
            try {
              await edgeKv.put(key, value);
            } catch (e) {
              console.error(`[EdgeKV] put失败, key: ${key}`, e);
              throw e;
            }
          },
          async get(key) {
            try {
              const result = await edgeKv.get(key, { type: 'text' });
              return result || null;
            } catch (e) {
              // 如果key不存在，EdgeKV可能抛出异常，返回null
              if (e.message && e.message.includes('not found')) {
                return null;
              }
              console.error(`[EdgeKV] get失败, key: ${key}`, e);
              return null;
            }
          },
          async delete(key) {
            try {
              await edgeKv.delete(key);
            } catch (e) {
              console.error(`[EdgeKV] delete失败, key: ${key}`, e);
              throw e;
            }
          },
          async list(prefix) {
            try {
              // EdgeKV list方法可能支持prefix参数
              // 根据官方文档，list方法可能返回 { keys: string[] }
              const result = await edgeKv.list({ prefix: prefix });
              if (result && Array.isArray(result.keys)) {
                return result.keys;
              } else if (Array.isArray(result)) {
                // 如果直接返回数组
                return result.filter(key => key.startsWith(prefix));
              }
              return [];
            } catch (e) {
              // 如果不支持list或list失败，返回空数组
              console.warn(`[EdgeKV] list方法不可用或失败, prefix: ${prefix}`, e);
              return [];
            }
          }
        };
      } else {
        console.warn(`[getEdgeStorage] EdgeKV类不可用，namespace已配置: ${edgeKvNamespace}`);
      }
    } catch (e) {
      console.warn('EdgeKV初始化失败，尝试其他方式:', e);
    }
  }
  
  // 方式2: 全局edgeStorage对象
  if (typeof edgeStorage !== 'undefined' && edgeStorage) {
    return edgeStorage;
  }
  
  // 方式3: 通过globalThis访问
  if (typeof globalThis !== 'undefined' && globalThis.edgeStorage) {
    return globalThis.edgeStorage;
  }
  
  // 方式4: 通过fetch调用存储API（如果ESA提供HTTP API）
  // 这种方式需要知道存储API的endpoint
  const storageEndpoint = getEnv('EDGE_STORAGE_ENDPOINT', '');
  if (storageEndpoint) {
    return {
      async set(key, value) {
        await fetch(`${storageEndpoint}/set`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
      },
      async get(key) {
        const res = await fetch(`${storageEndpoint}/get?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        return data.value || null;
      },
      async delete(key) {
        await fetch(`${storageEndpoint}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key })
        });
      },
      async list(prefix) {
        const res = await fetch(`${storageEndpoint}/list?prefix=${encodeURIComponent(prefix)}`);
        const data = await res.json();
        return data.keys || [];
      }
    };
  }
  
  // 方式5: 使用内存存储作为后备（仅用于测试）
  // 如果以上方式都不可用，使用内存存储（数据不会持久化）
  // ⚠️ 警告：内存存储在函数重启后会丢失，仅用于测试
  console.error('⚠️ 严重警告：使用内存存储（数据不会持久化）！');
  console.error('请配置 EDGE_KV_NAMESPACE 环境变量以使用真正的EdgeKV存储');
  console.error('当前配置的namespace:', getEnv('EDGE_KV_NAMESPACE', '未配置'));
  
  if (!globalThis._memoryStorage) {
    globalThis._memoryStorage = new Map();
  }
  return {
    async set(key, value) {
      globalThis._memoryStorage.set(key, value);
      console.warn(`[内存存储] set: ${key}`);
    },
    async get(key) {
      const value = globalThis._memoryStorage.get(key) || null;
      console.warn(`[内存存储] get: ${key}, 存在: ${value !== null}`);
      return value;
    },
    async delete(key) {
      globalThis._memoryStorage.delete(key);
      console.warn(`[内存存储] delete: ${key}`);
    },
    async list(prefix) {
      const keys = [];
      for (const key of globalThis._memoryStorage.keys()) {
        if (key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      console.warn(`[内存存储] list: prefix=${prefix}, 找到${keys.length}个key`);
      return keys;
    }
  };
}

async function saveRecord(record) {
  const id = record.id || generateId();
  const timestamp = record.timestamp || Date.now();
  const recordKey = `${config.storage.prefix}${timestamp}:${id}`;
  
  const storage = getEdgeStorage();
  const recordStr = JSON.stringify(record);
  
  try {
    // 保存主记录
    await storage.set(recordKey, recordStr);
    
    // 保存索引（用于查询）
    const indexKey = `${config.storage.indexPrefix}all:${timestamp}:${id}`;
    await storage.set(indexKey, id);
    
    // 如果已保存到家庭药品清单，也保存一份
    if (record.saved) {
      const drugKey = `${config.storage.prefix}drug:${id}`;
      await storage.set(drugKey, recordStr);
      
      // 保存到药品清单索引
      const drugIndexKey = `${config.storage.indexPrefix}drugs:${timestamp}:${id}`;
      await storage.set(drugIndexKey, id);
    }
  } catch (e) {
    console.error('保存记录失败:', e);
    // 如果存储失败，仍然返回ID（允许继续处理）
  }
  
  return { id, key: recordKey };
}

async function getRecord(id) {
  const storage = getEdgeStorage();
  
  try {
    // 方式1: 尝试通过索引查找
    const indexPrefix = `${config.storage.indexPrefix}all:`;
    const keys = await storage.list(indexPrefix);
    
    for (const indexKey of keys) {
      const recordId = await storage.get(indexKey);
      if (recordId === id) {
        // 找到对应的记录key
        const recordKey = indexKey.replace(config.storage.indexPrefix + 'all:', config.storage.prefix);
        const recordStr = await storage.get(recordKey);
        if (recordStr) {
          return JSON.parse(recordStr);
        }
      }
    }
    
    // 方式2: 直接查找所有可能的key
    const allKeys = await storage.list(config.storage.prefix);
    for (const key of allKeys) {
      if (key.includes(`:${id}`) && !key.includes('index')) {
        const recordStr = await storage.get(key);
        if (recordStr) {
          try {
            return JSON.parse(recordStr);
          } catch (e) {
            continue;
          }
        }
      }
    }
  } catch (e) {
    console.error('获取记录失败:', e);
  }
  
  return null;
}

async function getHistoryRecords(page = 1, limit = 20, search = '') {
  const storage = getEdgeStorage();
  const allRecords = [];
  const seenIds = new Set(); // 避免重复记录
  
  try {
    // 优先查询药品清单专用的key（drug:开头的），避免查询到重复数据
    const drugPrefix = `${config.storage.prefix}drug:`;
    
    // 尝试多种查询方式
    let drugKeys = [];
    
    // 方式1: 尝试查询drug:前缀的key
    try {
      drugKeys = await storage.list(drugPrefix);
      console.log(`[getHistoryRecords] 方式1: 找到 ${drugKeys.length} 个药品清单key (drug:开头)`);
    } catch (e) {
      console.warn(`[getHistoryRecords] 方式1失败，尝试方式2:`, e);
    }
    
    // 方式2: 如果方式1失败或返回空，尝试查询所有drug_record:开头的key，然后过滤
    if (drugKeys.length === 0) {
      try {
        const allKeys = await storage.list(config.storage.prefix);
        drugKeys = allKeys.filter(key => 
          key.startsWith(drugPrefix) && !key.includes('index')
        );
        console.log(`[getHistoryRecords] 方式2: 从 ${allKeys.length} 个key中过滤出 ${drugKeys.length} 个药品清单key`);
      } catch (e) {
        console.warn(`[getHistoryRecords] 方式2失败:`, e);
      }
    }
    
    // 从药品清单专用key获取记录
    for (const key of drugKeys) {
      try {
        const recordStr = await storage.get(key);
        if (!recordStr) {
          console.warn(`[getHistoryRecords] key ${key} 的值为空`);
          continue;
        }
        
        const record = JSON.parse(recordStr);
        
        // 跳过已处理的记录（通过ID去重）
        if (seenIds.has(record.id)) {
          console.log(`[getHistoryRecords] 跳过重复记录: ${record.id}`);
          continue;
        }
        seenIds.add(record.id);
        
        // 只返回已保存到家庭药品清单的记录（saved=true）
        if (!record.saved) {
          console.log(`[getHistoryRecords] 跳过未保存记录: ${record.id}, saved=${record.saved}`);
          continue;
        }
        
        // 验证记录完整性
        if (!record.mergedData || !record.id) {
          console.warn(`[getHistoryRecords] 记录不完整: ${record.id}, mergedData=${!!record.mergedData}`);
          continue;
        }
        
        // 如果search不为空，过滤药品名称
        const drugName = record.mergedData?.name || '';
        if (search && !drugName.includes(search)) {
          continue;
        }
        
        allRecords.push(record);
        console.log(`[getHistoryRecords] 添加记录: ${record.id}, 药品名: ${drugName}`);
      } catch (e) {
        console.error(`[getHistoryRecords] 解析记录失败, key: ${key}`, e);
        continue;
      }
    }
    
    // 如果药品清单专用key查询不到数据，尝试查询主记录（兼容旧数据）
    if (allRecords.length === 0) {
      console.log(`[getHistoryRecords] 药品清单key为空，尝试查询主记录`);
      try {
        const allKeys = await storage.list(config.storage.prefix);
        const recordKeys = allKeys.filter(key => 
          key.startsWith(config.storage.prefix) && 
          !key.includes('index') && 
          !key.startsWith(drugPrefix) // 排除drug:开头的，避免重复
        );
        
        console.log(`[getHistoryRecords] 找到 ${recordKeys.length} 个主记录key`);
        
        for (const key of recordKeys) {
          try {
            const recordStr = await storage.get(key);
            if (!recordStr) continue;
            
            const record = JSON.parse(recordStr);
            
            if (seenIds.has(record.id)) continue;
            seenIds.add(record.id);
            
            if (!record.saved) continue;
            
            if (!record.mergedData || !record.id) continue;
            
            const drugName = record.mergedData?.name || '';
            if (search && !drugName.includes(search)) {
              continue;
            }
            
            allRecords.push(record);
          } catch (e) {
            console.error(`[getHistoryRecords] 解析主记录失败, key: ${key}`, e);
            continue;
          }
        }
      } catch (e) {
        console.error(`[getHistoryRecords] 查询主记录失败:`, e);
      }
    }
    
    console.log(`[getHistoryRecords] 最终找到 ${allRecords.length} 条已保存记录`);
  } catch (e) {
    console.error('[getHistoryRecords] 查询历史记录失败:', e);
    // 如果查询失败，返回空列表
    return { records: [], total: 0, page, limit, debug: { error: e.message, stack: e.stack } };
  }
  
  // 按时间倒序排序
  allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const records = allRecords.slice(start, end);
  
  return { records, total: allRecords.length, page, limit };
}

// 保存药品到家庭药品清单
async function saveDrugToInventory(drugInfo, recordId) {
  const storage = getEdgeStorage();
  let id = recordId;
  let timestamp = Date.now();
  let existingRecord = null;
  
  console.log(`[saveDrugToInventory] 开始保存药品, recordId: ${recordId}, drugInfo:`, JSON.stringify(drugInfo));
  
  // 如果recordId存在，尝试查找并更新已有记录
  if (recordId) {
    existingRecord = await getRecord(recordId);
    if (existingRecord) {
      timestamp = existingRecord.timestamp || timestamp;
      // 更新已有记录
      existingRecord.mergedData = { ...drugInfo, edited: true };
      existingRecord.saved = true;
      existingRecord.status = 'completed';
      console.log(`[saveDrugToInventory] 更新已有记录: ${recordId}`);
    }
  }
  
  // 如果没有找到已有记录，创建新记录
  if (!existingRecord) {
    id = id || generateId();
    existingRecord = {
      id,
      timestamp,
      images: [],
      recognitionResults: [],
      mergedData: { ...drugInfo, edited: true },
      saved: true,
      status: 'completed'
    };
    console.log(`[saveDrugToInventory] 创建新记录: ${id}`);
  }
  
  const recordStr = JSON.stringify(existingRecord);
  
  try {
    // 保存到多个位置，确保能查询到
    const recordKey = `${config.storage.prefix}${timestamp}:${id}`;
    await storage.set(recordKey, recordStr);
    console.log(`[saveDrugToInventory] 保存主记录: ${recordKey}`);
    
    // 保存到药品清单专用key（这是查询时优先使用的key）
    const drugKey = `${config.storage.prefix}drug:${id}`;
    await storage.set(drugKey, recordStr);
    console.log(`[saveDrugToInventory] 保存药品记录: ${drugKey}`);
    
    // 验证药品清单key是否保存成功（重要：这是查询时使用的key）
    const verifyDrugKey = await storage.get(drugKey);
    if (verifyDrugKey) {
      console.log(`[saveDrugToInventory] ✅ 验证药品清单key保存成功: ${drugKey}`);
      try {
        const verifyRecord = JSON.parse(verifyDrugKey);
        console.log(`[saveDrugToInventory] 验证记录内容: id=${verifyRecord.id}, saved=${verifyRecord.saved}, name=${verifyRecord.mergedData?.name || 'N/A'}`);
      } catch (e) {
        console.warn(`[saveDrugToInventory] 验证记录解析失败:`, e);
      }
    } else {
      console.error(`[saveDrugToInventory] ❌ 验证药品清单key保存失败: ${drugKey}`);
    }
    
    // 保存到药品清单索引
    const drugIndexKey = `${config.storage.indexPrefix}drugs:${timestamp}:${id}`;
    await storage.set(drugIndexKey, id);
    console.log(`[saveDrugToInventory] 保存药品索引: ${drugIndexKey}`);
    
    // 保存到主索引
    const mainIndexKey = `${config.storage.indexPrefix}all:${timestamp}:${id}`;
    await storage.set(mainIndexKey, id);
    console.log(`[saveDrugToInventory] 保存主索引: ${mainIndexKey}`);
    
    // 验证保存是否成功（验证主记录）
    const verifyKey = `${config.storage.prefix}${timestamp}:${id}`;
    const verifyValue = await storage.get(verifyKey);
    if (verifyValue) {
      console.log(`[saveDrugToInventory] ✅ 验证主记录保存成功: ${verifyKey}`);
    } else {
      console.error(`[saveDrugToInventory] ❌ 验证主记录保存失败: ${verifyKey}`);
    }
  } catch (e) {
    console.error('保存药品失败:', e);
    return { id, success: false, error: e.message };
  }
  
  return { id, success: true };
}

// ========== 结果合并 ==========
function getEarlierDate(date1, date2) {
  if (!date1) return date2;
  if (!date2) return date1;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime())) return date2;
  if (isNaN(d2.getTime())) return date1;
  return d1 < d2 ? date1 : date2;
}

function getLaterDate(date1, date2) {
  if (!date1) return date2;
  if (!date2) return date1;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  if (isNaN(d1.getTime())) return date2;
  if (isNaN(d2.getTime())) return date1;
  return d1 > d2 ? date1 : date2;
}

function mergeStringField(values) {
  const nonEmptyValues = values.filter(v => v && v.trim() !== '');
  if (nonEmptyValues.length === 0) return '';
  if (nonEmptyValues.length === 1) return nonEmptyValues[0];
  const uniqueValues = [...new Set(nonEmptyValues)];
  return uniqueValues.reduce((longest, current) => {
    return current.length > longest.length ? current : longest;
  }, uniqueValues[0]);
}

function mergeDrugInfo(results) {
  if (!results || results.length === 0) {
    return { name: '', brand: '', manufacturer: '', production_date: '', expiry_date: '', batch_number: '', dosage_form: '', strength: '' };
  }
  
  const names = [], brands = [], manufacturers = [], productionDates = [], expiryDates = [], batchNumbers = [], dosageForms = [], strengths = [];
  
  for (const result of results) {
    const data = result.extractedData || {};
    if (data.name) names.push(data.name);
    if (data.brand) brands.push(data.brand);
    if (data.manufacturer) manufacturers.push(data.manufacturer);
    if (data.production_date) productionDates.push(data.production_date);
    if (data.expiry_date) expiryDates.push(data.expiry_date);
    if (data.batch_number) batchNumbers.push(data.batch_number);
    if (data.dosage_form) dosageForms.push(data.dosage_form);
    if (data.strength) strengths.push(data.strength);
  }
  
  return {
    name: mergeStringField(names),
    brand: mergeStringField(brands),
    manufacturer: mergeStringField(manufacturers),
    production_date: productionDates.reduce(getEarlierDate, ''),
    expiry_date: expiryDates.reduce(getLaterDate, ''),
    batch_number: mergeStringField(batchNumbers),
    dosage_form: mergeStringField(dosageForms),
    strength: mergeStringField(strengths)
  };
}

// ========== 处理函数 ==========
async function handleRecognize(request) {
  try {
    // 请求体已经在主入口中解析好了
    const body = request.body;
    
    if (!body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: '请求体为空' }, null, 0)
      };
    }
    
    const { images } = body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: '请至少上传一张图片' }, null, 0)
      };
    }
    
    const imageInfos = images.map(img => ({
      name: img.name || 'unknown',
      size: img.size || 0,
      type: img.type || 'image/jpeg'
    }));
    
    // 改为串行处理，避免并发导致总时间超过网关超时
    // 网关超时通常为30-60秒，串行处理可以更好地控制总时间
    const recognitionResults = [];
    
    // 串行处理图片（一张一张处理）
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      try {
        // 减少单张图片的超时时间（20秒），确保总时间不超过网关超时
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('识别超时（20秒）')), 20000);
        });
        
        const result = await Promise.race([
          recognizeDrugFromImage(img.base64),
          timeoutPromise
        ]);
          
          if (result.success) {
            // 解析识别结果
            const extractedData = parseDrugInfo(result.raw_text);
            
            recognitionResults.push({ 
              imageIndex: i, 
              rawText: result.raw_text || '', 
              extractedData,
              parseSuccess: Object.values(extractedData).some(v => v && v.trim() !== '')
            });
          } else {
            recognitionResults.push({
              imageIndex: i,
              rawText: '',
              extractedData: { name: '', brand: '', manufacturer: '', production_date: '', expiry_date: '', batch_number: '', dosage_form: '', strength: '' },
              error: result.error
            });
          }
        } catch (e) {
          recognitionResults.push({
            imageIndex: i,
            rawText: '',
            extractedData: { name: '', brand: '', manufacturer: '', production_date: '', expiry_date: '', batch_number: '', dosage_form: '', strength: '' },
            error: e.message || '识别失败'
          });
        }
        
        // 每处理完一张图片后稍作延迟，避免API限流
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    const mergedData = mergeDrugInfo(recognitionResults);
    
    const timestamp = Date.now();
    const record = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      images: imageInfos,
      recognitionResults,
      mergedData,
      status: 'completed'
    };
    
    await saveRecord(record);
    
    // 检查合并后的数据是否有内容
    const hasMergedData = Object.values(mergedData).some(v => v && v.trim() !== '');
    
    // 构建响应数据，始终包含调试信息
    const responseData = {
      success: true,
      data: { 
        id: record.id, 
        mergedData, 
        recognitionResults: recognitionResults.map(r => ({
          imageIndex: r.imageIndex,
          extractedData: r.extractedData,
          error: r.error,
          rawTextPreview: r.rawText ? r.rawText.substring(0, 500) : 'N/A',
          parseSuccess: r.parseSuccess || false
        })),
        timestamp
      },
      debug: {
        hasMergedData,
        totalImages: images.length,
        successfulRecognitions: recognitionResults.filter(r => !r.error).length,
        failedRecognitions: recognitionResults.filter(r => r.error).length,
        parseDetails: recognitionResults.map(r => ({
          imageIndex: r.imageIndex,
          hasExtractedData: Object.values(r.extractedData || {}).some(v => v && v.trim() !== ''),
          rawTextLength: r.rawText ? r.rawText.length : 0,
          rawTextStart: r.rawText ? r.rawText.substring(0, 200) : 'N/A',
          extractedFields: Object.keys(r.extractedData || {}).filter(k => r.extractedData[k] && r.extractedData[k].trim() !== '')
        }))
      }
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(responseData, null, 0)
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: `处理失败: ${e.message}` }, null, 0)
    };
  }
}

async function handleHistory(request, pathname, searchParams) {
  try {
    if (pathname.startsWith('/history/')) {
      const id = pathname.split('/history/')[1];
      if (!id) {
        return { statusCode: 400, body: JSON.stringify({ success: false, error: '缺少记录ID' }, null, 0) };
      }
      const record = await getRecord(id);
      if (!record) {
        return { statusCode: 404, body: JSON.stringify({ success: false, error: '记录不存在' }, null, 0) };
      }
      return { statusCode: 200, body: JSON.stringify({ success: true, data: record }, null, 0) };
    }
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const result = await getHistoryRecords(page, limit, search);
    
    return { statusCode: 200, body: JSON.stringify({ success: true, data: result }, null, 0) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ success: false, error: `查询失败: ${e.message}` }, null, 0) };
  }
}

// ========== 主入口 ==========
export default {
  async fetch(request) {
    // 解析URL路径 - 兼容多种格式
    let pathname = '/';
    let searchParams = new URLSearchParams();
    const method = request.method || 'GET';
    
    // 尝试多种方式获取路径
    if (request.url) {
      try {
        const url = new URL(request.url);
        pathname = url.pathname;
        searchParams = url.searchParams;
      } catch (e) {
        // URL解析失败，尝试其他方式
        if (request.path) {
          pathname = request.path;
        } else if (request.url) {
          // 从URL字符串中提取路径
          const urlMatch = request.url.match(/^https?:\/\/[^\/]+(\/[^?]*)/);
          if (urlMatch) {
            pathname = urlMatch[1];
          }
          // 提取查询参数
          const queryMatch = request.url.match(/\?([^#]*)/);
          if (queryMatch) {
            searchParams = new URLSearchParams(queryMatch[1]);
          }
        }
      }
    } else if (request.path) {
      pathname = request.path;
      if (request.query) {
        searchParams = new URLSearchParams(request.query);
      }
    }
    
    // 规范化路径（移除末尾斜杠，除非是根路径）
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (method === 'OPTIONS') {
      return new Response('', { status: 200, headers: corsHeaders });
    }
    
    try {
      let response;
      
      // 路由匹配 - 支持多种路径格式
      if (method === 'POST' && (pathname === '/recognize' || pathname.endsWith('/recognize'))) {
        // 读取请求体 - ESA边缘函数中request是Request对象
        let requestBody = null;
        try {
          // 直接从request读取文本
          const text = await request.text();
          if (text) {
            requestBody = JSON.parse(text);
          } else {
            return new Response(JSON.stringify({ 
              success: false, 
              error: '请求体为空'
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
        } catch (e) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '请求体解析失败: ' + e.message,
            details: String(e)
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        
        if (!requestBody || !requestBody.images) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '请求体格式错误：缺少images字段',
            received: Object.keys(requestBody || {})
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        
        // 验证图片数量
        if (!Array.isArray(requestBody.images) || requestBody.images.length === 0) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '请至少上传一张图片'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        
        // 直接调用处理函数，传入解析好的body
        try {
          const result = await handleRecognize({ body: requestBody });
          return new Response(result.body, {
            status: result.statusCode,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '处理失败: ' + e.message,
            stack: e.stack
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      } else if (method === 'POST' && pathname === '/drugs/save') {
        // 保存药品到家庭药品清单
        let requestBody = null;
        try {
          const text = await request.text();
          if (text) {
            requestBody = JSON.parse(text);
          }
        } catch (e) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '请求体解析失败: ' + e.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        
        if (!requestBody || !requestBody.drugInfo) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '缺少药品信息'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
        
        try {
          console.log(`[POST /drugs/save] 收到保存请求, drugInfo:`, JSON.stringify(requestBody.drugInfo));
          console.log(`[POST /drugs/save] recordId:`, requestBody.recordId);
          
          const result = await saveDrugToInventory(requestBody.drugInfo, requestBody.recordId);
          
          console.log(`[POST /drugs/save] 保存结果:`, JSON.stringify(result));
          
          if (result.success) {
            // 保存成功后，立即验证数据是否能查询到
            try {
              const testRecords = await getHistoryRecords(1, 10, '');
              console.log(`[POST /drugs/save] 保存后立即查询测试: 找到 ${testRecords.records.length} 条记录`);
            } catch (e) {
              console.warn(`[POST /drugs/save] 保存后查询测试失败:`, e);
            }
            
            return new Response(JSON.stringify({ 
              success: true, 
              data: result
            }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          } else {
            return new Response(JSON.stringify({ 
              success: false, 
              error: result.error || '保存失败'
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
            });
          }
        } catch (e) {
          console.error('[POST /drugs/save] 保存药品异常:', e);
          return new Response(JSON.stringify({ 
            success: false, 
            error: '保存失败: ' + e.message,
            stack: e.stack
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        }
      } else if (method === 'GET' && pathname === '/debug-storage') {
        // 调试端点：查看存储配置和状态
        const storage = getEdgeStorage();
        const namespace = getEnv('EDGE_KV_NAMESPACE', '未配置');
        const hasEdgeKV = typeof EdgeKV !== 'undefined' || 
                          (typeof globalThis !== 'undefined' && globalThis.EdgeKV) ||
                          (typeof self !== 'undefined' && self.EdgeKV);
        
        // 尝试列出一些key来测试list方法
        let testListResult = null;
        try {
          const testKeys = await storage.list(config.storage.prefix);
          testListResult = {
            success: true,
            totalKeys: testKeys.length,
            sampleKeys: testKeys.slice(0, 5) // 只显示前5个
          };
        } catch (e) {
          testListResult = {
            success: false,
            error: e.message
          };
        }
        
        return new Response(JSON.stringify({
          success: true,
          storage: {
            namespace: namespace,
            hasEdgeKV: hasEdgeKV,
            edgeKVAvailable: {
              global: typeof EdgeKV !== 'undefined',
              globalThis: typeof globalThis !== 'undefined' && !!globalThis.EdgeKV,
              self: typeof self !== 'undefined' && !!self.EdgeKV
            },
            storageType: storage.constructor?.name || 'unknown',
            isMemoryStorage: storage.set && storage.set.toString().includes('_memoryStorage')
          },
          config: {
            storagePrefix: config.storage.prefix,
            indexPrefix: config.storage.indexPrefix
          },
          testList: testListResult
        }, null, 2), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      } else if (method === 'GET' && pathname === '/test-kv') {
        // 测试端点：测试EdgeKV的读写功能
        const storage = getEdgeStorage();
        const testKey = `test-key-${Date.now()}`;
        const testValue = `test-value-${Date.now()}`;
        
        try {
          // 写入测试
          await storage.set(testKey, testValue);
          console.log(`[test-kv] 写入成功: ${testKey} = ${testValue}`);
          
          // 立即读取测试
          const immediateRead = await storage.get(testKey);
          console.log(`[test-kv] 立即读取: ${immediateRead}`);
          
          // 列出所有test-key开头的key
          const testKeys = await storage.list('test-key');
          console.log(`[test-kv] 列出test-key开头的key: ${testKeys.length} 个`);
          
          return new Response(JSON.stringify({
            success: true,
            test: {
              key: testKey,
              writtenValue: testValue,
              immediateRead: immediateRead,
              match: testValue === immediateRead,
              listResult: {
                prefix: 'test-key',
                count: testKeys.length,
                keys: testKeys.slice(0, 10) // 只显示前10个
              }
            }
          }, null, 2), {
            status: 200,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json; charset=utf-8'
            }
          });
        } catch (e) {
          return new Response(JSON.stringify({
            success: false,
            error: e.message,
            stack: e.stack
          }, null, 2), {
            status: 500,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json; charset=utf-8'
            }
          });
        }
      } else if (method === 'GET' && (pathname.startsWith('/history') || pathname.includes('/history'))) {
        const result = await handleHistory(request, pathname, searchParams);
        return new Response(result.body, {
          status: result.statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      } else if (method === 'GET' && pathname === '/') {
        // 根路径返回API信息（用于测试）
        const responseData = JSON.stringify({ 
          success: true, 
          message: '药品识别API服务运行正常',
          endpoints: {
            'POST /recognize': '识别药品图片',
            'POST /drugs/save': '保存药品到家庭药品清单',
            'GET /history': '获取历史记录列表',
            'GET /history/:id': '获取单条记录详情',
            'GET /debug-storage': '调试存储配置（新增）'
          },
          debug: {
            pathname: pathname,
            method: method,
            url: request.url || 'N/A'
          }
        });
        return new Response(responseData, {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json; charset=utf-8'
          }
        });
      } else if (method === 'GET' && pathname === '/recognize') {
        // GET请求到/recognize，返回友好的错误提示
        return new Response(JSON.stringify({ 
          success: false, 
          error: '/recognize 接口只支持 POST 方法，请使用 POST 请求',
          availableEndpoints: [
            'POST /recognize - 识别药品图片',
            'POST /drugs/save - 保存药品到家庭药品清单',
            'GET /history - 获取历史记录列表',
            'GET /history/:id - 获取单条记录详情'
          ],
          debug: {
            pathname: pathname,
            method: method,
            url: request.url || 'N/A',
            hint: '请检查前端代码是否正确使用 POST 方法'
          }
        }), {
          status: 405, // Method Not Allowed
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      } else {
        // 返回调试信息（开发时有用）
        return new Response(JSON.stringify({ 
          success: false, 
          error: '接口不存在',
          availableEndpoints: [
            'POST /recognize - 识别药品图片',
            'POST /drugs/save - 保存药品到家庭药品清单',
            'GET /history - 获取历史记录列表',
            'GET /history/:id - 获取单条记录详情'
          ],
          debug: {
            pathname: pathname,
            method: method,
            url: request.url || 'N/A'
          }
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
    } catch (e) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `服务器错误: ${e.message}`,
        stack: e.stack
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
      });
    }
  }
};

