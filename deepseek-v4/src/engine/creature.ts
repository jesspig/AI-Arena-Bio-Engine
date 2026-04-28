import {
  CreatureState,
  CreatureConfig,
  DEFAULT_CONFIG,
  BehaviorType,
  Vec2,
} from './types';
import { createSpine, updateSpine } from './spine';
import { updateLegs } from './leg';
import { updateBehavior } from './behavior';

export function createCreature(
  config: Partial<CreatureConfig> = {},
  startPos: Vec2,
): CreatureState {
  const fullConfig: CreatureConfig = { ...DEFAULT_CONFIG, ...config };
  const angle = Math.random() * Math.PI * 2;
  const segments = createSpine(fullConfig, startPos, angle);
  const margin = 60;

  return {
    segments,
    headPos: { ...startPos },
    headAngle: angle,
    target: null,
    behavior: 'WANDER' as BehaviorType,
    behaviorTimer: 0,
    config: fullConfig,
    wanderTarget: {
      x: Math.random() * (800 - margin * 2) + margin,
      y: Math.random() * (600 - margin * 2) + margin,
    },
    restTimer: 0,
  };
}

export function updateCreature(
  creature: CreatureState,
  mouseTarget: Vec2 | null,
  dt: number,
  bounds: { width: number; height: number },
  time: number,
): void {
  if (creature.segments.length === 0) return;

  const headTarget = updateBehavior(creature, mouseTarget, dt, bounds);
  const head = creature.segments[0];
  const bodySway = time * 3;

  updateSpine(creature.segments, headTarget, dt, creature.config, bodySway);
  updateLegs(creature.segments, dt, creature.config, time);

  creature.headPos = { ...head.position };
}
