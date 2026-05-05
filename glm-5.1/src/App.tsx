import { useEffect, useState } from 'react'
import { P5Canvas } from '@p5-wrapper/react'
import sketch, { sketchState } from './sketch'
import './styles.css'

const STATE_LABELS: Record<string, string> = {
  wander: '漫游',
  hunt: '觅食',
  startle: '惊吓',
  rest: '休息',
  curious: '好奇',
  play: '玩耍',
  sleep: '睡眠',
  eat: '进食',
}

export default function App() {
  const [behaviorState, setBehaviorState] = useState(sketchState.behaviorState)
  const [emotion, setEmotion] = useState(sketchState.emotion)
  const [intent, setIntent] = useState(sketchState.intent)
  const [helpVisible, setHelpVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      if (sketchState.behaviorState !== behaviorState) {
        setBehaviorState(sketchState.behaviorState)
      }
      setEmotion({ ...sketchState.emotion })
      setIntent(sketchState.intent)
    }, 150)
    return () => clearInterval(interval)
  }, [behaviorState])

  useEffect(() => {
    const timer = setTimeout(() => setHelpVisible(false), 10000)
    return () => clearTimeout(timer)
  }, [])

  const energyPercent = Math.round(emotion.energy * 100)
  const satisfactionPercent = Math.round(emotion.satisfaction * 100)
  const hungerPercent = Math.round(emotion.hunger * 100)
  const happinessPercent = Math.round(emotion.happiness * 100)

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
        <div className="hud-right">
          <div className="emotion-bars glass">
            <div className="emotion-bar">
              <span className="emotion-label">精力</span>
              <div className="bar-track">
                <div className="bar-fill bar-fill--energy" style={{ width: `${energyPercent}%` }} />
              </div>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">饱腹</span>
              <div className="bar-track">
                <div className="bar-fill bar-fill--hunger" style={{ width: `${100 - hungerPercent}%` }} />
              </div>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">满足</span>
              <div className="bar-track">
                <div className="bar-fill bar-fill--satisfaction" style={{ width: `${satisfactionPercent}%` }} />
              </div>
            </div>
            <div className="emotion-bar">
              <span className="emotion-label">快乐</span>
              <div className="bar-track">
                <div className="bar-fill bar-fill--happiness" style={{ width: `${happinessPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="state-badge glass" role="status" aria-live="polite">
            <span className={`state-dot state-dot--${behaviorState}`} />
            <span>{STATE_LABELS[behaviorState] ?? behaviorState}</span>
          </div>
        </div>
      </header>
      <div className="intent-bar glass">
        <span className="intent-text">{intent}</span>
      </div>
      <footer className={`help-footer${helpVisible ? '' : ' hidden'}`}>
        <p className="help-text glass">
          点击投食 · 双击惊吓 · 长按吸引 · 食物有偏好之分
        </p>
      </footer>
    </>
  )
}
