# Portal 目录

此目录包含 Hono 应用入口和子项目构建产物，用于单 Worker 部署。

## 目录结构

```
portal/
├── src/
│   └── index.ts        # Hono 应用（Portal 主页）
└── public/             # 构建输出（自动生成，不提交）
    ├── kimi-k2.6/      # Kimi-K2.6 构建产物
    ├── glm-5.1/        # GLM-5.1 构建产物
    └── deepseek-v4/    # DeepSeek-V4 构建产物
```

## 说明

- **src/index.ts**：Hono 应用，渲染 Portal 主页。子项目由 wrangler `[assets]` 直接提供静态文件
- **public/**：运行根目录 `bun run build` 后自动生成，各子项目的 Vite 构建直接输出到此处
