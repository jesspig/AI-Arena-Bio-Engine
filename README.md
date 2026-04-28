# Bio-Engine：AI 模型表现对比研究

## 项目目标

本项目旨在通过同一工程文档规范下，对比不同 AI 模型在代码实现任务上的表现差异。

项目包含一份详尽的技术规格文档（[CLAUDE.md](CLAUDE.md)），定义了清晰的架构决策、技术约束和实现规范。同一套文档将作为提示词输入给不同的 AI 模型，观察它们在代码生成质量、架构遵循度、边界 case 处理等方面的差异。

## 技术栈

| 领域 | 选型 |
| --- | --- |
| 前端框架 | React 19.x |
| 编程语言 | TypeScript（严格模式） |
| 动画引擎 | p5.js 1.11.x（实例模式） |
| p5 集成 | @p5-wrapper/react ^5.0.3 |
| 状态管理 | React Context + useReducer |
| 样式方案 | Tailwind CSS 4.x |
| 构建工具 | Vite 6.x |

## 快速开始

```bash
cd glm-5.1
bun install
bun run dev
bun run typecheck
```

## 工程文档

详细的技术规格和实现文档位于 `docs/` 目录：

| 文档 | 内容 |
| --- | --- |
| 01-项目概述与架构决策 | 系统定位、技术选型、架构总览 |
| 02-系统架构设计 | 分层架构、文件结构、模块职责 |
| 03-核心引擎设计-脊柱算法 | Spine 链式约束、Verlet 积分 |
| 04-核心引擎设计-IK肢体算法 | Leg 二关节 IK 求解 |
| 05-Creature行为编排与自动漫游 | 行为模式、目标生成 |
| 06-状态管理与数据流 | Context + Reducer、数据流机制 |
| 07-UI组件设计 | Layout、Sidebar、CreatureList |
| 08-交互机制设计 | 手动控制、选中交互、参数调整 |
| 09-参数化设计 | 核心参数列表与范围 |
| 10-性能优化策略 | React/p5 端优化、内存管理 |
| 11-测试与可扩展性 | 测试方案、跨框架移植 |
| 12-快速开始指南 | 项目初始化、类型定义、使用流程 |

## 架构概览

```plaintext
界面层 (UI Layer)
    ↓ 派发 Action，读取状态
状态管理层 (State Layer)
    ↓ 提供状态，广播更新
适配层 (Adaptor Layer)
    ↓ 调用引擎，转换数据
引擎层 (Engine Layer) ← 纯逻辑，无框架依赖
```

| 层次 | 目录 | 职责 |
| --- | --- | --- |
| 界面层 | `src/components/` | React UI 组件，用户交互 |
| 状态管理层 | `src/state/` | Context Provider + Reducer |
| 适配层 | `src/hooks/` | 自定义 Hook，封装 p5 sketch |
| 引擎层 | `src/engine/` | 纯 TypeScript 类，核心算法 |
