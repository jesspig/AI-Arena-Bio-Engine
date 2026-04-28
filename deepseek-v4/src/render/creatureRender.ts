import p5 from 'p5';
import { CreatureState, BodySegment, LegState, Vec2 } from '../engine/types';
import { sub, normalize, perpendicular, add, scale, length, lerp } from '../engine/math';

interface TrailParticle {
  pos: Vec2;
  life: number;
  maxLife: number;
  size: number;
}

const trail: TrailParticle[] = [];
const MAX_TRAIL = 80;
const LEG_PARTICLE_POOL: TrailParticle[] = [];

export function drawCreature(p: p5, creature: CreatureState, time: number): void {
  const { segments } = creature;
  if (segments.length === 0) return;

  p.push();

  drawLegs(p, segments, time);
  drawBody(p, segments, creature.config.segmentCount, time);
  drawShellDetails(p, segments, time);
  drawHead(p, segments, time);
  drawTrail(p, segments);

  p.pop();
}

function getSegmentColor(index: number, total: number): { body: [number, number, number]; highlight: [number, number, number] } {
  const t = index / (total - 1);
  const r = Math.round(lerpScalar(30, 60, t));
  const g = Math.round(lerpScalar(180, 140, t));
  const b = Math.round(lerpScalar(100, 160, t));
  const highlightR = Math.round(lerpScalar(80, 120, t));
  const highlightG = Math.round(lerpScalar(230, 190, t));
  const highlightB = Math.round(lerpScalar(160, 200, t));
  return {
    body: [r, g, b],
    highlight: [highlightR, highlightG, highlightB],
  };
}

function lerpScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function drawBody(p: p5, segments: BodySegment[], total: number, time: number): void {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const colors = getSegmentColor(i, total);
    const breathScale = 1 + Math.sin(time * 2 + i * 0.4) * 0.03;

    p.noStroke();

    p.fill(colors.body[0], colors.body[1], colors.body[2], 200);
    p.ellipse(seg.position.x, seg.position.y, seg.width * breathScale, seg.width * 0.7 * breathScale);

    p.fill(colors.highlight[0], colors.highlight[1], colors.highlight[2], 120);
    p.ellipse(seg.position.x, seg.position.y, seg.width * 0.6 * breathScale, seg.width * 0.35 * breathScale);

    if (i < segments.length - 1) {
      const next = segments[i + 1];
      p.stroke(colors.body[0], colors.body[1], colors.body[2], 180);
      p.strokeWeight(seg.width * 0.4);
      p.line(seg.position.x, seg.position.y, next.position.x, next.position.y);
    }
  }
}

function drawShellDetails(p: p5, segments: BodySegment[], time: number): void {
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 !== 0) continue;
    const seg = segments[i];
    const shimmer = Math.sin(time * 3 + i * 0.7) * 0.3 + 0.7;

    p.noFill();
    p.stroke(160, 220, 180, 80 * shimmer);
    p.strokeWeight(1.5);

    const dir = i < segments.length - 1
      ? normalize(sub(segments[i + 1].position, seg.position))
      : normalize(sub(seg.position, segments[i - 1].position));
    const perp = perpendicular(dir);

    const mid1 = add(seg.position, scale(perp, seg.width * 0.3));
    const mid2 = add(seg.position, scale(perp, -seg.width * 0.3));
    const mid3 = add(seg.position, scale(dir, seg.width * 0.15));
    const mid4 = add(seg.position, scale(dir, -seg.width * 0.15));

    p.line(mid1.x, mid1.y, mid3.x, mid3.y);
    p.line(mid2.x, mid2.y, mid3.x, mid3.y);
    p.line(mid1.x, mid1.y, mid4.x, mid4.y);
    p.line(mid2.x, mid2.y, mid4.x, mid4.y);
  }
}

