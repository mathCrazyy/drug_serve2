function normalizeDate(dateStr) {
  try {
    dateStr = dateStr.replace('年', '-').replace('月', '-').replace('日', '');
    dateStr = dateStr.replace(/\//g, '-');
    
    const dateFormats = ['%Y-%m-%d', '%Y-%m', '%Y'];
    for (const fmt of dateFormats) {
      try {
        // 简单的日期解析
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
      } catch (e) {
        continue;
      }
    }
    
    return dateStr;
  } catch (e) {
    return dateStr;
  }
}

function extractWithRegex(text) {
  const drugInfo = {
    name: '',
    brand: '',
    manufacturer: '',
    production_date: '',
    expiry_date: '',
    batch_number: '',
    dosage_form: '',
    strength: ''
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
    if (match) {
      drugInfo.name = match[1].trim();
      break;
    }
  }
  
  // 提取生产日期
  const datePatterns = [
    /生产日期[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /生产[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)\s*生产/i,
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      drugInfo.production_date = normalizeDate(match[1]);
      break;
    }
  }
  
  // 提取有效期
  const expiryPatterns = [
    /有效期[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /有效期至[：:]\s*(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/i,
    /(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)\s*前使用/i,
  ];
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      drugInfo.expiry_date = normalizeDate(match[1]);
      break;
    }
  }
  
  // 提取批号
  const batchPatterns = [
    /批号[：:]\s*([A-Za-z0-9]+)/i,
    /生产批号[：:]\s*([A-Za-z0-9]+)/i,
    /批号\s*([A-Za-z0-9]+)/i,
  ];
  
  for (const pattern of batchPatterns) {
    const match = text.match(pattern);
    if (match) {
      drugInfo.batch_number = match[1].trim();
      break;
    }
  }
  
  // 提取生产厂家
  const manufacturerPatterns = [
    /生产厂家[：:]\s*([^\n\r]+)/i,
    /生产企业[：:]\s*([^\n\r]+)/i,
    /制造商[：:]\s*([^\n\r]+)/i,
  ];
  
  for (const pattern of manufacturerPatterns) {
    const match = text.match(pattern);
    if (match) {
      drugInfo.manufacturer = match[1].trim();
      break;
    }
  }
  
  // 提取剂型
  const dosagePatterns = [
    /([片胶囊粒支瓶袋]剂?)/,
    /剂型[：:]\s*([^\n\r]+)/i,
  ];
  
  for (const pattern of dosagePatterns) {
    const match = text.match(pattern);
    if (match) {
      drugInfo.dosage_form = match[1].trim();
      break;
    }
  }
  
  // 提取规格/强度
  const strengthPatterns = [
    /(\d+mg)/i,
    /(\d+\.?\d*[mg]?[g]?)/i,
    /规格[：:]\s*([^\n\r]+)/i,
  ];
  
  for (const pattern of strengthPatterns) {
    const match = text.match(pattern);
    if (match) {
      drugInfo.strength = match[1].trim();
      break;
    }
  }
  
  return drugInfo;
}

export function parseDrugInfo(text) {
  const drugInfo = {
    name: '',
    brand: '',
    manufacturer: '',
    production_date: '',
    expiry_date: '',
    batch_number: '',
    dosage_form: '',
    strength: ''
  };
  
  try {
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    // 尝试解析JSON格式的返回
    if (text.trim().startsWith('{')) {
      try {
        const jsonData = JSON.parse(text);
        Object.assign(drugInfo, jsonData);
        return drugInfo;
      } catch (e) {
        // JSON解析失败，使用正则表达式
      }
    }
    
    // 使用正则表达式提取信息
    return extractWithRegex(text);
  } catch (e) {
    return extractWithRegex(text);
  }
}

