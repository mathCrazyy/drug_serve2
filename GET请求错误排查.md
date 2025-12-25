# GET请求到/recognize接口错误排查

## 问题现象

错误信息显示：
```json
{
  "success": false,
  "error": "接口不存在",
  "debug": {
    "pathname": "/recognize",
    "method": "GET",
    "url": "https://drug-api.be724115.er.aliyun-esa.net/recognize"
  }
}
```

## 问题分析

`/recognize` 接口只支持 `POST` 方法，但收到了 `GET` 请求。

### 可能的原因

1. **浏览器预检请求**（不太可能，因为预检是OPTIONS方法）
2. **浏览器缓存了旧的请求**（最可能）
3. **前端代码问题**（已检查，代码正确）
4. **浏览器开发者工具中的手动请求**（如果手动测试）

## 解决方案

### 方案1：清除浏览器缓存（立即执行）

1. **清除浏览器缓存**：
   - Windows/Linux: `Ctrl + Shift + Delete`
   - Mac: `Cmd + Shift + Delete`
   - 选择"缓存的图片和文件"

2. **硬刷新页面**：
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

3. **在开发者工具中禁用缓存**：
   - 打开开发者工具（F12）
   - 在 Network 标签中勾选 "Disable cache"
   - 刷新页面

### 方案2：检查前端代码

前端代码看起来是正确的（使用POST方法），但请确认：

1. **检查构建后的代码**：
   - 在浏览器开发者工具中查看 Network 标签
   - 点击 `recognize` 请求
   - 查看 Request Method 应该是 `POST`

2. **检查是否有其他地方调用**：
   - 搜索代码中是否有其他地方访问 `/recognize`
   - 确认没有浏览器扩展或脚本干扰

### 方案3：直接测试POST请求

在浏览器控制台（F12 → Console）中测试：

```javascript
fetch('https://drug-api.be724115.er.aliyun-esa.net/recognize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    images: [{
      base64: 'test',
      name: 'test.jpg',
      type: 'image/jpeg'
    }]
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

如果这个测试成功，说明是前端代码或缓存的问题。

## 已实施的修复

边缘函数代码已更新，现在会：
- 对 GET 请求到 `/recognize` 返回更友好的错误提示（405 Method Not Allowed）
- 提供更详细的调试信息

## 验证步骤

1. **清除浏览器缓存**
2. **硬刷新页面**
3. **在前端应用中上传图片并点击"开始识别"**
4. **在开发者工具中检查**：
   - Network 标签中的请求方法应该是 `POST`
   - 不应该有 GET 请求到 `/recognize`

## 如果问题持续

如果清除缓存后仍然出现 GET 请求：

1. **检查浏览器扩展**：某些扩展可能会修改请求
2. **检查网络代理**：确认没有代理修改请求方法
3. **查看边缘函数日志**：确认实际收到的请求方法
4. **联系技术支持**：如果以上都正常，可能是平台问题

