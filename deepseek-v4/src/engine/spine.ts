import {
  BodySegment,
  Vec2,
  CreatureConfig,
  LegState,
} from './types';
import {
  sub,
  normalize,
  scale,
  add,
  length,
  setMag,
  limit,
  createVec2,
  clamp,
  withinBounds,
} from './math';

export function createSpine(config: CreatureConfig, startPos: Vec2, angle: number): BodySegment[] {
  const segments: BodySegment[] = [];
  const dir: Vec2 = { x: Math.cos(-angle), y: Math.sin(-angle) };

  for (let i = 0; i < config.segmentCount; i++) {
    const t = i / Math.max(config.segmentCount - 1, 1);
    const pos: Vec2 = {
      x: startPos.x + dir.x * i * config.segmentLength,
      y: startPos.y + dir.y * i * config.segmentLength,
    };
    const width = config.bodyWidthBase + (config.bodyWidthTip - config.bodyWidthBase) * t;

    segments.push({
      position: { x: pos.x, y: pos.y },
      prevPosition: { x: pos.x, y: pos.y },
      width,
      legLeft: createLeg(pos, 'left', 0, config),
      legRight: createLeg(pos, 'right', 0, config),
    });
  }

  return segments;
}

function createLeg(
  origin: Vec2,
  side: 'left' | 'right',
  index: number,
  config: CreatureConfig,
): LegState {
  const sideSign = side === 'left' ? -1 : 1;
  const totalLen = config.legSegment1 + config.legSegment2;
  const shoulder: Vec2 = { x: origin.x + sideSign * 8, y: origin.y };
  const footX = origin.x + sideSign * totalLen * 0.6;
  const footY = origin.y + totalLen * 0.7;

  return {
    joints: {
      shoulder: { x: shoulder.x, y: shoulder.y },
      knee: {
        x: shoulder.x + sideSign * config.legSegment1 * 0.5,
        y: shoulder.y + config.legSegment1 * 0.7,
      },
      foot: { x: footX, y: footY },
    },
    planted: true,
    plantPos: { x: footX, y: footY },
    swingStartPos: { x: footX, y: footY },
    swingPhase: 0,
    side,
    gaitPhase: (index / Math.max(config.segmentCount - 1, 1)) * Math.PI * 2,
    legIndex: index,
  };
}

const BOUNDARY_MARGIN = 60;

export function updateSpine(
  segments: BodySegment[],
  headTarget: Vec2,
  dt: number,
  config: CreatureConfig,
  time: number,
  headVelocity: Vec2,
  headAcceleration: Vec2,
  maxSpeed: number,
  maxForce: number,
  worldWidth: number,
  worldHeight: number,
  curlAmount: number,
): { headVelocity: Vec2; headAcceleration: Vec2; currentSpeed: number } {
  if (segments.length === 0) {
    return {
      headVelocity: { x: 0, y: 0 },
      headAcceleration: { x: 0, y: 0 },
      currentSpeed: 0,
    };
  }

  const head = segments[0];
  const effectiveMaxForce = Math.min(maxForce, maxSpeed * 2.5);
  const effectiveMaxSpeed = Math.max(maxSpeed * (1 - curlAmount * 0.6), 5);

  const toTarget = sub(headTarget, head.position);
  const distToTarget = length(toTarget);

  let desired: Vec2;
  const arriveRadius = 60;

  if (distToTarget < arriveRadius) {
    const mappedSpeed = effectiveMaxSpeed * (distToTarget / arriveRadius);
    desired = setMag(toTarget, mappedSpeed);
  } else {
    desired = setMag(toTarget, effectiveMaxSpeed);
  }

  const steer = sub(desired, headVelocity);
  const limitedSteer = limit(steer, effectiveMaxForce);

  let containmentForce = createVec2(0, 0);
  if (!withinBounds(head.position, 0, 0, worldWidth, worldHeight, BOUNDARY_MARGIN)) {
    const centerX = worldWidth / 2;
    const centerY = worldHeight / 2;
    const toCenter = sub(createVec2(centerX, centerY), head.position);
    const distToEdge = Math.min(
      Math.max(head.position.x, 0),
      Math.max(worldWidth - head.position.x, 0),
      Math.max(head.position.y, 0),
      Math.max(worldHeight - head.position.y, 0),
    );
    const pushStrength = config.containmentForce * (1 + (BOUNDARY_MARGIN - Math.min(distToEdge, BOUNDARY_MARGIN)) / BOUNDARY_MARGIN);
    containmentForce = scale(normalize(toCenter), pushStrength);
  }

  const combinedSteer = add(limitedSteer, containmentForce);
  const clampedSteer = limit(combinedSteer, effectiveMaxForce * 1.5);

  const newAccel = add(headAcceleration, clampedSteer);
  const vel = add(headVelocity, scale(newAccel, dt));
  const clampedVel = limit(vel, effectiveMaxSpeed);

  head.prevPosition = { x: head.position.x, y: head.position.y };
  head.position = add(head.position, scale(clampedVel, dt));

  head.position.x = clamp(head.position.x, 5, worldWidth - 5);
  head.position.y = clamp(head.position.y, 5, worldHeight - 5);

  const effectiveSegLength = config.segmentLength * (1 - curlAmount * 0.5);

  for (let iter = 0; iter < config.spineIterations; iter++) {
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1];
      const curr = segments[i];
      const dir = sub(prev.position, curr.position);
      const dist = length(dir);
      if (dist < 0.0001) continue;
      const norm = normalize(dir);
      curr.prevPosition = { x: curr.position.x, y: curr.position.y };
      curr.position = sub(prev.position, scale(norm, effectiveSegLength));
    }

    for (let i = segments.length - 2; i >= 0; i--) {
      const next = segments[i + 1];
      const curr = segments[i];
      const dir = sub(next.position, curr.position);
      const dist = length(dir);
      if (dist < 0.0001) continue;
      const norm = normalize(dir);
      if (i === 0) {
        curr.prevPosition = { x: curr.position.x, y: curr.position.y };
      }
      curr.position = sub(next.position, scale(norm, effectiveSegLength));
    }
  }

  const undulationAngle = Math.sin(time * config.waveSpeed * 0.4) * 0.06 * (1 - curlAmount * 0.8);
  const swaySteer = {
    x: -clampedVel.y * undulationAngle,
    y: clampedVel.x * undulationAngle,
  };
  head.position = add(head.position, scale(swaySteer, dt));

  head.position.x = clamp(head.position.x, 3, worldWidth - 3);
  head.position.y = clamp(head.position.y, 3, worldHeight - 3);

  const currentSpeed = length(clampedVel);

  return {
    headVelocity: clampedVel,
    headAcceleration: scale(newAccel, 0.85),
    currentSpeed,
  };
}

function getSegmentDirection(segments: BodySegment[], index: number): Vec2 {
  if (index < segments.length - 1) {
    return normalize(sub(segments[index + 1].position, segments[index].position));
  }
  if (index > 0) {
    return normalize(sub(segments[index].position, segments[index - 1].position));
  }
  return createVec2(1, 0);
}

export function getSegmentAngle(segments: BodySegment[], index: number): number {
  const dir = getSegmentDirection(segments, index);
  return Math.atan2(dir.y, dir.x);
}
