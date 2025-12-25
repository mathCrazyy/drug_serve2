# ESA边缘存储配置指南

## 📋 概述

阿里云ESA（Edge Security Acceleration）边缘存储提供了持久化的Key-Value存储服务。本指南将帮助您配置和使用ESA边缘存储API。

## 🔍 第一步：确认边缘存储是否可用

### 1. 登录ESA控制台

1. 访问 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 登录您的账号

### 2. 检查边缘存储服务

1. 在左侧导航栏，找到 **边缘计算** > **边缘存储** 或 **Edge Storage**
2. 如果看到边缘存储页面，说明服务已开通
3. 如果提示需要开通，请按照提示完成开通流程

### 3. 创建存储空间（NameSpace）

1. 在边缘存储页面，点击 **创建存储空间** 或 **Create Namespace**
2. 输入存储空间名称（例如：`drug-storage`）
3. 输入描述（可选）
4. 点击 **确定** 创建
5. **重要**：记住您创建的存储空间名称，后续配置需要使用

## ⚙️ 第二步：配置边缘函数环境变量

### 方式1：使用ESA EdgeKV API（推荐）

如果ESA提供了EdgeKV类，需要配置以下环境变量：

1. 登录ESA控制台
2. 进入 **边缘函数** 管理页面
3. 找到您的边缘函数（例如：`drug-recognize`）
4. 点击函数名称进入详情页
5. 找到 **环境变量** 或 **Environment Variables** 配置
6. 添加以下环境变量：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `EDGE_KV_NAMESPACE` | `drug-storage` | 您创建的存储空间名称 |
| `STORAGE_PREFIX` | `drug_record:` | 存储key前缀（可选） |
| `STORAGE_INDEX_PREFIX` | `drug_index:` | 索引key前缀（可选） |

### 方式2：使用HTTP API（如果ESA提供）

如果ESA边缘存储提供HTTP API，配置以下环境变量：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `EDGE_STORAGE_ENDPOINT` | `https://storage-api.esa.aliyun.com` | 存储API端点（需要替换为实际地址） |
| `STORAGE_PREFIX` | `drug_record:` | 存储key前缀（可选） |
| `STORAGE_INDEX_PREFIX` | `drug_index:` | 索引key前缀（可选） |

### 方式3：使用全局对象（如果ESA提供）

如果ESA在边缘函数运行时提供了全局存储对象，代码会自动检测并使用，无需额外配置。

## 🔧 第三步：更新边缘函数代码

当前代码已经支持多种存储方式，会自动检测并使用可用的存储API。如果ESA提供了特定的API，可能需要调整代码。

### 检查代码是否支持EdgeKV

当前代码已经包含EdgeKV支持，会自动检测：
- 如果配置了 `EDGE_KV_NAMESPACE` 环境变量
- 并且全局存在 `EdgeKV` 类
- 代码会自动使用EdgeKV API

### 如果EdgeKV类不可用

如果ESA的EdgeKV需要通过其他方式导入，可能需要修改代码。请参考ESA官方文档：
- [使用边缘存储API管理存储空间](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api)

## 🧪 第四步：测试存储功能

### 方法1：通过应用测试

1. 部署更新后的边缘函数
2. 在前端应用中保存一个药品
3. 查看家庭药品清单
4. 如果能看到保存的药品，说明存储正常工作

### 方法2：通过边缘函数日志测试

1. 在边缘函数中添加测试代码（临时）：
```javascript
// 在边缘函数根路径添加测试
if (pathname === '/test-storage') {
  const storage = getEdgeStorage();
  await storage.set('test-key', 'test-value');
  const value = await storage.get('test-key');
  return new Response(JSON.stringify({ 
    success: true, 
    storageType: storage.constructor.name,
    testValue: value 
  }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}
```

2. 访问 `https://your-function-url.esa.aliyun.com/test-storage`
3. 查看返回结果，确认存储类型和测试值

### 方法3：查看边缘函数日志

1. 在ESA控制台找到边缘函数
2. 进入 **日志** 或 **Logs** 页面
3. 查看是否有存储相关的错误或警告信息
4. 如果看到 `⚠️ 警告：使用内存存储`，说明未配置真正的边缘存储

## 📊 第五步：验证存储类型

代码会自动检测使用的存储类型。您可以通过以下方式确认：

### 查看日志输出

在边缘函数日志中查找以下信息：
- `[saveDrugToInventory]` - 保存药品的日志
- `[getHistoryRecords]` - 查询记录的日志
- `⚠️ 警告：使用内存存储` - 如果看到此警告，说明使用的是内存存储（不会持久化）

### 检查存储持久化

1. 保存一个药品
2. 等待几分钟
3. 重启边缘函数（如果有此功能）
4. 再次查询历史记录
5. 如果数据还在，说明使用了持久化存储
6. 如果数据丢失，说明使用的是内存存储

## 🐛 常见问题

### Q1: 如何确认是否使用了真正的边缘存储？

**A:** 查看边缘函数日志，如果看到 `⚠️ 警告：使用内存存储`，说明使用的是内存存储。需要配置 `EDGE_KV_NAMESPACE` 或 `EDGE_STORAGE_ENDPOINT` 环境变量。

### Q2: 配置了环境变量，但数据还是不持久化？

**A:** 可能的原因：
1. EdgeKV类不可用 - 检查ESA文档，确认EdgeKV的使用方式
2. 环境变量名称错误 - 确认变量名完全匹配（区分大小写）
3. 存储空间名称错误 - 确认NameSpace名称与创建时一致
4. 需要重新部署函数 - 修改环境变量后需要重新部署

### Q3: 如何查看当前使用的存储类型？

**A:** 在边缘函数日志中查找存储相关的日志，或者添加测试端点查看存储类型。

### Q4: EdgeKV API的具体使用方法？

**A:** 参考ESA官方文档：
- [边缘存储API文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api)
- 根据文档确认EdgeKV类的导入方式和使用方法

### Q5: 如果ESA没有提供EdgeKV，怎么办？

**A:** 代码会自动降级到内存存储（仅用于测试）。如果需要真正的持久化，可以：
1. 联系阿里云技术支持，确认ESA边缘存储的具体API
2. 根据实际API修改 `getEdgeStorage()` 函数
3. 或者使用外部存储服务（如阿里云OSS、数据库等）

## 📝 配置检查清单

- [ ] 已在ESA控制台开通边缘存储服务
- [ ] 已创建存储空间（NameSpace）
- [ ] 已记录存储空间名称
- [ ] 已在边缘函数中配置 `EDGE_KV_NAMESPACE` 环境变量（或 `EDGE_STORAGE_ENDPOINT`）
- [ ] 已重新部署边缘函数
- [ ] 已测试保存功能
- [ ] 已验证数据持久化（重启后数据仍在）

## 🔗 相关链接

- [ESA边缘存储官方文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/get-started-with-edge-kv)
- [边缘存储API文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api)
- [ESA控制台](https://esa.console.aliyun.com/)

## 💡 提示

1. **存储空间名称**：建议使用有意义的名称，如 `drug-storage`、`medicine-inventory` 等
2. **环境变量**：修改环境变量后，必须重新部署边缘函数才能生效
3. **测试**：建议先在测试环境验证存储功能，再部署到生产环境
4. **日志**：遇到问题时，优先查看边缘函数日志，通常会有详细的错误信息

