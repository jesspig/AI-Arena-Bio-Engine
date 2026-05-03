import p5 from 'p5';
import { WorldState, Creature, Particle, Segment } from '../engine/types';
import { perpendicularVector, createVector } from '../engine/math';

const BACKGROUND_HUE = 230;
const BACKGROUND_SAT = 40;
const BACKGROUND_BRI = 8;
const GRID_HUE = 220;
const GRID_SAT = 30;
const GRID_BRI = 15;
const GRID_SIZE = 60;
const GRID_SCROLL_X = 0.3;
const GRID_SCROLL_Y = 0.2;
const PARTICLE_SAT = 80;
const PARTICLE_BRI = 100;
const PARTICLE_ALPHA_MULTIPLIER = 60;
const CREATURE_PULSE_AMPLITUDE = 0.15;
const CREATURE_PULSE_BASE = 0.85;
const LEG_STROKE_WEIGHT = 2.5;
const LEG_ALPHA_GROUNDED = 70;
const LEG_ALPHA_AIR = 45;
const LEG_BRIGHTNESS_GROUNDED = 80;
const LEG_BRIGHTNESS_AIR = 60;
const LEG_SAT = 60;
const BODY_GLOW_LAYERS = 3;
const BODY_GLOW_EXPAND = 6;
const BODY_GLOW_LAYER_ALPHA = 8;
const BODY_CORE_ALPHA = 25;
const BODY_OUTLINE_ALPHA = 40;
const BODY_SAT = 70;
const BODY_BRI = 95;
const BODY_OUTLINE_SAT = 50;
const BODY_OUTLINE_BRI = 100;
const RING_HUE_SHIFT = 30;
const RING_SAT = 60;
const RING_BRI = 100;
const RING_ALPHA_MULTIPLIER = 50;
const RING_SIZE_MULTIPLIER = 0.3;
const HEAD_RADIUS_BASE = 14;
const HEAD_GLOW_LAYERS = 3;
const HEAD_GLOW_EXPAND = 5;
const HEAD_GLOW_ALPHA = 10;
const HEAD_CORE_ALPHA = 30;
const HEAD_FILL_ALPHA = 70;
const HEAD_SAT = 60;
const HEAD_BRI = 100;
const HEAD_FILL_SAT = 40;
const EYE_OFFSET = 5;
const EYE_DISTANCE = 6;
const EYE_SIZE = 5;
const PUPIL_OFFSET = 1;
const PUPIL_SIZE = 2.5;
const MOUSE_PULSE_SPEED = 0.1;
const MOUSE_PULSE_MIN = 0.7;
const MOUSE_PULSE_AMPLITUDE = 0.3;
const MOUSE_CIRCLE_1_SIZE = 20;
const MOUSE_CIRCLE_2_SIZE = 40;
const MOUSE_CROSS_SIZE = 8;
const MOUSE_STROKE_WEIGHT = 2;
const MOUSE_STROKE_WEIGHT_THIN = 1.5;
const MOUSE_HUE = 180;
const MOUSE_SAT = 80;
const MOUSE_BRI = 100;
const MOUSE_ALPHA_1 = 50;
const MOUSE_ALPHA_2 = 30;
const MOUSE_ALPHA_CROSS = 60;

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
      p.background(BACKGROUND_HUE, BACKGROUND_SAT, BACKGROUND_BRI);
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
  p.stroke(GRID_HUE, GRID_SAT, GRID_BRI);
  p.strokeWeight(1);
  const offsetX = (world.time * GRID_SCROLL_X) % GRID_SIZE;
  const offsetY = (world.time * GRID_SCROLL_Y) % GRID_SIZE;

  for (let x = -GRID_SIZE + offsetX; x < world.width + GRID_SIZE; x += GRID_SIZE) {
    p.line(x, 0, x, world.height);
  }
  for (let y = -GRID_SIZE + offsetY; y < world.height + GRID_SIZE; y += GRID_SIZE) {
    p.line(0, y, world.width, y);
  }
}

function drawParticles(p: p5, particles: Particle[]): void {
  for (const particle of particles) {
    const alpha = particle.life * PARTICLE_ALPHA_MULTIPLIER;
    p.noStroke();
    p.fill(particle.hue % 360, PARTICLE_SAT, PARTICLE_BRI, alpha);
    p.circle(particle.position.x, particle.position.y, particle.size * particle.life);
  }
}

function drawCreature(p: p5, creature: Creature): void {
  const { segments, legs, config, pulsePhase } = creature;
  const { colorHue, segmentRadius, glowIntensity } = config;

  const pulse = Math.sin(pulsePhase) * CREATURE_PULSE_AMPLITUDE + CREATURE_PULSE_BASE;

  drawLegs(p, legs, colorHue, pulse);
  drawBody(p, segments, colorHue, segmentRadius, pulse, glowIntensity);
  drawHead(p, segments[0], colorHue, pulse, glowIntensity);
}

