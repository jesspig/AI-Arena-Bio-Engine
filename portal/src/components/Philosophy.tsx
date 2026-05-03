import { useEffect, useRef } from 'react'

export function Philosophy() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    )
    el.querySelectorAll('.reveal').forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="philosophy" ref={ref}>
      <h3 className="section-title reveal">项目理念</h3>
      <div className="philosophy-grid">
        <div className="philosophy-item philo-creativity reveal reveal-delay-1">
          <div className="philosophy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h4>启发创造力</h4>
          <p>鼓励独特的视觉风格和算法思路，每个模型自由诠释设计文档</p>
        </div>
        <div className="philosophy-item philo-freedom reveal reveal-delay-2">
          <div className="philosophy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4>无标准答案</h4>
          <p>自由选择技术方向和实现方式，展现多样化的解题路径</p>
        </div>
        <div className="philosophy-item philo-iterate reveal reveal-delay-3">
          <div className="philosophy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h4>迭代进化</h4>
          <p>在持续探索中发现有趣效果，算法「错误」可能产生惊喜</p>
        </div>
      </div>
    </section>
  )
}
