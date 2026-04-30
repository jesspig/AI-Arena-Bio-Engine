import { useEffect, useState } from 'react';

function useCurrentTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export default function InfoOverlay() {
  const time = useCurrentTime();
  const uptime = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className="absolute bottom-4 left-4 z-10 pointer-events-none select-none">
      <div className="bg-slate-950/60 backdrop-blur-md border border-white/[0.06] rounded-xl px-4 py-3 shadow-lg shadow-cyan-950/10 ring-1 ring-inset ring-white/[0.03]">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-cyan-200 text-xs font-bold tracking-wider uppercase">
            Bio-Engine
          </h1>
          <span className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/15 text-cyan-300 text-[9px] font-semibold tracking-wide">
            v1.0
          </span>
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">
          Kimi-K2.6 实现 · 程序化生物动画
        </p>
        <p className="text-slate-600 text-[10px] mt-1 leading-relaxed">
          反向运动学 · 行为状态机 · 粒子系统
        </p>
        <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-500 text-[10px] font-mono">{uptime}</span>
          </div>
          <span className="text-slate-700 text-[10px]">·</span>
          <span className="text-slate-500 text-[10px]">60 FPS</span>
        </div>
      </div>
    </div>
  );
}
