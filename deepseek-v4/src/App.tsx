import { useRef, useState, useCallback, useEffect } from 'react';
import BioCanvas from './components/BioCanvas';
import ControlPanel from './components/ControlPanel';
import StatusHUD from './components/StatusHUD';
import { WorldState, CreatureState, InteractionMode } from './engine/types';
import './index.css';

export default function App() {
  const worldRef = useRef<WorldState | null>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('NONE');
  const [creature, setCreature] = useState<CreatureState | null>(null);
  const [isNight, setIsNight] = useState(false);

  const [showHUD, setShowHUD] = useState(true);

  const handleCreatureInit = useCallback((c: CreatureState) => {
    setCreature(c);
  }, []);

  const handleInteractionChange = useCallback((mode: InteractionMode) => {
    setInteractionMode(mode);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (worldRef.current) {
        setIsNight(worldRef.current.isNight);
        setShowHUD(worldRef.current.showHUD);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleToggleNight = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.timeOfDay = worldRef.current.isNight ? 0.25 : 0.75;
      worldRef.current.isNight = !worldRef.current.isNight;
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '\\' || e.key === '`') {
      e.preventDefault();
      setShowPanel((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-root">
      <div className="canvas-container">
        <BioCanvas
          worldRef={worldRef}
          onCreatureInit={handleCreatureInit}
          onInteractionChange={handleInteractionChange}
        />

        <BackButton />

        {showHUD && creature && <StatusHUD creature={creature} isNight={isNight} />}

        <button
          className={`panel-toggle ${showPanel ? 'open' : ''}`}
          onClick={() => setShowPanel(!showPanel)}
          aria-label={showPanel ? '隐藏控制面板' : '显示控制面板'}
          title={`${showPanel ? '隐藏' : '显示'}控制面板 (\\ 键)`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <div className={`side-panel ${showPanel ? 'visible' : ''}`}>
        <ControlPanel
          isNight={isNight}
          interactionMode={interactionMode}
          creature={creature}
          onToggleNight={handleToggleNight}
        />
      </div>
    </div>
  );
}

function BackButton() {
  const handleClick = useCallback(() => {
    window.location.href = '/';
  }, []);

  return (
    <button
      onClick={handleClick}
      aria-label="返回门户主页"
      title="返回门户主页"
      className="back-btn"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>返回</span>
    </button>
  );
}
