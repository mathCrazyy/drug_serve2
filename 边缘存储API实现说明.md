# 边缘存储API实现说明

## 实现方案

已实现了一个兼容多种边缘存储API方式的封装函数 `getEdgeStorage()`，支持以下方式：

### 方式1: 全局edgeStorage对象（推荐）

如果ESA边缘函数提供了全局 `edgeStorage` 对象：

```javascript
// 直接使用全局对象
await edgeStorage.set(key, value);
const value = await edgeStorage.get(key);
const keys = await edgeStorage.list(prefix);
await edgeStorage.delete(key);
```

### 方式2: 通过globalThis访问

```javascript
// 通过globalThis访问
const storage = globalThis.edgeStorage;
```

### 方式3: 通过HTTP API（如果ESA提供）

如果ESA边缘存储提供HTTP API，可以通过环境变量配置：

```bash
EDGE_STORAGE_ENDPOINT=https://storage-api.esa.aliyun.com
```

代码会自动使用fetch调用存储API。

### 方式4: 内存存储（后备方案）

如果以上方式都不可用，会使用内存存储作为后备（数据不会持久化，仅用于测试）。

## API接口规范

边缘存储对象需要实现以下方法：

```javascript
{
  // 设置值
  async set(key: string, value: string): Promise<void>
  
  // 获取值
  async get(key: string): Promise<string | null>
  
  // 删除值
  async delete(key: string): Promise<void>
  
  // 列出所有匹配前缀的key
  async list(prefix: string): Promise<string[]>
}
```

## 配置说明

### 环境变量

可以在边缘函数控制台配置以下环境变量：

```
EDGE_STORAGE_ENDPOINT=https://storage-api.esa.aliyun.com  # 如果使用HTTP API
STORAGE_PREFIX=drug_record:  # 存储key前缀
STORAGE_INDEX_PREFIX=drug_index:  # 索引key前缀
```

## 使用示例

代码已经自动使用边缘存储API，无需额外配置。如果ESA提供了特定的存储API，只需要：

1. **如果ESA提供全局edgeStorage对象**：
   - 代码会自动检测并使用
   - 无需修改

2. **如果ESA提供HTTP API**：
   - 在环境变量中配置 `EDGE_STORAGE_ENDPOINT`
   - 代码会自动使用fetch调用

3. **如果需要自定义实现**：
   - 修改 `getEdgeStorage()` 函数
   - 根据ESA实际提供的API实现

## 数据存储结构

### 主记录
- Key: `drug_record:{timestamp}:{id}`
- Value: JSON格式的完整记录

### 药品清单记录
- Key: `drug_record:drug:{id}`
- Value: JSON格式的药品记录

### 索引
- 主索引: `drug_index:all:{timestamp}:{id}` -> `{id}`
- 药品索引: `drug_index:drugs:{timestamp}:{id}` -> `{id}`

## 注意事项

1. **数据持久化**：使用边缘存储API后，数据会持久化保存
2. **性能优化**：索引用于快速查询，避免全量扫描
3. **错误处理**：代码已包含错误处理，存储失败不会影响主流程
4. **兼容性**：如果边缘存储API不可用，会自动降级到内存存储（仅用于测试）

## 验证存储是否工作

1. 保存一个药品
2. 查看家庭药品清单
3. 如果能看到保存的药品，说明存储正常工作
4. 如果看不到，检查边缘函数日志中的错误信息

