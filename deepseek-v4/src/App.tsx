import { useRef, useState, useCallback } from 'react';
import BioCanvas from './components/BioCanvas';
import { CreatureState } from './engine/types';

const THEME = {
  bg: '#080f0c',
  panelBg: 'rgba(10, 22, 16, 0.88)',
  border: 'rgba(80, 180, 130, 0.15)',
  borderActive: 'rgba(80, 200, 140, 0.4)',
  text: '#c0dcc8',
  textDim: '#60997a',
  textMuted: '#406a54',
  accent: '#80dbb0',
  accentDim: '#50c88a',
  accentGlow: 'rgba(80, 200, 140, 0.15)',
  font: '"Segoe UI", system-ui, -apple-system, sans-serif',
};

const styles = {
  // 全局样式（通过 style 标签注入）
  global: `
    *, *::before, *::after { box-sizing: border-box; }
    html, body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
    body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

    input[type=range] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 4px;
      background: rgba(80, 180, 130, 0.2);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      touch-action: manipulation;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--thumb-color, #50c88a);
      border: 2px solid rgba(80, 200, 140, 0.5);
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    input[type=range]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }
    input[type=range]:focus-visible::-webkit-slider-thumb {
      box-shadow: 0 0 0 4px rgba(80, 200, 140, 0.3);
    }
    input[type=range]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--thumb-color, #50c88a);
      border: 2px solid rgba(80, 200, 140, 0.5);
      cursor: pointer;
    }
    input[type=range]:focus-visible::-moz-range-thumb {
      box-shadow: 0 0 0 4px rgba(80, 200, 140, 0.3);
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
  `,
};

function BackButton() {
  const handleClick = useCallback(() => {
    window.location.href = '/';
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = '/';
    }
  }, []);

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label="返回门户主页"
      title="返回门户主页"
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        borderRadius: 8,
        border: '1px solid rgba(80, 200, 140, 0.2)',
        background: 'rgba(10, 22, 16, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        color: THEME.textDim,
        cursor: 'pointer',
        fontSize: 13,
        fontFamily: THEME.font,
        transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.15s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(20, 50, 35, 0.85)';
        el.style.borderColor = 'rgba(80, 200, 140, 0.5)';
        el.style.color = THEME.accent;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = 'rgba(10, 22, 16, 0.7)';
        el.style.borderColor = 'rgba(80, 200, 140, 0.2)';
        el.style.color = THEME.textDim;
      }}
      onFocus={(e) => {
        const el = e.currentTarget;
        el.style.outline = 'none';
        el.style.boxShadow = '0 0 0 2px rgba(80, 200, 140, 0.4)';
      }}
      onBlur={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = 'none';
      }}
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

