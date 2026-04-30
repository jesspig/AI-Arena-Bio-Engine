import { useEffect, useRef, useCallback, useState } from 'react';
import p5 from 'p5';
import { WorldState } from '../engine/types';
import { createSketch } from '../renderer/p5Renderer';
import { setMousePosition, setMouseActive } from '../engine/world';

interface BioCanvasProps {
  world: WorldState;
}

export default function BioCanvas({ world }: BioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const worldRef = useRef(world);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = createSketch(world, (p) => {
      p5Ref.current = p;
      setIsReady(true);
    });

    const instance = new p5(sketch, containerRef.current);

    return () => {
      instance.remove();
      p5Ref.current = null;
      setIsReady(false);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePosition(world, e.clientX - rect.left, e.clientY - rect.top);
    setMouseActive(world, true);
  }, [world]);

  const handleMouseLeave = useCallback(() => {
    setMouseActive(world, false);
  }, [world]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || e.touches.length === 0) return;
    const touch = e.touches[0];
    setMousePosition(world, touch.clientX - rect.left, touch.clientY - rect.top);
    setMouseActive(world, true);
  }, [world]);

  const handleTouchEnd = useCallback(() => {
    setMouseActive(world, false);
  }, [world]);

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="absolute inset-0 w-full h-full"
      role="img"
      aria-label="程序化生物动画画布"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-cyan-300 text-sm font-medium">加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
}
