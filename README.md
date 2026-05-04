# Bio-Engine

**生物引擎 · AI 模型能力对比**

Bio-Engine 是 AI-Arena 项目系列的**生物引擎主题作品**。

---

## 实验目的

本项目是**完全开放式的创意测试**：

- **唯一限制**：符合生物引擎主题
- **其他所有**：模型自由发挥，不设任何约束

通过同一主题，让不同 AI 模型尽情展现各自在以下维度的能力：

- **审美** — 视觉风格、配色、整体氛围
- **架构** — 模块划分、设计模式、代码组织
- **代码** — 实现质量、可读性、技术选型
- **设计** — 用户体验、交互逻辑、细节处理

程序化动画没有标准答案，每一个模型都可以创造完全不同的生物形态、运动方式、视觉语言。

---

## 关于 AI-Arena

AI-Arena 是一个项目系列，涵盖多种主题的能力对比测试。Bio-Engine 是该系列的生物引擎主题。

## 快速开始

```bash
# 安装依赖
bun install

# 构建所有子项目
bun run build

# 启动本地服务
bun run dev
```

访问 <http://localhost:8787> 查看 Portal 主页，从那里可以跳转到四个模型实现。

## 参与模型

| 模型 | 名称 | 路由 |
| --- | --- | --- |
| Kimi-K2.6 | 月之暗面 | `/kimi-k2.6` |
| GLM-5.1 | 智谱 AI | `/glm-5.1` |
| DeepSeek-V4 | 深度求索 | `/deepseek-v4` |
| MiMo-V2.5-Pro | MiMo AI | `/mimo-v2.5-pro` |

## 部署

```bash
bun run deploy
```

单 Worker 部署架构，整个 monorepo 打包到 Cloudflare Workers，通过路由前缀访问不同项目。

## 项目结构

```
Bio-Engine/
├── portal/              # Portal React SPA
├── kimi-k2.6/          # Kimi-K2.6 实现
├── glm-5.1/            # GLM-5.1 实现
├── deepseek-v4/        # DeepSeek-V4 实现
├── mimo-v2.5-pro/     # Mimo-V2.5-Pro 实现
└── docs/               # 设计文档（共享）
```

## 常用命令

```bash
bun run build            # 构建所有子项目
bun run build:turbo     # Turbo 增量构建（推荐）
bun run dev             # Portal 开发服务器（端口 5173）
bun run dev:wrangler    # Wrangler 本地服务（端口 8787）
bun run deploy          # 部署到 Cloudflare Workers
bun run deploy:turbo    # Turbo 构建后部署
bun run clean           # 清理构建产物
```

## 设计文档

| 文档 | 内容 |
| --- | --- |
| 01-创意灵感.md | 生物类型、行为模式、视觉风格的想象空间 |
| 02-核心概念.md | 程序化动画的核心思想 |
| 03-实现思路.md | 链式运动、肢体 IK、行为漫游、渲染的多种算法方向 |
| 04-架构参考.md | 引擎与渲染分离、分层架构等可选架构模式 |
| 05-交互设计.md | 用户与生物互动的多种模式 |
| 06-性能建议.md | 优化方向和策略 |

## 开发理念

这不是一个"按规格实现"的项目，而是一个启发创造力的画布：

- **没有标准答案**：鼓励独特的实现方式
- **迭代开发**：先让简单版本跑起来，再观察调整
- **在"错误"中发现**：算法错误可能产生有趣效果

## 技术栈

- **Portal**：React 19 + Vite 8 + CSS
- **子项目**：React 19 + p5.js + @p5-wrapper/react + Vite 8
- **部署**：Cloudflare Workers + Wrangler
- **构建优化**：Turbo 增量构建
- **包管理器**：bun

## License

MIT
