import { useEffect, useRef, useCallback } from 'react';
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

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = createSketch(world, (p) => {
      p5Ref.current = p;
    });

    const instance = new p5(sketch, containerRef.current);

    return () => {
      instance.remove();
      p5Ref.current = null;
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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
