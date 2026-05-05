import { BodySegment, LegState, Vec2, CreatureConfig } from './types';
import { sub, add, scale, normalize, length, clamp } from './math';

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
  const safeCos = clamp(cosAngle, -1, 1);
  const angle = Math.acos(safeCos);
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

const MAX_DT = 0.033;

export function updateLegs(
  segments: BodySegment[],
  dt: number,
  config: CreatureConfig,
  time: number,
  headVelocity: Vec2,
  curlAmount: number = 0,
): void {
  if (segments.length === 0) return;

  for (let i = 0; i < segments.length; i++) {
    updateLeg(segments[i], segments, i, dt, config, time, headVelocity, curlAmount);
  }
}

function updateLeg(
  segment: BodySegment,
  allSegments: BodySegment[],
  index: number,
  dt: number,
  config: CreatureConfig,
  time: number,
  headVelocity: Vec2,
  curlAmount: number = 0,
): void {
  updateSingleLeg(segment, segment.legLeft, allSegments, index, dt, config, time, headVelocity, 'left', curlAmount);
  updateSingleLeg(segment, segment.legRight, allSegments, index, dt, config, time, headVelocity, 'right', curlAmount);
}

function updateSingleLeg(
  segment: BodySegment,
  leg: LegState,
  allSegments: BodySegment[],
  index: number,
  dt: number,
  config: CreatureConfig,
  time: number,
  headVelocity: Vec2,
  side: 'left' | 'right',
  curlAmount: number = 0,
): void {
  const safeDt = Math.min(dt, MAX_DT);
  const sideSign = side === 'left' ? -1 : 1;
  const shoulderOffset: Vec2 = { x: sideSign * (segment.width * 0.6 * (1 - curlAmount * 0.4)), y: 0 };
  leg.joints.shoulder = add(segment.position, shoulderOffset);

  const headSpeed = length(headVelocity);
  const totalLegLen = config.legSegment1 + config.legSegment2;

  if (curlAmount > 0.3) {
    const tuckShoulder: Vec2 = {
      x: leg.joints.shoulder.x + sideSign * 3 * curlAmount,
      y: leg.joints.shoulder.y + 5 * curlAmount,
    };
    const tuckTarget: Vec2 = {
      x: tuckShoulder.x + sideSign * 5,
      y: tuckShoulder.y + 9,
    };
    const ik = solve2JointIK(
      tuckShoulder,
      tuckTarget,
      config.legSegment1,
      config.legSegment2,
      side,
    );
    leg.joints.knee = ik.knee;
    leg.joints.foot = ik.foot;
    leg.planted = false;
    leg.swingPhase = Math.min(leg.swingPhase + safeDt, Math.PI * 0.8);
    return;
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

    const shoulderToPlant = sub(leg.plantPos, leg.joints.shoulder);
    const distToPlant = length(shoulderToPlant);
    const maxStretch = totalLegLen * 0.88;

    if (distToPlant > maxStretch && canLegLift(index, side, time, allSegments.length, headSpeed)) {
      leg.planted = false;
      leg.swingStartPos = { x: leg.plantPos.x, y: leg.plantPos.y };
      leg.swingPhase = 0;
    }
  } else {
    const swingSpeed = 3.0 + headSpeed * 0.03;
    leg.swingPhase += safeDt * swingSpeed;

    const moveDir = headSpeed > 8 ? normalize(headVelocity) : { x: 1, y: 0 };
    const perpDir = { x: -moveDir.y, y: moveDir.x };
    const stepDistance = totalLegLen * 0.72;
    const lateralReach = totalLegLen * 0.45;

    const swingTarget: Vec2 = {
      x: leg.joints.shoulder.x + moveDir.x * stepDistance + perpDir.x * sideSign * lateralReach,
      y: leg.joints.shoulder.y + moveDir.y * stepDistance + perpDir.y * sideSign * lateralReach,
    };

    const t = clamp(leg.swingPhase / Math.PI, 0, 1);
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const targetPos: Vec2 = {
      x: leg.swingStartPos.x + (swingTarget.x - leg.swingStartPos.x) * easeT,
      y: leg.swingStartPos.y + (swingTarget.y - leg.swingStartPos.y) * easeT,
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
      leg.plantPos = { x: ik.foot.x, y: ik.foot.y };
      leg.swingPhase = 0;
    }
  }
}

function canLegLift(index: number, side: 'left' | 'right', time: number, totalSegments: number, speed: number): boolean {
  if (speed < 10) return index === 0 || index === totalSegments - 1;

  const gaitClock = time * 0.06;
  const phaseOffset = (index / Math.max(totalSegments, 1)) * Math.PI * 2;
  const sideOffset = side === 'left' ? 0 : Math.PI * 0.6;
  const legPhase = (gaitClock + phaseOffset + sideOffset) % (Math.PI * 2);

  return Math.sin(legPhase) > 0;
}
