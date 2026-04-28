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
  add,
  subtract,
  multiply,
  normalize,
  magnitude,
  distance,
  lerpVector,
  angleBetween,
  clamp,
  randomRange,
  rotateVector,
} from './math';

const STATE_DURATIONS: Record<CreatureState, number> = {
  idle: 120,
  roam: 300,
  chase: 200,
  flee: 150,
};

export function createDefaultConfig(): CreatureConfig {
  return {
    segmentCount: 24,
    segmentLength: 14,
    segmentRadius: 10,
    followFactor: 0.35,
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

function updateState(creature: Creature, mousePos: Vector2, mouseActive: boolean): void {
  creature.stateTimer--;

  if (creature.stateTimer <= 0) {
    const states: CreatureState[] = ['idle', 'roam', 'roam', 'roam'];
    const nextState = states[Math.floor(Math.random() * states.length)];
    creature.state = nextState;
    creature.stateTimer = STATE_DURATIONS[nextState] * randomRange(0.5, 1.5);
    creature.targetPosition = null;
  }

  if (mouseActive) {
    const distToMouse = distance(creature.segments[0].position, mousePos);
    if (distToMouse < 150) {
      creature.state = 'flee';
      creature.stateTimer = STATE_DURATIONS.flee;
    } else if (distToMouse < 300) {
      creature.state = 'chase';
      creature.stateTimer = STATE_DURATIONS.chase;
    }
  }
}

function pickTarget(creature: Creature, worldWidth: number, worldHeight: number, mousePos: Vector2, mouseActive: boolean): void {
  if (creature.state === 'idle') {
    creature.targetPosition = null;
    return;
  }

  if (creature.targetPosition && Math.random() > 0.01) {
    const distToTarget = distance(creature.segments[0].position, creature.targetPosition);
    if (distToTarget > 20) return;
  }

  let targetX: number;
  let targetY: number;

  if (creature.state === 'chase' && mouseActive) {
    targetX = mousePos.x;
    targetY = mousePos.y;
  } else if (creature.state === 'flee' && mouseActive) {
    const dx = creature.segments[0].position.x - mousePos.x;
    const dy = creature.segments[0].position.y - mousePos.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    targetX = creature.segments[0].position.x + (dx / len) * 300;
    targetY = creature.segments[0].position.y + (dy / len) * 300;
  } else {
    const margin = 100;
    targetX = randomRange(margin, worldWidth - margin);
    targetY = randomRange(margin, worldHeight - margin);
  }

  creature.targetPosition = createVector(targetX, targetY);
}

function updateHeadMovement(creature: Creature): void {
  const head = creature.segments[0];
  const speed = creature.state === 'flee' ? creature.config.speed * 2.2 :
                creature.state === 'chase' ? creature.config.speed * 1.8 :
                creature.state === 'roam' ? creature.config.speed :
                creature.config.speed * 0.3;

  if (creature.targetPosition) {
    const desiredAngle = angleBetween(head.position, creature.targetPosition);
    let angleDiff = desiredAngle - creature.heading;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    creature.heading += clamp(angleDiff, -creature.config.turnSpeed, creature.config.turnSpeed);
  } else if (creature.state === 'idle') {
    creature.heading += Math.sin(creature.noiseOffset) * 0.02;
    creature.noiseOffset += 0.05;
  }

  const moveDir = createVector(Math.cos(creature.heading), Math.sin(creature.heading));
  const targetVelocity = multiply(moveDir, speed);
  creature.velocity = lerpVector(creature.velocity, targetVelocity, 0.1);

  head.previousPosition = { ...head.position };
  head.position = add(head.position, creature.velocity);
  head.angle = creature.heading;
}

function updateSpine(creature: Creature): void {
  const { segmentLength, followFactor } = creature.config;

  for (let i = 1; i < creature.segments.length; i++) {
    const prev = creature.segments[i - 1];
    const curr = creature.segments[i];

    curr.previousPosition = { ...curr.position };

    const dir = subtract(prev.position, curr.position);
    const dist = magnitude(dir);

    if (dist > 0) {
      const targetPos = subtract(prev.position, multiply(normalize(dir), segmentLength));
      curr.position = lerpVector(curr.position, targetPos, followFactor);
    }

    curr.angle = angleBetween(curr.position, prev.position);
  }
}

function solveLegIK(leg: Leg, rootPos: Vector2, targetPos: Vector2, legLength: number): void {
  const halfLen = legLength * 0.5;
  const dist = distance(rootPos, targetPos);
  const reach = Math.min(dist, legLength * 0.98);

  const angleToTarget = angleBetween(rootPos, targetPos);
  const midX = rootPos.x + Math.cos(angleToTarget) * reach * 0.5;
  const midY = rootPos.y + Math.sin(angleToTarget) * reach * 0.5;

  const perpAngle = angleToTarget + Math.PI / 2;
  const offset = Math.sqrt(Math.max(0, halfLen * halfLen - (reach * 0.5) * (reach * 0.5)));

  const kneeX = midX + Math.cos(perpAngle) * offset * leg.side;
  const kneeY = midY + Math.sin(perpAngle) * offset * leg.side;

  leg.segments[0] = createVector(kneeX, kneeY);
  leg.footPosition = targetPos;
}

function updateLegs(creature: Creature): void {
  const { legLength, segmentLength } = creature.config;
  const stepThreshold = legLength * 0.6;
  const stepSpeed = 0.15;

  for (const leg of creature.legs) {
    const rootPos = creature.segments[leg.rootIndex].position;
    const bodyDir = creature.segments[leg.rootIndex].angle;

    const idealOffset = rotateVector(
      createVector(0, leg.side * segmentLength * 1.2),
      bodyDir
    );
    const idealFootPos = add(rootPos, idealOffset);

    const distToIdeal = distance(leg.footPosition, idealFootPos);

    if (leg.isGrounded && distToIdeal > stepThreshold && leg.stepProgress <= 0) {
      leg.isGrounded = false;
      leg.stepProgress = 0;
      leg.targetPosition = {
        x: idealFootPos.x + Math.cos(bodyDir) * legLength * 0.3,
        y: idealFootPos.y + Math.sin(bodyDir) * legLength * 0.3,
      };
    }

    if (!leg.isGrounded) {
      leg.stepProgress += stepSpeed;
      if (leg.stepProgress >= 1) {
        leg.stepProgress = 0;
        leg.isGrounded = true;
        leg.footPosition = { ...leg.targetPosition };
      } else {
        const t = leg.stepProgress;
        const arcHeight = legLength * 0.4 * Math.sin(t * Math.PI);
        const groundPos = lerpVector(leg.footPosition, leg.targetPosition, t);
        leg.footPosition = createVector(groundPos.x, groundPos.y - arcHeight);
      }
    }

    solveLegIK(leg, rootPos, leg.footPosition, legLength);
  }
}

function wrapPosition(pos: Vector2, width: number, height: number): void {
  const margin = 50;
  if (pos.x < -margin) pos.x = width + margin;
  if (pos.x > width + margin) pos.x = -margin;
  if (pos.y < -margin) pos.y = height + margin;
  if (pos.y > height + margin) pos.y = -margin;
}

export function updateCreature(
  creature: Creature,
  worldWidth: number,
  worldHeight: number,
  mousePos: Vector2,
  mouseActive: boolean,
  _time: number
): void {
  updateState(creature, mousePos, mouseActive);
  pickTarget(creature, worldWidth, worldHeight, mousePos, mouseActive);
  updateHeadMovement(creature);
  updateSpine(creature);
  updateLegs(creature);

  wrapPosition(creature.segments[0].position, worldWidth, worldHeight);

  creature.pulsePhase += 0.03;
}
