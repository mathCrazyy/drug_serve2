import config from '../config.js';

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

export async function recognizeDrugFromImage(imageBase64) {
  const headers = {
    'Authorization': `Bearer ${config.doubaoApi.apiKey}`,
    'Content-Type': 'application/json'
  };
  
  const payload = {
    model: config.doubaoApi.model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请识别这张药品图片中的所有文字信息，包括药品名称、生产日期、有效期、批号、生产厂家等信息。如果没有则对应字段返回无。请以JSON格式返回结果，格式如下：{"name": "药品名称", "brand": "品牌", "manufacturer": "生产厂家", "production_date": "生产日期", "expiry_date": "有效期", "batch_number": "批号", "dosage_form": "剂型", "strength": "规格"}'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      }
    ],
    max_tokens: config.doubaoApi.maxTokens,
    temperature: config.doubaoApi.temperature
  };
  
  try {
    const response = await fetch(config.doubaoApi.baseUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    if (response.status === 200) {
      const contentType = response.headers.get('Content-Type') || '';
      const isStream = contentType.includes('text/event-stream') || contentType.includes('event-stream');
      
      let content = '';
      
      if (isStream) {
        const responseText = await response.text();
        content = parseSseResponse(responseText);
      } else {
        const result = await response.json();
        
        if (!result.choices || result.choices.length === 0) {
          return {
            success: false,
            error: '响应格式不正确：choices数组为空',
            raw_text: '',
            extracted_data: {}
          };
        }
        
        const choice = result.choices[0];
        if (choice.message && choice.message.content) {
          content = choice.message.content;
        } else if (choice.delta && choice.delta.content) {
          content = choice.delta.content;
        } else {
          return {
            success: false,
            error: '响应格式不正确：缺少content字段',
            raw_text: '',
            extracted_data: {}
          };
        }
      }
      
      // extracted_data将在调用parseDrugInfo后填充
      return {
        success: true,
        raw_text: content,
        extracted_data: {},
        confidence: 'high'
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `API请求失败: ${response.status}`,
        raw_text: errorText,
        extracted_data: {}
      };
    }
  } catch (e) {
    return {
      success: false,
      error: `网络请求异常: ${e.message}`,
      raw_text: '',
      extracted_data: {}
    };
  }
}

