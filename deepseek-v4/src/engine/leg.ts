import { BodySegment, LegState, Vec2, CreatureConfig } from './types';
import { sub, add, scale, normalize, length } from './math';

function solve2JointIK(
  shoulder: Vec2,
  footTarget: Vec2,
  len1: number,
  len2: number,
  side: 'left' | 'right',
): { knee: Vec2; foot: Vec2 } {
  const toTarget = sub(footTarget, shoulder);
  const d = length(toTarget);
  const sideSign = side === 'left' ? -1 : 1;

  if (d > len1 + len2) {
    const dir = normalize(toTarget);
    return {
      knee: add(shoulder, scale(dir, len1)),
      foot: add(shoulder, scale(dir, len1 + len2)),
    };
  }

  if (d < Math.abs(len1 - len2)) {
    const dir = normalize(toTarget);
    return {
      knee: add(shoulder, scale(dir, len1)),
      foot: add(shoulder, scale(dir, Math.abs(len1 - len2))),
    };
  }

  const cosAngle = (d * d + len1 * len1 - len2 * len2) / (2 * d * len1);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const targetAngle = Math.atan2(toTarget.y, toTarget.x);
  const kneeAngle = targetAngle + angle * sideSign;
  const knee: Vec2 = {
    x: shoulder.x + Math.cos(kneeAngle) * len1,
    y: shoulder.y + Math.sin(kneeAngle) * len1,
  };
  const kneeToTarget = sub(footTarget, knee);
  const footDir = normalize(kneeToTarget);
  const foot: Vec2 = add(knee, scale(footDir, Math.min(len2, length(kneeToTarget))));

  return { knee, foot };
}

export function updateLegs(
  segments: BodySegment[],
  dt: number,
  config: CreatureConfig,
  time: number,
): void {
  if (segments.length === 0) return;

  for (let i = 0; i < segments.length; i++) {
    updateLeg(segments[i], segments, i, dt, config, time);
  }
}

function updateLeg(
  segment: BodySegment,
  allSegments: BodySegment[],
  index: number,
  dt: number,
  config: CreatureConfig,
  time: number,
): void {
  updateSingleLeg(segment, segment.legLeft, allSegments, index, dt, config, time, 'left');
  updateSingleLeg(segment, segment.legRight, allSegments, index, dt, config, time, 'right');
}

function updateSingleLeg(
  segment: BodySegment,
  leg: LegState,
  allSegments: BodySegment[],
  index: number,
  dt: number,
  config: CreatureConfig,
  time: number,
  side: 'left' | 'right',
): void {
  const sideSign = side === 'left' ? -1 : 1;
  const shoulderOffset: Vec2 = { x: sideSign * (segment.width * 0.6), y: 0 };
  leg.joints.shoulder = add(segment.position, shoulderOffset);

  const moveSpeed = length(sub(segment.position, segment.prevPosition)) / Math.max(dt, 0.016);
  const liftThreshold = 30;

  if (moveSpeed > liftThreshold && leg.planted) {
    leg.planted = false;
    leg.swingPhase = 0;
  }

  if (leg.planted) {
    const ik = solve2JointIK(
      leg.joints.shoulder,
      leg.plantPos,
      config.legSegment1,
      config.legSegment2,
      side,
    );
    leg.joints.knee = ik.knee;
    leg.joints.foot = ik.foot;
  } else {
    leg.swingPhase += dt * (1.5 + moveSpeed * 0.02);

    const gaitOffset = getGaitOffset(allSegments, segment, index, side);
    const targetPos: Vec2 = {
      x: segment.position.x + sideSign * (config.legSegment1 + config.legSegment2) * 0.6 + Math.sin(time * 2 + gaitOffset) * 10,
      y: segment.position.y + (config.legSegment1 + config.legSegment2) * 0.7 + Math.abs(Math.sin(leg.swingPhase)) * 15 - 5,
    };

    const ik = solve2JointIK(
      leg.joints.shoulder,
      targetPos,
      config.legSegment1,
      config.legSegment2,
      side,
    );
    leg.joints.knee = ik.knee;
    leg.joints.foot = ik.foot;

    if (leg.swingPhase > Math.PI) {
      leg.planted = true;
      leg.plantPos = { ...leg.joints.foot };
      leg.swingPhase = 0;
    }
  }
}

function getGaitOffset(
  allSegments: BodySegment[],
  _segment: BodySegment,
  index: number,
  side: 'left' | 'right',
): number {
  const sidePhase = side === 'left' ? 0 : Math.PI;
  const segmentPhase = (index / allSegments.length) * Math.PI * 2;
  return sidePhase + segmentPhase;
}
