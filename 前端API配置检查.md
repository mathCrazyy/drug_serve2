# 前端API配置检查

## 问题分析

边缘函数返回 `{"success":false,"error":"接口不存在","debug":{"pathname":"/","method":"GET"}}`

这说明：
1. ✅ 边缘函数已正常运行
2. ❌ 前端可能没有正确配置API地址，或者请求路径不对

## 检查步骤

### 1. 确认边缘函数URL

您的边缘函数URL是：`https://drug-api.be724115.er.aliyun-esa.net`

### 2. 检查前端环境变量

在ESA Pages控制台：

1. 进入您的前端站点设置
2. 找到 **环境变量** 配置
3. 确认是否有以下环境变量：
   ```
   VITE_API_BASE_URL=https://drug-api.be724115.er.aliyun-esa.net
   ```
4. 如果没有，请添加并保存
5. **重要**：保存后需要重新部署前端

### 3. 验证配置

前端代码中，API调用应该是：
```typescript
// 如果 VITE_API_BASE_URL = https://drug-api.be724115.er.aliyun-esa.net
// 那么实际请求URL = https://drug-api.be724115.er.aliyun-esa.net/recognize
```

### 4. 测试边缘函数

直接在浏览器访问：
- `https://drug-api.be724115.er.aliyun-esa.net/` - 应该返回API信息
- `https://drug-api.be724115.er.aliyun-esa.net/recognize` - POST请求（需要工具测试）

### 5. 测试前端调用

1. 打开浏览器开发者工具（F12）
2. 切换到 Network（网络）标签
3. 在前端应用中上传图片并点击识别
4. 查看网络请求：
   - 请求URL应该是：`https://drug-api.be724115.er.aliyun-esa.net/recognize`
   - 请求方法：POST
   - 如果URL不对，说明环境变量未生效

## 常见问题

### 问题1：环境变量已配置但未生效

**解决方案**：
- 确认环境变量名称是 `VITE_API_BASE_URL`（注意大小写）
- 重新部署前端应用
- 清除浏览器缓存

### 问题2：CORS错误

**解决方案**：
- 边缘函数代码已配置CORS
- 如果仍有问题，检查请求头

### 问题3：404错误

**解决方案**：
- 确认请求路径是 `/recognize`（不是 `/api/recognize`）
- 确认边缘函数URL正确
- 查看网络请求的完整URL

## 快速验证

在浏览器控制台（F12 → Console）运行：

```javascript
// 测试边缘函数是否可访问
fetch('https://drug-api.be724115.er.aliyun-esa.net/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

应该返回：
```json
{
  "success": true,
  "message": "药品识别API服务运行正常",
  "endpoints": {...}
}
```

