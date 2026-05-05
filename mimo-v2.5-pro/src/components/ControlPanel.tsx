import { useState } from 'react'
import { BehaviorState } from '../engine/types'

interface ControlPanelProps {
  showDebug: boolean
  onToggleDebug: () => void
  creatureState: string
  needs?: {
    hunger: number
    energy: number
    curiosity: number
    social: number
    mood: number
  }
  onClearFood?: () => void
  onClearObstacles?: () => void
  onReset?: () => void
}

const stateLabels: Record<string, { label: string; emoji: string; color: string; dotColor: string }> = {
  [BehaviorState.RESTING]: { label: '休息中', emoji: '\uD83D\uDE34', color: 'text-blue-300', dotColor: 'bg-blue-400' },
  [BehaviorState.IDLE]: { label: '发呆中', emoji: '\uD83D\uDE10', color: 'text-gray-300', dotColor: 'bg-gray-400' },
  [BehaviorState.WANDERING]: { label: '漫步探索', emoji: '\uD83E\uDD8E', color: 'text-emerald-300', dotColor: 'bg-emerald-400' },
  [BehaviorState.EXPLORING]: { label: '好奇探索', emoji: '\uD83D\uDD0D', color: 'text-cyan-300', dotColor: 'bg-cyan-400' },
  [BehaviorState.EATING]: { label: '进食中', emoji: '\uD83C\uDF7D', color: 'text-green-300', dotColor: 'bg-green-400' },
  [BehaviorState.GROOMING]: { label: '自我清洁', emoji: '\u2728', color: 'text-purple-300', dotColor: 'bg-purple-400' },
  [BehaviorState.CURIOUS]: { label: '好奇观察', emoji: '\uD83D\uDC40', color: 'text-amber-300', dotColor: 'bg-amber-400' },
  [BehaviorState.FLEEING]: { label: '急速逃离', emoji: '\uD83D\uDCA8', color: 'text-red-300', dotColor: 'bg-red-400' },
  [BehaviorState.SLEEPING]: { label: '深度睡眠', emoji: '\uD83C\uDF19', color: 'text-indigo-300', dotColor: 'bg-indigo-400' },
  [BehaviorState.PLAYING]: { label: '玩耍中', emoji: '\u266B', color: 'text-yellow-300', dotColor: 'bg-yellow-400' },
  [BehaviorState.SOCIALIZING]: { label: '社交互动', emoji: '\u2665', color: 'text-pink-300', dotColor: 'bg-pink-400' },
  [BehaviorState.PATROLLING]: { label: '领地巡逻', emoji: '\uD83D\uDC0E', color: 'text-teal-300', dotColor: 'bg-teal-400' },
}

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-gray-400 text-right">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
      <span className="w-7 text-gray-500 text-right tabular-nums">{Math.round(value * 100)}</span>
    </div>
  )
}

export default function ControlPanel({ showDebug, onToggleDebug, creatureState, needs, onClearFood, onClearObstacles, onReset }: ControlPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const stateInfo = stateLabels[creatureState] || stateLabels[BehaviorState.WANDERING]

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`
          bg-gray-900/75 backdrop-blur-xl rounded-2xl border border-gray-700/40 shadow-2xl shadow-black/30
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${expanded ? 'w-80 p-4' : 'w-auto p-2'}
        `}
      >
        <div className="flex items-center gap-2">
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
            <span className="text-base" aria-hidden="true">{stateInfo.emoji}</span>
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

          {needs && (
            <div className="px-2 py-1.5 rounded-lg bg-gray-800/30 text-lg" title={`心情: ${Math.round(needs.mood * 100)}%`}>
              {needs.mood > 0.8 ? '\uD83D\uDE0A' : needs.mood > 0.5 ? '\uD83D\uDE42' : needs.mood > 0.3 ? '\uD83D\uDE1F' : '\uD83D\uDE22'}
            </div>
          )}

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

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-700/30 space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
            {needs && (
              <div className="space-y-1.5">
                <NeedBar label="饱腹" value={1 - needs.hunger} color="bg-green-400" />
                <NeedBar label="精力" value={needs.energy} color="bg-blue-400" />
                <NeedBar label="好奇" value={needs.curiosity} color="bg-amber-400" />
                <NeedBar label="社交" value={needs.social} color="bg-pink-400" />
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1.5 pt-1 border-t border-gray-700/20">
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0"></span>
                <span>移动鼠标吸引生物</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0"></span>
                <span>点击放置食物（浆果/蘑菇/虫子）</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70 shrink-0"></span>
                <span>靠近头部抚摸互动</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 shrink-0"></span>
                <span>按住鼠标驱赶生物</span>
              </p>
              <p className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400/70 shrink-0"></span>
                <span>场景会自动刷新食物和环境刺激物</span>
              </p>
            </div>

            <div className="flex gap-2 pt-1 border-t border-gray-700/20">
              {onClearFood && (
                <button
                  onClick={onClearFood}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  清除食物
                </button>
              )}
              {onClearObstacles && (
                <button
                  onClick={onClearObstacles}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 transition-colors"
                >
                  清除障碍
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-800/30 transition-colors"
                >
                  重置生物
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
