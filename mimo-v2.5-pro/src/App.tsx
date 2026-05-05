import { useState, useCallback, useRef } from 'react'
import BioCanvas from './components/BioCanvas'
import ControlPanel from './components/ControlPanel'
import { BehaviorState } from './engine/types'

interface NeedsState {
  hunger: number
  energy: number
  curiosity: number
  social: number
  mood: number
}

export default function App() {
  const [showDebug, setShowDebug] = useState(false)
  const [creatureState, setCreatureState] = useState<string>(BehaviorState.WANDERING)
  const [needs, setNeeds] = useState<NeedsState | undefined>()
  const [resetKey, setResetKey] = useState(0)

  const handleStateChange = useCallback((state: string) => {
    setCreatureState(state)
  }, [])

  const handleNeedsChange = useCallback((n: NeedsState) => {
    setNeeds(n)
  }, [])

  const handleReset = useCallback(() => {
    setResetKey(k => k + 1)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-950">
      <BioCanvas
        key={resetKey}
        showDebug={showDebug}
        onStateChange={handleStateChange}
        onNeedsChange={handleNeedsChange}
      />

      <header className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex items-center justify-between px-5 py-4">
          <a
            href="/"
            className="pointer-events-auto group flex items-center gap-2.5 px-3.5 py-2 rounded-xl
                       bg-gray-900/70 backdrop-blur-lg border border-gray-700/40
                       text-gray-400 hover:text-white hover:bg-gray-800/80 hover:border-gray-600/50
                       transition-all duration-200 ease-out
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            aria-label="返回 Portal 主页"
          >
            <svg
              className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm font-medium">Portal</span>
          </a>

          <div className="text-right">
            <h1 className="text-sm font-semibold text-white/70 tracking-wide">
              MiMo V2.5 Pro
            </h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              程序化脊椎爬行动物 · AI 驱动行为
            </p>
          </div>
        </div>
      </header>

      <ControlPanel
        showDebug={showDebug}
        onToggleDebug={() => setShowDebug(!showDebug)}
        creatureState={creatureState}
        needs={needs}
        onReset={handleReset}
      />
    </div>
  )
}
