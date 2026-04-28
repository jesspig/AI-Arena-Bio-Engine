# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

生物引擎（Bio-Engine）是一个基于 React 和 p5.js 的程序化生物动画系统，用于创建具有自然运动行为的虚拟生物。系统采用分层架构，核心引擎层与框架完全解耦。

**项目结构**：根目录包含项目文档，实际的 React 应用代码位于 `glm-5.1/` 子目录中。

## 技术栈

- **前端框架**: React 19.x
- **编程语言**: TypeScript（严格模式，noUnusedLocals/noUnusedParameters 启用）
- **动画引擎**: p5.js 1.11.x（实例模式）
- **p5 集成**: @p5-wrapper/react ^5.0.3（通过 `updateWithProps` 回调同步状态）
- **状态管理**: React Context + useReducer
- **样式方案**: Tailwind CSS 4.x（CSS-first 配置，无 tailwind.config.js）
- **构建工具**: Vite 6.x（通过 `@vitejs/plugin-react` + `@tailwindcss/vite` 插件）
- **包管理器**: Bun

## 常用命令

所有命令需在 `glm-5.1/` 目录中执行：

```bash
cd glm-5.1           # 进入应用目录
bun install          # 安装依赖
bun run dev          # 运行开发服务器（Vite dev server）
bun run typecheck    # 类型检查（tsc -b）
bun run build        # 构建（tsc -b && vite build）
bun run preview      # 本地预览构建产物
```

当前项目没有测试框架。

## 分层架构

系统采用四层架构，依赖方向单向向下：

```plaintext
界面层 (UI Layer)
    ↓ 派发 Action，读取状态
状态管理层 (State Layer)
    ↓ 提供状态，广播更新
适配层 (Adaptor Layer)
    ↓ 调用引擎，转换数据
引擎层 (Engine Layer) ← 纯逻辑，无框架依赖
```

| 层次 | 目录（相对于 glm-5.1/） | 职责 | 依赖 |
| --- | --- | --- | --- |
| 界面层 | `src/components/` | React UI 组件，用户交互 | 状态管理层 |
| 状态管理层 | `src/state/` | Context Provider + Reducer，不可变状态 | 无外部依赖 |
| 适配层 | `src/hooks/` | 自定义 Hook，封装 p5 sketch 工厂函数 | 状态管理层 + 引擎层 |
| 引擎层 | `src/engine/` | 纯 TypeScript 类，核心算法 | 无任何依赖 |

### 引擎层核心模块

| 文件（glm-5.1/src/engine/） | 职责 |
| --- | --- |
| `Creature.ts` | 生物主体：数据聚合、行为编排、配置增量更新（`applyConfig`） |
| `Spine.ts` | 脊柱链式约束：头部追逐目标 + 距离约束求解 |
| `Leg.ts` | 反向运动学：二关节 IK 解析求解、抬脚检测与重定位 |

### Action 类型

- `ADD_CREATURE`: 添加新生物（使用默认配置 + 自增 ID）
- `REMOVE_CREATURE`: 删除指定 ID 的生物
- `SELECT_CREATURE`: 选中/取消选中生物（取消时清除所有 isSelected）
- `SET_TARGET`: 为指定生物设置移动目标
- `UPDATE_CONFIG`: 增量更新生物的部分配置参数

## 数据流机制

### React → p5 方向

1. UI 组件通过 `dispatch` 派发 Action
2. Reducer 计算新状态（不可变更新）并返回
3. Context 广播状态更新，触发 `CanvasPanel` 重渲染
4. `P5Canvas` 组件将 props 传递给 sketch
5. p5 的 `updateWithProps` 回调将 props 写入闭包变量
6. p5 `draw` 循环每帧读取闭包变量中的最新配置

### p5 → React 方向

1. 用户在 p5 画布中**右键点击**（左键事件被忽略）
2. `mousePressed` 回调检测 `selectedId` 非空
3. 通过闭包中的 `dispatch` 派发 `SET_TARGET` Action
4. Reducer 更新对应生物的 `target`
5. 新状态广播后通过 `updateWithProps` 同步回 p5

### 交互流程总结

```
用户操作流程：
1. 点击 Sidebar 中的 "添加生物" → 创建新生物
2. 点击生物列表项选中生物 → 显示选中环和目标线
3. 右键点击画布设置目标点 → 选中生物移动到目标
4. 未选中生物自动随机漫游
5. 点击 "删除" 移除生物 → 从状态和画布中清除
```

### 关键实现模式

**Creature 实例生命周期**: `useCreatureSketch` 内部通过 `Map<string, Creature>` 管理实例。每帧 `draw` 中：
- 删除不在当前配置列表中的实例
- 对已存在的实例调用 `applyConfig` 增量更新配置（避免重建）
- 对新配置创建新实例

**CanvasPanel 优化**: 组件使用 `memo` 包裹，`createCreatureSketch()` 通过 `useMemo` 保证 sketch 函数引用稳定，避免不必要的重渲染。

**自动行为**: 未选中的生物会通过 `updateAutoTarget()` 在到达目标或无目标时自动生成随机目标点，范围由 `autoTargetRange` 控制。

## 核心算法参数

| 参数 | 范围 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `spineCount` | 3~30 | 10 | 脊柱节点总数 |
| `segLength` | 10~50 | 20 | 体节间距（像素） |
| `legCount` | 0~8 | 4 | 腿部数量 |
| `legSegments` | [5, 50] | [20, 15] | 股骨和胫骨长度数组 |
| `speed` | 1~10 | 5 | 头部追逐速度（像素/帧） |
| `constraintIterations` | 2~5 | 3 | 距离约束迭代次数（注意：`Spine.update` 内部当前硬编码为 3） |
| `liftThreshold` | 30~60 | 40 | 抬腿检测距离阈值 |
| `autoTargetRange` | — | [50, 50, 750, 550] | 自动目标的随机范围 [xMin, yMin, xMax, yMax] |

## 性能约束

- 生物数量建议 ≤ 20（超过需使用对象池模式）
- 距离约束迭代次数建议 3 次
- `draw` 循环中避免频繁对象分配
- `spineCount` > 30 会导致性能下降

## 开发规范

### 引擎层约束

- **零框架依赖**: `glm-5.1/src/engine/` 下的文件不得 import React、p5 或任何框架模块
- **纯函数类**: 所有算法通过参数接收数据，返回计算结果
- **可移植性**: 引擎层代码应能直接移植到 Vue、Svelte 等其他框架

### TypeScript 编译选项

项目启用严格模式及额外检查：
- `strict: true` - 严格模式
- `noUnusedLocals: true` - 未使用的局部变量报错
- `noUnusedParameters: true` - 未使用的参数报错
- `noFallthroughCasesInSwitch: true` - switch case 必须显式 break/return
- `noUncheckedSideEffectImports: true` - 副作用导入检查

### 状态不可变性

- 不直接修改状态对象
- 使用对象展开运算符创建新对象
- 数组操作使用 `filter`、`map` 等返回新数组的方法

## Tailwind CSS 4 主题变量

```css
@theme {
  --color-surface: #0a0a0a;
  --color-panel: #1a1a1a;
  --color-panel-hover: #2a2a2a;
  --color-accent: #4a9eff;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
  --color-border: #333333;
}
```

使用方式：`bg-surface`、`text-text-primary`、`border-border` 等。
