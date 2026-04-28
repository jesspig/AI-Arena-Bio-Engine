import { useRef, useState } from 'react';
import BioCanvas from './components/BioCanvas';
import { CreatureState } from './engine/types';

export default function App() {
  const creatureRef = useRef<CreatureState | null>(null);
  const [segmentCount, setSegmentCount] = useState(28);
  const [moveSpeed, setMoveSpeed] = useState(90);
  const [showPanel, setShowPanel] = useState(true);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      fontFamily: '"Segoe UI", system-ui, -apple-system, sans-serif',
      color: '#c0dcc8',
      overflow: 'hidden',
      background: '#080f0c',
    }}>
      <div style={{
        flex: 1,
        position: 'relative',
      }}>
        <BioCanvas
          creatureRef={creatureRef}
          segmentCount={segmentCount}
          moveSpeed={moveSpeed}
        />

        <button
          onClick={() => setShowPanel(!showPanel)}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 10,
            background: 'rgba(20, 50, 35, 0.7)',
            border: '1px solid rgba(100, 200, 150, 0.3)',
            color: '#a0ddb8',
            padding: '6px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            backdropFilter: 'blur(4px)',
          }}
        >
          {showPanel ? '隐藏面板' : '显示面板'}
        </button>
      </div>

      <div style={{
        width: showPanel ? 260 : 0,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        background: 'rgba(12, 25, 18, 0.85)',
        borderLeft: '1px solid rgba(80, 180, 130, 0.2)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ padding: 0 }}>
          <div style={{
            padding: '20px 20px 14px',
            borderBottom: '1px solid rgba(80, 180, 130, 0.15)',
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 600,
              color: '#80dbb0',
              letterSpacing: 1,
            }}>
              翡翠蜈蚣
            </h2>
            <p style={{
              margin: '4px 0 0',
              fontSize: 12,
              color: '#60997a',
            }}>
              程序化生行动画
            </p>
          </div>

          <div style={{ padding: '16px 20px' }}>
            <Label>生物参数</Label>

            <ControlGroup>
              <SliderControl
                label="节段数量"
                value={segmentCount}
                min={10}
                max={40}
                step={2}
                onChange={setSegmentCount}
              />
              <SliderControl
                label="移动速度"
                value={moveSpeed}
                min={30}
                max={200}
                step={5}
                onChange={setMoveSpeed}
              />
            </ControlGroup>
          </div>

          <div style={{ padding: '0 20px 16px' }}>
            <Label>交互操作</Label>
            <div style={{
              fontSize: 12,
              color: '#60997a',
              lineHeight: 1.8,
            }}>
              <div>• 点击画布 - 设置追逐目标</div>
              <div>• 松开鼠标 - 恢复自由漫游</div>
              <div>• 生物会自动切换行为</div>
            </div>
          </div>

          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(80, 180, 130, 0.1)',
            marginTop: 8,
          }}>
            <Label>行为状态</Label>
            <div style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              marginTop: 8,
            }}>
              {['WANDER', 'CHASE', 'REST', 'EXPLORE'].map((b) => {
                const isActive = creatureRef.current?.behavior === b;
                return (
                  <span key={b} style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    background: isActive ? 'rgba(80, 200, 140, 0.25)' : 'rgba(60, 140, 100, 0.1)',
                    border: `1px solid ${isActive ? 'rgba(80, 200, 140, 0.5)' : 'rgba(60, 140, 100, 0.2)'}`,
                    color: isActive ? '#80eebb' : '#50806a',
                    transition: 'all 0.3s',
                  }}>
                    {b === 'WANDER' && '漫游'}
                    {b === 'CHASE' && '追逐'}
                    {b === 'REST' && '休憩'}
                    {b === 'EXPLORE' && '探索'}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 'auto',
          padding: '16px 20px',
          borderTop: '1px solid rgba(80, 180, 130, 0.1)',
          fontSize: 11,
          color: '#406a54',
          textAlign: 'center',
        }}>
          DeepSeek-V4 · Bio-Engine
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#60997a',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function ControlGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>;
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
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        marginBottom: 6,
      }}>
        <span style={{ color: '#90bba2' }}>{label}</span>
        <span style={{ color: '#80dbb0', fontWeight: 600 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: 4,
          appearance: 'none',
          background: 'rgba(80, 180, 130, 0.2)',
          borderRadius: 2,
          outline: 'none',
          cursor: 'pointer',
        }}
        onMouseMove={(e) => {
          const target = e.target as HTMLInputElement;
          const ratio = (Number(target.value) - Number(target.min)) / (Number(target.max) - Number(target.min));
          const thumbColor = `hsl(${120 + ratio * 40}, 50%, ${50 + ratio * 10}%)`;
          target.style.setProperty('--thumb-color', thumbColor);
        }}
      />
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--thumb-color, '#50c88a');
          border: 2px solid rgba(80, 200, 140, 0.4);
          cursor: pointer;
          transition: transform 0.1s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
