# ESA Pages 配置说明

## 配置文件

项目根目录包含 `esa.jsonc` 配置文件：

```json
{
  "name": "drug-serve2",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "assets": {
    "directory": "./frontend/dist",
    "notFoundStrategy": "singlePageApplication"
  }
}
```

## 如果自动配置不生效

如果系统无法自动识别 `esa.jsonc` 配置文件，请在 ESA Pages 控制台手动配置：

### 构建设置

1. **安装命令**：`npm install`
2. **构建命令**：`npm run build`
3. **输出目录**：`frontend/dist`
4. **资源目录**：`frontend/dist`

### 手动配置步骤

1. 登录阿里云 ESA Pages 控制台
2. 进入站点设置 → 构建设置
3. 配置以下项：
   - **安装命令**：`npm install`
   - **构建命令**：`npm run build`
   - **输出目录/资源目录**：`frontend/dist`
   - **根目录**：`.`（项目根目录）

### 验证构建产物

构建成功后，应该在以下路径找到文件：
- `frontend/dist/index.html`
- `frontend/dist/assets/index-*.js`
- `frontend/dist/assets/index-*.css`

如果这些文件存在但系统仍无法识别，请检查：
1. 路径是否正确（相对项目根目录）
2. 文件权限是否正确
3. 控制台配置是否与配置文件一致

