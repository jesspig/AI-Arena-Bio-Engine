import { CreatureState } from '../engine/types';

interface StatusHUDProps {
  creature: CreatureState;
  isNight: boolean;
}

export default function StatusHUD({ creature, isNight }: StatusHUDProps) {
  const needs = creature.needs;
  const subStateLabels: Record<string, string> = {
    WANDERING: '漫步中',
    FORAGING: '觅食中',
    HUNTING: '捕猎中',
    EXPLORING: '探索中',
    FLEEING: '逃离中',
    RESTING: '休憩中',
    INTERACTING: '互动中',
    EATING: '进食中',
    PLAY: '玩耍中',
    BURROWING: '钻地中',
  };

  const moodLabels: Record<string, { emoji: string; label: string; color: string }> = {
    CONTENT: { emoji: '😊', label: '放松', color: '#80eebb' },
    CURIOUS: { emoji: '🔍', label: '好奇', color: '#88cc44' },
    EXCITED: { emoji: '✨', label: '兴奋', color: '#ffcc44' },
    NERVOUS: { emoji: '😰', label: '紧张', color: '#ffaa44' },
    SCARED: { emoji: '💨', label: '恐惧', color: '#ff4466' },
  };

  const mood = moodLabels[needs.mood] || moodLabels.CONTENT;

  const foodTypeLabel = creature.lastEatType
    ? creature.lastEatType === 'FAVORITE' ? '❤️' : creature.lastEatType === 'AVOID' ? '💔' : '🍽️'
    : null;

  return (
    <div className="status-hud">
      <div className="hud-mood" style={{ color: mood.color }}>
        <span className="hud-emoji">{mood.emoji}</span>
        <span className="hud-label">{mood.label}</span>
      </div>

      <div className="hud-state">
        <span className="state-dot" />
        <span>{subStateLabels[creature.subState] || creature.subState}</span>
      </div>

      <div className="hud-time">
        <span>{isNight ? '🌙' : '☀️'}</span>
        <span>{isNight ? '夜晚' : '白昼'}</span>
      </div>

      {foodTypeLabel && (
        <div className="hud-food">
          <span>{foodTypeLabel}</span>
        </div>
      )}
    </div>
  );
}
