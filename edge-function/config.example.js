// 配置文件示例
// 复制此文件为 config.js 并填入实际的配置信息

export default {
  doubaoApi: {
    baseUrl: process.env.DOUBAO_API_BASE_URL || 'https://api.chatfire.site/v1/chat/completions',
    apiKey: process.env.DOUBAO_API_KEY || 'your-api-key-here',
    model: process.env.DOUBAO_MODEL || 'doubao-1.5-vision-pro-250328',
    maxTokens: parseInt(process.env.DOUBAO_MAX_TOKENS || '1000'),
    temperature: parseFloat(process.env.DOUBAO_TEMPERATURE || '0.1')
  },
  storage: {
    prefix: process.env.STORAGE_PREFIX || 'drug_record:',
    indexPrefix: process.env.STORAGE_INDEX_PREFIX || 'drug_index:'
  }
}

