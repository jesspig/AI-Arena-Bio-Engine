import p5 from 'p5';
import { WorldState, Creature, Particle, Segment } from '../engine/types';
import { perpendicular, createVector } from '../engine/math';

export function createSketch(world: WorldState, onCanvasReady: (p: p5) => void) {
  return function (p: p5) {
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    p.setup = () => {
      const canvas = p.createCanvas(canvasWidth, canvasHeight);
      canvas.parent('canvas-container');
      p.colorMode(p.HSB, 360, 100, 100, 100);
      p.frameRate(60);
      onCanvasReady(p);
    };

    p.draw = () => {
      p.background(230, 40, 8);
      drawGrid(p, world);
      drawParticles(p, world.particles);
      for (const creature of world.creatures) {
        drawCreature(p, creature);
      }
      drawMouseIndicator(p, world);
    };

    p.windowResized = () => {
      canvasWidth = window.innerWidth;
      canvasHeight = window.innerHeight;
      p.resizeCanvas(canvasWidth, canvasHeight);
      world.width = canvasWidth;
      world.height = canvasHeight;
    };
  };
}

function drawGrid(p: p5, world: WorldState): void {
  p.stroke(220, 30, 15);
  p.strokeWeight(1);
  const gridSize = 60;
  const offsetX = (world.time * 0.3) % gridSize;
  const offsetY = (world.time * 0.2) % gridSize;

  for (let x = -gridSize + offsetX; x < world.width + gridSize; x += gridSize) {
    p.line(x, 0, x, world.height);
  }
  for (let y = -gridSize + offsetY; y < world.height + gridSize; y += gridSize) {
    p.line(0, y, world.width, y);
  }
}

function drawParticles(p: p5, particles: Particle[]): void {
  for (const particle of particles) {
    const alpha = particle.life * 60;
    p.noStroke();
    p.fill(particle.hue % 360, 80, 100, alpha);
    p.circle(particle.position.x, particle.position.y, particle.size * particle.life);
  }
}

function drawCreature(p: p5, creature: Creature): void {
  const { segments, legs, config, pulsePhase } = creature;
  const { colorHue, segmentRadius, glowIntensity } = config;

  const pulse = Math.sin(pulsePhase) * 0.15 + 0.85;

  drawLegs(p, legs, colorHue, pulse);
  drawBody(p, segments, colorHue, segmentRadius, pulse, glowIntensity);
  drawHead(p, segments[0], colorHue, pulse, glowIntensity);
}

function drawLegs(p: p5, legs: Creature['legs'], hue: number, pulse: number): void {
  for (const leg of legs) {
    if (leg.segments.length < 1) continue;

    const alpha = leg.isGrounded ? 70 : 45;
    const brightness = leg.isGrounded ? 80 : 60;

    p.stroke(hue, 60, brightness, alpha * pulse);
    p.strokeWeight(2.5);
    p.noFill();

    p.beginShape();
    p.vertex(leg.segments[0].x, leg.segments[0].y);
    p.vertex(leg.footPosition.x, leg.footPosition.y);
    p.endShape();
  }
}

function drawBody(
  p: p5,
  segments: Segment[],
  hue: number,
  baseRadius: number,
  pulse: number,
  glowIntensity: number
): void {
  if (segments.length < 2) return;

  const leftPoints: { x: number; y: number }[] = [];
  const rightPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const t = i / (segments.length - 1);
    const widthFactor = Math.sin(t * Math.PI) * 0.8 + 0.2;
    const radius = baseRadius * widthFactor * (1 - t * 0.3);

    const dir = perpendicular(createVector(Math.cos(seg.angle), Math.sin(seg.angle)));
    const r = radius * pulse;

    leftPoints.push({
      x: seg.position.x + dir.x * r,
      y: seg.position.y + dir.y * r,
    });
    rightPoints.push({
      x: seg.position.x - dir.x * r,
      y: seg.position.y - dir.y * r,
    });
  }

  p.noStroke();

  const glowLayers = 3;
  for (let layer = glowLayers; layer >= 0; layer--) {
    const layerAlpha = layer === 0 ? 25 : 8 * glowIntensity;
    const expand = layer * 6;

    p.fill(hue, 70, 95, layerAlpha);
    p.beginShape();

    for (const pt of leftPoints) {
      p.vertex(pt.x + expand, pt.y + expand);
    }
    for (let i = rightPoints.length - 1; i >= 0; i--) {
      const pt = rightPoints[i];
      p.vertex(pt.x + expand, pt.y + expand);
    }
    p.endShape(p.CLOSE);
  }

  p.fill(hue, 50, 100, 40);
  p.beginShape();
  for (const pt of leftPoints) {
    p.vertex(pt.x, pt.y);
  }
  for (let i = rightPoints.length - 1; i >= 0; i--) {
    p.vertex(rightPoints[i].x, rightPoints[i].y);
  }
  p.endShape(p.CLOSE);

  for (let i = 0; i < segments.length; i += 2) {
    const t = i / segments.length;
    const seg = segments[i];
    const ringAlpha = (1 - t) * 50 * glowIntensity;
    const ringSize = baseRadius * (1 - t * 0.5) * 0.3;

    p.noFill();
    p.stroke((hue + 30) % 360, 60, 100, ringAlpha);
    p.strokeWeight(1);
    p.circle(seg.position.x, seg.position.y, ringSize * 2);
  }
}

function drawHead(
  p: p5,
  head: Segment,
  hue: number,
  pulse: number,
  glowIntensity: number
): void {
  const { position, angle } = head;
  const headRadius = 14 * pulse;

  for (let i = 3; i >= 0; i--) {
    const expand = i * 5;
    const alpha = i === 0 ? 30 : 10 * glowIntensity;
    p.noStroke();
    p.fill(hue, 60, 100, alpha);
    p.circle(position.x, position.y, (headRadius + expand) * 2);
  }

  p.noStroke();
  p.fill(hue, 40, 100, 70);
  p.circle(position.x, position.y, headRadius * 2);

  const eyeOffset = 5;
  const eyeDistance = 6;
  const eyeX = position.x + Math.cos(angle) * eyeOffset;
  const eyeY = position.y + Math.sin(angle) * eyeOffset;
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  p.fill(0, 0, 100, 90);
  p.circle(eyeX + perpX * eyeDistance, eyeY + perpY * eyeDistance, 5);
  p.circle(eyeX - perpX * eyeDistance, eyeY - perpY * eyeDistance, 5);

  p.fill(0, 0, 0, 80);
  p.circle(eyeX + perpX * eyeDistance + Math.cos(angle) * 1, eyeY + perpY * eyeDistance + Math.sin(angle) * 1, 2.5);
  p.circle(eyeX - perpX * eyeDistance + Math.cos(angle) * 1, eyeY - perpY * eyeDistance + Math.sin(angle) * 1, 2.5);
}

function drawMouseIndicator(p: p5, world: WorldState): void {
  if (!world.mouseActive) return;

  const { x, y } = world.mousePosition;
  const pulse = Math.sin(world.time * 0.1) * 0.3 + 0.7;

  p.noFill();
  p.stroke(180, 80, 100, 50 * pulse);
  p.strokeWeight(2);
  p.circle(x, y, 20 * pulse);

  p.stroke(180, 80, 100, 30 * pulse);
  p.circle(x, y, 40 * pulse);

  p.stroke(180, 80, 100, 60);
  p.strokeWeight(1.5);
  const crossSize = 8;
  p.line(x - crossSize, y, x + crossSize, y);
  p.line(x, y - crossSize, x, y + crossSize);
}
