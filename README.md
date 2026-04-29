# Bio-Engine：AI 模型能力对比测试

这是一个**模型能力测试项目**，用于对比 glm-5.1、deepseek-v4、kimi-k2.6 在相同设计主题中的自由发挥生成效果。

## 快速开始

```bash
# 安装根依赖
bun install

# 构建所有子项目
bun run build

# 启动本地服务
bun run dev
```

访问 http://localhost:8787 查看 Portal 主页，从那里可以跳转到三个模型实现。

## 部署到 Cloudflare Workers

```bash
bun run deploy
```

**单 Worker 部署架构**：整个 monorepo 打包到一个 Cloudflare Worker 中，通过路由前缀访问不同项目。

## 项目背景

在相同的设计文档基础上，让不同的 AI 模型自由发挥，观察它们在以下维度的表现差异：

- 算法思路的选择
- 代码架构的设计
- 视觉风格的呈现
- 功能实现的完整性
- 代码质量与可维护性

## 测试模型

| 模型目录 | 模型名称 | 说明 | 路由前缀 |
| --- | --- | --- | --- |
| glm-5.1/ | GLM-5.1 | 智谱 AI 模型 | `/glm-5.1` |
| deepseek-v4/ | DeepSeek-V4 | 深度求索 AI 模型 | `/deepseek-v4` |
| kimi-k2.6/ | Kimi-K2.6 | 月之暗面 AI 模型 | `/kimi-k2.6` |

## 部署架构

```
https://your-worker.workers.dev
├── /              # Portal 主页（三个项目卡片）
├── /glm-5.1/      # GLM-5.1 实现
├── /deepseek-v4/  # DeepSeek-V4 实现
└── /kimi-k2.6/    # Kimi-K2.6 实现
```

## 项目结构

```
Bio-Engine/
├── portal/              # 单 Worker 部署目录
│   ├── src/index.ts     # Hono 应用
│   └── public/          # 构建产物（自动生成）
├── glm-5.1/             # GLM-5.1 实现
├── deepseek-v4/         # DeepSeek-V4 实现
├── kimi-k2.6/           # Kimi-K2.6 实现
└── docs/                # 设计文档（共享）
```

## 常用命令

```bash
# 根目录
bun run build            # 构建所有子项目
bun run dev              # wrangler 本地服务（端口 8788）
bun run deploy           # 部署到 Workers
bun run clean            # 清理构建产物

# 各子项目（在子目录中执行，独立 Vite HMR）
bun install          # 安装依赖
bun run dev          # 独立启动该项目（端口 5200/5300/5100）
```

## 设计文档

所有模型都基于相同的设计文档进行实现：

| 文档 | 内容 |
| --- | --- |
| [01-创意灵感.md](docs/01-创意灵感.md) | 生物类型、行为模式、视觉风格的想象空间 |
| [02-核心概念.md](docs/02-核心概念.md) | 程序化动画的核心思想 |
| [03-实现思路.md](docs/03-实现思路.md) | 链式运动、肢体 IK、行为漫游、渲染的多种算法方向 |
| [04-架构参考.md](docs/04-架构参考.md) | 引擎与渲染分离、分层架构等可选架构模式 |
| [05-交互设计.md](docs/05-交互设计.md) | 用户与生物互动的多种模式 |
| [06-性能建议.md](docs/06-性能建议.md) | 优化方向和策略 |

## 技术栈

- **Portal**：Hono + Cloudflare Workers + Tailwind CSS
- **子项目**：React 19 + p5.js + Vite 8 + Tailwind CSS 4
- **包管理器**：bun

## 对比维度

### 功能完整性
- 是否实现了核心的链式运动
- 是否包含生物行为系统
- 交互功能是否完善

### 代码质量
- 代码结构是否清晰
- 是否遵循单一职责原则
- 命名是否规范

### 算法选择
- 选择了哪种链式运动算法
- IK 实现方式
- 是否有创新性

### 视觉表现
- 生物的视觉风格
- 动画流畅度
- 是否有独特的视觉效果

### 架构设计
- 是否采用了引擎与渲染分离
- 模块划分是否合理
- 可扩展性如何

## 开发理念

这不是一个"按规格实现"的项目，而是一个启发创造力的画布：

- **没有标准答案**：鼓励独特的实现方式
- **迭代开发**：先让简单版本跑起来，再观察调整
- **在"错误"中发现**：算法错误可能产生有趣效果

## License

MIT
