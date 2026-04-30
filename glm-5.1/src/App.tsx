import { useEffect, useState } from 'react'
import { P5Canvas } from '@p5-wrapper/react'
import sketch, { sketchState } from './sketch'
import './styles.css'

const STATE_LABELS: Record<string, string> = {
  wander: '漫游',
  hunt: '追踪',
  startle: '惊吓',
  rest: '休息',
}

export default function App() {
  const [behaviorState, setBehaviorState] = useState(sketchState.behaviorState)
  const [helpVisible, setHelpVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      if (sketchState.behaviorState !== behaviorState) {
        setBehaviorState(sketchState.behaviorState)
      }
    }, 150)
    return () => clearInterval(interval)
  }, [behaviorState])

  useEffect(() => {
    const timer = setTimeout(() => setHelpVisible(false), 6000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <P5Canvas sketch={sketch} />
      <header className="hud-header">
        <div className="hud-left">
          <a href="/" className="back-btn glass" aria-label="返回首页">
            <svg
              className="back-btn-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 12L6 8L10 4" />
            </svg>
            返回
          </a>
          <span className="creature-title">深渊螈</span>
        </div>
        <div className="state-badge glass" role="status" aria-live="polite">
          <span className={`state-dot state-dot--${behaviorState}`} />
          <span>{STATE_LABELS[behaviorState] ?? behaviorState}</span>
        </div>
      </header>
      <footer className={`help-footer${helpVisible ? '' : ' hidden'}`}>
        <p className="help-text glass">点击画布吸引生物 · 靠近触发惊吓</p>
      </footer>
    </>
  )
}
