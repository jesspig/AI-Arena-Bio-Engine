import { type Subprocess } from 'bun'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { rmSync, mkdirSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..', '..')

const PORTAL_PORT = 8788

const PROJECTS = [
  { name: 'Kimi-K2.6', dir: 'kimi-k2.6', port: 5100, color: '35' },
  { name: 'GLM-5.1', dir: 'glm-5.1', port: 5200, color: '34' },
  { name: 'DeepSeek-V4', dir: 'deepseek-v4', port: 5300, color: '31' },
]

const procs: Subprocess[] = []

function cleanup() {
  for (const proc of procs) {
    try { proc.kill() } catch {}
  }
  process.exit(0)
}

process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

function findWrangler(): string {
  const binDir = join(ROOT, 'node_modules', '.bin')
  for (const name of ['wrangler', 'wrangler.cmd']) {
    if (existsSync(join(binDir, name))) return join(binDir, name)
  }
  return 'wrangler'
}

async function main() {
  console.log(`\n  \x1b[1m\x1b[36mBio-Engine Monorepo\x1b[0m\n`)

  // 清理 stale 构建产物，使 wrangler [assets] 找不到文件而落入 Worker 代理
  const publicDir = join(ROOT, 'portal', 'public')
  for (const project of PROJECTS) {
    const dir = join(publicDir, project.dir)
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }
  mkdirSync(publicDir, { recursive: true })

  // 启动子项目 Vite dev server
  console.log('  启动子项目...')
  for (const project of PROJECTS) {
    const proc = Bun.spawn({
      cmd: ['bun', 'run', 'dev'],
      cwd: join(ROOT, project.dir),
      stdout: 'pipe',
      stderr: 'pipe',
    })
    procs.push(proc)
    console.log(`  \x1b[${project.color}m● ${project.name}\x1b[0m → http://localhost:${project.port}`)
  }

  // 启动 wrangler
  const wranglerBin = findWrangler()
  const wranglerProc = Bun.spawn({
    cmd: [wranglerBin, 'dev', '--local', '--port', String(PORTAL_PORT)],
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  })
  procs.push(wranglerProc)

  console.log(`  \x1b[32m● Portal\x1b[0m → http://localhost:${PORTAL_PORT}`)
  console.log(`\n  所有服务已就绪，Ctrl+C 停止全部\n`)

  await wranglerProc.exited
}

main()