function drawHead(p: p5, segments: BodySegment[], time: number): void {
  if (segments.length === 0) return;
  const head = segments[0];

  p.noStroke();
  p.fill(25, 160, 90, 220);
  p.ellipse(head.position.x, head.position.y, head.width * 1.3, head.width * 0.9);

  p.fill(40, 200, 110, 160);
  p.ellipse(head.position.x, head.position.y, head.width * 0.8, head.width * 0.55);

  const lookAngle = segments.length > 1
    ? Math.atan2(segments[1].position.y - head.position.y, segments[1].position.x - head.position.x)
    : 0;
  const eyeOffsetX = Math.cos(lookAngle) * head.width * 0.3;
  const eyeOffsetY = Math.sin(lookAngle) * head.width * 0.3;

  const eyeY = head.position.y - head.width * 0.2;
  for (const side of [-1, 1]) {
    const eyeX = head.position.x + eyeOffsetX + side * head.width * 0.25;
    const glow = Math.sin(time * 4 + side) * 0.15 + 0.85;

    p.fill(200, 255, 220, 60 * glow);
    p.circle(eyeX, eyeY, head.width * 0.5);

    p.fill(100, 255, 180, 180 * glow);
    p.circle(eyeX, eyeY, head.width * 0.25);

    p.fill(200, 255, 230, 220 * glow);
    p.circle(eyeX, eyeY, head.width * 0.1);
  }

  const antennaDir = segments.length > 1
    ? normalize(sub(segments[1].position, head.position))
    : { x: 1, y: 0 };
  const antPerp = perpendicular(antennaDir);

  for (const side of [-1, 1]) {
    const baseX = head.position.x + antennaDir.x * head.width * 0.4 + antPerp.x * side * head.width * 0.2;
    const baseY = head.position.y + antennaDir.y * head.width * 0.4 + antPerp.y * side * head.width * 0.2;
    const antWave = Math.sin(time * 3 + side * 1.5) * 10;

    p.noFill();
    p.stroke(60, 200, 130, 160);
    p.strokeWeight(2);

    p.beginShape();
    const steps = 5;
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      const waveOffset = Math.sin(t * Math.PI * 3 + time * 2 + side) * (t * 12);
      const px = baseX + antennaDir.x * t * 25 + antPerp.x * (antWave * t + waveOffset);
      const py = baseY + antennaDir.y * t * 25 + antPerp.y * (antWave * t + waveOffset);
      p.vertex(px, py);
    }
    p.endShape();
  }
}

function drawLegs(p: p5, segments: BodySegment[], time: number): void {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    drawSingleLeg(p, seg, seg.legLeft, i, time);
    drawSingleLeg(p, seg, seg.legRight, i, time);
  }
}

function drawSingleLeg(p: p5, _segment: BodySegment, leg: LegState, index: number, time: number): void {
  const { shoulder, knee, foot } = leg.joints;
  const isLeft = leg.side === 'left';
  const legColor = isLeft ? [80, 180, 130] : [60, 160, 120];
  const alpha = leg.planted ? 200 : 140;

  p.noFill();
  p.stroke(legColor[0], legColor[1], legColor[2], alpha);
  p.strokeWeight(3 - (index / 28) * 1.5);
  p.line(shoulder.x, shoulder.y, knee.x, knee.y);
  p.line(knee.x, knee.y, foot.x, foot.y);

  const glow = Math.sin(time * 3 + index * 0.5) * 0.2 + 0.8;
  p.noStroke();
  p.fill(legColor[0] + 40, legColor[1] + 40, legColor[2] + 40, 100 * glow);
  p.circle(knee.x, knee.y, 4);

  if (leg.planted) {
    p.fill(legColor[0], legColor[1], legColor[2], 60);
    p.circle(foot.x, foot.y, 6);
  } else {
    const footGlow = Math.sin(leg.swingPhase * 2) * 0.3 + 0.7;
    p.fill(200, 255, 220, 80 * footGlow);
    p.circle(foot.x, foot.y, 5);
  }

  if (!leg.planted && index % 3 === 0) {
    addLegParticle(foot, isLeft, time);
  }
}

