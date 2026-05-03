import { useEffect, useRef } from 'react'

export function Hero() {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const items = el.querySelectorAll('.reveal')
    items.forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 120)
    })
  }, [])

  return (
    <header className="hero" ref={heroRef}>
      <div className="hero-badge reveal">AI Model Comparison Lab</div>

      <h1 className="hero-title reveal reveal-delay-1">
        <span className="gradient-text">Bio-Engine</span>
      </h1>

      <p className="hero-subtitle reveal reveal-delay-2">AI 模型能力对比测试项目</p>
      <p className="hero-desc reveal reveal-delay-2">
        在相同的设计文档基础上，让不同的 AI 模型自由发挥，对比它们在算法思路、代码架构、视觉风格和功能完整性方面的差异。
      </p>
      <p className="hero-meta reveal reveal-delay-3">
        <span><span className="dot"></span> 算法思路</span>
        <span><span className="dot"></span> 代码架构</span>
        <span><span className="dot"></span> 视觉风格</span>
        <span><span className="dot"></span> 功能完整性</span>
      </p>

      <div className="scroll-hint reveal reveal-delay-4">
        <span>向下滚动探索</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </header>
  )
}
