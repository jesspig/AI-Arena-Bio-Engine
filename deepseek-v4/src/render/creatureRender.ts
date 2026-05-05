import p5 from 'p5';
import { CreatureState, BodySegment, LegState, Vec2, WorldState } from '../engine/types';
import {
  sub,
  normalize,
  perpendicular,
  add,
  scale,
  length,
  lerpScalar,
  distance,
  lerp,
} from '../engine/math';
import { getMoodColor, getMoodGlowIntensity } from '../engine/needs';

export function drawCreature(p: p5, creature: CreatureState, world: WorldState): void {
  const { segments } = creature;
  if (segments.length === 0) return;

  p.push();

  drawLegs(p, segments, creature.config.segmentCount, world.time);
  drawBody(p, creature, world);
  drawShellPlates(p, segments, creature, world);
  drawBioluminescentSpots(p, creature, world);
  drawHead(p, segments, creature, world);
  drawMandibles(p, creature, world);

  p.pop();
}

function getMoodShiftedColor(
  baseR: number,
  baseG: number,
  baseB: number,
  creature: CreatureState,
): [number, number, number] {
  const moodColor = getMoodColor(creature.needs.mood);
  const t = 0.3;
  return [
    Math.round(lerpScalar(baseR, moodColor[0], t)),
    Math.round(lerpScalar(baseG, moodColor[1], t)),
    Math.round(lerpScalar(baseB, moodColor[2], t)),
  ];
}

function drawBody(p: p5, creature: CreatureState, world: WorldState): void {
  const { segments, config } = creature;
  const total = config.segmentCount;
  const moodColor = getMoodColor(creature.needs.mood);

  for (let i = segments.length - 1; i >= 1; i--) {
    const seg = segments[i];
    const prev = segments[i - 1];
    const t = i / (total - 1);

    const r = Math.round(lerpScalar(20, 45, t));
    const g = Math.round(lerpScalar(moodColor[1] * 0.5, moodColor[1] * 0.7, t));
    const b = Math.round(lerpScalar(moodColor[2] * 0.4, moodColor[2] * 0.6, t));

    p.noStroke();
    p.fill(r, g, b, 220);
    p.stroke(lerpScalar(140, 80, t), lerpScalar(160, 100, t), lerpScalar(100, 60, t), 120);
    p.strokeWeight(1);

    p.beginShape();
    const dir = normalize(sub(prev.position, seg.position));
    const perp = { x: -dir.y, y: dir.x };
    const halfW = seg.width * 0.5;
    const halfH = seg.width * 0.35;

    p.vertex(seg.position.x + perp.x * halfW, seg.position.y + perp.y * halfW);
    p.vertex(seg.position.x + dir.x * halfH + perp.x * halfW * 0.8, seg.position.y + dir.y * halfH + perp.y * halfW * 0.8);
    p.vertex(seg.position.x + dir.x * halfH * 1.5 - perp.x * halfW * 0.8, seg.position.y + dir.y * halfH * 1.5 - perp.y * halfW * 0.8);
    p.vertex(seg.position.x - perp.x * halfW, seg.position.y - perp.y * halfW);
    p.vertex(seg.position.x - dir.x * halfH - perp.x * halfW * 0.8, seg.position.y - dir.y * halfH - perp.y * halfW * 0.8);
    p.vertex(seg.position.x - dir.x * halfH * 1.5 + perp.x * halfW * 0.8, seg.position.y - dir.y * halfH * 1.5 + perp.y * halfW * 0.8);
    p.endShape(p.CLOSE);

    const highlightAlpha = 80 + Math.sin(world.time * 2 + i * 0.3) * 20;
    p.noStroke();
    p.fill(255, 255, 255, highlightAlpha);
    p.beginShape();
    p.vertex(seg.position.x + perp.x * halfW * 0.3, seg.position.y + perp.y * halfW * 0.3);
    p.vertex(seg.position.x + dir.x * halfH * 0.5 + perp.x * halfW * 0.2, seg.position.y + dir.y * halfH * 0.5 + perp.y * halfW * 0.2);
    p.vertex(seg.position.x + dir.x * halfH - perp.x * halfW * 0.2, seg.position.y + dir.y * halfH - perp.y * halfW * 0.2);
    p.vertex(seg.position.x - perp.x * halfW * 0.3, seg.position.y - perp.y * halfW * 0.3);
    p.vertex(seg.position.x - dir.x * halfH * 0.5 - perp.x * halfW * 0.2, seg.position.y - dir.y * halfH * 0.5 - perp.y * halfW * 0.2);
    p.vertex(seg.position.x - dir.x * halfH + perp.x * halfW * 0.2, seg.position.y - dir.y * halfH + perp.y * halfW * 0.2);
    p.endShape(p.CLOSE);
  }

  for (let i = 0; i < segments.length - 1; i++) {
    const curr = segments[i];
    const next = segments[i + 1];
    const t = i / (total - 1);
    const r = Math.round(lerpScalar(30, 50, t));
    const g = Math.round(lerpScalar(moodColor[1] * 0.6, moodColor[1] * 0.5, t));

    p.stroke(r, g, Math.round(lerpScalar(moodColor[2] * 0.5, 100, t)), 120);
    p.strokeWeight(3);
    p.noFill();
    p.line(curr.position.x, curr.position.y, next.position.x, next.position.y);
  }
}

