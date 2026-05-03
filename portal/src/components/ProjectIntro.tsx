export function ProjectIntro() {
  return (
    <section id="project-intro" className="project-intro">
      <div className="intro-hero">
        <div className="intro-badge">关于项目</div>
        <h2>Bio-Engine</h2>
        <p className="intro-tagline">AI 模型能力对比测试平台</p>
      </div>

      <div className="intro-grid">
        <div className="intro-card intro-purpose">
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3>实验目的</h3>
          <p>在相同的设计文档基础上，让不同的 AI 模型自由发挥，对比它们在算法思路、代码架构、视觉风格和功能完整性方面的差异。这不是一个「按规格实现」的项目，而是一个启发创造力的画布。</p>
        </div>

        <div className="intro-card intro-method">
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3>实验方法</h3>
          <p>所有子项目共享相同的设计文档（docs/），包括核心概念、算法参考、架构建议等。每个模型根据这些文档独立实现，最终通过对比揭示不同模型在创造力、架构思维和工程实践上的差异。</p>
        </div>

        <div className="intro-card intro-models">
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3>参与模型</h3>
          <div className="intro-model-list">
            <span className="model-tag" style={{ background: 'rgba(26,136,255,0.15)', color: '#1a88ff' }}>Kimi-K2.6</span>
            <span className="model-tag" style={{ background: 'rgba(16,65,243,0.15)', color: '#1041f3' }}>GLM-5.1</span>
            <span className="model-tag" style={{ background: 'rgba(77,107,254,0.15)', color: '#4D6BFE' }}>DeepSeek-V4</span>
            <span className="model-tag" style={{ background: 'rgba(255,105,0,0.15)', color: '#ff6900' }}>Mimo-V2.5-Pro</span>
          </div>
        </div>

        <div className="intro-card intro-philosophy">
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3>设计理念</h3>
          <p>算法是工具，不是教条。希望这些实现能给你一些灵感，去创造属于你自己的生命。</p>
        </div>
      </div>

      <div className="intro-cta">
        <a href="#kimi-k2.6" className="intro-link">
          <span>探索 Kimi 的实现</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  )
}
