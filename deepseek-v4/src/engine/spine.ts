import { BodySegment, Vec2, CreatureConfig } from './types';
import { sub, normalize, scale, add, length } from './math';

export function createSpine(config: CreatureConfig, startPos: Vec2, angle: number): BodySegment[] {
  const segments: BodySegment[] = [];
  const dir: Vec2 = { x: Math.cos(angle), y: Math.sin(angle) };

  for (let i = 0; i < config.segmentCount; i++) {
    const t = i / (config.segmentCount - 1);
    const pos: Vec2 = {
      x: startPos.x - dir.x * i * config.segmentLength,
      y: startPos.y - dir.y * i * config.segmentLength,
    };
    const width = config.bodyWidthBase + (config.bodyWidthTip - config.bodyWidthBase) * t;

    segments.push({
      position: pos,
      prevPosition: pos,
      width,
      legLeft: createLeg(pos, 'left', config),
      legRight: createLeg(pos, 'right', config),
    });
  }

  return segments;
}

function createLeg(origin: Vec2, side: 'left' | 'right', config: CreatureConfig) {
  const sideSign = side === 'left' ? -1 : 1;
  const shoulder: Vec2 = { x: origin.x + sideSign * 8, y: origin.y };
  return {
    joints: {
      shoulder,
      knee: { x: shoulder.x + sideSign * config.legSegment1 * 0.5, y: shoulder.y + config.legSegment1 * 0.7 },
      foot: { x: shoulder.x + sideSign * config.legSegment1 * 0.5 + sideSign * config.legSegment2 * 0.3, y: shoulder.y + config.legSegment1 * 0.7 + config.legSegment2 * 0.7 },
    },
    planted: true,
    plantPos: { x: origin.x + sideSign * (config.legSegment1 + config.legSegment2) * 0.6, y: origin.y + (config.legSegment1 + config.legSegment2) * 0.7 },
    swingPhase: 0,
    side,
  };
}

export function updateSpine(
  segments: BodySegment[],
  headTarget: Vec2,
  dt: number,
  config: CreatureConfig,
  bodySway: number,
): void {
  if (segments.length === 0) return;

  const head = segments[0];
  const headDir = sub(headTarget, head.position);
  const headDist = length(headDir);
  const maxStep = config.moveSpeed * dt * 1.5;

  if (headDist > 1) {
    const step = Math.min(headDist, maxStep);
    const dir = normalize(headDir);
    head.prevPosition = head.position;
    head.position = add(head.position, scale(dir, step));
  }

  for (let iter = 0; iter < config.spineIterations; iter++) {
    for (let i = 1; i < segments.length; i++) {
      const prev = segments[i - 1];
      const curr = segments[i];
      const dir = sub(prev.position, curr.position);
      const dist = length(dir);
      if (dist < 0.0001) continue;
      const norm = normalize(dir);
      curr.prevPosition = curr.position;
      curr.position = sub(prev.position, scale(norm, config.segmentLength));
    }

    for (let i = segments.length - 2; i >= 0; i--) {
      const next = segments[i + 1];
      const curr = segments[i];
      const dir = sub(next.position, curr.position);
      const dist = length(dir);
      if (dist < 0.0001) continue;
      const norm = normalize(dir);
      curr.prevPosition = curr.position;
      curr.position = sub(next.position, scale(norm, config.segmentLength));
    }
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const vel = sub(seg.position, seg.prevPosition);
    const swayOffset = Math.sin(bodySway + i * 0.3) * 2;
    seg.position = add(seg.position, { x: Math.cos(bodySway + i * 0.2) * swayOffset * 0.3, y: 0 });
  }
}

export function getSegmentAngle(segments: BodySegment[], index: number): number {
  if (index >= segments.length - 1) {
    const prev = segments[index - 1];
    const curr = segments[index];
    const dir = sub(curr.position, prev.position);
    return Math.atan2(dir.y, dir.x);
  }
  const curr = segments[index];
  const next = segments[index + 1];
  const dir = sub(next.position, curr.position);
  return Math.atan2(dir.y, dir.x);
}
