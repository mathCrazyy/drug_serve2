# 配置 EDGE_KV_NAMESPACE 环境变量 - 详细步骤

## 🔍 问题诊断结果

根据 `/debug-storage` 端点的返回结果：
- ✅ EdgeKV类可用（`hasEdgeKV: true`）
- ❌ **环境变量未配置**（`namespace: "未配置"`）
- ❌ **正在使用内存存储**（`isMemoryStorage: true`）

**结论**：需要在边缘函数中配置 `EDGE_KV_NAMESPACE=drug-storage` 环境变量。

## 📝 配置步骤

### 步骤1：登录ESA控制台

1. 访问 [阿里云ESA控制台](https://esa.console.aliyun.com/)
2. 登录您的账号

### 步骤2：进入边缘函数配置

1. 在左侧导航栏，点击 **边缘计算** > **函数和 Pages NEW**
2. 找到您的边缘函数：**`drug-api`**
3. 点击函数名称进入详情页

### 步骤3：配置环境变量

1. 在函数详情页，找到 **环境变量** 或 **Environment Variables** 配置项
2. 点击 **添加环境变量** 或 **Add Environment Variable** 按钮
3. 添加以下环境变量：

   **变量名**：`EDGE_KV_NAMESPACE`
   
   **变量值**：`drug-storage`
   
   **说明**：必须与您在KV存储控制台中创建的存储空间名称完全一致（区分大小写）

4. 点击 **保存** 或 **Save**

### 步骤4：重新部署边缘函数

**重要**：修改环境变量后，必须重新部署函数才能生效！

1. 在函数详情页，找到 **部署** 或 **Deploy** 按钮
2. 点击部署，等待部署完成（通常需要几十秒）

### 步骤5：验证配置

部署完成后，再次访问调试端点：

```
https://drug-api.be724115.er.aliyun-esa.net/debug-storage
```

**期望结果**：
```json
{
  "success": true,
  "storage": {
    "namespace": "drug-storage",  // ✅ 应该显示配置的值
    "hasEdgeKV": true,
    "edgeKVAvailable": {
      "global": true,
      "globalThis": true,
      "self": true
    },
    "storageType": "Object",
    "isMemoryStorage": false  // ✅ 应该变为 false
  }
}
```

### 步骤6：测试存储功能

1. 在前端应用中保存一个药品
2. 查看家庭药品清单，确认数据能正常显示
3. 在KV存储控制台查看数据（**边缘计算** > **KV 存储** > **drug-storage**）

## 🎯 配置位置示意图

```
ESA控制台
  └── 边缘计算
      └── 函数和 Pages NEW
          └── drug-api (您的函数)
              └── 环境变量 (Environment Variables)
                  └── 添加变量
                      ├── 变量名: EDGE_KV_NAMESPACE
                      └── 变量值: drug-storage
```

## ⚠️ 注意事项

1. **变量名必须完全匹配**：`EDGE_KV_NAMESPACE`（区分大小写）
2. **变量值必须与存储空间名称一致**：`drug-storage`（区分大小写）
3. **必须重新部署**：修改环境变量后，必须重新部署函数才能生效
4. **验证配置**：使用 `/debug-storage` 端点验证配置是否正确

## 🐛 如果配置后仍然显示"未配置"

可能的原因：

1. **未重新部署**：修改环境变量后必须重新部署
2. **变量名错误**：确认变量名完全匹配 `EDGE_KV_NAMESPACE`
3. **变量值错误**：确认变量值为 `drug-storage`（与KV存储空间名称一致）
4. **缓存问题**：等待几分钟后再次访问调试端点

## ✅ 配置检查清单

- [ ] 已在ESA控制台找到边缘函数 `drug-api`
- [ ] 已添加环境变量 `EDGE_KV_NAMESPACE=drug-storage`
- [ ] 已保存环境变量配置
- [ ] 已重新部署边缘函数
- [ ] 已访问 `/debug-storage` 验证配置
- [ ] 确认 `namespace` 显示为 `drug-storage`
- [ ] 确认 `isMemoryStorage` 显示为 `false`
- [ ] 已测试保存功能，数据能正常显示

## 📞 需要帮助？

如果按照以上步骤配置后仍然有问题，请：
1. 再次访问 `/debug-storage` 端点，查看最新状态
2. 查看边缘函数日志，确认是否有错误信息
3. 联系阿里云技术支持