function drawLegs(p: p5, legs: Creature['legs'], hue: number, pulse: number): void {
  for (const leg of legs) {
    if (leg.segments.length < 1) continue;

    const alpha = leg.isGrounded ? LEG_ALPHA_GROUNDED : LEG_ALPHA_AIR;
    const brightness = leg.isGrounded ? LEG_BRIGHTNESS_GROUNDED : LEG_BRIGHTNESS_AIR;

    p.stroke(hue, LEG_SAT, brightness, alpha * pulse);
    p.strokeWeight(LEG_STROKE_WEIGHT);
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

    const dir = perpendicularVector(createVector(Math.cos(seg.angle), Math.sin(seg.angle)));
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

  for (let layer = BODY_GLOW_LAYERS; layer >= 0; layer--) {
    const layerAlpha = layer === 0 ? BODY_CORE_ALPHA : BODY_GLOW_LAYER_ALPHA * glowIntensity;
    const expand = layer * BODY_GLOW_EXPAND;

    p.fill(hue, BODY_SAT, BODY_BRI, layerAlpha);
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

  p.fill(hue, BODY_OUTLINE_SAT, BODY_OUTLINE_BRI, BODY_OUTLINE_ALPHA);
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
    const ringAlpha = (1 - t) * RING_ALPHA_MULTIPLIER * glowIntensity;
    const ringSize = baseRadius * (1 - t * 0.5) * RING_SIZE_MULTIPLIER;

    p.noFill();
    p.stroke((hue + RING_HUE_SHIFT) % 360, RING_SAT, RING_BRI, ringAlpha);
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
  const headRadius = HEAD_RADIUS_BASE * pulse;

  for (let i = HEAD_GLOW_LAYERS; i >= 0; i--) {
    const expand = i * HEAD_GLOW_EXPAND;
    const alpha = i === 0 ? HEAD_CORE_ALPHA : HEAD_GLOW_ALPHA * glowIntensity;
    p.noStroke();
    p.fill(hue, HEAD_SAT, HEAD_BRI, alpha);
    p.circle(position.x, position.y, (headRadius + expand) * 2);
  }

  p.noStroke();
  p.fill(hue, HEAD_FILL_SAT, HEAD_BRI, HEAD_FILL_ALPHA);
  p.circle(position.x, position.y, headRadius * 2);

  const eyeX = position.x + Math.cos(angle) * EYE_OFFSET;
  const eyeY = position.y + Math.sin(angle) * EYE_OFFSET;
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  p.fill(0, 0, 100, 90);
  p.circle(eyeX + perpX * EYE_DISTANCE, eyeY + perpY * EYE_DISTANCE, EYE_SIZE);
  p.circle(eyeX - perpX * EYE_DISTANCE, eyeY - perpY * EYE_DISTANCE, EYE_SIZE);

  p.fill(0, 0, 0, 80);
  p.circle(eyeX + perpX * EYE_DISTANCE + Math.cos(angle) * PUPIL_OFFSET, eyeY + perpY * EYE_DISTANCE + Math.sin(angle) * PUPIL_OFFSET, PUPIL_SIZE);
  p.circle(eyeX - perpX * EYE_DISTANCE + Math.cos(angle) * PUPIL_OFFSET, eyeY - perpY * EYE_DISTANCE + Math.sin(angle) * PUPIL_OFFSET, PUPIL_SIZE);
}

function drawMouseIndicator(p: p5, world: WorldState): void {
  if (!world.mouseActive) return;

  const { x, y } = world.mousePosition;
  const pulse = Math.sin(world.time * MOUSE_PULSE_SPEED) * MOUSE_PULSE_AMPLITUDE + MOUSE_PULSE_MIN;

  p.noFill();
  p.stroke(MOUSE_HUE, MOUSE_SAT, MOUSE_BRI, MOUSE_ALPHA_1 * pulse);
  p.strokeWeight(MOUSE_STROKE_WEIGHT);
  p.circle(x, y, MOUSE_CIRCLE_1_SIZE * pulse);

  p.stroke(MOUSE_HUE, MOUSE_SAT, MOUSE_BRI, MOUSE_ALPHA_2 * pulse);
  p.circle(x, y, MOUSE_CIRCLE_2_SIZE * pulse);

  p.stroke(MOUSE_HUE, MOUSE_SAT, MOUSE_BRI, MOUSE_ALPHA_CROSS);
  p.strokeWeight(MOUSE_STROKE_WEIGHT_THIN);
  p.line(x - MOUSE_CROSS_SIZE, y, x + MOUSE_CROSS_SIZE, y);
  p.line(x, y - MOUSE_CROSS_SIZE, x, y + MOUSE_CROSS_SIZE);
}
