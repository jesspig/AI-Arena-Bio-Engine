import { useEffect, useState, useRef } from 'react'
import { ThemeToggle } from './components/ThemeToggle'
import { Nav } from './components/Nav'
import { QuickEntry } from './components/QuickEntry'
import { LiquidGlassFilter } from './components/LiquidGlassFilter'
import { ProjectIntro } from './components/ProjectIntro'
import { ModelSection } from './components/ModelSection'
import { MODELS } from './data/models'
import { useMouseGlow } from './hooks/useMouseGlow'
import './styles/globals.css'
import './styles/components.css'

function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showScrollHint, setShowScrollHint] = useState(true)
  const mainRef = useRef<HTMLElement>(null)

  useMouseGlow()

  useEffect(() => {
    const handleScroll = () => {
      const main = mainRef.current
      if (!main) return

      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))

      if (scrollTop > 100) {
        setShowScrollHint(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <LiquidGlassFilter />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      <ThemeToggle />
      <Nav />

      <main ref={mainRef}>
        <QuickEntry models={MODELS} />

        {showScrollHint && (
          <div className="scroll-hint">
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
        )}

        <ProjectIntro />

        {MODELS.map((model, i) => (
          <ModelSection key={model.id} model={model} index={i} />
        ))}

        <footer className="footer">
          <p>Bio-Engine &copy; 2026 &mdash; AI-Arena 生物引擎主题</p>
          <p>Powered by React + Vite + Cloudflare Workers</p>
        </footer>
      </main>
    </>
  )
}

export default App
