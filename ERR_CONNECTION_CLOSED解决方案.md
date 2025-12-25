# ERR_CONNECTION_CLOSED 解决方案

## 问题现象

前端调用边缘函数时出现 `ERR_CONNECTION_CLOSED` 错误，连接在请求完成前被关闭。

## 可能原因

1. **边缘函数执行超时**（最常见）
2. **请求体太大**（图片base64数据过大）
3. **网络连接不稳定**
4. **边缘函数代码错误导致崩溃**

## 解决方案

### 方案1：更新边缘函数代码（已优化）

代码已添加：
- ✅ 分批处理（一次最多3张图片）
- ✅ 超时控制（每张图片25秒）
- ✅ 更好的错误处理

**操作步骤**：
1. 复制 `修复后的单文件代码.js` 的完整内容
2. 在边缘函数控制台替换代码
3. 保存并重新部署

### 方案2：检查边缘函数日志

在边缘函数控制台：
1. 进入函数详情
2. 查看 **日志** 或 **Logs**
3. 查看是否有错误信息
4. 确认函数是否收到请求

### 方案3：测试小图片

1. 先上传一张很小的图片（< 100KB）测试
2. 如果小图片能成功，说明是大图片导致的问题
3. 可以考虑在前端添加图片压缩

### 方案4：检查网络请求

在浏览器开发者工具中：
1. 打开 Network 标签
2. 点击失败的 `recognize` 请求
3. 查看：
   - **Request URL**：是否正确
   - **Request Method**：是否为 POST
   - **Request Payload**：查看请求体大小
   - **Status**：错误代码

### 方案5：直接测试边缘函数

使用curl或Postman直接测试边缘函数：

```bash
curl -X POST https://orange-butterfly-4818.be724115.er.aliyun-esa.net/recognize \
  -H "Content-Type: application/json" \
  -d '{"images":[{"base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","name":"test.jpg","type":"image/jpeg"}]}'
```

如果这个也失败，说明边缘函数本身有问题。

## 检查清单

- [ ] 已更新边缘函数代码（使用最新版本）
- [ ] 已查看边缘函数日志
- [ ] 已测试小图片
- [ ] 已检查网络请求详情
- [ ] 已确认环境变量配置正确

## 如果仍然失败

请提供以下信息：
1. 边缘函数日志中的错误信息
2. 网络请求的详细信息（URL、方法、请求体大小）
3. 测试小图片的结果

这样我可以更准确地定位问题。