function drawShellPlates(
  p: p5,
  segments: BodySegment[],
  creature: CreatureState,
  world: WorldState,
): void {
  const moodColor = getMoodColor(creature.needs.mood);

  for (let i = 1; i < segments.length; i += 2) {
    const seg = segments[i];
    if (i >= segments.length - 1) continue;

    const next = segments[i + 1];
    const dir = normalize(sub(next.position, seg.position));
    const perp = { x: -dir.y, y: dir.x };

    const shimmer = Math.sin(world.time * 2.5 + i * 0.8) * 0.25 + 0.75;
    const edgeColor: [number, number, number] = [
      Math.round(180 * shimmer),
      Math.round(140 * shimmer + 40),
      Math.round(80 * shimmer + 20),
    ];

    p.noFill();
    p.stroke(edgeColor[0], edgeColor[1], edgeColor[2], 100 * shimmer);
    p.strokeWeight(1.5);

    const halfW = seg.width * 0.45;

    p.beginShape();
    p.vertex(seg.position.x + perp.x * halfW, seg.position.y + perp.y * halfW);
    p.vertex(seg.position.x + dir.x * 10 + perp.x * halfW * 0.6, seg.position.y + dir.y * 10 + perp.y * halfW * 0.6);
    p.vertex(seg.position.x + dir.x * 10 - perp.x * halfW * 0.6, seg.position.y + dir.y * 10 - perp.y * halfW * 0.6);
    p.vertex(seg.position.x - perp.x * halfW, seg.position.y - perp.y * halfW);
    p.endShape(p.CLOSE);
  }
}

function drawBioluminescentSpots(
  p: p5,
  creature: CreatureState,
  world: WorldState,
): void {
  const { segments, config } = creature;
  const spotInterval = Math.max(2, Math.floor(segments.length / config.bioluminescentSpots));

  const glowIntensity = getMoodGlowIntensity(creature.needs.mood);
  const nightBoost = world.isNight ? 2.5 : 1.0;

  for (let i = spotInterval; i < segments.length; i += spotInterval) {
    const seg = segments[i];
    if (i >= segments.length - 1) continue;

    const next = segments[i + 1];
    const dir = normalize(sub(next.position, seg.position));
    const perp = { x: -dir.y, y: dir.x };

    for (const side of [-1, 1]) {
      const spotX = seg.position.x + perp.x * side * seg.width * 0.4;
      const spotY = seg.position.y + perp.y * side * seg.width * 0.4;

      const pulse = Math.sin(world.time * 0.06 + i * 0.5 + side) * 0.3 + 0.7;
      const alpha = glowIntensity * nightBoost * pulse * 220;

      p.noStroke();
      for (let g = 2; g >= 0; g--) {
        const glowR = g * 3 + 2;
        p.fill(60, 255, 200, alpha * 0.1 * (3 - g));
        p.ellipse(spotX, spotY, glowR, glowR);
      }

      p.fill(80, 255, 210, alpha * 0.8);
      p.ellipse(spotX, spotY, 2.5, 2.5);

      p.fill(200, 255, 240, alpha * 0.9);
      p.ellipse(spotX, spotY, 1.2, 1.2);
    }
  }
}

