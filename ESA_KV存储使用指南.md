# ESA KV存储使用指南 - 与函数和Pages配合

## 📋 概述

本指南将详细说明如何在阿里云ESA中使用KV存储，与边缘函数（Edge Functions）和Pages配合，实现数据的持久化存储。

根据您提供的控制台截图，您已经创建了名为 **`drug-storage`** 的KV存储空间。现在需要配置边缘函数以使用这个存储空间。

## 🎯 架构说明

```
前端Pages → 边缘函数API → EdgeKV存储
   ↓            ↓              ↓
用户界面    业务逻辑处理    数据持久化
```

**工作流程：**
1. 用户在Pages前端界面操作（上传图片、保存药品等）
2. 前端通过HTTP请求调用边缘函数API
3. 边缘函数使用EdgeKV API读写KV存储
4. 数据持久化保存在KV存储空间中

## ⚙️ 第一步：配置边缘函数环境变量

### 1. 登录ESA控制台

1. 访问 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 登录您的账号

### 2. 进入边缘函数配置

1. 在左侧导航栏，点击 **边缘计算** > **函数和 Pages NEW** 或 **Edge Functions**
2. 找到您的边缘函数（例如：`drug-recognize`）
3. 点击函数名称进入详情页

### 3. 配置环境变量

1. 在函数详情页，找到 **环境变量** 或 **Environment Variables** 配置
2. 点击 **添加环境变量** 或 **Add Environment Variable**
3. 添加以下环境变量：

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `EDGE_KV_NAMESPACE` | `drug-storage` | **重要**：您创建的KV存储空间名称（必须与控制台中的名称完全一致） |
| `STORAGE_PREFIX` | `drug_record:` | 存储key的前缀（可选，用于组织数据） |
| `STORAGE_INDEX_PREFIX` | `drug_index:` | 索引key的前缀（可选，用于快速查询） |
| `DOUBAO_API_BASE_URL` | `https://api.chatfire.site/v1/chat/completions` | 豆包API地址 |
| `DOUBAO_API_KEY` | `your-api-key` | 豆包API密钥 |
| `DOUBAO_MODEL` | `doubao-seed-1-6-vision-250815` | 使用的模型 |

**重要提示：**
- `EDGE_KV_NAMESPACE` 的值必须与您在KV存储控制台中创建的空间名称完全一致（区分大小写）
- 根据您的截图，应该设置为 `drug-storage`

### 4. 保存并重新部署

1. 保存所有环境变量
2. **重要**：修改环境变量后，必须重新部署边缘函数才能生效
3. 点击 **部署** 或 **Deploy** 按钮
4. 等待部署完成

## 🔧 第二步：验证EdgeKV API可用性

### 方法1：查看边缘函数日志

1. 在边缘函数详情页，找到 **日志** 或 **Logs** 标签
2. 查看日志输出，查找以下信息：
   - `[getEdgeStorage] 使用EdgeKV API, namespace: drug-storage` - 说明成功使用EdgeKV
   - `⚠️ 警告：使用内存存储` - 说明未使用EdgeKV，需要检查配置

### 方法2：添加测试端点（临时）

在边缘函数代码中添加测试端点（用于验证）：

```javascript
// 在边缘函数的fetch handler中添加
if (pathname === '/test-kv') {
  const storage = getEdgeStorage();
  const testKey = 'test-key-' + Date.now();
  const testValue = 'test-value-' + Date.now();
  
  try {
    await storage.set(testKey, testValue);
    const retrievedValue = await storage.get(testKey);
    
    return new Response(JSON.stringify({
      success: true,
      storageType: 'EdgeKV',
      namespace: getEnv('EDGE_KV_NAMESPACE', 'not-set'),
      testKey: testKey,
      savedValue: testValue,
      retrievedValue: retrievedValue,
      match: testValue === retrievedValue
    }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      success: false,
      error: e.message,
      stack: e.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
```

访问测试端点：
```
https://your-function-url.esa.aliyun.com/test-kv
```

如果返回 `success: true` 且 `match: true`，说明EdgeKV正常工作。

## 📊 第三步：在控制台验证数据

### 1. 查看KV存储数据

1. 在ESA控制台，进入 **边缘计算** > **KV 存储**
2. 点击您创建的存储空间 `drug-storage`
3. 在 **KV 数据** 部分，应该能看到保存的数据

### 2. 数据格式说明

保存的药品数据会以以下格式存储：

**主记录：**
- Key: `drug_record:{timestamp}:{id}`
- Value: JSON格式的完整药品记录

**药品清单记录：**
- Key: `drug_record:drug:{id}`
- Value: JSON格式的药品记录

**索引：**
- Key: `drug_index:all:{timestamp}:{id}`
- Value: `{id}`

## 🔄 第四步：与Pages配合使用

### 架构流程

