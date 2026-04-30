import { useRef, useEffect, useState, useCallback } from 'react';
import { WorldState } from './engine/types';
import { createWorld, addCreature, updateWorld } from './engine/world';
import BioCanvas from './components/BioCanvas';
import ControlPanel from './components/ControlPanel';
import InfoOverlay from './components/InfoOverlay';

export default function App() {
  const worldRef = useRef<WorldState | null>(null);
  const [, setTick] = useState(0);
  const animFrameRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  if (!worldRef.current) {
    worldRef.current = createWorld(window.innerWidth, window.innerHeight);
    addCreature(worldRef.current, window.innerWidth * 0.5, window.innerHeight * 0.5);
  }

  const gameLoop = useCallback(() => {
    if (worldRef.current && !isPausedRef.current) {
      updateWorld(worldRef.current);
    }
    setTick((t) => (t + 1) % 1000000);
    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [gameLoop]);

  const handleCreatureAdded = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  const world = worldRef.current;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <BioCanvas world={world} />
      <ControlPanel world={world} onCreatureAdded={handleCreatureAdded} />
      <InfoOverlay />
    </div>
  );
}