function drawHead(
  p: p5,
  segments: BodySegment[],
  creature: CreatureState,
  world: WorldState,
): void {
  if (segments.length === 0) return;
  const head = segments[0];
  const moodColor = getMoodColor(creature.needs.mood);

  const lookAngle = segments.length > 1
    ? Math.atan2(segments[1].position.y - head.position.y, segments[1].position.x - head.position.x)
    : creature.headAngle;

  p.push();
  p.translate(head.position.x, head.position.y);
  p.rotate(lookAngle);

  const bw = head.width * 1.2;
  const bh = head.width * 0.85;

  const isEating = creature.subState === 'EATING';
  const eatBob = isEating ? Math.sin(world.time * 0.3) * 4 : 0;

  if (isEating) {
    p.translate(0, eatBob);
  }

  if (creature.archAmount > 0.1) {
    p.translate(0, -creature.archAmount * 5);
  }

  p.noStroke();
  p.fill(15, 100, 60, 230);
  p.ellipse(bw * 0.2, 0, bw * 0.8, bh * 1.8);

  p.fill(12, 80, 45, 230);
  p.arc(bw * 0.3, 0, bw * 0.7, bh * 1.6, -Math.PI * 0.45, Math.PI * 0.45, p.CHORD);

  p.fill(moodColor[0] * 0.7, moodColor[1] * 0.7, moodColor[2] * 0.7, 180);
  p.ellipse(bw * 0.1, 0, bw * 0.35, bh * 1.1);

  p.noFill();
  p.stroke(160, 130, 70, 150);
  p.strokeWeight(1.5);
  p.ellipse(bw * 0.2, 0, bw * 0.8, bh * 1.8);

  drawCompoundEyes(p, bw, bh, world.time, creature);

  drawAntennae(p, bw, bh, lookAngle, head, creature, world);

  if (isEating) {
    p.translate(0, -eatBob);
  }

  p.pop();
}

function drawCompoundEyes(
  p: p5,
  bodyWidth: number,
  bodyHeight: number,
  time: number,
  creature: CreatureState,
): void {
  const glowIntensity = getMoodGlowIntensity(creature.needs.mood);
  const eyeX = bodyWidth * 0.35;
  const eyeY = -bodyHeight * 0.35;
  const eyeSize = creature.config.eyeSize;

  for (const side of [-1, 1]) {
    const ex = eyeX;
    const ey = eyeY * side;

    p.noStroke();
    for (let g = 3; g >= 1; g--) {
      p.fill(60, 255, 200, glowIntensity * 15 * (4 - g));
      p.ellipse(ex, ey, eyeSize + g * 3, eyeSize + g * 3);
    }

    p.fill(30, 40, 30, 200);
    p.ellipse(ex, ey, eyeSize, eyeSize * 0.9);

    const facetCount = 5;
    for (let f = 0; f < facetCount; f++) {
      const fAngle = (f / facetCount) * Math.PI * 2 + time * 0.02;
      const fR = eyeSize * 0.3;
      const fx = ex + Math.cos(fAngle) * fR;
      const fy = ey + Math.sin(fAngle) * fR * 0.7;

      const shimmer = Math.sin(time * 0.1 + f) * 0.5 + 0.5;
      p.fill(100, 255, 200, 80 * shimmer);
      p.ellipse(fx, fy, 2, 1.5);
    }

    const highlightAngle = Math.sin(time * 0.03) * 0.3;
    p.fill(200, 255, 240, 200 * glowIntensity);
    p.ellipse(
      ex + Math.cos(time * 0.05 + side) * 1.5,
      ey + Math.sin(time * 0.05 + side) * 1,
      2.5,
      2,
    );
  }
}

