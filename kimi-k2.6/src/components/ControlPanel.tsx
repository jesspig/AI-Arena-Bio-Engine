import { useState, useCallback, useEffect } from 'react';
import { WorldState } from '../engine/types';
import { addCreature } from '../engine/world';

interface ControlPanelProps {
  world: WorldState;
  onCreatureAdded: () => void;
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export default function ControlPanel({ world, onCreatureAdded }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [creatureCount, setCreatureCount] = useState(world.creatures.length);
  const [particleCount, setParticleCount] = useState(world.particles.length);

  const updateStats = useCallback(() => {
    setCreatureCount(world.creatures.length);
    setParticleCount(world.particles.length);
  }, [world]);

  useEffect(() => {
    const interval = setInterval(updateStats, 500);
    return () => clearInterval(interval);
  }, [updateStats]);

  const handleAddCreature = () => {
    const x = Math.random() * world.width * 0.8 + world.width * 0.1;
    const y = Math.random() * world.height * 0.8 + world.height * 0.1;
    addCreature(world, x, y);
    onCreatureAdded();
    updateStats();
  };

  const handleClearCreatures = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    world.creatures.length = 0;
    onCreatureAdded();
    updateStats();
    setShowConfirm(false);
  };

  const cancelClear = () => {
    setShowConfirm(false);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
    world.creatures.forEach((c) => {
      c.state = isPaused ? 'roam' : 'idle';
    });
  };

  return (
    <div className="absolute top-4 left-4 z-50 select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-md text-cyan-200 border border-cyan-500/30 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-900 hover:border-cyan-500/50 active:bg-slate-900 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          aria-expanded={isOpen}
          aria-controls="control-panel-body"
        >
          {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          <span>控制面板</span>
        </button>

        <button
          onClick={togglePause}
          className="flex items-center justify-center w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded-xl hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-slate-900 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          aria-label={isPaused ? '继续模拟' : '暂停模拟'}
          title={isPaused ? '继续模拟' : '暂停模拟'}
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>

        <a
          href="/"
          className="flex items-center justify-center w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded-xl hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-slate-900 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          aria-label="返回 Portal 首页"
          title="返回 Portal 首页"
        >
          <BackIcon />
        </a>
      </div>

      {isOpen && (
        <div
          id="control-panel-body"
          className="mt-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-72 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-cyan-200 text-sm font-semibold tracking-wide uppercase">
              生物控制
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
              </span>
              {isPaused ? '已暂停' : '运行中'}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddCreature}
              className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 active:bg-cyan-500/40 text-cyan-200 border border-cyan-500/30 hover:border-cyan-500/50 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]"
            >
              <PlusIcon />
              添加生物
            </button>
            <button
              onClick={handleClearCreatures}
              className="flex-1 flex items-center justify-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-500/40 text-rose-200 border border-rose-500/30 hover:border-rose-500/50 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]"
            >
              <TrashIcon />
              清除全部
            </button>
          </div>

          {showConfirm && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 backdrop-blur-sm">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-rose-300 mt-0.5 shrink-0">
                  <AlertIcon />
                </span>
                <p className="text-rose-200 text-xs leading-relaxed">
                  确定要清除所有生物吗？此操作不可撤销。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmClear}
                  className="flex-1 bg-rose-500/30 hover:bg-rose-500/50 active:bg-rose-500/60 text-rose-100 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]"
                >
                  确认清除
                </button>
                <button
                  onClick={cancelClear}
                  className="flex-1 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 text-slate-300 border border-slate-600/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-[0.98]"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-slate-400 text-xs leading-relaxed">
              移动鼠标吸引生物注意，靠近时生物会逃离，中等距离会被吸引。
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-slate-900/60 rounded-lg px-2.5 py-2 border border-white/5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium mb-0.5">生物数量</p>
              <p className="text-cyan-200 font-mono text-sm font-semibold tabular-nums">{creatureCount}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg px-2.5 py-2 border border-white/5">
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-medium mb-0.5">粒子数量</p>
              <p className="text-cyan-200 font-mono text-sm font-semibold tabular-nums">{particleCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
