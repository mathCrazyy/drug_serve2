# 药品识别系统

基于阿里云ESA边缘生态产品构建的药品图片识别应用，支持多张图片同时上传，通过豆包API识别药品信息。

## 📦 项目信息

- **GitHub仓库**: [https://github.com/mathCrazyy/drug_serve2](https://github.com/mathCrazyy/drug_serve2)
- **在线演示**: [部署后提供URL]
- **技术栈**: React + TypeScript + 阿里云ESA边缘计算

---

## 🏆 项目介绍

### 实用性 ⭐⭐⭐⭐⭐

本项目解决了药品信息管理的实际痛点：

1. **快速识别药品信息**：用户只需拍照即可自动识别药品名称、生产日期、有效期等关键信息，无需手动输入，大大提升效率。

2. **多图智能合并**：药品信息可能分布在包装盒的不同面，系统支持同时上传多张图片，智能合并识别结果，确保信息完整。

3. **历史记录管理**：所有识别记录自动保存，支持按时间查询和按药品名称搜索，方便用户管理药品信息，特别适合家庭药箱管理。

4. **移动端友好**：支持手机拍照和本地选择，响应式设计适配各种设备，随时随地可用。

**应用场景**：
- 家庭药箱管理：快速录入药品信息，避免过期药品
- 药店管理：批量录入药品信息，提高工作效率
- 医疗记录：辅助医护人员快速记录药品信息
- 老年人用药：简化药品信息录入流程

### 创意性 ⭐⭐⭐⭐⭐

1. **边缘计算架构**：充分利用阿里云ESA的边缘计算能力，将识别服务部署在边缘节点，大幅降低延迟，提升用户体验。

2. **多图智能合并算法**：
   - 药品名称：取最长的非空值（通常更完整）
   - 生产日期：取最早日期（确保准确性）
   - 截止日期：取最晚日期（确保安全）
   - 其他字段：智能去重合并，优先非空值

3. **零图片存储设计**：只存储识别结果和元数据，不存储图片本身，既保护隐私又节省存储成本。

4. **渐进式Web应用**：支持离线缓存，提升访问速度，提供接近原生应用的体验。

### 技术深度 ⭐⭐⭐⭐⭐

1. **边缘计算架构**：
   - **Pages**：静态资源边缘分发，全球加速
   - **边缘函数**：Node.js运行时，低延迟计算
   - **边缘存储**：KV存储，快速读写
   - **缓存策略**：多层缓存优化，提升性能

2. **AI视觉识别**：
   - 集成豆包多模态大模型（doubao-seed-1-6-vision-250815）
   - 支持流式响应（SSE）和普通JSON响应
   - 智能解析JSON和正则表达式提取
   - 并发处理多张图片，提升识别效率

3. **前端工程化**：
   - React 18 + TypeScript：类型安全，开发体验好
   - Vite构建：快速构建，热更新
   - 组件化设计：可复用、易维护
   - 响应式设计：适配各种屏幕尺寸

4. **数据安全**：
   - 环境变量管理敏感信息
   - Git历史清理，保护API密钥
   - CORS安全配置
   - 输入验证和错误处理

5. **性能优化**：
   - 图片Base64编码，减少请求次数
   - 并发API调用，提升识别速度
   - 分页查询，优化大数据量处理
   - 前端代码压缩和代码分割

---

## 🎯 功能特性

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

---

## 🛠 技术栈

### 前端
- React 18 + TypeScript
- Vite
- 原生CSS（响应式设计）

### 边缘函数
- Node.js 18+
- ES Modules

### 存储
- 阿里云边缘存储（KV）

### AI服务
- 豆包多模态大模型 API

---

## 📁 项目结构

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

---

## ⚙️ 配置说明

### 边缘函数配置

**方式1：使用环境变量（推荐，生产环境）**

在阿里云ESA边缘函数中配置以下环境变量：

```
DOUBAO_API_BASE_URL=https://api.chatfire.site/v1/chat/completions
DOUBAO_API_KEY=your-api-key-here
DOUBAO_MODEL=doubao-seed-1-6-vision-250815
DOUBAO_MAX_TOKENS=1000
DOUBAO_TEMPERATURE=0.1
STORAGE_PREFIX=drug_record:
STORAGE_INDEX_PREFIX=drug_index:
```

**方式2：直接编辑配置文件（仅开发环境）**

1. 复制 `edge-function/config.example.js` 为 `edge-function/config.js`
2. 编辑 `edge-function/config.js` 并填入实际配置

⚠️ **注意**：`config.js` 已添加到 `.gitignore`，不会被提交到Git仓库。

### 前端API配置

创建 `frontend/.env` 文件：

```
VITE_API_BASE_URL=https://your-edge-function-url.com
```

⚠️ **注意**：`.env` 文件已添加到 `.gitignore`，不会被提交到Git仓库。

---

## 🚀 安装和运行

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

---

## 📡 API接口

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

### GET /history/:id

获取单条记录详情

---

## 📝 注意事项

1. **边缘存储实现**：需要根据阿里云ESA边缘存储的实际API实现存储操作函数
2. **API密钥安全**：生产环境请使用环境变量或密钥管理服务存储API密钥
3. **CORS配置**：边缘函数已配置CORS，如需限制来源请修改 `edge-function/index.js`
4. **图片大小限制**：前端默认限制10MB，可在 `frontend/src/utils/imageUtils.ts` 中修改

---

## 📄 许可证

MIT

---

## 🙏 致谢

**本项目由阿里云ESA提供加速、计算和保护**

![阿里云ESA](https://help-static-aliyun-doc.aliyuncs.com/assets/img/zh-CN/123456789.png)

> 注：请替换为阿里云ESA官方Logo图片URL

阿里云ESA（Edge Security Acceleration）边缘安全加速平台为项目提供了：
- **边缘计算**：低延迟、高性能的计算能力
- **边缘存储**：快速、可靠的数据存储服务
- **边缘加速**：全球CDN加速，提升访问速度
- **安全防护**：DDoS防护、WAF等安全能力

---

## 📞 联系方式

- **GitHub**: [mathCrazyy](https://github.com/mathCrazyy)
- **项目地址**: [https://github.com/mathCrazyy/drug_serve2](https://github.com/mathCrazyy/drug_serve2)