function drawAntennae(
  p: p5,
  bodyWidth: number,
  bodyHeight: number,
  lookAngle: number,
  head: BodySegment,
  creature: CreatureState,
  world: WorldState,
): void {
  const antennnaLen = creature.config.antennaLength;
  const moodColor = getMoodColor(creature.needs.mood);

  for (const side of [-1, 1]) {
    const baseX = bodyWidth * 0.5;
    const baseY = bodyHeight * 0.15 * side;

    const fearFactor = creature.needs.fear / 100;
    const curlAmount = fearFactor * 0.5;

    p.noFill();
    p.stroke(moodColor[0] + 20, moodColor[1] + 30, moodColor[2] + 20, 180);
    p.strokeWeight(2);

    p.beginShape();
    const steps = 8;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const segmentAngle = lookAngle + side * (0.4 - curlAmount * 0.3) * (1 - t);
      const xOff =
        baseX +
        Math.cos(segmentAngle) * t * antennnaLen +
        Math.sin(t * Math.PI * 2 + world.time * 0.04 + side) * (t * 6);
      const yOff =
        baseY +
        Math.sin(segmentAngle) * t * antennnaLen +
        Math.cos(t * Math.PI * 2 + world.time * 0.04 + side) * (t * 4);

      p.vertex(xOff, yOff);
    }
    p.endShape();

    const tipX =
      baseX +
      Math.cos(lookAngle + side * 0.2) * antennnaLen +
      Math.sin(world.time * 0.04 + side) * 6;
    const tipY =
      baseY +
      Math.sin(lookAngle + side * 0.2) * antennnaLen +
      Math.cos(world.time * 0.04 + side) * 4;

    p.noStroke();
    const tipGlow = getMoodGlowIntensity(creature.needs.mood);
    p.fill(80, 255, 200, tipGlow * 150);
    p.ellipse(tipX, tipY, 3, 3);
  }
}

function drawMandibles(
  p: p5,
  creature: CreatureState,
  world: WorldState,
): void {
  if (creature.segments.length === 0) return;
  const head = creature.segments[0];

  const lookAngle = creature.segments.length > 1
    ? Math.atan2(creature.segments[1].position.y - head.position.y, creature.segments[1].position.x - head.position.x)
    : creature.headAngle;

  const mandibleLen = creature.config.mandibleLength;

  const isNearFood = creature.subState === 'HUNTING' || creature.subState === 'FORAGING';
  const isEating = creature.subState === 'EATING';
  const chompSpeed = isEating ? 12 : isNearFood ? 8 : 2;
  const mandiblePhase = world.time * 0.1 * chompSpeed + (isEating ? Math.sin(world.time * 0.3) * 0.5 : 0);
  const openAngle = Math.sin(mandiblePhase) * (isEating ? 0.7 : isNearFood ? 0.5 : 0.15) + 0.15;

  for (const side of [-1, 1]) {
    const baseX = head.position.x + Math.cos(lookAngle) * head.width * 0.6;
    const baseY = head.position.y + Math.sin(lookAngle) * head.width * 0.6;
    const sideOffset = side * head.width * 0.2;

    const mangle = lookAngle + side * openAngle + (side === 1 ? Math.PI * 0.1 : -Math.PI * 0.1);

    const tipX = baseX + Math.cos(mangle) * mandibleLen + Math.sin(lookAngle) * sideOffset;
    const tipY = baseY + Math.sin(mangle) * mandibleLen + Math.cos(lookAngle) * sideOffset;

    p.stroke(60, 50, 35, 200);
    p.strokeWeight(2.5);
    p.noFill();

    const midX = baseX + Math.cos(mangle) * mandibleLen * 0.5 + Math.sin(lookAngle) * sideOffset * 0.5;
    const midY = baseY + Math.sin(mangle) * mandibleLen * 0.5 + Math.cos(lookAngle) * sideOffset * 0.5;

    p.line(baseX, baseY, midX, midY);
    p.line(midX, midY, tipX, tipY);

    p.noStroke();
    p.fill(100, 70, 40, 150);
    p.ellipse(tipX, tipY, 3, 2);
  }
}

