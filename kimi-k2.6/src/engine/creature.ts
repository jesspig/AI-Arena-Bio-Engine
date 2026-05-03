import {
  Creature,
  CreatureConfig,
  CreatureState,
  Segment,
  Leg,
  Vector2,
} from './types';
import {
  createVector,
  addVectors,
  subtractVectors,
  multiplyVector,
  normalizeVector,
  vectorMagnitude,
  distanceBetween,
  lerpVectors,
  angleBetweenVectors,
  clampValue,
  randomRange,
  rotateVector,
  copyVector,
} from './math';

const STATE_DURATIONS: Record<CreatureState, number> = {
  idle: 120,
  roam: 300,
  chase: 200,
  flee: 150,
};

const FLEE_DISTANCE = 150;
const CHASE_DISTANCE = 300;
const FLEE_TARGET_DISTANCE = 300;
const IDLE_WANDER_FACTOR = 0.02;
const IDLE_NOISE_INCREMENT = 0.05;
const VELOCITY_LERP_FACTOR = 0.1;
const HEAD_MARGIN = 50;
const PULSE_PHASE_INCREMENT = 0.03;
const STATE_TIMER_VARIATION_MIN = 0.5;
const STATE_TIMER_VARIATION_MAX = 1.5;
const SPEED_MULTIPLIER_FLEE = 2.2;
const SPEED_MULTIPLIER_CHASE = 1.8;
const SPEED_MULTIPLIER_IDLE = 0.3;
const TARGET_REACHED_THRESHOLD = 20;
const TARGET_PERSIST_CHANCE = 0.01;
const WORLD_MARGIN = 100;
const LEG_STEP_THRESHOLD_MULTIPLIER = 0.6;
const LEG_STEP_SPEED = 0.15;
const LEG_ARC_HEIGHT_MULTIPLIER = 0.4;
const LEG_FORWARD_OFFSET_MULTIPLIER = 0.3;
const LEG_IDEAL_OFFSET_MULTIPLIER = 1.2;
const LEG_REACH_SAFETY_FACTOR = 0.98;
const LEG_KNEE_HALF_FACTOR = 0.5;
const SPINE_FOLLOW_FACTOR = 0.35;

export function createDefaultConfig(): CreatureConfig {
  return {
    segmentCount: 24,
    segmentLength: 14,
    segmentRadius: 10,
    followFactor: SPINE_FOLLOW_FACTOR,
    legCount: 8,
    legLength: 28,
    colorHue: 280,
    glowIntensity: 0.8,
    speed: 2.5,
    turnSpeed: 0.08,
  };
}

