import { Hono } from 'hono'
import { html } from 'hono/html'

const app = new Hono()

// ============ 布局模板 ============
const layout = (title: string, content: string) => html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style type="text/tailwindcss">
    @layer utilities {
      .gradient-bg {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      }
      .card-hover {
        transition: all 0.3s ease;
      }
      .card-hover:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      }
      .glow-kimi {
        box-shadow: 0 0 40px rgba(139, 92, 246, 0.4);
      }
      .glow-glm {
        box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
      }
      .glow-deepseek {
        box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(5deg); }
      }
      .float-animation {
        animation: float 4s ease-in-out infinite;
      }
      @keyframes pulse-glow {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.05); }
      }
      .pulse-glow {
        animation: pulse-glow 2.5s ease-in-out infinite;
      }
      @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .gradient-text {
        background: linear-gradient(90deg, #a855f7, #3b82f6, #ef4444);
        background-size: 200% 200%;
        -webkit-background-clip: text;
        background-clip: text;
        animation: gradient-shift 3s ease infinite;
      }
    }
  </style>
</head>
<body class="gradient-bg min-h-screen text-white font-sans">
  ${content}
</body>
</html>
`

// ============ Portal 主页 ============
const renderPortal = () => layout('Bio-Engine - AI 模型能力对比', html`
  <div class="container mx-auto px-4 py-12">
    <!-- 头部 -->
    <header class="text-center mb-16">
      <div class="inline-block mb-6">
        <div class="w-28 h-28 mx-auto bg-gradient-to-br from-purple-600 via-blue-600 to-red-600 rounded-3xl flex items-center justify-center float-animation shadow-2xl">
          <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      </div>
      <h1 class="text-6xl font-bold mb-4">
        <span class="gradient-text">Bio-Engine</span>
      </h1>
      <p class="text-2xl text-gray-300 mb-3">AI 模型能力对比测试项目</p>
      <p class="text-gray-400 max-w-2xl mx-auto text-lg">
        在相同的设计文档基础上，让不同的 AI 模型自由发挥
      </p>
      <p class="text-gray-500 text-sm mt-2">对比算法思路 · 代码架构 · 视觉风格 · 功能完整性</p>
    </header>

    <!-- 模型卡片 -->
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
      <!-- Kimi-K2.6 -->
      <a href="/kimi-k2.6" class="model-card card-hover glow-kimi block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 border border-purple-500/30 h-full">
          <div class="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-6 pulse-glow">
            <span class="text-4xl font-black">K</span>
          </div>
          <h2 class="text-3xl font-bold mb-3 text-purple-400">Kimi-K2.6</h2>
          <p class="text-gray-400 mb-6">月之暗面出品的新一代大模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">算法创造力</span>
            <span class="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full text-sm font-medium border border-purple-500/30">视觉表现</span>
          </div>
          <div class="flex items-center text-purple-400">
            <span class="font-medium">查看实现</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>

      <!-- GLM-5.1 -->
      <a href="/glm-5.1" class="model-card card-hover glow-glm block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 border border-blue-500/30 h-full">
          <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mb-6 pulse-glow">
            <span class="text-4xl font-black">G</span>
          </div>
          <h2 class="text-3xl font-bold mb-3 text-blue-400">GLM-5.1</h2>
          <p class="text-gray-400 mb-6">智谱 AI 最新大语言模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">代码架构</span>
            <span class="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">系统设计</span>
          </div>
          <div class="flex items-center text-blue-400">
            <span class="font-medium">查看实现</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>

      <!-- DeepSeek-V4 -->
      <a href="/deepseek-v4" class="model-card card-hover glow-deepseek block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 border border-red-500/30 h-full">
          <div class="w-20 h-20 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mb-6 pulse-glow">
            <span class="text-4xl font-black">D</span>
          </div>
          <h2 class="text-3xl font-bold mb-3 text-red-400">DeepSeek-V4</h2>
          <p class="text-gray-400 mb-6">深度求索的开源大模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm font-medium border border-red-500/30">功能完整</span>
            <span class="px-4 py-2 bg-red-500/20 text-red-300 rounded-full text-sm font-medium border border-red-500/30">技术创新</span>
          </div>
          <div class="flex items-center text-red-400">
            <span class="font-medium">查看实现</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>
    </div>

    <!-- 说明 -->
    <section class="max-w-4xl mx-auto mb-16">
      <h3 class="text-3xl font-bold text-center mb-10 text-gray-200">项目理念</h3>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4 class="font-bold text-lg mb-2">启发创造力</h4>
          <p class="text-gray-400">鼓励独特的视觉风格和算法思路</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 class="font-bold text-lg mb-2">无标准答案</h4>
          <p class="text-gray-400">自由选择技术方向和实现方式</p>
        </div>
        <div class="text-center">
          <div class="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0h4a1 1 0 011 1v3M7 4H3a1 1 0 00-1 1v3m18 0v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8m18 0H3" />
            </svg>
          </div>
          <h4 class="font-bold text-lg mb-2">迭代开发</h4>
          <p class="text-gray-400">在探索中发现有趣效果</p>
        </div>
      </div>
    </section>

    <!-- 技术栈 -->
    <section class="text-center mb-12">
      <div class="inline-flex items-center gap-6 bg-gray-900/40 backdrop-blur-sm px-8 py-4 rounded-2xl border border-gray-700/50">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-cyan-400 rounded-full"></span>
          <span class="text-gray-300">React 19</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-orange-400 rounded-full"></span>
          <span class="text-gray-300">p5.js</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-teal-400 rounded-full"></span>
          <span class="text-gray-300">Tailwind CSS 4</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 bg-purple-400 rounded-full"></span>
          <span class="text-gray-300">Vite 8</span>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="text-center text-gray-500 text-sm border-t border-gray-800 pt-8">
      <p>Bio-Engine &copy; 2025 | AI 模型能力对比测试</p>
      <p class="mt-2 text-gray-600">Powered by Hono + Cloudflare Workers</p>
    </footer>
  </div>
`)

// ============ 路由定义 ============

// 主页
app.get('/', (c) => c.html(renderPortal()))

// API 路由
app.get('/api/projects', (c) => {
  return c.json({
    projects: [
      { id: 'kimi-k2.6', name: 'Kimi-K2.6', path: '/kimi-k2.6', color: 'purple' },
      { id: 'glm-5.1', name: 'GLM-5.1', path: '/glm-5.1', color: 'blue' },
      { id: 'deepseek-v4', name: 'DeepSeek-V4', path: '/deepseek-v4', color: 'red' }
    ]
  })
})

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

export default app
