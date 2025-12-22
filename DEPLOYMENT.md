# 部署指南

## 前置准备

1. 阿里云ESA账号
2. 已配置的边缘存储服务
3. 豆包API密钥（已在config.js中配置）

## 部署步骤

### 1. 部署边缘函数

1. 登录阿里云ESA控制台
2. 进入边缘函数管理
3. 创建新函数：
   - 函数名称：`drug-recognize`
   - 运行时：Node.js 18
   - 入口文件：`index.js`
4. 上传 `edge-function` 目录下的所有文件
5. 配置环境变量（如需要）
6. 部署函数

### 2. 实现边缘存储操作

根据阿里云ESA边缘存储的实际API，修改 `edge-function/utils/storage.js`：

```javascript
// 示例：假设边缘存储提供edgeStorage对象
import { edgeStorage } from '@aliyun/esa-storage';

export async function saveRecord(record) {
  const id = record.id || generateId();
  const timestamp = record.timestamp || Date.now();
  const key = `${config.storage.prefix}${timestamp}:${id}`;
  
  // 保存主记录
  await edgeStorage.set(key, JSON.stringify(record));
  
  // 创建时间索引
  const timeIndexKey = `${config.storage.indexPrefix}time:${timestamp}`;
  await edgeStorage.set(timeIndexKey, id);
  
  // 如果药品名称存在，创建名称索引
  if (record.mergedData && record.mergedData.name) {
    const nameIndexKey = `${config.storage.indexPrefix}name:${record.mergedData.name}:${timestamp}`;
    await edgeStorage.set(nameIndexKey, id);
  }
  
  return { id, key };
}

export async function getRecord(id) {
  // 通过索引查找key
  const keys = await edgeStorage.list(`${config.storage.prefix}*:${id}`);
  if (keys.length === 0) return null;
  
  const recordStr = await edgeStorage.get(keys[0]);
  return recordStr ? JSON.parse(recordStr) : null;
}

export async function getHistoryRecords(page = 1, limit = 20, search = '') {
  let keys = [];
  
  if (search) {
    // 按名称搜索
    const nameKeys = await edgeStorage.list(`${config.storage.indexPrefix}name:${search}:*`);
    keys = nameKeys.map(k => {
      const id = await edgeStorage.get(k);
      return `${config.storage.prefix}*:${id}`;
    });
  } else {
    // 按时间索引查询
    const timeKeys = await edgeStorage.list(`${config.storage.indexPrefix}time:*`);
    keys = timeKeys.map(k => {
      const id = await edgeStorage.get(k);
      return `${config.storage.prefix}*:${id}`;
    });
  }
  
  // 排序（时间倒序）
  keys.sort((a, b) => {
    const timeA = parseInt(a.split(':')[1]);
    const timeB = parseInt(b.split(':')[1]);
    return timeB - timeA;
  });
  
  // 分页
  const start = (page - 1) * limit;
  const end = start + limit;
  const pageKeys = keys.slice(start, end);
  
  // 获取记录
  const records = await Promise.all(
    pageKeys.map(async (key) => {
      const recordStr = await edgeStorage.get(key);
      return recordStr ? JSON.parse(recordStr) : null;
    })
  );
  
  return {
    records: records.filter(r => r !== null),
    total: keys.length,
    page: page,
    limit: limit
  };
}
```

### 3. 部署前端应用

1. 构建前端应用：
   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. 配置API地址：
   - 复制 `.env.example` 为 `.env`
   - 修改 `VITE_API_BASE_URL` 为实际的边缘函数URL

3. 重新构建：
   ```bash
   npm run build
   ```

4. 部署到阿里云ESA Pages：
   - 登录阿里云ESA控制台
   - 进入Pages管理
   - 创建新站点或更新现有站点
   - 上传 `frontend/dist` 目录下的所有文件
   - 配置域名和HTTPS

### 4. 配置CORS（如需要）

如果前端和边缘函数不在同一域名下，确保边缘函数已正确配置CORS。

当前配置允许所有来源（`Access-Control-Allow-Origin: *`），生产环境建议限制为前端域名。

## 测试

1. 访问前端应用URL
2. 上传一张或多张药品图片
3. 查看识别结果
4. 测试历史记录查询功能
5. 测试搜索功能

## 故障排查

### 问题1：API调用失败

- 检查边缘函数URL是否正确
- 检查网络连接
- 查看边缘函数日志

### 问题2：识别结果为空

- 检查豆包API配置是否正确
- 检查图片格式是否支持
- 查看边缘函数日志中的API响应

### 问题3：历史记录无法保存/查询

- 检查边缘存储API实现是否正确
- 检查存储权限配置
- 查看边缘函数日志

### 问题4：CORS错误

- 检查边缘函数的CORS配置
- 确认前端域名已添加到允许列表

## 性能优化建议

1. **图片压缩**：在前端上传前压缩图片，减少传输时间
2. **并发控制**：限制同时识别的图片数量
3. **缓存策略**：对历史记录查询结果进行缓存
4. **CDN加速**：使用CDN加速前端资源加载

