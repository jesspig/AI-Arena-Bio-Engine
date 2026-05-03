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
        box-shadow: 0 0 40px rgba(26, 136, 255, 0.4);
      }
      .glow-glm {
        box-shadow: 0 0 40px rgba(16, 65, 243, 0.4);
      }
      .glow-deepseek {
        box-shadow: 0 0 40px rgba(86, 134, 254, 0.4);
      }
      .glow-mimo {
        box-shadow: 0 0 40px rgba(255, 105, 0, 0.4);
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
        background: linear-gradient(90deg, #1a88ff, #1041f3, #5686fe, #ff6900);
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
    <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
      <!-- Kimi-K2.6 -->
      <a href="/kimi-k2.6" class="model-card card-hover glow-kimi block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 h-full" style="border:1px solid rgba(26,136,255,0.3)">
          <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 pulse-glow bg-white">
            <svg class="w-12 h-12" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M842.1632 246.4512c6.9376-8.9344 13.056-17.0752 19.4816-24.96 2.9952-3.712 2.7392-6.528-.1536-10.4192-27.9552-36.736-30.592-77.5168-14.5152-118.912 12.0832-31.1552 38.784-45.7472 71.424-48.8448 20.352-1.92 40.32.1536 58.8288 10.0608 24.32 13.0048 38.5024 32.8448 43.1104 60.2368 3.6608 21.8624 2.9696 43.1872-3.2 64.3584-10.9824 37.4528-37.888 56.8576-74.8032 61.7728-30.6432 4.096-61.696 4.608-92.5952 6.7072-2.3808.1536-4.8128 0-7.5776 0z" fill="#027AFF"/><path d="M766.3872 78.6688h-184.576L435.6608 411.904h-206.592V80.128H64v858.5472h165.12V576.9728h291.1488a129.0752 129.0752 0 0 0 117.0432-74.6496v436.352h165.12V576.9728a165.12 165.12 0 0 0-153.088-164.6848v-.4352h-90.6752a168.1152 168.1152 0 0 0 99.1232-90.4448l108.5952-242.7392z" fill="#000"/></svg>
          </div>
          <h2 class="text-3xl font-bold mb-3" style="color:#1a88ff">Kimi-K2.6</h2>
          <p class="text-gray-400 mb-6">月之暗面出品的新一代大模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(26,136,255,0.15);color:rgba(26,136,255,0.85);border:1px solid rgba(26,136,255,0.3)">算法创造力</span>
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(26,136,255,0.15);color:rgba(26,136,255,0.85);border:1px solid rgba(26,136,255,0.3)">视觉表现</span>
          </div>
          <div class="flex items-center" style="color:#1a88ff">
            <span class="font-medium">查看实现</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>

      <!-- GLM-5.1 -->
      <a href="/glm-5.1" class="model-card card-hover glow-glm block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 h-full" style="border:1px solid rgba(16,65,243,0.3)">
          <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 pulse-glow" style="background:#2d2d2d">
            <svg class="w-12 h-12" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"><path d="M24.51 28.51H5.49c-2.21 0-4-1.79-4-4V5.49c0-2.21 1.79-4 4-4h19.03c2.21 0 4 1.79 4 4v19.03c0 2.21-1.79 4-4.01 3.99z" fill="#2D2D2D" stroke="#fff" stroke-width=".3162" stroke-miterlimit="10"/><path d="M15.47 7.1l-1.3 1.85c-.2.29-.54.47-.9.47h-7.1V7.09h9.3zM24.3 7.1L13.14 22.91H5.7L16.86 7.1z" fill="#fff"/><path d="M14.53 22.91l1.31-1.86c.2-.29.54-.47.9-.47h7.09v2.33h-9.3z" fill="#fff"/></svg>
          </div>
          <h2 class="text-3xl font-bold mb-3" style="color:#1041f3">GLM-5.1</h2>
          <p class="text-gray-400 mb-6">智谱 AI 最新大语言模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(16,65,243,0.15);color:rgba(16,65,243,0.85);border:1px solid rgba(16,65,243,0.3)">代码架构</span>
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(16,65,243,0.15);color:rgba(16,65,243,0.85);border:1px solid rgba(16,65,243,0.3)">系统设计</span>
          </div>
          <div class="flex items-center" style="color:#1041f3">
            <span class="font-medium">查看实现</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>

      <!-- DeepSeek-V4 -->
      <a href="/deepseek-v4" class="model-card card-hover glow-deepseek block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 h-full" style="border:1px solid rgba(86,134,254,0.3)">
          <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 pulse-glow bg-white">
            <svg class="w-12 h-12" viewBox="0 0 35 26" xmlns="http://www.w3.org/2000/svg"><path fill="#5686fe" d="M33.615 2.598c-.36-.176-.515.16-.726.33-.072.055-.132.127-.193.193-.526.562-1.14.93-1.943.887-1.174-.067-2.176.302-3.062 1.2-.188-1.107-.814-1.767-1.766-2.191-.498-.22-1.002-.441-1.35-.92-.244-.341-.31-.721-.433-1.096-.077-.226-.154-.457-.415-.496-.282-.044-.393.193-.504.391-.443.81-.614 1.702-.598 2.605.04 2.033.898 3.652 2.603 4.803.193.132.243.264.182.457-.116.397-.254.782-.376 1.179-.078.253-.194.308-.465.198-.936-.391-1.744-.97-2.458-1.669-1.213-1.173-2.31-2.467-3.676-3.48a16.254 16.254 0 0 0-.975-.668c-1.395-1.354.183-2.467.548-2.599.382-.138.133-.612-1.102-.606-1.234.005-2.364.42-3.803.97a4.34 4.34 0 0 1-.66.193 13.577 13.577 0 0 0-4.08-.143c-2.667.297-4.799 1.558-6.365 3.712C.116 8.436-.327 11.378.215 14.444c.57 3.233 2.22 5.91 4.755 8.002 2.63 2.17 5.658 3.233 9.113 3.03 2.098-.122 4.434-.403 7.07-2.633.664.33 1.362.463 2.518.562.892.083 1.75-.044 2.414-.182 1.04-.22.97-1.184.593-1.36-3.05-1.421-2.38-.843-2.99-1.311 1.55-1.834 3.918-5.093 4.648-9.531.072-.49.164-1.18.153-1.577-.006-.242.05-.336.326-.364a5.903 5.903 0 0 0 2.187-.672c1.977-1.08 2.774-2.853 2.962-4.978.028-.325-.006-.661-.35-.832zM16.39 21.73c-2.956-2.324-4.39-3.089-4.982-3.056-.554.033-.454.667-.332 1.08.127.407.293.688.526 1.046.16.237.271.59-.161.854-.952.589-2.607-.198-2.685-.237-1.927-1.134-3.537-2.632-4.673-4.68-1.096-1.972-1.733-4.087-1.838-6.345-.028-.545.133-.738.676-.837A6.643 6.643 0 0 1 5.086 9.5c3.017.441 5.586 1.79 7.74 3.927 1.229 1.217 2.159 2.671 3.116 4.092 1.02 1.509 2.115 2.946 3.51 4.125.494.413.887.727 1.263.958-1.135.127-3.028.154-4.324-.87v-.002zm1.417-9.114a.434.434 0 0 1 .587-.408c.06.022.117.055.16.105a.426.426 0 0 1 .122.303.434.434 0 0 1-.437.435.43.43 0 0 1-.432-.435zm4.402 2.257c-.283.116-.565.215-.836.226-.421.022-.88-.149-1.13-.358-.387-.325-.664-.506-.78-1.073-.05-.242-.022-.617.022-.832.1-.463-.011-.76-.338-1.03-.265-.22-.603-.28-.974-.28a.8.8 0 0 1-.36-.11c-.155-.078-.283-.27-.161-.508.039-.077.227-.264.271-.297.504-.286 1.085-.193 1.623.022.498.204.875.578 1.417 1.107.553.639.653.815.968 1.295.25.374.476.76.632 1.2.094.275-.028.5-.354.638z"/></svg>
          </div>
          <h2 class="text-3xl font-bold mb-3" style="color:#5686fe">DeepSeek-V4</h2>
          <p class="text-gray-400 mb-6">深度求索的开源大模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(86,134,254,0.15);color:rgba(86,134,254,0.85);border:1px solid rgba(86,134,254,0.3)">功能完整</span>
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(86,134,254,0.15);color:rgba(86,134,254,0.85);border:1px solid rgba(86,134,254,0.3)">技术创新</span>
          </div>
          <div class="flex items-center" style="color:#5686fe">
            <span class="font-medium">查看实现</span>
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </div>
      </a>

      <!-- Mimo-V2.5-Pro -->
      <a href="/mimo-v2.5-pro" class="model-card card-hover glow-mimo block">
        <div class="bg-gray-900/60 backdrop-blur-md rounded-3xl p-8 h-full" style="border:1px solid rgba(255,105,0,0.3)">
          <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 pulse-glow bg-white">
            <svg class="w-14 h-14" viewBox="0 0 808 808" xmlns="http://www.w3.org/2000/svg"><path fill="#ff6900" d="M723.79 84.42C647.55 8.48 537.94 0 404 0 269.89 0 160.12 8.58 83.92 84.72S0 270.43 0 404.39 7.74 648 84 724.14 269.9 808 404 808s243.85-7.71 320-83.86 84-185.78 84-319.75c0-134.14-7.84-243.85-84.21-319.97z"/><path fill="#fff" d="M374.26 553.72a5 5 0 0 1-5.06 5H300.3a5.05 5.05 0 0 1-5.12-5V373.53a5.05 5.05 0 0 1 5.12-5h68.9a5 5 0 0 1 5.06 5zM509.18 553.72a5.05 5.05 0 0 1-5.09 5H438.5a5 5 0 0 1-5.1-5V398.26c-.07-27.15-1.62-55-15.64-69.06-12-12.09-34.51-14.86-57.88-15.44H241a5 5 0 0 0-5.07 5v235a5.07 5.07 0 0 1-5.12 5H165.16a5 5 0 0 1-5.06-5V254.31a5 5 0 0 1 5.06-5H354.52c49.49 0 101.22 2.26 126.74 27.81s27.92 77.3 27.92 126.85zM644.29 553.72a5.06 5.06 0 0 1-5.09 5H573.57a5 5 0 0 1-5.08-5V254.31a5 5 0 0 1 5.08-5H639.2a5.06 5.06 0 0 1 5.09 5z"/></svg>
          </div>
          <h2 class="text-3xl font-bold mb-3" style="color:#ff6900">Mimo-V2.5-Pro</h2>
          <p class="text-gray-400 mb-6">小米推出的多模态大模型</p>
          <div class="flex flex-wrap gap-2 mb-6">
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(255,105,0,0.15);color:rgba(255,105,0,0.85);border:1px solid rgba(255,105,0,0.3)">多模态</span>
            <span class="px-4 py-2 rounded-full text-sm font-medium" style="background:rgba(255,105,0,0.15);color:rgba(255,105,0,0.85);border:1px solid rgba(255,105,0,0.3)">推理能力</span>
          </div>
          <div class="flex items-center" style="color:#ff6900">
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
      { id: 'kimi-k2.6', name: 'Kimi-K2.6', path: '/kimi-k2.6', color: '#1a88ff' },
      { id: 'glm-5.1', name: 'GLM-5.1', path: '/glm-5.1', color: '#1041f3' },
      { id: 'deepseek-v4', name: 'DeepSeek-V4', path: '/deepseek-v4', color: '#5686fe' },
      { id: 'mimo-v2.5-pro', name: 'Mimo-V2.5-Pro', path: '/mimo-v2.5-pro', color: '#ff6900' }
    ]
  })
})

app.get('/health', (c) => c.json({ status: 'ok', timestamp: Date.now() }))

export default app