export default function App() {
  const creatureRef = useRef<CreatureState | null>(null);
  const [segmentCount, setSegmentCount] = useState(28);
  const [moveSpeed, setMoveSpeed] = useState(90);
  const [showPanel, setShowPanel] = useState(true);

  return (
    <>
      <style>{styles.global}</style>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          fontFamily: THEME.font,
          color: THEME.text,
          overflow: 'hidden',
          background: THEME.bg,
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            minWidth: 0,
          }}
        >
          <BioCanvas
            creatureRef={creatureRef}
            segmentCount={segmentCount}
            moveSpeed={moveSpeed}
          />

          <BackButton />

          <button
            onClick={() => setShowPanel(!showPanel)}
            aria-label={showPanel ? '隐藏控制面板' : '显示控制面板'}
            style={{
              position: 'absolute',
              top: 12,
              right: showPanel ? 272 : 12,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              background: 'rgba(20, 50, 35, 0.7)',
              border: '1px solid rgba(100, 200, 150, 0.25)',
              color: '#a0ddb8',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              transition: 'right 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, border-color 0.2s ease, transform 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(30, 70, 50, 0.85)';
              e.currentTarget.style.borderColor = 'rgba(80, 200, 140, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(20, 50, 35, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(100, 200, 150, 0.25)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(80, 200, 140, 0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
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
              style={{
                transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: showPanel ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div
          style={{
            width: showPanel ? 260 : 0,
            overflow: 'hidden',
            transition: 'width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            background: THEME.panelBg,
            borderLeft: '1px solid rgba(80, 180, 130, 0.15)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            opacity: showPanel ? 1 : 0,
            transitionProperty: 'width, opacity',
            transitionDuration: '0.35s, 0.25s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1), ease',
            transitionDelay: '0s, 0.1s',
          }}
        >
          <div style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
            <PanelHeader />
            <ParametersSection
              segmentCount={segmentCount}
              moveSpeed={moveSpeed}
              onSegmentCountChange={setSegmentCount}
              onMoveSpeedChange={setMoveSpeed}
            />
            <InteractionGuide />
            <BehaviorMonitor creatureRef={creatureRef} />
          </div>

          <PanelFooter />
        </div>
      </div>
    </>
  );
}

function PanelHeader() {
  return (
    <div
      style={{
        padding: '20px 20px 14px',
        borderBottom: '1px solid rgba(80, 180, 130, 0.12)',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 600,
          color: THEME.accent,
          letterSpacing: 1,
        }}
      >
        翡翠蜈蚣
      </h2>
      <p
        style={{
          margin: '4px 0 0',
          fontSize: 12,
          color: THEME.textDim,
        }}
      >
        程序化生行动画
      </p>
    </div>
  );
}

function ParametersSection({
  segmentCount,
  moveSpeed,
  onSegmentCountChange,
  onMoveSpeedChange,
}: {
  segmentCount: number;
  moveSpeed: number;
  onSegmentCountChange: (v: number) => void;
  onMoveSpeedChange: (v: number) => void;
}) {
  return (
    <div style={{ padding: '16px 20px' }}>
      <Label>生物参数</Label>
      <ControlGroup>
        <SliderControl
          label="节段数量"
          value={segmentCount}
          min={10}
          max={40}
          step={2}
          onChange={onSegmentCountChange}
        />
        <SliderControl
          label="移动速度"
          value={moveSpeed}
          min={30}
          max={200}
          step={5}
          onChange={onMoveSpeedChange}
        />
      </ControlGroup>
    </div>
  );
}

function InteractionGuide() {
  return (
    <div style={{ padding: '0 20px 16px' }}>
      <Label>交互操作</Label>
      <div
        style={{
          fontSize: 12,
          color: THEME.textDim,
          lineHeight: 1.8,
        }}
      >
        <div>• 点击画布 — 设置追逐目标</div>
        <div>• 松开鼠标 — 恢复自由漫游</div>
        <div>• 生物会自动切换行为</div>
      </div>
    </div>
  );
}

function BehaviorMonitor({ creatureRef }: { creatureRef: React.RefObject<CreatureState | null> }) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(80, 180, 130, 0.1)',
        marginTop: 8,
      }}
    >
      <Label>行为状态</Label>
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginTop: 8,
        }}
      >
        {[
          { id: 'WANDER', label: '漫游' },
          { id: 'CHASE', label: '追逐' },
          { id: 'REST', label: '休憩' },
          { id: 'EXPLORE', label: '探索' },
        ].map(({ id, label }) => {
          const isActive = creatureRef.current?.behavior === id;
          return (
            <span
              key={id}
              role="status"
              aria-label={`${label}${isActive ? '（当前）' : ''}`}
              style={{
                padding: '3px 10px',
                borderRadius: 12,
                fontSize: 11,
                background: isActive
                  ? 'rgba(80, 200, 140, 0.25)'
                  : 'rgba(60, 140, 100, 0.1)',
                border: isActive
                  ? '1px solid rgba(80, 200, 140, 0.5)'
                  : '1px solid rgba(60, 140, 100, 0.2)',
                color: isActive ? '#80eebb' : '#50806a',
                transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
                boxShadow: isActive ? `0 0 12px ${THEME.accentGlow}` : 'none',
              }}
            >
              {label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function PanelFooter() {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(80, 180, 130, 0.1)',
        fontSize: 11,
        color: THEME.textMuted,
        textAlign: 'center',
        letterSpacing: 0.5,
      }}
    >
      DeepSeek-V4 · Bio-Engine
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: THEME.textDim,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ControlGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const ratio = (value - min) / (max - min);
  const thumbColor = `hsl(${120 + ratio * 40}, 50%, ${50 + ratio * 10}%)`;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          marginBottom: 6,
        }}
      >
        <label style={{ color: '#90bba2', cursor: 'pointer' }}>{label}</label>
        <span
          style={{
            color: THEME.accent,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            minWidth: 28,
            textAlign: 'right',
          }}
        >
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        style={{
          '--thumb-color': thumbColor,
        } as React.CSSProperties}
      />
    </div>
  );
}
