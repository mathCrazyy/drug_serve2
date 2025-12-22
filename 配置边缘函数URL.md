# 配置边缘函数URL - 解决404错误

## 问题说明

前端应用已成功部署，但出现 `识别失败: HTTP error! status: 404` 错误。

**原因**：前端没有配置边缘函数的API地址，导致请求失败。

## 解决方案

### 方案1：在ESA Pages中配置环境变量（推荐）

1. 登录阿里云ESA Pages控制台
2. 进入您的站点设置
3. 找到 **环境变量** 或 **Environment Variables** 配置
4. 添加环境变量：
   ```
   变量名: VITE_API_BASE_URL
   变量值: https://your-edge-function-url.esa.aliyuncs.com
   ```
   （将 `your-edge-function-url` 替换为实际的边缘函数URL）
5. 保存配置
6. 重新触发部署（系统会自动使用新的环境变量重新构建）

### 方案2：如果边缘函数还未部署

#### 步骤1：部署边缘函数

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

#### 步骤2：在前端配置边缘函数URL

按照 **方案1** 的步骤，在ESA Pages中配置环境变量 `VITE_API_BASE_URL`。

### 方案3：临时测试（仅开发环境）

如果需要快速测试，可以修改代码（不推荐用于生产环境）：

1. 修改 `frontend/src/services/api.ts`：
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-edge-function-url.esa.aliyuncs.com';
   ```
2. 重新构建和部署

## 验证配置

配置完成后：

1. 重新部署前端应用
2. 访问应用URL
3. 上传图片测试识别功能
4. 如果仍然404，检查：
   - 边缘函数URL是否正确
   - 边缘函数是否已部署
   - 环境变量是否已保存
   - 是否已重新触发部署

## 边缘函数路由

确保边缘函数支持以下路由：
- `POST /recognize` - 识别药品图片
- `GET /history` - 获取历史记录列表
- `GET /history/:id` - 获取单条记录详情

## 注意事项

1. **CORS配置**：确保边缘函数允许前端域名的跨域请求
2. **HTTPS**：生产环境必须使用HTTPS
3. **环境变量**：不要在代码中硬编码API地址，使用环境变量

