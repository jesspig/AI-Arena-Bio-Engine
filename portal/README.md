# Portal 目录

此目录包含 Hono 应用入口，用于单 Worker 部署。

## 目录结构

```
portal/
├── src/
│   └── index.ts        # Hono 应用主文件（路由 + Portal 页面）
└── public/             # 构建输出目录（自动生成，不提交）
    ├── kimi-k2.6/      # Kimi-K2.6 构建产物
    ├── glm-5.1/        # GLM-5.1 构建产物
    └── deepseek-v4/    # DeepSeek-V4 构建产物
```

## 说明

- **src/index.ts**：Hono 应用，处理路由和渲染 Portal 页面
- **public/**：运行 `bun run build` 后自动生成，包含三个子项目的构建产物
- **wrangler.toml**：已移至项目根目录

## 相关文件

- `../wrangler.toml` - Cloudflare Workers 配置
- `../build.ts` - 构建脚本
- `../start.ps1` / `../start.sh` - 启动脚本
