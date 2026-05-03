# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Bio-Engine 是一个 **AI 模型能力对比测试项目**，在相同的设计文档基础上，让不同的 AI 模型自由发挥，对比它们在算法思路、代码架构、视觉风格和功能完整性方面的差异。这不是一个"按规格实现"的项目，而是一个启发创造力的画布。

## 架构

**单 Worker 部署**：所有子项目直接构建到 `portal/public/`，由 Cloudflare Worker（Hono 应用）通过 `[assets]` 提供静态文件，主页是 Portal 卡片导航。

每个子项目的 Vite `base` 配置匹配路由前缀（如 `base: '/glm-5.1/'`），`build.outDir` 直接输出到 `../portal/public/<项目名>/`。

子项目各自独立，有自己的 `node_modules/`、`package.json`、`tsconfig.json`。Portal 入口是 `portal/src/index.ts`（Hono 路由 + 内联 HTML 模板）。

## 常用命令

```bash
# 构建所有子项目到 portal/public/
bun run build

# 开发：先构建，再用 wrangler 本地服务
bun run build && bun run dev

# 部署到 Cloudflare Workers
bun run deploy

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

## 项目结构

```
Bio-Engine/
├── portal/src/index.ts        # Hono 应用（Portal 主页，内联 HTML）
├── wrangler.toml              # Cloudflare Workers 配置（[assets] 指向 portal/public）
├── docs/                      # 设计文档（所有模型共享）
├── kimi-k2.6/src/             # Kimi-K2.6 实现
├── glm-5.1/src/               # GLM-5.1 实现
├── deepseek-v4/src/           # DeepSeek-V4 实现
└── mimo-v2.5-pro/src/         # Mimo-V2.5-Pro 实现
```

## 子项目内部架构

每个子项目遵循 **引擎与渲染分离** 模式：

- **engine/** — 纯算法层（数学工具、数据类型、脊柱/肢体运动、IK、行为系统、生物实体）。不调用任何绘图 API
- **renderer/** — p5.js 渲染层，将引擎数据可视化
- **components/** — React UI 组件（控制面板、画布容器等）
- **App.tsx / main.tsx** — 入口，组装 React + p5 画布

引擎通过参数接收数据，通过返回值输出数据。四个子项目各自独立实现，互不依赖。

## 技术栈

- **子项目**：React 19 + p5.js + @p5-wrapper/react + Vite 8 + Tailwind CSS 4 + TypeScript
- **Portal**：Hono + Cloudflare Workers (wrangler)
- **包管理器**：bun

## 端口与路由

| 目录 | 端口 | 路由前缀 |
| --- | --- | --- |
| kimi-k2.6 | 5100 | `/kimi-k2.6/` |
| glm-5.1 | 5200 | `/glm-5.1/` |
| deepseek-v4 | 5300 | `/deepseek-v4/` |
| mimo-v2.5-pro | 5400 | `/mimo-v2.5-pro/` |
| Portal (wrangler) | 默认 | `/` |

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
