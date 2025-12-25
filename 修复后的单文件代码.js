// 药品识别边缘函数 - 修复版本（兼容ESA环境）

// ========== 配置 ==========
// 在ESA边缘函数中，环境变量可能通过不同的方式访问
// 如果 process.env 不可用，请使用控制台配置的环境变量
function getEnv(key, defaultValue) {
  // 尝试多种方式获取环境变量
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
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
  
  if (estimatedSizeMB > 5) {
    return { 
      success: false, 
      error: `图片过大（约${estimatedSizeMB.toFixed(2)}MB），请压缩后重试`, 
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

// ========== 存储操作 ==========
// 注意：这是一个简化的内存存储实现（临时方案）
// 实际部署时需要替换为阿里云ESA边缘存储API
// 边缘函数是无状态的，这个内存存储会在函数重启后丢失
// 生产环境必须使用持久化存储

// 使用全局变量作为临时存储（仅用于测试）
// 实际应该使用边缘存储API
let memoryStorage = null;
function getMemoryStorage() {
  if (!memoryStorage) {
    memoryStorage = new Map();
  }
  return memoryStorage;
}

async function saveRecord(record) {
  const id = record.id || generateId();
  const timestamp = record.timestamp || Date.now();
  const recordKey = `${config.storage.prefix}${timestamp}:${id}`;
  
  // 临时使用内存存储
  const storage = getMemoryStorage();
  storage.set(recordKey, JSON.stringify(record));
  
  // 保存索引（用于查询）
  const indexKey = `${config.storage.indexPrefix}all:${timestamp}:${id}`;
  storage.set(indexKey, id);
  
  // 如果已保存到家庭药品清单，也保存一份
  if (record.saved) {
    const drugKey = `${config.storage.prefix}drug:${id}`;
    storage.set(drugKey, JSON.stringify(record));
    
    // 保存到药品清单索引
    const drugIndexKey = `${config.storage.indexPrefix}drugs:${timestamp}:${id}`;
    storage.set(drugIndexKey, id);
  }
  
  // TODO: 实际部署时使用边缘存储API
  // await edgeStorage.set(recordKey, JSON.stringify(record));
  
  return { id, key: recordKey };
}

async function getRecord(id) {
  const storage = getMemoryStorage();
  
  // 查找所有可能的key
  for (const [key, value] of storage.entries()) {
    if (key.includes(`:${id}`) && !key.includes('index')) {
      try {
        return JSON.parse(value);
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

async function getHistoryRecords(page = 1, limit = 20, search = '') {
  const storage = getMemoryStorage();
  const allRecords = [];
  const seenIds = new Set(); // 避免重复记录
  
  // 从内存存储中获取所有记录
  for (const [key, value] of storage.entries()) {
    // 只处理主记录（不包含index的）
    if (key.startsWith(config.storage.prefix) && !key.includes('index')) {
      try {
        const record = JSON.parse(value);
        
        // 跳过已处理的记录
        if (seenIds.has(record.id)) continue;
        seenIds.add(record.id);
        
        // 如果search不为空，过滤药品名称
        const drugName = record.mergedData?.name || '';
        if (search && !drugName.includes(search)) {
          continue;
        }
        
        allRecords.push(record);
      } catch (e) {
        continue;
      }
    }
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
  const id = recordId || generateId();
  const timestamp = Date.now();
  
  // 构建药品记录
  const drugRecord = {
    id,
    timestamp,
    images: [],
    recognitionResults: [],
    mergedData: { ...drugInfo, edited: true },
    saved: true,
    status: 'completed'
  };
  
  // 临时使用内存存储
  const storage = getMemoryStorage();
  const drugKey = `${config.storage.prefix}drug:${id}`;
  storage.set(drugKey, JSON.stringify(drugRecord));
  
  // 保存到药品清单索引
  const drugIndexKey = `${config.storage.indexPrefix}drugs:${timestamp}:${id}`;
  storage.set(drugIndexKey, id);
  
  // 同时保存到主记录
  const recordKey = `${config.storage.prefix}${timestamp}:${id}`;
  storage.set(recordKey, JSON.stringify(drugRecord));
  
  // TODO: 实际部署时使用边缘存储API
  // await edgeStorage.set(drugKey, JSON.stringify(drugRecord));
  
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
    
    // 限制并发数量，避免超时（一次最多处理3张图片）
    const maxConcurrent = 3;
    const recognitionResults = [];
    
    // 分批处理图片
    for (let i = 0; i < images.length; i += maxConcurrent) {
      const batch = images.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (img, batchIndex) => {
        const index = i + batchIndex;
        try {
          // 添加超时控制（25秒）
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('识别超时')), 25000);
          });
          
          const result = await Promise.race([
            recognizeDrugFromImage(img.base64),
            timeoutPromise
          ]);
          
          if (result.success) {
            // 解析识别结果
            const extractedData = parseDrugInfo(result.raw_text);
            
            return { 
              imageIndex: index, 
              rawText: result.raw_text || '', 
              extractedData,
              parseSuccess: Object.values(extractedData).some(v => v && v.trim() !== '')
            };
          } else {
            return {
              imageIndex: index,
              rawText: '',
              extractedData: { name: '', brand: '', manufacturer: '', production_date: '', expiry_date: '', batch_number: '', dosage_form: '', strength: '' },
              error: result.error
            };
          }
        } catch (e) {
          return {
            imageIndex: index,
            rawText: '',
            extractedData: { name: '', brand: '', manufacturer: '', production_date: '', expiry_date: '', batch_number: '', dosage_form: '', strength: '' },
            error: e.message || '识别失败'
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      recognitionResults.push(...batchResults);
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
          const result = await saveDrugToInventory(requestBody.drugInfo, requestBody.recordId);
          return new Response(JSON.stringify({ 
            success: true, 
            data: result
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
          });
        } catch (e) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: '保存失败: ' + e.message
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' }
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
            'GET /history/:id': '获取单条记录详情'
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

