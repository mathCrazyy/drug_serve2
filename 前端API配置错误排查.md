# 前端API配置错误排查

## 🔍 问题分析

从浏览器开发者工具可以看到：
- **错误信息**：`识别失败: Failed to fetch`
- **请求URL**：`https://drug-api.be724115.er.aliyun-esa.ne/recognize`
- **问题**：URL末尾显示为 `.ne` 而不是 `.net`（可能是显示问题，或URL配置错误）

## 🐛 可能的原因

### 1. 环境变量未配置

如果 `VITE_API_BASE_URL` 环境变量未配置或为空：
- `API_BASE_URL` 会是空字符串
- 请求会变成相对路径，可能无法正确访问

### 2. URL配置错误

如果环境变量配置的URL不正确：
- URL可能缺少协议（`https://`）
- URL可能缺少域名后缀（`.net`）
- URL可能有拼写错误

### 3. CORS问题

虽然边缘函数已配置CORS，但可能：
- CORS配置不完整
- 浏览器阻止了跨域请求

## 🔧 解决方案

### 步骤1：检查ESA Pages环境变量配置

1. 登录 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 进入 **Pages** 管理页面
3. 找到您的站点（例如：`drug-serve2`）
4. 进入站点设置，找到 **环境变量** 配置
5. 检查是否有 `VITE_API_BASE_URL` 环境变量
6. 确认变量值是否正确：
   ```
   https://drug-api.be724115.er.aliyun-esa.net
   ```
   **注意**：
   - 必须包含 `https://` 协议
   - 必须是完整的域名（`.net` 结尾）
   - 不要包含路径（如 `/recognize`）

### 步骤2：重新部署Pages

修改环境变量后，必须重新部署Pages才能生效：
1. 在Pages设置中，点击 **重新部署** 或 **Rebuild**
2. 等待部署完成

### 步骤3：验证配置

部署完成后：
1. 打开浏览器开发者工具（F12）
2. 进入 **Console** 标签
3. 刷新页面
4. 查看是否有 `[API] VITE_API_BASE_URL:` 的日志输出
5. 确认输出的URL是否正确

### 步骤4：测试API连接

在浏览器Console中执行：
```javascript
fetch('https://drug-api.be724115.er.aliyun-esa.net/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

如果返回API信息，说明边缘函数正常。

## 📝 正确的配置示例

### ESA Pages环境变量配置

| 变量名 | 变量值 | 说明 |
|--------|--------|------|
| `VITE_API_BASE_URL` | `https://drug-api.be724115.er.aliyun-esa.net` | **重要**：必须是完整的URL，包含协议和域名 |

### 注意事项

1. **不要包含路径**：
   - ❌ 错误：`https://drug-api.be724115.er.aliyun-esa.net/recognize`
   - ✅ 正确：`https://drug-api.be724115.er.aliyun-esa.net`

2. **必须包含协议**：
   - ❌ 错误：`drug-api.be724115.er.aliyun-esa.net`
   - ✅ 正确：`https://drug-api.be724115.er.aliyun-esa.net`

3. **不要有多余的空格**：
   - ❌ 错误：` https://drug-api.be724115.er.aliyun-esa.net `
   - ✅ 正确：`https://drug-api.be724115.er.aliyun-esa.net`

## 🧪 测试步骤

1. **检查环境变量**
   - 在ESA Pages中确认 `VITE_API_BASE_URL` 已配置
   - 确认变量值正确

2. **重新部署**
   - 修改环境变量后重新部署Pages

3. **查看浏览器Console**
   - 打开开发者工具
   - 查看是否有 `[API]` 相关的日志
   - 查看请求URL是否正确

4. **测试API**
   - 在Console中测试fetch请求
   - 确认边缘函数可访问

## ✅ 配置检查清单

- [ ] 已在ESA Pages中配置 `VITE_API_BASE_URL` 环境变量
- [ ] 变量值包含 `https://` 协议
- [ ] 变量值是完整的域名（`.net` 结尾）
- [ ] 变量值不包含路径（如 `/recognize`）
- [ ] 已重新部署Pages
- [ ] 浏览器Console显示正确的API URL
- [ ] 测试fetch请求成功

## 💡 如果问题仍然存在

1. **检查边缘函数状态**
   - 确认边缘函数正常运行
   - 访问边缘函数URL，确认能返回API信息

2. **检查网络连接**
   - 确认网络连接正常
   - 尝试在浏览器直接访问边缘函数URL

3. **查看浏览器Console**
   - 查看详细的错误信息
   - 查看网络请求的详细信息

4. **联系技术支持**
   - 如果以上步骤都无法解决问题
   - 提供详细的错误信息和配置信息

