import { CreatureState, BehaviorType, Vec2, CreatureConfig } from './types';
import { sub, length, normalize, add, scale, distance } from './math';

export function createBehavior(config: CreatureConfig, startPos: Vec2): BehaviorType {
  return 'WANDER';
}

export function updateBehavior(
  creature: CreatureState,
  mouseTarget: Vec2 | null,
  dt: number,
  bounds: { width: number; height: number },
): Vec2 {
  creature.behaviorTimer += dt;
  const config = creature.config;

  maybeSwitchBehavior(creature, mouseTarget, bounds);

  switch (creature.behavior) {
    case 'CHASE':
      return updateChase(creature, mouseTarget!, dt);
    case 'REST':
      return updateRest(creature, dt);
    case 'EXPLORE':
      return updateExplore(creature, dt, bounds);
    case 'WANDER':
    default:
      return updateWander(creature, dt, bounds);
  }
}

function maybeSwitchBehavior(
  creature: CreatureState,
  mouseTarget: Vec2 | null,
  bounds: { width: number; height: number },
): void {
  const head = creature.segments[0];
  if (!head) return;

  if (mouseTarget) {
    const dist = distance(head.position, mouseTarget);
    if (dist > 20) {
      creature.behavior = 'CHASE';
      creature.behaviorTimer = 0;
      return;
    }
  }

  if (creature.behavior === 'CHASE') {
    creature.behavior = 'WANDER';
    creature.behaviorTimer = 0;
    pickWanderTarget(creature, bounds);
  }

  if (creature.behaviorTimer > 5 + Math.random() * 3) {
    const roll = Math.random();
    if (roll < 0.6) {
      creature.behavior = 'WANDER';
      pickWanderTarget(creature, bounds);
    } else if (roll < 0.85) {
      creature.behavior = 'EXPLORE';
      creature.behaviorTimer = 0;
    } else {
      creature.behavior = 'REST';
      creature.restTimer = 1 + Math.random() * 2;
    }
    creature.behaviorTimer = 0;
  }
}

function pickWanderTarget(creature: CreatureState, bounds: { width: number; height: number }): void {
  const head = creature.segments[0];
  if (!head) return;
  const margin = 60;
  creature.wanderTarget = {
    x: margin + Math.random() * (bounds.width - margin * 2),
    y: margin + Math.random() * (bounds.height - margin * 2),
  };
}

function steerToward(creature: CreatureState, target: Vec2, speed: number): Vec2 {
  const head = creature.segments[0];
  if (!head) return target;

  const dir = sub(target, head.position);
  const dist = length(dir);

  if (dist < 5) return head.position;

  const maxStep = speed * 0.016;
  const step = Math.min(dist, maxStep);
  const norm = normalize(dir);
  return add(head.position, scale(norm, step));
}

function updateWander(
  creature: CreatureState,
  dt: number,
  bounds: { width: number; height: number },
): Vec2 {
  const head = creature.segments[0];
  if (!head) return { x: bounds.width / 2, y: bounds.height / 2 };

  const dist = distance(head.position, creature.wanderTarget);
  if (dist < 30) {
    pickWanderTarget(creature, bounds);
  }

  applyBoundaryPush(creature, bounds);
  return steerToward(creature, creature.wanderTarget, creature.config.moveSpeed * 0.6);
}

function updateChase(creature: CreatureState, mouseTarget: Vec2, _dt: number): Vec2 {
  return steerToward(creature, mouseTarget, creature.config.moveSpeed * 1.3);
}

function updateRest(creature: CreatureState, dt: number): Vec2 {
  creature.restTimer -= dt;
  if (creature.restTimer <= 0) {
    creature.behavior = 'WANDER';
    creature.behaviorTimer = 0;
  }

  const head = creature.segments[0];
  if (!head) return { x: 0, y: 0 };

  const idlePos: Vec2 = {
    x: head.position.x + Math.sin(creature.behaviorTimer * 2) * 3,
    y: head.position.y + Math.cos(creature.behaviorTimer * 2.5) * 2,
  };
  return idlePos;
}

function updateExplore(
  creature: CreatureState,
  dt: number,
  bounds: { width: number; height: number },
): Vec2 {
  if (creature.behaviorTimer > 3 + Math.random() * 2) {
    creature.behavior = 'WANDER';
    pickWanderTarget(creature, bounds);
    return steerToward(creature, creature.wanderTarget, creature.config.moveSpeed * 0.6);
  }

  const head = creature.segments[0];
  if (!head) return { x: bounds.width / 2, y: bounds.height / 2 };

  const noiseAngle = creature.behaviorTimer * 1.5 + Math.sin(creature.behaviorTimer * 0.7) * 2;
  const exploreTarget: Vec2 = {
    x: head.position.x + Math.cos(noiseAngle) * 80,
    y: head.position.y + Math.sin(noiseAngle) * 80,
  };
  applyBoundaryPush(creature, bounds);
  return steerToward(creature, exploreTarget, creature.config.moveSpeed * 0.8);
}

function applyBoundaryPush(
  creature: CreatureState,
  bounds: { width: number; height: number },
): void {
  const head = creature.segments[0];
  if (!head) return;

  const margin = 80;
  if (head.position.x < margin) creature.wanderTarget.x += 5;
  if (head.position.x > bounds.width - margin) creature.wanderTarget.x -= 5;
  if (head.position.y < margin) creature.wanderTarget.y += 5;
  if (head.position.y > bounds.height - margin) creature.wanderTarget.y -= 5;
}