export function createCreature(
  id: string,
  x: number,
  y: number,
  config: CreatureConfig = createDefaultConfig()
): Creature {
  const segments: Segment[] = [];
  for (let i = 0; i < config.segmentCount; i++) {
    segments.push({
      position: createVector(x - i * config.segmentLength, y),
      previousPosition: createVector(x - i * config.segmentLength, y),
      angle: 0,
    });
  }

  const legs: Leg[] = [];
  const legsPerSide = Math.floor(config.legCount / 2);
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < legsPerSide; i++) {
      const rootIndex = Math.floor(3 + (i / legsPerSide) * (config.segmentCount - 6));
      legs.push({
        rootIndex,
        side,
        segments: [createVector(0, 0), createVector(0, 0)],
        footPosition: createVector(x, y),
        targetPosition: createVector(x, y),
        isGrounded: true,
        stepProgress: 0,
      });
    }
  }

  return {
    id,
    segments,
    legs,
    state: 'roam',
    targetPosition: null,
    velocity: createVector(0, 0),
    heading: 0,
    stateTimer: 0,
    noiseOffset: Math.random() * 1000,
    config,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

function selectNextState(): CreatureState {
  const states: CreatureState[] = ['idle', 'roam', 'roam', 'roam'];
  return states[Math.floor(Math.random() * states.length)];
}

function computeStateDuration(state: CreatureState): number {
  const base = STATE_DURATIONS[state];
  return base * randomRange(STATE_TIMER_VARIATION_MIN, STATE_TIMER_VARIATION_MAX);
}

function updateStateTimer(creature: Creature, mousePos: Vector2, mouseActive: boolean): void {
  creature.stateTimer--;

  if (creature.stateTimer <= 0) {
    const nextState = selectNextState();
    creature.state = nextState;
    creature.stateTimer = computeStateDuration(nextState);
    creature.targetPosition = null;
  }

  if (mouseActive) {
    const distToMouse = distanceBetween(creature.segments[0].position, mousePos);
    if (distToMouse < FLEE_DISTANCE) {
      creature.state = 'flee';
      creature.stateTimer = STATE_DURATIONS.flee;
    } else if (distToMouse < CHASE_DISTANCE) {
      creature.state = 'chase';
      creature.stateTimer = STATE_DURATIONS.chase;
    }
  }
}

function computeSpeedForState(creature: Creature): number {
  const baseSpeed = creature.config.speed;
  switch (creature.state) {
    case 'flee':
      return baseSpeed * SPEED_MULTIPLIER_FLEE;
    case 'chase':
      return baseSpeed * SPEED_MULTIPLIER_CHASE;
    case 'roam':
      return baseSpeed;
    case 'idle':
      return baseSpeed * SPEED_MULTIPLIER_IDLE;
    default:
      return baseSpeed;
  }
}

function computeFleeTarget(creature: Creature, mousePos: Vector2): Vector2 {
  const headPos = creature.segments[0].position;
  const dx = headPos.x - mousePos.x;
  const dy = headPos.y - mousePos.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return createVector(
    headPos.x + (dx / len) * FLEE_TARGET_DISTANCE,
    headPos.y + (dy / len) * FLEE_TARGET_DISTANCE
  );
}

function pickTargetPosition(
  creature: Creature,
  worldWidth: number,
  worldHeight: number,
  mousePos: Vector2,
  mouseActive: boolean
): Vector2 | null {
  if (creature.state === 'idle') {
    return null;
  }

  if (creature.targetPosition && Math.random() > TARGET_PERSIST_CHANCE) {
    const distToTarget = distanceBetween(creature.segments[0].position, creature.targetPosition);
    if (distToTarget > TARGET_REACHED_THRESHOLD) {
      return creature.targetPosition;
    }
  }

  if (creature.state === 'chase' && mouseActive) {
    return copyVector(mousePos);
  }

  if (creature.state === 'flee' && mouseActive) {
    return computeFleeTarget(creature, mousePos);
  }

  const targetX = randomRange(WORLD_MARGIN, worldWidth - WORLD_MARGIN);
  const targetY = randomRange(WORLD_MARGIN, worldHeight - WORLD_MARGIN);
  return createVector(targetX, targetY);
}

function normalizeAngleDifference(angleDiff: number): number {
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  return angleDiff;
}

function computeDesiredHeading(creature: Creature): number {
  if (creature.targetPosition) {
    const desiredAngle = angleBetweenVectors(creature.segments[0].position, creature.targetPosition);
    const angleDiff = normalizeAngleDifference(desiredAngle - creature.heading);
    const maxTurn = creature.config.turnSpeed;
    return creature.heading + clampValue(angleDiff, -maxTurn, maxTurn);
  }

  if (creature.state === 'idle') {
    return creature.heading + Math.sin(creature.noiseOffset) * IDLE_WANDER_FACTOR;
  }

  return creature.heading;
}

function updateHeadMovement(creature: Creature): void {
  const head = creature.segments[0];
  const speed = computeSpeedForState(creature);

  creature.heading = computeDesiredHeading(creature);

  if (creature.state === 'idle') {
    creature.noiseOffset += IDLE_NOISE_INCREMENT;
  }

  const moveDir = createVector(Math.cos(creature.heading), Math.sin(creature.heading));
  const targetVelocity = multiplyVector(moveDir, speed);
  creature.velocity = lerpVectors(creature.velocity, targetVelocity, VELOCITY_LERP_FACTOR);

  head.previousPosition = copyVector(head.position);
  head.position = addVectors(head.position, creature.velocity);
  head.angle = creature.heading;
}

function updateSpine(creature: Creature): void {
  const { segmentLength, followFactor } = creature.config;

  for (let i = 1; i < creature.segments.length; i++) {
    const prev = creature.segments[i - 1];
    const curr = creature.segments[i];

    curr.previousPosition = copyVector(curr.position);

    const dir = subtractVectors(prev.position, curr.position);
    const dist = vectorMagnitude(dir);

    if (dist > 0) {
      const targetPos = subtractVectors(prev.position, multiplyVector(normalizeVector(dir), segmentLength));
      curr.position = lerpVectors(curr.position, targetPos, followFactor);
    }

    curr.angle = angleBetweenVectors(curr.position, prev.position);
  }
}

function solveLegIK(leg: Leg, rootPos: Vector2, targetPos: Vector2, legLength: number): void {
  const halfLen = legLength * LEG_KNEE_HALF_FACTOR;
  const dist = distanceBetween(rootPos, targetPos);
  const reach = Math.min(dist, legLength * LEG_REACH_SAFETY_FACTOR);

  const angleToTarget = angleBetweenVectors(rootPos, targetPos);
  const midX = rootPos.x + Math.cos(angleToTarget) * reach * LEG_KNEE_HALF_FACTOR;
  const midY = rootPos.y + Math.sin(angleToTarget) * reach * LEG_KNEE_HALF_FACTOR;

  const perpAngle = angleToTarget + Math.PI / 2;
  const offset = Math.sqrt(Math.max(0, halfLen * halfLen - (reach * LEG_KNEE_HALF_FACTOR) * (reach * LEG_KNEE_HALF_FACTOR)));

  const kneeX = midX + Math.cos(perpAngle) * offset * leg.side;
  const kneeY = midY + Math.sin(perpAngle) * offset * leg.side;

  leg.segments[0] = createVector(kneeX, kneeY);
  leg.footPosition = targetPos;
}

function computeIdealFootPosition(leg: Leg, creature: Creature): Vector2 {
  const rootPos = creature.segments[leg.rootIndex].position;
  const bodyDir = creature.segments[leg.rootIndex].angle;
  const idealOffset = rotateVector(
    createVector(0, leg.side * creature.config.segmentLength * LEG_IDEAL_OFFSET_MULTIPLIER),
    bodyDir
  );
  return addVectors(rootPos, idealOffset);
}

function startLegStep(leg: Leg, idealFootPos: Vector2, bodyDir: number, legLength: number): void {
  leg.isGrounded = false;
  leg.stepProgress = 0;
  leg.targetPosition = {
    x: idealFootPos.x + Math.cos(bodyDir) * legLength * LEG_FORWARD_OFFSET_MULTIPLIER,
    y: idealFootPos.y + Math.sin(bodyDir) * legLength * LEG_FORWARD_OFFSET_MULTIPLIER,
  };
}

function updateSteppingLeg(leg: Leg, legLength: number): void {
  leg.stepProgress += LEG_STEP_SPEED;
  if (leg.stepProgress >= 1) {
    leg.stepProgress = 0;
    leg.isGrounded = true;
    leg.footPosition = copyVector(leg.targetPosition);
  } else {
    const t = leg.stepProgress;
    const arcHeight = legLength * LEG_ARC_HEIGHT_MULTIPLIER * Math.sin(t * Math.PI);
    const groundPos = lerpVectors(leg.footPosition, leg.targetPosition, t);
    leg.footPosition = createVector(groundPos.x, groundPos.y - arcHeight);
  }
}

function updateLegs(creature: Creature): void {
  const { legLength } = creature.config;
  const stepThreshold = legLength * LEG_STEP_THRESHOLD_MULTIPLIER;

  for (const leg of creature.legs) {
    const rootPos = creature.segments[leg.rootIndex].position;
    const bodyDir = creature.segments[leg.rootIndex].angle;
    const idealFootPos = computeIdealFootPosition(leg, creature);
    const distToIdeal = distanceBetween(leg.footPosition, idealFootPos);

    if (leg.isGrounded && distToIdeal > stepThreshold && leg.stepProgress <= 0) {
      startLegStep(leg, idealFootPos, bodyDir, legLength);
    }

    if (!leg.isGrounded) {
      updateSteppingLeg(leg, legLength);
    }

    solveLegIK(leg, rootPos, leg.footPosition, legLength);
  }
}

function wrapPosition(pos: Vector2, width: number, height: number): void {
  if (pos.x < -HEAD_MARGIN) pos.x = width + HEAD_MARGIN;
  if (pos.x > width + HEAD_MARGIN) pos.x = -HEAD_MARGIN;
  if (pos.y < -HEAD_MARGIN) pos.y = height + HEAD_MARGIN;
  if (pos.y > height + HEAD_MARGIN) pos.y = -HEAD_MARGIN;
}

export function updateCreature(
  creature: Creature,
  worldWidth: number,
  worldHeight: number,
  mousePos: Vector2,
  mouseActive: boolean,
  _time: number
): void {
  updateStateTimer(creature, mousePos, mouseActive);
  creature.targetPosition = pickTargetPosition(creature, worldWidth, worldHeight, mousePos, mouseActive);
  updateHeadMovement(creature);
  updateSpine(creature);
  updateLegs(creature);

  wrapPosition(creature.segments[0].position, worldWidth, worldHeight);

  creature.pulsePhase += PULSE_PHASE_INCREMENT;
}
