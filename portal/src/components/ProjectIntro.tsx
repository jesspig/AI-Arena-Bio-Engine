import { useEffect, useRef } from 'react'

export function ProjectIntro() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const cards = section.querySelectorAll('.intro-card')
    const cta = section.querySelector('.intro-cta')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    )

    cards.forEach((card, i) => {
      (card as HTMLElement).style.setProperty('--card-delay', `${i * 100}ms`)
      observer.observe(card)
    })

    if (cta) observer.observe(cta)

    return () => observer.disconnect()
  }, [])

  return (
    <section id="project-intro" className="project-intro" ref={sectionRef}>
      <div className="intro-hero">
        <div className="intro-badge">关于项目</div>
        <h2>Bio-Engine</h2>
        <p className="intro-tagline">生物引擎 · AI 模型能力对比</p>
      </div>

      <div className="intro-grid">
        <div className="intro-card intro-purpose scroll-reveal" style={{ '--card-delay': '0ms' } as React.CSSProperties}>
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3>实验目的</h3>
          <p>完全开放式的创意测试。唯一限制是符合生物引擎主题，其他所有内容模型自由发挥。测试各模型在审美、架构、代码、设计等维度的能力。</p>
        </div>

        <div className="intro-card intro-method scroll-reveal" style={{ '--card-delay': '100ms' } as React.CSSProperties}>
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3>参与方式</h3>
          <p>所有模型共享相同的设计文档（docs/），包括核心概念、算法参考、架构建议等。每个模型根据这些文档独立实现，展现各自的创意和工程能力。</p>
        </div>

        <div className="intro-card intro-models scroll-reveal" style={{ '--card-delay': '200ms' } as React.CSSProperties}>
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
            <span className="model-tag" style={{ background: 'rgba(255,105,0,0.15)', color: '#ff6900' }}>MiMo-V2.5-Pro</span>
          </div>
        </div>

        <div className="intro-card intro-philosophy scroll-reveal" style={{ '--card-delay': '300ms' } as React.CSSProperties}>
          <div className="intro-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h3>开发理念</h3>
          <p>程序化动画没有标准答案。这不是一个「按规格实现」的项目，而是一个启发创造力的画布。</p>
        </div>
      </div>

      <div className="intro-cta scroll-reveal">
        <a href="#kimi-k2.6" className="intro-link">
          <span>向下探索各模型实现</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </div>
    </section>
  )
}