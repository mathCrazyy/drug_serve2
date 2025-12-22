# 药品识别系统

基于阿里云ESA边缘生态产品构建的药品图片识别应用，支持多张图片同时上传，通过豆包API识别药品信息。

## 功能特性

1. **图片上传**
   - 支持手机拍照
   - 支持从本地选择图片
   - 支持多张图片同时上传
   - 支持拖拽上传

2. **药品识别**
   - 通过豆包API识别图片中的药品信息
   - 支持识别：药品名称、生产日期、截止日期、批号、生产厂家、品牌、剂型、规格
   - 多张图片智能合并识别结果

3. **历史记录**
   - 保存所有识别记录
   - 支持按时间查询
   - 支持按药品名称搜索
   - 分页显示

## 技术栈

### 前端
- React 18 + TypeScript
- Vite
- 原生CSS（响应式设计）

### 边缘函数
- Node.js 18+
- ES Modules

### 存储
- 阿里云边缘存储（KV）

## 项目结构

```
drug_serve2/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── services/        # API服务
│   │   ├── types/           # TypeScript类型
│   │   ├── utils/           # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── edge-function/            # 边缘函数
│   ├── handlers/            # 处理函数
│   ├── utils/              # 工具函数
│   ├── index.js            # 主入口
│   └── config.js           # 配置文件
└── README.md
```

## 配置说明

### 边缘函数配置

编辑 `edge-function/config.js`：

```javascript
export default {
  doubaoApi: {
    baseUrl: 'https://api.chatfire.site/v1/chat/completions',
    apiKey: 'your-api-key',
    model: 'doubao-1.5-vision-pro-250328',
    maxTokens: 1000,
    temperature: 0.1
  },
  storage: {
    prefix: 'drug_record:',
    indexPrefix: 'drug_index:'
  }
}
```

### 前端API配置

创建 `frontend/.env` 文件：

```
VITE_API_BASE_URL=https://your-edge-function-url.com
```

## 安装和运行

### 前端开发

```bash
cd frontend
npm install
npm run dev
```

### 前端构建

```bash
cd frontend
npm run build
```

构建产物在 `frontend/dist` 目录，可部署到阿里云ESA Pages。

### 边缘函数部署

1. 将 `edge-function` 目录部署到阿里云ESA Functions
2. 配置运行时为 Node.js 18+
3. 配置入口文件为 `index.js`
4. 根据阿里云ESA边缘存储的实际API，实现 `edge-function/utils/storage.js` 中的存储操作

## 边缘存储实现

`edge-function/utils/storage.js` 中的函数需要根据阿里云ESA边缘存储的实际API实现：

- `saveRecord(record)`: 保存识别记录
- `getRecord(id)`: 获取单条记录
- `getHistoryRecords(page, limit, search)`: 查询历史记录

边缘存储通常提供以下接口：
- `set(key, value)`: 设置键值对
- `get(key)`: 获取值
- `list(prefix)`: 列出指定前缀的所有键
- `delete(key)`: 删除键值对

## API接口

### POST /recognize

识别药品图片

**请求体：**
```json
{
  "images": [
    {
      "base64": "base64编码的图片",
      "name": "图片文件名",
      "type": "image/jpeg"
    }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "记录ID",
    "mergedData": {
      "name": "药品名称",
      "production_date": "生产日期",
      "expiry_date": "截止日期",
      ...
    },
    "recognitionResults": [...],
    "timestamp": 1234567890
  }
}
```

### GET /history

获取历史记录列表

**查询参数：**
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）
- `search`: 搜索关键词（可选）

**响应：**
```json
{
  "success": true,
  "data": {
    "records": [...],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### GET /history/:id

获取单条记录详情

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "记录ID",
    "timestamp": 1234567890,
    "images": [...],
    "recognitionResults": [...],
    "mergedData": {...}
  }
}
```

## 注意事项

1. **边缘存储实现**：需要根据阿里云ESA边缘存储的实际API实现存储操作函数
2. **API密钥安全**：生产环境请使用环境变量或密钥管理服务存储API密钥
3. **CORS配置**：边缘函数已配置CORS，如需限制来源请修改 `edge-function/index.js`
4. **图片大小限制**：前端默认限制10MB，可在 `frontend/src/utils/imageUtils.ts` 中修改

## 许可证

MIT

