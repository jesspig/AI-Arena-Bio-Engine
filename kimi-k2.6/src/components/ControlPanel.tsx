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

function InfoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function getStateLabel(state: string): string {
  const labels: Record<string, string> = {
    idle: '发呆',
    roam: '漫游',
    chase: '追逐',
    flee: '逃跑',
    rest: '休息',
    eat: '进食',
    social: '社交',
    curious: '好奇',
    play: '玩耍',
    sleep: '睡觉',
    hunt: '捕猎',
  };
  return labels[state] || state;
}

function getEmotionLabel(emotion: string): string {
  const labels: Record<string, string> = {
    calm: '平静',
    happy: '开心',
    anxious: '焦虑',
    excited: '兴奋',
    tired: '疲惫',
    scared: '害怕',
    hungry: '饥饿',
    sleepy: '困倦',
    playful: ' playful',
    content: '满足',
  };
  return labels[emotion] || emotion;
}

function getEmotionColor(emotion: string): string {
  const colors: Record<string, string> = {
    calm: 'text-cyan-300',
    happy: 'text-yellow-300',
    anxious: 'text-orange-300',
    excited: 'text-pink-300',
    tired: 'text-slate-400',
    scared: 'text-red-300',
    hungry: 'text-amber-300',
    sleepy: 'text-violet-300',
    playful: 'text-lime-300',
    content: 'text-emerald-300',
  };
  return colors[emotion] || 'text-slate-300';
}

function getEmotionDotColor(emotion: string): string {
  const colors: Record<string, string> = {
    calm: 'bg-cyan-400',
    happy: 'bg-yellow-400',
    anxious: 'bg-orange-400',
    excited: 'bg-pink-400',
    tired: 'bg-slate-400',
    scared: 'bg-red-400',
    hungry: 'bg-amber-400',
    sleepy: 'bg-violet-400',
    playful: 'bg-lime-400',
    content: 'bg-emerald-400',
  };
  return colors[emotion] || 'bg-slate-400';
}

