import p5 from 'p5';
import { WorldState, Creature, Particle, Segment, FoodSource, Footprint, Obstacle } from '../engine/types';
import { perpendicularVector, createVector } from '../engine/math';

const BACKGROUND_HUE = 230;
const BACKGROUND_SAT = 35;
const BACKGROUND_BRI = 10;
const GRID_HUE = 220;
const GRID_SAT = 25;
const GRID_BRI = 18;
const GRID_SIZE = 60;
const GRID_SCROLL_X = 0.3;
const GRID_SCROLL_Y = 0.2;
const PARTICLE_SAT = 80;
const PARTICLE_BRI = 100;
const PARTICLE_ALPHA_MULTIPLIER = 60;
const CREATURE_PULSE_AMPLITUDE = 0.12;
const CREATURE_PULSE_BASE = 0.88;
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
const ANTENNA_STROKE_WEIGHT = 1.5;
const ANTENNA_ALPHA = 60;
const ANTENNA_TIP_SIZE = 3;
const FOOTPRINT_ALPHA_BASE = 25;
const FOOD_PULSE_AMPLITUDE = 0.2;
const FOOD_PULSE_BASE = 1;
const FOOD_GLOW_LAYERS = 2;
const FOOD_GLOW_EXPAND = 8;
const FOOD_GLOW_ALPHA = 15;
const EMOTION_INDICATOR_OFFSET = 35;
const EMOTION_INDICATOR_SIZE = 4;
const BREATH_AMPLITUDE = 0.05;
const BREATH_BASE = 1;
const OBSTACLE_ROCK_HUE = 30;
const OBSTACLE_PLANT_HUE = 100;
const OBSTACLE_WATER_HUE = 200;
const SLEEP_Z_SPAWN_INTERVAL = 30;

const EMOTION_COLORS: Record<string, { hue: number; sat: number; bri: number }> = {
  calm: { hue: 180, sat: 40, bri: 80 },
  happy: { hue: 60, sat: 80, bri: 100 },
  anxious: { hue: 30, sat: 70, bri: 90 },
  excited: { hue: 320, sat: 80, bri: 100 },
  tired: { hue: 240, sat: 30, bri: 60 },
  scared: { hue: 0, sat: 80, bri: 90 },
  hungry: { hue: 20, sat: 70, bri: 85 },
  sleepy: { hue: 260, sat: 30, bri: 55 },
  playful: { hue: 45, sat: 90, bri: 100 },
  content: { hue: 150, sat: 50, bri: 85 },
};

