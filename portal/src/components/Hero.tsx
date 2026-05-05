import { useEffect, useRef, useState } from 'react'
import { useParallax } from '../hooks/useScrollAnimation'

export function Hero() {
  const heroRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const descRef = useRef<HTMLParagraphElement>(null)
  const metaRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 })
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 })

  const parallaxOffset = useParallax(0.3)
  const orb1Offset = useParallax(0.15)
  const orb2Offset = useParallax(0.2)

  useEffect(() => {
    const el = heroRef.current
    if (!el) return

    const items = el.querySelectorAll('.reveal')
    items.forEach((item, i) => {
      setTimeout(() => item.classList.add('visible'), i * 120)
    })
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight

      if (scrollY < viewportHeight) {
        const progress = scrollY / viewportHeight

        if (titleRef.current) {
          const translateY = progress * 80
          const opacity = 1 - progress * 1.5
          titleRef.current.style.transform = `translateY(${translateY}px)`
          titleRef.current.style.opacity = String(Math.max(0, opacity))
        }

        if (subtitleRef.current) {
          const translateY = progress * 60
          const opacity = 1 - progress * 1.8
          subtitleRef.current.style.transform = `translateY(${translateY}px)`
          subtitleRef.current.style.opacity = String(Math.max(0, opacity))
        }

        if (descRef.current) {
          const translateY = progress * 40
          const opacity = 1 - progress * 2
          descRef.current.style.transform = `translateY(${translateY}px)`
          descRef.current.style.opacity = String(Math.max(0, opacity))
        }

        if (metaRef.current) {
          const translateY = progress * 20
          const opacity = 1 - progress * 2.5
          metaRef.current.style.transform = `translateY(${translateY}px)`
          metaRef.current.style.opacity = String(Math.max(0, opacity))
        }

        if (badgeRef.current) {
          const scale = 1 - progress * 0.3
          const translateY = progress * 30
          badgeRef.current.style.transform = `translateY(${translateY}px) scale(${scale})`
          badgeRef.current.style.opacity = String(Math.max(0, 1 - progress * 2))
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="hero" ref={heroRef}>
      <div
        className="hero-mouse-glow"
        style={{
          '--mouse-x': `${mousePos.x}px`,
          '--mouse-y': `${mousePos.y}px`,
        } as React.CSSProperties}
      />
      <div
        className="hero-bg-gradient"
        style={{ transform: `translateY(${parallaxOffset * 0.5}px)` }}
      />
      <div
        className="hero-bg-orb hero-bg-orb-1"
        style={{ transform: `translateY(${orb1Offset * 0.3}px)` }}
      />
      <div
        className="hero-bg-orb hero-bg-orb-2"
        style={{ transform: `translateY(${orb2Offset * 0.4}px)` }}
      />

      <div className="hero-badge reveal" ref={badgeRef}>AI Model Comparison Lab</div>

      <h1 className="hero-title reveal reveal-delay-1" ref={titleRef}>
        <span className="gradient-text">Bio-Engine</span>
      </h1>

      <p className="hero-subtitle reveal reveal-delay-2" ref={subtitleRef}>AI 模型能力对比测试项目</p>
      <p className="hero-desc reveal reveal-delay-2" ref={descRef}>
        在相同的设计文档基础上，让不同的 AI 模型自由发挥，对比它们在算法思路、代码架构、视觉风格和功能完整性方面的差异。
      </p>
      <p className="hero-meta reveal reveal-delay-3" ref={metaRef}>
        <span><span className="dot"></span> 算法思路</span>
        <span><span className="dot"></span> 代码架构</span>
        <span><span className="dot"></span> 视觉风格</span>
        <span><span className="dot"></span> 功能完整性</span>
      </p>

      <div className="scroll-hint reveal reveal-delay-4">
        <div className="scroll-hint-text">
          <span className="scroll-hint-label">Scroll</span>
          <span>向下滚动探索</span>
        </div>
        <div className="scroll-hint-mouse">
          <div className="scroll-hint-wheel"></div>
        </div>
        <div className="scroll-hint-arrow">
          <div className="scroll-hint-arrow-line"></div>
          <svg className="scroll-hint-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>
    </header>
  )
}