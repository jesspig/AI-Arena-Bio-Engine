import { useState } from 'react';
import { WorldState } from '../engine/types';
import { addCreature } from '../engine/world';

interface ControlPanelProps {
  world: WorldState;
  onCreatureAdded: () => void;
}

export default function ControlPanel({ world, onCreatureAdded }: ControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleAddCreature = () => {
    const x = Math.random() * world.width * 0.8 + world.width * 0.1;
    const y = Math.random() * world.height * 0.8 + world.height * 0.1;
    addCreature(world, x, y);
    onCreatureAdded();
  };

  const handleClearCreatures = () => {
    world.creatures.length = 0;
    onCreatureAdded();
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-900/80 backdrop-blur-sm text-cyan-300 border border-cyan-500/30 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800/80 transition-colors cursor-pointer"
      >
        {isOpen ? '收起控制' : '打开控制'}
      </button>

      {isOpen && (
        <div className="mt-2 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4 w-64 space-y-3">
          <h2 className="text-cyan-300 text-sm font-semibold tracking-wide uppercase">
            生物控制
          </h2>

          <div className="flex gap-2">
            <button
              onClick={handleAddCreature}
              className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              添加生物
            </button>
            <button
              onClick={handleClearCreatures}
              className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              清除全部
            </button>
          </div>

          <div className="pt-2 border-t border-slate-700/50">
            <p className="text-slate-400 text-xs leading-relaxed">
              移动鼠标吸引生物注意，靠近时生物会逃离，中等距离会被吸引。
            </p>
          </div>

          <div className="pt-1">
            <p className="text-slate-500 text-xs">
              当前生物数量: <span className="text-cyan-300 font-mono">{world.creatures.length}</span>
            </p>
            <p className="text-slate-500 text-xs">
              粒子数量: <span className="text-cyan-300 font-mono">{world.particles.length}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
