// 多图结果合并逻辑

// 比较日期，返回较早的日期
function getEarlierDate(date1, date2) {
  if (!date1) return date2;
  if (!date2) return date1;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime())) return date2;
  if (isNaN(d2.getTime())) return date1;
  
  return d1 < d2 ? date1 : date2;
}

// 比较日期，返回较晚的日期
function getLaterDate(date1, date2) {
  if (!date1) return date2;
  if (!date2) return date1;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (isNaN(d1.getTime())) return date2;
  if (isNaN(d2.getTime())) return date1;
  
  return d1 > d2 ? date1 : date2;
}

// 合并字符串字段（去重，优先非空值，如果都非空则取最长的）
function mergeStringField(values) {
  const nonEmptyValues = values.filter(v => v && v.trim() !== '');
  
  if (nonEmptyValues.length === 0) return '';
  if (nonEmptyValues.length === 1) return nonEmptyValues[0];
  
  // 去重
  const uniqueValues = [...new Set(nonEmptyValues)];
  
  // 如果有多个不同的非空值，取最长的（通常更完整）
  return uniqueValues.reduce((longest, current) => {
    return current.length > longest.length ? current : longest;
  }, uniqueValues[0]);
}

export function mergeDrugInfo(results) {
  if (!results || results.length === 0) {
    return {
      name: '',
      brand: '',
      manufacturer: '',
      production_date: '',
      expiry_date: '',
      batch_number: '',
      dosage_form: '',
      strength: ''
    };
  }
  
  // 收集所有字段的值
  const names = [];
  const brands = [];
  const manufacturers = [];
  const productionDates = [];
  const expiryDates = [];
  const batchNumbers = [];
  const dosageForms = [];
  const strengths = [];
  
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
  
  // 合并结果
  const merged = {
    name: mergeStringField(names),
    brand: mergeStringField(brands),
    manufacturer: mergeStringField(manufacturers),
    production_date: productionDates.reduce(getEarlierDate, ''),
    expiry_date: expiryDates.reduce(getLaterDate, ''),
    batch_number: mergeStringField(batchNumbers),
    dosage_form: mergeStringField(dosageForms),
    strength: mergeStringField(strengths)
  };
  
  return merged;
}