export default function ControlPanel({ world, onCreatureAdded }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [creatureCount, setCreatureCount] = useState(world.creatures.length);
  const [particleCount, setParticleCount] = useState(world.particles.length);
  const [selectedCreatures, setSelectedCreatures] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [showInfo, setShowInfo] = useState(false);

  const updateStats = useCallback(() => {
    setCreatureCount(world.creatures.length);
    setParticleCount(world.particles.length);

    setSelectedCreatures((prev) => {
      const newSet = new Set(prev);
      for (const id of newSet) {
        if (!world.creatures.find((c) => c.id === id)) {
          newSet.delete(id);
        }
      }
      world.selectedCreatureIds = newSet;
      return newSet;
    });
  }, [world]);

  useEffect(() => {
    const interval = setInterval(updateStats, 200);
    return () => clearInterval(interval);
  }, [updateStats]);

  const handleAddCreature = () => {
    const x = Math.random() * world.width * 0.8 + world.width * 0.1;
    const y = Math.random() * world.height * 0.8 + world.height * 0.1;
    const creature = addCreature(world, x, y);
    onCreatureAdded();
    updateStats();

    setSelectedCreatures((prev) => {
      const newSet = new Set(prev);
      newSet.add(creature.id);
      world.selectedCreatureIds = newSet;
      return newSet;
    });
    setActiveTab('list');
  };

  const handleClearCreatures = () => {
    setShowConfirm(true);
  };

  const confirmClear = () => {
    world.creatures.length = 0;
    world.foodSources.length = 0;
    setSelectedCreatures(new Set());
    world.selectedCreatureIds = new Set();
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
      if (!isPaused) {
        c.state = 'idle';
      }
    });
  };

  const toggleCreatureSelection = (creatureId: string) => {
    setSelectedCreatures((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(creatureId)) {
        newSet.delete(creatureId);
      } else {
        newSet.add(creatureId);
      }
      world.selectedCreatureIds = newSet;
      return newSet;
    });
  };

  const selectAllCreatures = () => {
    const newSet = new Set(world.creatures.map((c) => c.id));
    setSelectedCreatures(newSet);
    world.selectedCreatureIds = newSet;
  };

  const deselectAllCreatures = () => {
    setSelectedCreatures(new Set());
    world.selectedCreatureIds = new Set();
  };

  const selectedCreaturesList = world.creatures.filter((c) => selectedCreatures.has(c.id));

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
          {selectedCreatures.size > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-cyan-500/30 rounded-full text-[10px] text-cyan-200">
              {selectedCreatures.size}
            </span>
          )}
        </button>

        <button
          onClick={togglePause}
          className="flex items-center justify-center w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded-xl hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-slate-900 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          aria-label={isPaused ? '继续模拟' : '暂停模拟'}
          title={isPaused ? '继续模拟' : '暂停模拟'}
        >
          {isPaused ? <PlayIcon /> : <PauseIcon />}
        </button>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center justify-center w-9 h-9 bg-slate-950/90 backdrop-blur-md text-slate-300 border border-slate-600/50 rounded-xl hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-slate-900 active:scale-[0.97] transition-all duration-150 cursor-pointer"
          aria-label="显示信息"
          title="显示信息"
        >
          <InfoIcon />
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
          className="mt-2 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-96 shadow-2xl max-h-[85vh] overflow-y-auto"
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

          <div className="flex gap-2 mb-3">
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

          {world.creatures.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'list'
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50'
                    }`}
                  >
                    生物列表 ({world.creatures.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('detail')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'detail'
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50'
                    }`}
                  >
                    详情 ({selectedCreatures.size})
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={selectAllCreatures}
                    className="px-2 py-1 rounded-md bg-slate-800/50 text-slate-400 text-[10px] hover:bg-slate-700/50 hover:text-slate-300 transition-all"
                  >
                    全选
                  </button>
                  <button
                    onClick={deselectAllCreatures}
                    className="px-2 py-1 rounded-md bg-slate-800/50 text-slate-400 text-[10px] hover:bg-slate-700/50 hover:text-slate-300 transition-all"
                  >
                    清空
                  </button>
                </div>
              </div>

              {activeTab === 'list' && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {world.creatures.map((creature, index) => (
                    <button
                      key={creature.id}
                      onClick={() => toggleCreatureSelection(creature.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                        selectedCreatures.has(creature.id)
                          ? 'bg-cyan-500/15 border border-cyan-500/30'
                          : 'bg-slate-800/40 border border-transparent hover:bg-slate-700/40'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${getEmotionDotColor(creature.emotionalState)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-300 text-xs font-medium truncate">
                            生物 #{index + 1}
                          </span>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${
                            selectedCreatures.has(creature.id)
                              ? 'bg-cyan-500/20 text-cyan-300'
                              : 'bg-slate-700/50 text-slate-500'
                          }`}>
                            {getStateLabel(creature.state)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] ${getEmotionColor(creature.emotionalState)}`}>
                            {getEmotionLabel(creature.emotionalState)}
                          </span>
                          <span className="text-slate-600 text-[9px]">
                            能量 {Math.round(creature.needs.energy * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-500">
                        {selectedCreatures.has(creature.id) ? <EyeIcon /> : <EyeOffIcon />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'detail' && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedCreaturesList.length === 0 && (
                    <p className="text-slate-500 text-xs text-center py-4">
                      请在列表中选择要观察的生物
                    </p>
                  )}
                  {selectedCreaturesList.map((creature) => (
                    <div key={creature.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${getEmotionDotColor(creature.emotionalState)}`} />
                          <span className="text-cyan-200 text-xs font-semibold">生物 #{world.creatures.indexOf(creature) + 1}</span>
                        </div>
                        <button
                          onClick={() => toggleCreatureSelection(creature.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <EyeOffIcon />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                        <div className="bg-slate-800/50 rounded px-2 py-1">
                          <p className="text-slate-500 text-[8px] uppercase tracking-wider">状态</p>
                          <p className="text-cyan-200 text-[10px] font-semibold">{getStateLabel(creature.state)}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded px-2 py-1">
                          <p className="text-slate-500 text-[8px] uppercase tracking-wider">情绪</p>
                          <p className={`text-[10px] font-semibold ${getEmotionColor(creature.emotionalState)}`}>
                            {getEmotionLabel(creature.emotionalState)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <CompactNeedBar label="能量" value={creature.needs.energy} color="bg-emerald-400" />
                        <CompactNeedBar label="饥饿" value={creature.needs.hunger} color="bg-amber-400" />
                        <CompactNeedBar label="好奇" value={creature.needs.curiosity} color="bg-violet-400" />
                        <CompactNeedBar label="社交" value={creature.needs.social} color="bg-rose-400" />
                        <CompactNeedBar label="舒适" value={creature.needs.comfort} color="bg-sky-400" />
                        <CompactNeedBar label="乐趣" value={creature.needs.fun} color="bg-lime-400" />
                      </div>

                      <div className="grid grid-cols-3 gap-1 mt-1.5 text-[8px]">
                        <div className="text-slate-400">
                          <span className="text-slate-500">大胆:</span> {Math.round(creature.personality.boldness * 100)}%
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">好奇:</span> {Math.round(creature.personality.curiosity * 100)}%
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">社交:</span> {Math.round(creature.personality.sociability * 100)}%
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">懒惰:</span> {Math.round(creature.personality.laziness * 100)}%
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500"> playful:</span> {Math.round(creature.personality.playfulness * 100)}%
                        </div>
                        <div className="text-slate-400">
                          <span className="text-slate-500">挑剔:</span> {Math.round(creature.personality.pickiness * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showInfo && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-white/10">
              <h3 className="text-cyan-200 text-xs font-semibold mb-2">交互指南</h3>
              <ul className="text-slate-400 text-xs space-y-1 leading-relaxed">
                <li>• 移动鼠标吸引生物注意</li>
                <li>• 靠近时生物会逃离（若胆小）</li>
                <li>• 中等距离会被吸引（若好奇）</li>
                <li>• 生物会自动寻找喜欢的食物</li>
                <li>• 生物有独特个性和情绪</li>
                <li>• 它们会记住遇到的事物</li>
                <li>• 困倦时会找地方睡觉</li>
                <li>• 无聊时会想要玩耍</li>
              </ul>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-slate-400 text-xs leading-relaxed">
              每个生物都有独特的个性、需求和情绪。观察它们如何根据环境和自身状态做出决策。
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

function CompactNeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  const percentage = Math.round(value * 100);
  const isLow = value < 0.3;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-slate-500 text-[8px] w-6 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color} ${isLow ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-[8px] w-5 text-right ${isLow ? 'text-rose-400' : 'text-slate-400'}`}>
        {percentage}%
      </span>
    </div>
  );
}
