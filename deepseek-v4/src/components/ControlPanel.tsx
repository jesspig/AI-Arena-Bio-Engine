import { CreatureState, InteractionMode } from '../engine/types';

interface ControlPanelProps {
  isNight: boolean;
  interactionMode: InteractionMode;
  creature: CreatureState | null;
  onToggleNight: () => void;
}

const T = {
  panelBg: 'rgba(8, 18, 12, 0.92)',
  border: 'rgba(80, 200, 140, 0.12)',
  accent: '#50c88a',
  accentText: '#80eebb',
  text: '#c0dcc8',
  dim: '#60997a',
  muted: '#406a54',
  font: '"Segoe UI", system-ui, -apple-system, sans-serif',
};

export default function ControlPanel({
  isNight,
  interactionMode,
  creature,
  onToggleNight,
}: ControlPanelProps) {
  const interactionLabels: Record<string, string> = {
    NONE: '待机中',
    FEEDING: '进食中',
    PETTING: '被抚摸',
    TOY: '追逐玩具',
    POKING: '被惊吓',
  };

  return (
    <div className="control-panel" style={{ fontFamily: T.font }}>
      <div className="panel-header">
        <h2 className="panel-title">翡翠蜈蚣</h2>
        <p className="panel-subtitle">DeepSeek-V4 · 程序化生命</p>
      </div>

      <div className="panel-section">
        <Label>交互状态</Label>
        <div className="interaction-badge">
          {interactionLabels[interactionMode] || '待机中'}
        </div>
      </div>

      <div className="panel-section">
        <Label>环境控制</Label>
        <button
          className={`toggle-btn ${isNight ? 'active' : ''}`}
          onClick={onToggleNight}
          style={{
            width: '100%',
            padding: '8px 16px',
            borderRadius: 8,
            border: isNight
              ? '1px solid rgba(80, 200, 200, 0.5)'
              : '1px solid rgba(80, 200, 140, 0.2)',
            background: isNight
              ? 'rgba(40, 80, 120, 0.3)'
              : 'rgba(80, 180, 120, 0.1)',
            color: isNight ? '#80ccdd' : '#80bbaa',
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: T.font,
            transition: 'all 0.3s ease',
          }}
        >
          {isNight ? '🌙 夜晚' : '☀️ 白昼'} — 点击切换
        </button>
      </div>

      {creature && (
        <div className="panel-section">
          <Label>需求状态</Label>
          <NeedBar label="饥饿" value={100 - creature.needs.hunger} color="#ff9944" warn={creature.needs.hunger > 60} />
          <NeedBar label="精力" value={creature.needs.energy} color="#44ccff" warn={creature.needs.energy < 25} />
          <NeedBar label="好奇" value={creature.needs.curiosity} color="#88ee44" />
          <NeedBar label="恐惧" value={creature.needs.fear} color="#ff4466" warn={creature.needs.fear > 50} />
          <NeedBar label="舒适" value={creature.needs.comfort} color="#ffcc44" />
        </div>
      )}

      <div className="panel-section">
        <Label>操作说明</Label>
        <div className="guide-list">
          <div>🖱️ 左键 — 投放食物(中性)</div>
          <div>🖱️ Shift+左键 — 投放喜欢吃的</div>
          <div>🖱️ Ctrl+左键 — 投放讨厌的</div>
          <div>🖱️ 右键 — 戳生物</div>
          <div>🖱️ 拖拽 — 玩具追逐</div>
          <div>🖱️ 接近头部 — 抚摸</div>
          <div>🖱️ 双击 — 放置障碍</div>
          <div>⌨️ D — 切换昼夜</div>
          <div>⌨️ F — 投放食物群</div>
          <div>⌨️ B — 强制休息</div>
          <div>⌨️ P — 投放玩具</div>
          <div>⌨️ L — 气味标记视图</div>
          <div>⌨️ R — 清除障碍</div>
          <div>⌨️ H — 切换HUD</div>
        </div>
      </div>

      <div className="panel-footer">
        DeepSeek-V4 · Bio-Engine
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="section-label">{children}</div>;
}

function NeedBar({
  label,
  value,
  color,
  warn,
}: {
  label: string;
  value: number;
  color: string;
  warn?: boolean;
}) {
  return (
    <div className="need-bar-row">
      <span className="need-label">{label}</span>
      <div className="need-bar-track">
        <div
          className={`need-bar-fill ${warn ? 'warn' : ''}`}
          style={{
            width: `${value}%`,
            background: color,
            boxShadow: warn ? `0 0 8px ${color}` : 'none',
          }}
        />
      </div>
      <span className="need-value">{Math.round(value)}</span>
    </div>
  );
}
