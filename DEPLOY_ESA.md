# 阿里云ESA部署指南

## 部署步骤

### 1. 部署边缘函数

1. 登录[阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 进入 **边缘函数** 管理页面
3. 点击 **创建函数**
4. 配置函数信息：
   - 函数名称：`drug-recognize`
   - 运行时：Node.js 18
   - 入口文件：`index.js`
5. 上传 `edge-function` 目录下的所有文件
6. 配置环境变量：
   ```
   DOUBAO_API_BASE_URL=https://api.chatfire.site/v1/chat/completions
   DOUBAO_API_KEY=your-api-key-here
   DOUBAO_MODEL=doubao-1.5-vision-pro-250328
   DOUBAO_MAX_TOKENS=1000
   DOUBAO_TEMPERATURE=0.1
   STORAGE_PREFIX=drug_record:
   STORAGE_INDEX_PREFIX=drug_index:
   ```
7. 部署函数，获取函数URL（例如：`https://xxx.esa.aliyuncs.com`）

### 2. 实现边缘存储

根据阿里云ESA边缘存储的实际API，修改 `edge-function/utils/storage.js` 中的实现。

参考实现示例（需要根据实际API调整）：

```javascript
// 假设边缘存储提供 edgeStorage 对象
export async function saveRecord(record) {
  const id = record.id || generateId();
  const timestamp = record.timestamp || Date.now();
  const key = `${config.storage.prefix}${timestamp}:${id}`;
  
  await edgeStorage.set(key, JSON.stringify(record));
  
  // 创建索引...
  return { id, key };
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
   - 创建 `frontend/.env` 文件
   - 设置 `VITE_API_BASE_URL` 为边缘函数URL
   - 重新构建：`npm run build`

3. 部署到阿里云ESA Pages：
   - 登录[阿里云ESA控制台](https://esa.console.aliyun.com/)
   - 进入 **Pages** 管理页面
   - 点击 **创建站点**
   - 上传 `frontend/dist` 目录下的所有文件
   - 配置自定义域名（可选）
   - 部署完成，获取访问URL

### 4. 配置CORS

确保边缘函数允许前端域名的跨域请求。当前配置允许所有来源，生产环境建议限制为前端域名。

---

## 部署后URL

部署完成后，请更新README.md中的以下信息：

1. **在线演示URL**：替换 `[部署后提供URL]` 为实际的Pages访问地址
2. **边缘函数URL**：在环境变量配置中记录

---

## 验证部署

1. 访问前端应用URL
2. 上传一张药品图片测试识别功能
3. 测试多张图片上传和合并
4. 测试历史记录查询功能
5. 测试搜索功能

---

## 故障排查

### 问题1：API调用失败

- 检查边缘函数URL是否正确配置
- 检查环境变量是否设置
- 查看边缘函数日志

### 问题2：识别结果为空

- 检查豆包API配置是否正确
- 检查图片格式是否支持
- 查看边缘函数日志中的API响应

### 问题3：历史记录无法保存/查询

- 检查边缘存储API实现是否正确
- 检查存储权限配置
- 查看边缘函数日志