function addLegParticle(pos: Vec2, isLeft: boolean, time: number): void {
  LEG_PARTICLE_POOL.push({
    pos: { ...pos },
    life: 1,
    maxLife: 1,
    size: 2 + Math.random() * 2,
  });
  if (LEG_PARTICLE_POOL.length > 30) {
    LEG_PARTICLE_POOL.shift();
  }
}

function drawTrail(p: p5, segments: BodySegment[]): void {
  const tail = segments[segments.length - 1];
  if (!tail) return;

  trail.push({
    pos: { x: tail.position.x, y: tail.position.y },
    life: 1,
    maxLife: 1,
    size: 3 + Math.random() * 2,
  });

  if (trail.length > MAX_TRAIL) {
    trail.splice(0, trail.length - MAX_TRAIL);
  }

  p.noStroke();
  for (let i = 0; i < trail.length; i++) {
    const particle = trail[i];
    if (particle.life <= 0) continue;

    particle.life -= 0.015;
    const alpha = particle.life * 100;
    const size = particle.size * particle.life;
    p.fill(60, 200, 140, alpha);
    p.circle(particle.pos.x, particle.pos.y, size);
  }

  for (let i = 0; i < LEG_PARTICLE_POOL.length; i++) {
    const particle = LEG_PARTICLE_POOL[i];
    if (particle.life <= 0) continue;

    particle.life -= 0.02;
    particle.pos.y -= 0.3;
    const alpha = particle.life * 80;
    const size = particle.size * particle.life;
    p.fill(100, 220, 170, alpha);
    p.circle(particle.pos.x, particle.pos.y, size);
  }
}

export function drawTargetIndicator(p: p5, target: Vec2 | null): void {
  if (!target) return;
  const pulse = Math.sin(p.millis() * 0.005) * 0.3 + 0.7;

  p.noFill();
  p.stroke(200, 255, 220, 150 * pulse);
  p.strokeWeight(2);
  p.circle(target.x, target.y, 20);
  p.circle(target.x, target.y, 30 * pulse);

  p.line(target.x - 10, target.y, target.x + 10, target.y);
  p.line(target.x, target.y - 10, target.x, target.y + 10);
}

export function drawBehaviorLabel(p: p5, creature: CreatureState): void {
  const head = creature.segments[0];
  if (!head) return;

  const behaviorNames: Record<string, string> = {
    WANDER: '漫游',
    CHASE: '追逐',
    REST: '休憩',
    EXPLORE: '探索',
  };

  const label = behaviorNames[creature.behavior] || creature.behavior;
  const alpha = Math.sin(p.millis() * 0.003) * 30 + 70;

  p.noStroke();
  p.fill(200, 255, 220, alpha);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text(label, head.position.x, head.position.y - 25);
}

export function drawBackground(p: p5, time: number): void {
  p.background(8, 15, 12);
  const gradientSteps = 20;
  for (let i = 0; i <= gradientSteps; i++) {
    const t = i / gradientSteps;
    const alpha = 20 + Math.sin(t * Math.PI + time * 0.1) * 10;
    p.noStroke();
    p.fill(15, 35, 25, alpha);
    const yPos = (p.height / gradientSteps) * i;
    p.rect(0, yPos, p.width, p.height / gradientSteps + 1);
  }

  for (let i = 0; i < 30; i++) {
    const flicker = Math.sin(time * 0.5 + i * 7.3) * 0.5 + 0.5;
    const x = (Math.sin(i * 13.7 + time * 0.02) * 0.5 + 0.5) * p.width;
    const y = (Math.cos(i * 9.1 + time * 0.015) * 0.5 + 0.5) * p.height;
    p.fill(40, 80, 60, 15 * flicker);
    p.circle(x, y, 1.5);
  }
}
