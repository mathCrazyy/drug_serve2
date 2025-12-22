import { getHistoryRecords, getRecord } from '../utils/storage.js';

export async function handleHistory(request, pathname, searchParams) {
  try {
    // 获取单条记录详情
    if (pathname.startsWith('/history/')) {
      const id = pathname.split('/history/')[1];
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: '缺少记录ID'
          })
        };
      }
      
      const record = await getRecord(id);
      if (!record) {
        return {
          statusCode: 404,
          body: JSON.stringify({
            success: false,
            error: '记录不存在'
          })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: record
        })
      };
    }
    
    // 获取历史记录列表
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    
    const result = await getHistoryRecords(page, limit, search);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data: result
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: `查询失败: ${e.message}`
      })
    };
  }
}