function drawLegs(
  p: p5,
  segments: BodySegment[],
  total: number,
  time: number,
): void {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    drawSingleLeg(p, seg, seg.legLeft, i, total, time);
    drawSingleLeg(p, seg, seg.legRight, i, total, time);
  }
}

function drawSingleLeg(
  p: p5,
  _segment: BodySegment,
  leg: LegState,
  index: number,
  total: number,
  time: number,
): void {
  const { shoulder, knee, foot } = leg.joints;
  const baseAlpha = leg.planted ? 220 : 150;
  const legColor: [number, number, number] = leg.side === 'left'
    ? [70, 180, 120]
    : [55, 160, 110];

  const segRatio = 1 - index / total;
  const strokeW = 1.5 + segRatio * 2.5;

  p.stroke(legColor[0], legColor[1], legColor[2], baseAlpha);
  p.strokeWeight(strokeW);
  p.noFill();
  p.line(shoulder.x, shoulder.y, knee.x, knee.y);
  p.line(knee.x, knee.y, foot.x, foot.y);

  const jointGlow = Math.sin(time * 3 + index * 0.4) * 0.2 + 0.8;
  p.noStroke();
  p.fill(legColor[0] + 50, legColor[1] + 50, legColor[2] + 50, 120 * jointGlow);
  p.ellipse(knee.x, knee.y, 4, 4);

  if (leg.planted) {
    p.fill(legColor[0], legColor[1], legColor[2], 70);
    p.ellipse(foot.x, foot.y, 5, 5);
  } else {
    const footGlow = Math.abs(Math.sin(leg.swingPhase * 2)) * 0.4 + 0.6;
    p.fill(120, 255, 200, 100 * footGlow);
    p.ellipse(foot.x, foot.y, 4.5, 4.5);
  }
}

export function drawTargetIndicator(p: p5, target: Vec2 | null, time: number): void {
  if (!target) return;
  const pulse = Math.sin(time * 0.08) * 0.3 + 0.7;

  p.noFill();
  p.stroke(80, 255, 200, 150 * pulse);
  p.strokeWeight(2);
  p.ellipse(target.x, target.y, 18, 18);
  p.ellipse(target.x, target.y, 28 * pulse, 28 * pulse);

  p.line(target.x - 8, target.y, target.x + 8, target.y);
  p.line(target.x, target.y - 8, target.x, target.y + 8);
}

export function drawBehaviorLabel(
  p: p5,
  creature: CreatureState,
  time: number,
): void {
  const head = creature.headPos;
  const label = getBehaviorLabel(creature.mainState, creature.subState);
  const alpha = Math.sin(time * 0.04) * 25 + 75;

  p.push();
  p.noStroke();
  p.textSize(11);
  p.textAlign(p.CENTER, p.CENTER);

  p.fill(0, 0, 0, alpha * 0.5);
  p.text(label, head.x + 1, head.y - 22 + 1);

  const moodColor = getMoodColor(creature.needs.mood);
  p.fill(moodColor[0], moodColor[1] + 30, moodColor[2] + 30, alpha + 80);
  p.text(label, head.x, head.y - 22);

  p.pop();
}

function getBehaviorLabel(mainState: string, subState: string): string {
  if (mainState === 'SLEEPING') return '💤 睡眠';
  const labels: Record<string, string> = {
    WANDERING: '漫步',
    FORAGING: '觅食',
    HUNTING: '捕猎',
    EXPLORING: '探索',
    FLEEING: '逃离',
    RESTING: '休憩',
    INTERACTING: '互动',
    EATING: '进食',
    PLAY: '玩耍',
    BURROWING: '钻地',
  };
  return labels[subState] || subState;
}
