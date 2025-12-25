# URL路径和模型配置说明

## 1. URL路径重复问题分析

### 可能的原因

虽然ESA Pages环境变量配置正确（`https://drug-api.be724115.er.aliyun-esa.net`），但出现 `/recognize/recognize` 路径重复，可能的原因：

#### 原因1：浏览器缓存了旧的构建版本 ⚠️ **最可能**

**解决方案**：
1. 清除浏览器缓存（Ctrl+Shift+Delete 或 Cmd+Shift+Delete）
2. 或者在浏览器中硬刷新（Ctrl+F5 或 Cmd+Shift+R）
3. 或者在开发者工具中勾选"Disable cache"

#### 原因2：前端构建时环境变量未正确注入

**检查步骤**：
1. 在浏览器开发者工具中查看构建后的代码
2. 打开 `Network` 标签 → 找到 `index.html` 或 JS 文件
3. 检查代码中 `VITE_API_BASE_URL` 的实际值

**解决方案**：
1. 在ESA Pages控制台重新触发构建
2. 确保环境变量在构建前已配置

#### 原因3：边缘函数路由配置问题

**检查步骤**：
1. 直接访问边缘函数根路径：`https://drug-api.be724115.er.aliyun-esa.net/`
2. 应该返回API信息，而不是404

## 2. 模型名称修改说明

### 当前状态

✅ **边缘函数代码已更新**：
- 默认值已改为：`doubao-seed-1-6-vision-250815`
- 如果环境变量 `DOUBAO_MODEL` 未设置，会使用这个默认值

### 需要检查的地方

#### 1. 边缘函数环境变量（重要）⚠️

在**边缘函数控制台**检查环境变量：

```
DOUBAO_MODEL=doubao-seed-1-6-vision-250815
```

**如果环境变量已设置**：
- 环境变量的值会覆盖代码中的默认值
- 需要确保环境变量是新的模型名称

**如果环境变量未设置**：
- 会使用代码中的默认值（已更新为新模型）

#### 2. 文档中的旧值（可选更新）

以下文档中还有旧的模型名称，但**不影响功能**，可以稍后更新：

- `README.md`
- `DEPLOY_ESA.md`
- `部署信息.md`
- `配置边缘函数URL.md`
- `edge-function/config.example.js`

## 3. 立即操作步骤

### 步骤1：清除浏览器缓存并测试

1. 清除浏览器缓存
2. 硬刷新页面（Ctrl+F5）
3. 重新测试，查看Network标签中的请求URL

### 步骤2：检查边缘函数环境变量

1. 进入边缘函数控制台
2. 查看环境变量 `DOUBAO_MODEL`
3. 如果存在且是旧值，更新为：`doubao-seed-1-6-vision-250815`
4. 如果不存在，代码会使用新的默认值

### 步骤3：重新触发前端构建（如果需要）

1. 在ESA Pages控制台
2. 手动触发重新构建
3. 等待构建完成

## 4. 验证修复

修复后，在浏览器开发者工具中检查：

1. **Network标签**：
   - 请求URL应该是：`https://drug-api.be724115.er.aliyun-esa.net/recognize`
   - **不应该**是：`https://drug-api.be724115.er.aliyun-esa.net/recognize/recognize`

2. **响应状态**：
   - 应该是 `200 OK` 或 `504 Gateway Time-out`（如果超时）
   - **不应该**是 `404 Not Found`

## 5. 如果问题持续

如果清除缓存后仍然出现路径重复：

1. **检查构建产物**：
   - 在ESA Pages控制台下载构建产物
   - 检查JS文件中 `VITE_API_BASE_URL` 的实际值

2. **检查边缘函数路由**：
   - 直接访问：`https://drug-api.be724115.er.aliyun-esa.net/`
   - 应该返回API信息

3. **联系技术支持**：
   - 如果以上都正常，可能是ESA平台的问题