const FOOD_TYPE_VISUALS: Record<string, { hue: number; sat: number; bri: number; shape: string }> = {
  favorite: { hue: 120, sat: 70, bri: 90, shape: 'star' },
  normal: { hue: 60, sat: 60, bri: 80, shape: 'circle' },
  disliked: { hue: 0, sat: 50, bri: 70, shape: 'triangle' },
};

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
      drawObstacles(p, world.obstacles);
      drawFootprints(p, world.footprints);
      drawFoodSources(p, world.foodSources);
      drawParticles(p, world.particles);
      for (const creature of world.creatures) {
        const isSelected = world.selectedCreatureIds.has(creature.id);
        drawCreature(p, creature, isSelected);
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

function drawObstacles(p: p5, obstacles: Obstacle[]): void {
  for (const obstacle of obstacles) {
    let hue: number;
    let sat: number;
    let bri: number;

    switch (obstacle.type) {
      case 'rock':
        hue = OBSTACLE_ROCK_HUE;
        sat = 20;
        bri = 45;
        break;
      case 'plant':
        hue = OBSTACLE_PLANT_HUE;
        sat = 40;
        bri = 50;
        break;
      case 'water':
        hue = OBSTACLE_WATER_HUE;
        sat = 50;
        bri = 55;
        break;
    }

    p.noStroke();
    p.fill(hue, sat, bri, 30);
    p.circle(obstacle.position.x, obstacle.position.y, obstacle.radius * 2);

    p.noFill();
    p.stroke(hue, sat + 10, bri + 10, 40);
    p.strokeWeight(2);
    p.circle(obstacle.position.x, obstacle.position.y, obstacle.radius * 2);

    if (obstacle.type === 'plant') {
      p.stroke(hue, sat + 20, bri + 20, 25);
      p.strokeWeight(1);
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + Math.sin(Date.now() * 0.001 + i) * 0.2;
        const len = obstacle.radius * 0.8;
        p.line(
          obstacle.position.x,
          obstacle.position.y,
          obstacle.position.x + Math.cos(angle) * len,
          obstacle.position.y + Math.sin(angle) * len
        );
      }
    }
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

function drawFootprints(p: p5, footprints: Footprint[]): void {
  for (const footprint of footprints) {
    const alpha = (footprint.life / footprint.maxLife) * FOOTPRINT_ALPHA_BASE;
    p.noStroke();
    p.fill(200, 20, 60, alpha);

    const size = 3 * (footprint.life / footprint.maxLife);

    p.push();
    p.translate(footprint.position.x, footprint.position.y);
    p.rotate(footprint.angle);
    p.ellipse(footprint.side * 4, 0, size * 2, size * 1.2);
    p.pop();
  }
}

function drawFoodSources(p: p5, foodSources: FoodSource[]): void {
  for (const food of foodSources) {
    const pulse = Math.sin(food.pulsePhase) * FOOD_PULSE_AMPLITUDE + FOOD_PULSE_BASE;
    const radius = food.radius * pulse;
    const visuals = FOOD_TYPE_VISUALS[food.type];

    for (let i = FOOD_GLOW_LAYERS; i >= 0; i--) {
      const expand = i * FOOD_GLOW_EXPAND;
      const alpha = i === 0 ? FOOD_GLOW_ALPHA * 2 : FOOD_GLOW_ALPHA;
      p.noStroke();
      p.fill(visuals.hue, visuals.sat, visuals.bri, alpha * (food.amount / food.maxAmount));
      p.circle(food.position.x, food.position.y, (radius + expand) * 2);
    }

    p.noStroke();
    p.fill(visuals.hue, visuals.sat + 10, visuals.bri + 10, 80);

    if (visuals.shape === 'star') {
      drawStar(p, food.position.x, food.position.y, radius, radius * 0.5, 5);
    } else if (visuals.shape === 'triangle') {
      drawTriangle(p, food.position.x, food.position.y, radius);
    } else {
      p.circle(food.position.x, food.position.y, radius * 2);
    }

    p.noFill();
    p.stroke(visuals.hue + 30, 80, 100, 50);
    p.strokeWeight(1.5);
    p.circle(food.position.x, food.position.y, radius * 2.5);

    const particleCount = 3;
    for (let i = 0; i < particleCount; i++) {
      const angle = food.pulsePhase * 0.5 + (i / particleCount) * Math.PI * 2;
      const dist = radius * 1.8;
      p.fill(visuals.hue, 50, 100, 40);
      p.noStroke();
      p.circle(
        food.position.x + Math.cos(angle) * dist,
        food.position.y + Math.sin(angle) * dist,
        2
      );
    }
  }
}

function drawStar(p: p5, x: number, y: number, outerRadius: number, innerRadius: number, points: number): void {
  p.beginShape();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    p.vertex(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  p.endShape(p.CLOSE);
}

function drawTriangle(p: p5, x: number, y: number, radius: number): void {
  p.beginShape();
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
    p.vertex(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
  p.endShape(p.CLOSE);
}

function drawCreature(p: p5, creature: Creature, isSelected: boolean): void {
  const { segments, legs, config, pulsePhase, breathPhase, emotionalState } = creature;
  const { colorHue, segmentRadius, glowIntensity } = config;

  const pulse = Math.sin(pulsePhase) * CREATURE_PULSE_AMPLITUDE + CREATURE_PULSE_BASE;
  const breath = Math.sin(breathPhase) * BREATH_AMPLITUDE + BREATH_BASE;
  const combinedPulse = pulse * breath;

  const emotionColor = EMOTION_COLORS[emotionalState] || EMOTION_COLORS.calm;

  if (isSelected) {
    drawSelectionHighlight(p, creature, emotionColor);
  }

  if (creature.state === 'sleep') {
    drawSleepZs(p, creature);
  }

  drawLegs(p, legs, colorHue, combinedPulse);
  drawBody(p, segments, colorHue, segmentRadius, combinedPulse, glowIntensity, emotionalState, isSelected);
  drawHead(p, segments[0], colorHue, combinedPulse, glowIntensity, creature, isSelected);
  drawAntennas(p, creature);
  drawEmotionIndicator(p, creature, emotionColor);

  if (isSelected) {
    drawSelectionRing(p, creature);
  }
}

function drawSleepZs(p: p5, creature: Creature): void {
  if (creature.age % SLEEP_Z_SPAWN_INTERVAL !== 0) return;

  const head = creature.segments[0];
  p.fill(220, 30, 80, 40);
  p.noStroke();
  p.textSize(12);
  p.text('Z', head.position.x + 15, head.position.y - 15);
}

function drawAntennas(p: p5, creature: Creature): void {
  const head = creature.segments[0];

  for (const antenna of creature.antennas) {
    p.stroke(creature.config.colorHue, 40, 80, ANTENNA_ALPHA);
    p.strokeWeight(ANTENNA_STROKE_WEIGHT);
    p.noFill();

    p.line(head.position.x, head.position.y, antenna.tipPosition.x, antenna.tipPosition.y);

    p.noStroke();
    p.fill(creature.config.colorHue + 20, 60, 100, ANTENNA_ALPHA + 20);
    p.circle(antenna.tipPosition.x, antenna.tipPosition.y, ANTENNA_TIP_SIZE);
  }
}

function drawEmotionIndicator(p: p5, creature: Creature, emotionColor: { hue: number; sat: number; bri: number }): void {
  const head = creature.segments[0];
  const indicatorX = head.position.x + Math.cos(head.angle + Math.PI / 2) * EMOTION_INDICATOR_OFFSET;
  const indicatorY = head.position.y + Math.sin(head.angle + Math.PI / 2) * EMOTION_INDICATOR_OFFSET;

  p.noStroke();
  p.fill(emotionColor.hue, emotionColor.sat, emotionColor.bri, 60);
  p.circle(indicatorX, indicatorY, EMOTION_INDICATOR_SIZE * 2);

  p.noFill();
  p.stroke(emotionColor.hue, emotionColor.sat, emotionColor.bri, 40);
  p.strokeWeight(1);
  p.circle(indicatorX, indicatorY, EMOTION_INDICATOR_SIZE * 3);
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
  glowIntensity: number,
  emotionalState: string,
  isSelected: boolean
): void {
  if (segments.length < 2) return;

  const leftPoints: { x: number; y: number }[] = [];
  const rightPoints: { x: number; y: number }[] = [];

  const emotionGlow = emotionalState === 'excited' ? 1.5 : emotionalState === 'scared' ? 0.6 : emotionalState === 'playful' ? 1.3 : 1;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const t = i / (segments.length - 1);
    const widthFactor = Math.sin(t * Math.PI) * 0.8 + 0.2;
    const radius = baseRadius * widthFactor * (1 - t * 0.3);

    const dir = perpendicularVector(createVector(Math.cos(seg.angle), Math.sin(seg.angle)));
    const r = radius * pulse * emotionGlow;

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

  if (isSelected) {
    p.stroke(60, 80, 100, 70);
    p.strokeWeight(2.5);
  } else {
    p.noStroke();
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
  glowIntensity: number,
  creature: Creature,
  isSelected: boolean
): void {
  const { position, angle } = head;
  const headRadius = HEAD_RADIUS_BASE * pulse;

  const emotionPulse = creature.emotionalState === 'excited' ? 1.2 : creature.emotionalState === 'scared' ? 0.8 : creature.emotionalState === 'playful' ? 1.15 : 1;

  for (let i = HEAD_GLOW_LAYERS; i >= 0; i--) {
    const expand = i * HEAD_GLOW_EXPAND;
    const alpha = i === 0 ? HEAD_CORE_ALPHA : HEAD_GLOW_ALPHA * glowIntensity;
    p.noStroke();
    p.fill(hue, HEAD_SAT, HEAD_BRI, alpha);
    p.circle(position.x, position.y, (headRadius + expand) * 2 * emotionPulse);
  }

  if (isSelected) {
    p.noFill();
    p.stroke(60, 80, 100, 80);
    p.strokeWeight(2);
    p.circle(position.x, position.y, headRadius * 2.6);
  }

  p.noStroke();
  p.fill(hue, HEAD_FILL_SAT, HEAD_BRI, HEAD_FILL_ALPHA);
  p.circle(position.x, position.y, headRadius * 2);

  const eyeX = position.x + Math.cos(angle) * EYE_OFFSET;
  const eyeY = position.y + Math.sin(angle) * EYE_OFFSET;
  const perpX = -Math.sin(angle);
  const perpY = Math.cos(angle);

  const pupilOffset = creature.emotionalState === 'scared'
    ? PUPIL_OFFSET * 0.3
    : creature.emotionalState === 'excited' || creature.emotionalState === 'playful'
      ? PUPIL_OFFSET * 1.5
      : PUPIL_OFFSET;

  p.fill(0, 0, 100, 90);
  p.circle(eyeX + perpX * EYE_DISTANCE, eyeY + perpY * EYE_DISTANCE, EYE_SIZE);
  p.circle(eyeX - perpX * EYE_DISTANCE, eyeY - perpY * EYE_DISTANCE, EYE_SIZE);

  p.fill(0, 0, 0, 80);
  p.circle(eyeX + perpX * EYE_DISTANCE + Math.cos(angle) * pupilOffset, eyeY + perpY * EYE_DISTANCE + Math.sin(angle) * pupilOffset, PUPIL_SIZE);
  p.circle(eyeX - perpX * EYE_DISTANCE + Math.cos(angle) * pupilOffset, eyeY - perpY * EYE_DISTANCE + Math.sin(angle) * pupilOffset, PUPIL_SIZE);

  if (creature.state === 'sleep') {
    p.stroke(0, 0, 0, 40);
    p.strokeWeight(1.5);
    p.noFill();
    const eyelidY1 = eyeY + perpY * EYE_DISTANCE - EYE_SIZE * 0.3;
    const eyelidY2 = eyeY - perpY * EYE_DISTANCE - EYE_SIZE * 0.3;
    p.line(eyeX + perpX * EYE_DISTANCE - EYE_SIZE * 0.6, eyelidY1, eyeX + perpX * EYE_DISTANCE + EYE_SIZE * 0.6, eyelidY1);
    p.line(eyeX - perpX * EYE_DISTANCE - EYE_SIZE * 0.6, eyelidY2, eyeX - perpX * EYE_DISTANCE + EYE_SIZE * 0.6, eyelidY2);
  }
}

function drawSelectionHighlight(p: p5, creature: Creature, emotionColor: { hue: number; sat: number; bri: number }): void {
  const head = creature.segments[0];
  const tail = creature.segments[creature.segments.length - 1];

  p.noFill();
  p.stroke(emotionColor.hue, emotionColor.sat, emotionColor.bri, 35);
  p.strokeWeight(1);

  const midX = (head.position.x + tail.position.x) * 0.5;
  const midY = (head.position.y + tail.position.y) * 0.5;
  const dx = head.position.x - tail.position.x;
  const dy = head.position.y - tail.position.y;
  const length = Math.sqrt(dx * dx + dy * dy) * 0.6 + 20;

  p.push();
  p.translate(midX, midY);
  p.rotate(Math.atan2(dy, dx));
  p.rectMode(p.CENTER);
  p.rect(0, 0, length + 10, 30, 8);
  p.pop();
}

function drawSelectionRing(p: p5, creature: Creature): void {
  const head = creature.segments[0];
  const time = creature.age * 0.05;

  p.noFill();
  p.stroke(180, 60, 100, 40 + Math.sin(time) * 15);
  p.strokeWeight(1.5);

  const radius = 22 + Math.sin(time * 1.5) * 3;
  p.circle(head.position.x, head.position.y, radius * 2);

  p.stroke(180, 40, 100, 20);
  p.strokeWeight(1);
  const outerRadius = 28 + Math.sin(time * 1.2) * 4;
  p.circle(head.position.x, head.position.y, outerRadius * 2);
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
