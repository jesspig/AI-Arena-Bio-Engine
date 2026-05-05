# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Bio-Engine 是一个 **AI 模型能力对比测试项目**，在相同的设计文档基础上，让不同的 AI 模型自由发挥，对比它们在算法思路、代码架构、视觉风格和功能完整性方面的差异。这不是一个"按规格实现"的项目，而是一个启发创造力的画布。

## 架构

**纯静态部署**：Portal（React SPA）和四个子项目全部构建到 `portal/public/`，由 Cloudflare Workers 的 `[assets]` 纯静态托管（`wrangler.toml`），无 Worker 入口函数。

项目使用 **bun workspaces**（见根 `package.json` 的 `workspaces` 字段），五个子项目（portal + 四个模型实现）各自独立，有自己的 `node_modules/`、`package.json`、`tsconfig.json`。根 `package.json` 只保留工具链依赖（turbo、wrangler、workers-types）。

每个子项目的 Vite `base` 配置匹配路由前缀（如 `base: '/glm-5.1/'`），`build.outDir` 直接输出到 `../portal/public/<项目名>/`。Portal 构建会清空 `portal/public/`，所以 **构建顺序是 Portal 先，子项目后**。

Portal 开发模式下通过自定义 Vite 插件 `serveSubProjects()`（见 `portal/vite.config.ts`）代理已构建的子项目文件，因此需要先 `bun run build` 至少一次才能在 Portal 开发模式下访问子项目。

**Turbo**（`turbo.json`）用于增量构建缓存。`build:turbo` 只重建变化的项目，`build` 是顺序执行的完整构建。

## 初始设置

```bash
bun install          # 安装根级工具链依赖
bun run build        # 首次完整构建（会自动在各子项目中执行 bun install）
```

## 常用命令

```bash
# 完整构建（顺序执行：portal → 四个子项目）
bun run build

# Turbo 增量构建（推荐开发流程，只重建变化的项目）
bun run build:turbo

# Portal Vite 开发服务器（端口 5173），需先 build 过子项目
bun run dev

# Wrangler 本地服务（端口 8787），模拟生产环境
bun run dev:wrangler

# 部署
bun run deploy           # 完整构建后部署
bun run deploy:turbo     # Turbo 构建后部署

# 清理构建产物
bun run clean

# 单独构建某个子项目
bun run build:kimi-k2.6
bun run build:glm-5.1
bun run build:deepseek-v4
bun run build:mimo-v2.5-pro

# 单独开发某个子项目（进入对应目录，独立 Vite HMR）
cd kimi-k2.6 && bun install && bun run dev     # 端口 5100
cd glm-5.1 && bun install && bun run dev       # 端口 5200
cd deepseek-v4 && bun install && bun run dev   # 端口 5300
cd mimo-v2.5-pro && bun install && bun run dev # 端口 5400
```

## 构建细节

- **Portal**：仅 `vite build`（无 tsc 类型检查步骤，Portal 无 tsconfig）
- **子项目**：`tsc -b && vite build`（先类型检查再构建，类型错误会阻止构建）
- 子项目间互不依赖，可并行构建。Turbo 利用 `dependsOn: ["^build"]` 自动处理依赖拓扑

## 项目结构

```
Bio-Engine/
├── portal/                    # Portal React SPA（纯 CSS，无 Tailwind）
│   ├── src/data/models.ts     # 模型元数据（名称、描述、图标路径、配色）
│   ├── vite.config.ts         # 含 serveSubProjects() 插件
│   └── public/                # 构建产物（gitignore，Portal 构建会清空此目录）
├── wrangler.toml              # 纯 [assets] 静态托管，html_handling: auto-trailing-slash
├── turbo.json                 # Turbo 增量构建缓存
├── docs/                      # 设计文档（所有模型共享的参考规范）
├── kimi-k2.6/src/             # Kimi-K2.6 实现
├── glm-5.1/src/               # GLM-5.1 实现
├── deepseek-v4/src/           # DeepSeek-V4 实现
└── mimo-v2.5-pro/src/         # Mimo-V2.5-Pro 实现
```

## 子项目内部架构

每个子项目遵循 **引擎与渲染分离** 模式：

- **engine/** — 纯算法层（数学工具、数据类型、脊柱/肢体运动、IK、行为系统、生物实体）。不调用任何绘图 API
- **renderer/** 或 **render/** — p5.js 渲染层（DeepSeek-V4 使用 `render/`，其余使用 `renderer/`）
- **components/** — React UI 组件（控制面板、画布容器等，部分子项目无此目录）
- **App.tsx / main.tsx** — 入口

引擎通过参数接收数据，通过返回值输出数据。四个子项目各自独立实现，互不依赖。

子项目差异：
- GLM-5.1 使用 `sketch.ts` 直接创建 p5 实例，其余通过 `@p5-wrapper/react` 的 React 组件包装
- Tailwind CSS 4：仅 kimi-k2.6（`@tailwindcss/vite`）和 mimo-v2.5-pro（`@tailwindcss/postcss`）使用
- GLM-5.1 有独立的 `vec2.ts` 向量类，其余项目在各自的 `math.ts` 中实现
- DeepSeek-V4 额外依赖 `simplex-noise`

## 技术栈

- **子项目**：React 19 + p5.js + @p5-wrapper/react + Vite 8 + TypeScript
- **Portal**：React 19 + Vite 8（纯 SPA，CSS 无框架）
- **构建缓存**：Turbo（`turbo.json`，增量构建 + 内容缓存）
- **部署**：Cloudflare Workers [assets] 静态托管 + Wrangler
- **包管理器**：bun（`packageManager: "bun@1.3.10"`）

## 端口与路由

| 目录 | 独立开发端口 | 路由前缀 |
| --- | --- | --- |
| kimi-k2.6 | 5100 | `/kimi-k2.6/` |
| glm-5.1 | 5200 | `/glm-5.1/` |
| deepseek-v4 | 5300 | `/deepseek-v4/` |
| mimo-v2.5-pro | 5400 | `/mimo-v2.5-pro/` |
| Portal（Vite dev） | 5173 | `/` |
| Portal（wrangler） | 8787 | `/` |

## 质量保障

- **无测试套件**：项目当前没有配置任何测试框架
- **无 Lint/格式化**：项目没有 ESLint 或 Prettier 配置
- **类型检查**：子项目通过 `tsc -b` 在构建时进行类型检查，Portal 无此步骤
- **无 CI 管道**：部署依赖本地 `bun run deploy`

## 核心概念

- **程序化动画**：定义规则而非绘制每一帧
- **链式跟随**：每个节段跟随前一节段运动
- **反向运动学（IK）**：从目标位置倒推各关节位置
- **行为系统**：赋予生物状态（放松、紧张、好奇）和目标

详细概念：[docs/02-核心概念.md](docs/02-核心概念.md) | 算法参考：[docs/03-实现思路.md](docs/03-实现思路.md)

## 开发理念

- 没有标准答案，鼓励独特实现方式
- 迭代开发：先跑起来再调整
- 算法"错误"可能产生有趣效果
- 每个模型可以自由选择算法和视觉风格
