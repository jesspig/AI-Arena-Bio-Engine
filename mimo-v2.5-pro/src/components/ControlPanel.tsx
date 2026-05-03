import { useState } from 'react'
import { BehaviorState } from '../engine/types'

interface ControlPanelProps {
  showDebug: boolean
  onToggleDebug: () => void
  creatureState: string
}

const stateLabels: Record<string, { label: string; color: string; dotColor: string }> = {
  [BehaviorState.IDLE]: { label: '休息中', color: 'text-gray-300', dotColor: 'bg-gray-400' },
  [BehaviorState.WANDERING]: { label: '漫步探索', color: 'text-emerald-300', dotColor: 'bg-emerald-400' },
  [BehaviorState.CURIOUS]: { label: '好奇观察', color: 'text-amber-300', dotColor: 'bg-amber-400' },
  [BehaviorState.FLEEING]: { label: '急速逃离', color: 'text-red-300', dotColor: 'bg-red-400' },
}

export default function ControlPanel({ showDebug, onToggleDebug, creatureState }: ControlPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const stateInfo = stateLabels[creatureState] || stateLabels[BehaviorState.WANDERING]

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`
          bg-gray-900/75 backdrop-blur-xl rounded-2xl border border-gray-700/40 shadow-2xl shadow-black/30
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${expanded ? 'w-72 p-4' : 'w-auto p-2'}
        `}
      >
        {/* Primary controls — always visible */}
        <div className="flex items-center gap-2">
          {/* State indicator / expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl
                       bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-150
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50"
            aria-expanded={expanded}
            aria-label={`当前状态: ${stateInfo.label}。点击${expanded ? '收起' : '展开'}控制面板`}
          >
            <span
              className={`w-2 h-2 rounded-full ${stateInfo.dotColor} animate-pulse`}
              aria-hidden="true"
            />
            <span className={`text-sm font-medium ${stateInfo.color}`}>
              {stateInfo.label}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          {/* Debug toggle */}
          <button
            onClick={onToggleDebug}
            className={`
              px-3 py-2 rounded-xl text-xs font-mono tracking-wide transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50
              ${showDebug
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                : 'bg-gray-800/50 text-gray-500 hover:text-gray-400 hover:bg-gray-700/50 border border-transparent'}
            `}
            aria-label={`调试信息: ${showDebug ? '已开启' : '已关闭'}`}
            aria-pressed={showDebug}
          >
            DEBUG
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-700/30 space-y-2.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="text-xs text-gray-500 space-y-2">
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0" aria-hidden="true"></span>
                <span>移动鼠标吸引生物</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 shrink-0" aria-hidden="true"></span>
                <span>按住鼠标驱赶生物</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500/70 shrink-0" aria-hidden="true"></span>
                <span>远离则自动漫游</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
