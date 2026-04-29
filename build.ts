#!/usr/bin/env bun
/**
 * Bio-Engine Monorepo 构建脚本
 * 将三个子项目构建到 portal/public 目录，实现单 Worker 部署
 */

import { spawn } from 'child_process'
import { mkdir, rm, copyFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 跨平台运行命令
function runCommand(cmd: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, [], {
      cwd,
      shell: true,
      stdio: 'inherit',
    })
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with code ${code}`))
    })
  })
}

// 递归复制目录
async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg: string) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg: string) => console.log(`\n${colors.bright}${colors.blue}▶${colors.reset} ${msg}`),
}

// 项目配置
const projects = [
  { name: 'Kimi-K2.6', path: './kimi-k2.6', output: 'portal/public/kimi-k2.6' },
  { name: 'GLM-5.1', path: './glm-5.1', output: 'portal/public/glm-5.1' },
  { name: 'DeepSeek-V4', path: './deepseek-v4', output: 'portal/public/deepseek-v4' },
]

async function buildProject(project: typeof projects[0]) {
  log.step(`构建 ${colors.bright}${project.name}${colors.reset}`)
  const projectPath = join(__dirname, project.path).replace(/\\/g, '/')
  const outputPath = join(__dirname, project.output)
  const distPath = join(projectPath, 'dist')

  // 检查项目目录是否存在
  if (!existsSync(projectPath)) {
    log.warn(`跳过 ${project.name}（目录不存在）`)
    return false
  }

  // 安装依赖
  log.info(`安装 ${project.name} 依赖...`)
  try {
    await runCommand('bun install', projectPath)
  } catch {
    log.warn(`依赖安装可能有问题，继续尝试构建`)
  }

  // 构建
  log.info(`构建 ${project.name}...`)
  try {
    await runCommand('bun run build', projectPath)
  } catch (error) {
    log.error(`${project.name} 构建失败`)
    return false
  }

  // 检查 dist 目录是否存在
  if (!existsSync(distPath)) {
    log.error(`${project.name} 构建产物不存在`)
    return false
  }

  // 创建输出目录
  await mkdir(outputPath, { recursive: true })

  // 复制构建产物
  log.info(`复制 ${project.name} 构建产物...`)
  try {
    await copyDir(distPath, outputPath)
    log.success(`${project.name} 构建完成`)
    return true
  } catch (error) {
    log.error(`${project.name} 构建产物复制失败`)
    console.error(error)
    return false
  }
}

async function clean() {
  log.step('清理构建目录')
  try {
    await rm(join(__dirname, 'portal/public'), { recursive: true, force: true })
    log.success('清理完成')
  } catch {
    // 目录不存在，忽略
  }
}

async function main() {
  console.log(`\n${colors.bright}${colors.cyan}
╔═══════════════════════════════════════╗
║   Bio-Engine Monorepo 构建工具        ║
║   单 Worker 部署解决方案              ║
╚═══════════════════════════════════════╝
${colors.reset}\n`)

  // 检查命令参数
  const args = process.argv.slice(2)
  const shouldClean = args.includes('--clean') || args.includes('-c')

  if (shouldClean) {
    await clean()
  }

  // 创建 public 目录
  await mkdir(join(__dirname, 'portal/public'), { recursive: true })

  // 构建所有项目
  const results: { project: typeof projects[0]; success: boolean; duration: number }[] = []

  for (const project of projects) {
    const start = Date.now()
    const success = await buildProject(project)
    const duration = Date.now() - start
    results.push({ project, success, duration })
  }

  // 输出摘要
  console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(`${colors.bright}构建摘要${colors.reset}`)
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  let successCount = 0
  for (const result of results) {
    const status = result.success
      ? `${colors.green}✓ 成功${colors.reset}`
      : `${colors.red}✗ 失败${colors.reset}`
    const time = `${result.duration}ms`
    console.log(`  ${result.project.name.padEnd(15)} ${status}  ${colors.dim}${time}${colors.reset}`)
    if (result.success) successCount++
  }

  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`)

  if (successCount === projects.length) {
    log.success(`${colors.bright}所有项目构建完成！${colors.reset}`)
    log.info(`现在可以运行: ${colors.cyan}bun run dev${colors.reset}`)
    process.exit(0)
  } else if (successCount > 0) {
    log.warn(`部分项目构建失败（${successCount}/${projects.length} 成功）`)
    process.exit(1)
  } else {
    log.error('所有项目构建失败')
    process.exit(1)
  }
}

main().catch((error) => {
  log.error('构建过程出错')
  console.error(error)
  process.exit(1)
})
