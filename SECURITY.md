# 安全配置指南

## ⚠️ 重要安全提示

由于代码已经推送到GitHub，**API密钥已经暴露在公开仓库中**。请立即采取以下措施：

## 立即行动

### 1. 更换API密钥（必须）

1. 登录豆包API控制台
2. 撤销当前API密钥：`sk-pzZXi9zXV9ERBJFrjAVV4WEMj6u7TcTLtoNUkRfefSrLxlid`
3. 生成新的API密钥
4. 在边缘函数环境变量中配置新密钥

### 2. 使用环境变量配置（推荐）

**边缘函数环境变量配置：**

在阿里云ESA边缘函数控制台中设置：

```
DOUBAO_API_BASE_URL=https://api.chatfire.site/v1/chat/completions
DOUBAO_API_KEY=新生成的API密钥
DOUBAO_MODEL=doubao-seed-1-6-vision-250815
DOUBAO_MAX_TOKENS=1000
DOUBAO_TEMPERATURE=0.1
STORAGE_PREFIX=drug_record:
STORAGE_INDEX_PREFIX=drug_index:
```

### 3. 从Git历史中移除敏感信息（可选但推荐）

如果仓库是私有的，可以保留当前配置。如果是公开仓库，建议：

1. 使用 `git filter-branch` 或 `git filter-repo` 从历史中移除敏感信息
2. 或者创建新仓库并重新推送（不包含敏感信息）

## 当前安全措施

✅ 已添加 `.gitignore` 规则，防止未来提交敏感文件：
- `edge-function/config.js` - 配置文件（包含API密钥）
- `frontend/.env` - 前端环境变量

✅ 已创建示例配置文件：
- `edge-function/config.example.js` - 配置模板（不含真实密钥）
- `frontend/.env.example` - 前端环境变量模板

✅ 代码已更新为支持环境变量：
- `edge-function/config.js` 现在优先使用环境变量
- 如果环境变量未设置，才使用默认值（开发环境）

## 最佳实践

1. **永远不要**将API密钥、密码等敏感信息提交到Git仓库
2. **始终使用**环境变量或密钥管理服务存储敏感信息
3. **定期轮换**API密钥和密码
4. **使用私有仓库**存储包含敏感信息的代码
5. **审查提交历史**，确保没有意外提交敏感信息

## 检查清单

- [ ] 已撤销暴露的API密钥
- [ ] 已生成新的API密钥
- [ ] 已在边缘函数中配置环境变量
- [ ] 已确认 `.gitignore` 正确配置
- [ ] 已从本地删除包含敏感信息的提交（如需要）
- [ ] 已通知团队成员更新配置

