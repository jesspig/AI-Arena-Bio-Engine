export default function InfoOverlay() {
  return (
    <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
      <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/10 rounded-lg px-3 py-2">
        <h1 className="text-cyan-300 text-xs font-semibold tracking-wider uppercase">
          Bio-Engine
        </h1>
        <p className="text-slate-500 text-[10px] mt-0.5">
          Kimi-K2.6 实现 · 程序化生物动画
        </p>
      </div>
    </div>
  );
}