```
用户操作（Pages前端）
    ↓
HTTP请求（fetch）
    ↓
边缘函数API（/recognize, /drugs/save, /history）
    ↓
EdgeKV存储（读写数据）
    ↓
返回结果给前端
```

### 前端调用示例

前端代码已经实现了与边缘函数的交互，无需修改。前端通过以下API调用边缘函数：

1. **识别药品**：`POST /recognize`
2. **保存药品**：`POST /drugs/save`
3. **查询历史**：`GET /history`
4. **查询详情**：`GET /history/:id`

### Pages环境变量配置

在ESA Pages中，需要配置边缘函数的URL：

1. 进入 **Pages** 管理页面
2. 找到您的站点
3. 进入 **环境变量** 配置
4. 添加：
   - 变量名：`VITE_API_BASE_URL`
   - 变量值：您的边缘函数URL（例如：`https://xxx.esa.aliyun.com`）

## 🧪 第五步：测试完整流程

### 测试步骤

1. **保存药品**
   - 在前端上传图片并识别
   - 点击"保存到家庭药品清单"
   - 查看是否显示"已保存"提示

2. **查看清单**
   - 点击"查看家庭药品清单"
   - 确认能看到刚才保存的药品

3. **验证持久化**
   - 在KV存储控制台查看是否有数据
   - 等待几分钟后再次查看清单，数据应该还在

4. **验证跨会话**
   - 关闭浏览器
   - 重新打开应用
   - 查看清单，数据应该还在

## 🐛 常见问题排查

### Q1: 配置了EDGE_KV_NAMESPACE，但日志显示"使用内存存储"

**可能原因：**
1. EdgeKV类在运行时不可用
2. 环境变量名称错误或值不正确
3. 未重新部署函数

**解决方法：**
1. 确认环境变量名称完全匹配：`EDGE_KV_NAMESPACE`
2. 确认变量值与存储空间名称完全一致（区分大小写）
3. 重新部署边缘函数
4. 查看边缘函数日志，确认是否有EdgeKV相关的错误

### Q2: 保存成功，但在KV控制台看不到数据

**可能原因：**
1. 数据保存到了其他存储空间
2. Key的前缀导致数据在列表中不显示
3. 需要刷新控制台页面

**解决方法：**
1. 在KV控制台的搜索框中，输入前缀 `drug_record:` 进行搜索
2. 确认存储空间名称是否正确
3. 查看边缘函数日志，确认保存的key名称

### Q3: 数据保存后，查询时找不到

**可能原因：**
1. 查询逻辑只返回 `saved=true` 的记录
2. 保存时未正确设置 `saved=true`
3. Key的格式不匹配

**解决方法：**
1. 查看边缘函数日志，确认保存时是否设置了 `saved=true`
2. 检查 `getHistoryRecords` 函数的查询逻辑
3. 确认存储的key格式是否正确

### Q4: EdgeKV API调用失败

**可能原因：**
1. EdgeKV类不可用
2. namespace名称错误
3. Key格式不符合要求（Key只能包含字母、数字、`-`和`_`）

**解决方法：**
1. 确认EdgeKV类在运行时可用（查看日志）
2. 确认namespace名称与创建时完全一致
3. 检查key格式，确保符合要求（不能包含空格、`/`、`?`等特殊字符）

## 📝 EdgeKV限制说明

根据ESA官方文档，EdgeKV有以下限制：

1. **存储容量**
   - 单个账号：最大10 GB
   - 单个存储空间：最大1 GB

2. **Key-Value限制**
   - 单个Key：最大512字节，只允许字母、数字、`-`和`_`
   - 单个Value：最大1.8 MB

3. **Key命名规则**
   - 不能包含空格
   - 不能包含 `/`、`?` 等特殊字符
   - 当前代码使用的key格式：`drug_record:{timestamp}:{id}` 符合要求

## ✅ 配置检查清单

- [ ] 已在KV存储控制台创建存储空间 `drug-storage`
- [ ] 已在边缘函数中配置 `EDGE_KV_NAMESPACE=drug-storage`
- [ ] 已重新部署边缘函数
- [ ] 已查看边缘函数日志，确认使用EdgeKV API
- [ ] 已在KV存储控制台验证数据保存
- [ ] 已测试保存和查询功能
- [ ] 已验证数据持久化（重启后数据仍在）

## 🔗 相关链接

- [ESA边缘存储入门](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/get-started-with-edge-kv)
- [边缘存储API文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/user-guide/edge-storage-api)
- [ESA控制台](https://esa.console.aliyun.com/)

## 💡 最佳实践

1. **命名规范**：使用有意义的存储空间名称和key前缀
2. **数据组织**：使用前缀组织数据，便于查询和管理
3. **错误处理**：代码已包含错误处理，确保存储失败不影响主流程
4. **日志记录**：查看边缘函数日志，及时发现问题
5. **定期验证**：定期在KV控制台查看数据，确认存储正常

