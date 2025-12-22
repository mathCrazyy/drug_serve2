import { handleRecognize } from './handlers/recognize.js';
import { handleHistory } from './handlers/history.js';

export default async function handler(request) {
  // 处理URL（边缘函数环境可能不同）
  let pathname = request.path || '/';
  let searchParams = new URLSearchParams();
  
  if (request.url) {
    try {
      const url = new URL(request.url);
      pathname = url.pathname;
      searchParams = url.searchParams;
    } catch (e) {
      // 如果URL解析失败，尝试从path和query构建
      if (request.path) {
        pathname = request.path;
      }
      if (request.query) {
        searchParams = new URLSearchParams(request.query);
      }
    }
  }
  
  const method = request.method;
  
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  // 处理OPTIONS预检请求
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    let response;
    
    // 路由分发
    if (method === 'POST' && pathname === '/recognize') {
      response = await handleRecognize(request);
    } else if (method === 'GET' && pathname.startsWith('/history')) {
      response = await handleHistory(request, pathname, searchParams);
    } else {
      response = {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: '接口不存在'
        })
      };
    }
    
    // 添加CORS头
    response.headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      ...(response.headers || {})
    };
    
    return response;
  } catch (e) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: `服务器错误: ${e.message}`
      })
    };
  }
}

