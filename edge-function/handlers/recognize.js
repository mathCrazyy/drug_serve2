import { recognizeDrugFromImage } from '../utils/doubaoApi.js';
import { parseDrugInfo } from '../utils/parser.js';
import { mergeDrugInfo } from './merge.js';
import { saveRecord } from '../utils/storage.js';

export async function handleRecognize(request) {
  try {
    // 解析请求体
    let body = request.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { images } = body || {};
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: '请至少上传一张图片'
        })
      };
    }
    
    // 提取图片信息（不存储图片本身）
    const imageInfos = images.map(img => ({
      name: img.name || 'unknown',
      size: img.size || 0,
      type: img.type || 'image/jpeg'
    }));
    
    // 并发调用豆包API识别每张图片
    const recognitionPromises = images.map(async (img, index) => {
      try {
        const result = await recognizeDrugFromImage(img.base64);
        
        if (result.success) {
          // 解析识别结果
          const extractedData = parseDrugInfo(result.raw_text);
          
          return {
            imageIndex: index,
            rawText: result.raw_text,
            extractedData: extractedData
          };
        } else {
          return {
            imageIndex: index,
            rawText: '',
            extractedData: {
              name: '',
              brand: '',
              manufacturer: '',
              production_date: '',
              expiry_date: '',
              batch_number: '',
              dosage_form: '',
              strength: ''
            },
            error: result.error
          };
        }
      } catch (e) {
        return {
          imageIndex: index,
          rawText: '',
          extractedData: {
            name: '',
            brand: '',
            manufacturer: '',
            production_date: '',
            expiry_date: '',
            batch_number: '',
            dosage_form: '',
            strength: ''
          },
          error: e.message
        };
      }
    });
    
    // 等待所有识别完成
    const recognitionResults = await Promise.all(recognitionPromises);
    
    // 合并多图结果
    const mergedData = mergeDrugInfo(recognitionResults);
    
    // 创建记录
    const timestamp = Date.now();
    const record = {
      id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: timestamp,
      images: imageInfos,
      recognitionResults: recognitionResults,
      mergedData: mergedData,
      status: 'completed'
    };
    
    // 保存到边缘存储
    await saveRecord(record);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: record.id,
          mergedData: mergedData,
          recognitionResults: recognitionResults,
          timestamp: timestamp
        }
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: `处理失败: ${e.message}`
      })
    };
  }
}

