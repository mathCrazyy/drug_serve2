# ESA环境变量配置位置查找指南

## 🔍 问题

在ESA控制台找不到"环境变量"或"Environment Variables"配置入口。

## 📋 可能的位置

ESA边缘函数的环境变量配置可能在以下位置之一：

### 位置1：函数详情页 - "配置"或"设置"标签

1. 登录 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 进入 **边缘计算** > **函数和 Pages NEW**
3. 点击您的函数 `drug-api` 进入详情页
4. 查看顶部标签页：
   - **配置** 或 **Configuration**
   - **设置** 或 **Settings**
   - **函数配置** 或 **Function Configuration**
5. 在这些标签页中查找 **环境变量** 或 **Environment Variables**

### 位置2：函数详情页 - "代码执行"标签

1. 在函数详情页，查找 **代码执行** 或 **Code Execution** 标签
2. 向下滚动，找到 **环境变量** 部分
3. 点击 **添加环境变量** 或 **Add Environment Variable**

### 位置3：编辑/修改模式

1. 在函数详情页，查找 **编辑** 或 **Edit** 按钮
2. 点击进入编辑模式
3. 在编辑界面中查找 **环境变量** 配置

### 位置4：部署配置

1. 在函数详情页，查找 **部署** 或 **Deploy** 相关选项
2. 在部署配置中可能有环境变量设置

## 🔧 临时解决方案：在代码中配置

如果确实找不到环境变量配置入口，可以在代码中临时设置默认值。

**⚠️ 注意**：这只是一个临时方案，生产环境建议在控制台配置环境变量。

### 已更新的代码

代码已经更新，如果环境变量未配置，会自动使用以下默认值：

```javascript
EDGE_KV_NAMESPACE = 'drug-storage'
```

这样即使不在控制台配置，也能使用EdgeKV存储。

### 验证

部署更新后的代码，再次访问调试端点：

```
https://drug-api.be724115.er.aliyun-esa.net/debug-storage
```

应该看到：
```json
{
  "namespace": "drug-storage",  // ✅ 应该显示配置的值
  "isMemoryStorage": false      // ✅ 应该变为 false
}
```

## 📞 如果仍然找不到

### 方法1：查看ESA官方文档

1. 访问 [阿里云ESA文档](https://help.aliyun.com/product/59086.html)
2. 搜索"边缘函数 环境变量"或"Edge Function Environment Variables"
3. 查看最新的配置方法

### 方法2：联系技术支持

1. 在ESA控制台找到 **工单** 或 **技术支持**
2. 咨询：如何在ESA边缘函数中配置环境变量
3. 提供您的函数名称：`drug-api`

### 方法3：使用阿里云CLI

如果控制台不支持，可以尝试使用阿里云CLI工具配置：

```bash
# 安装阿里云CLI（如果未安装）
# 然后使用命令配置环境变量
aliyun esa update-function-environment \
  --function-name drug-api \
  --environment-variables '{"EDGE_KV_NAMESPACE":"drug-storage"}'
```

## ✅ 推荐方案

**当前最佳方案**：代码中已添加默认值 `drug-storage`，可以直接使用。

1. 重新部署边缘函数（使用更新后的代码）
2. 访问 `/debug-storage` 验证配置
3. 测试保存功能，确认数据能持久化

这样即使找不到控制台的环境变量配置入口，也能正常使用EdgeKV存储。

## 🎯 下一步

1. **立即**：重新部署边缘函数（代码已包含默认值）
2. **验证**：访问 `/debug-storage` 确认配置
3. **测试**：保存一个药品，验证数据持久化
4. **后续**：如果找到控制台的环境变量配置入口，建议在那里配置（更规范）

