import type P5 from 'p5';
import { WorldState, FoodItem, Obstacle, FoodType, ScentMarker } from '../engine/types';

function getFoodColors(type: FoodType): {
  fill: [number, number, number];
  glow: [number, number, number];
  stroke: [number, number, number];
} {
  switch (type) {
    case 'FAVORITE':
      return { fill: [80, 255, 160], glow: [60, 255, 180], stroke: [180, 255, 220] };
    case 'AVOID':
      return { fill: [160, 80, 60], glow: [120, 60, 40], stroke: [200, 100, 80] };
    case 'NEUTRAL':
    default:
      return { fill: [100, 240, 160], glow: [80, 200, 140], stroke: [60, 200, 120] };
  }
}

export function drawEnvironment(p: P5, world: WorldState): void {
  drawBackground(p, world);
  drawScentMarkers(p, world);
  drawFoodItems(p, world);
  drawObstacles(p, world);
  drawPositiveMemories(p, world);
  drawToy(p, world);
}

function drawBackground(p: P5, world: WorldState): void {
  const nightAlpha = world.isNight ? 1 : 0;
  const dayColor = p.color(18, 25, 20);
  const nightColor = p.color(5, 8, 15);

  const bg = p.lerpColor(dayColor, nightColor, nightAlpha);
  p.background(bg);

  p.push();
  p.noStroke();

  const groundPatchCount = 30;
  for (let i = 0; i < groundPatchCount; i++) {
    const px = (i * 173 + 59) % world.width;
    const py = (i * 281 + 127) % world.height;
    const size = 20 + (i * 73) % 40;

    const patchAlpha = world.isNight ? 8 : 15;
    p.fill(30, 40, 25, patchAlpha);
    p.ellipse(px, py, size, size * 0.6);
  }

  for (let i = 0; i < 15; i++) {
    const px = (i * 313 + 89) % world.width;
    const py = (i * 197 + 233) % world.height;

    p.fill(40, 55, 30, world.isNight ? 4 : 10);
    p.ellipse(px, py, 3 + Math.sin(i * 1.3) * 2, 3 + Math.sin(i * 1.3) * 2);
  }

  if (world.isNight) {
    for (let i = 0; i < 25; i++) {
      const sx = (i * 421 + 37) % world.width;
      const sy = (i * 359 + 73) % world.height;
      const twinkle = Math.sin(world.time * 0.05 + i * 1.7) * 0.5 + 0.5;

      p.fill(255, 255, 200, twinkle * 60);
      p.ellipse(sx, sy, 1.5, 1.5);
    }
  }

  p.pop();
}

function drawFoodItems(p: P5, world: WorldState): void {
  p.push();

  for (const food of world.foodItems) {
    if (food.eaten) continue;

    const colors = getFoodColors(food.foodType);
    const ageRatio = food.age / food.maxAge;
    const alpha = 1 - ageRatio * 0.5;
    const pulse = 1 + Math.sin(world.time * 0.08 + food.position.x * 0.02) * 0.15;

    const glowMult = food.foodType === 'FAVORITE' ? 1.8 : food.foodType === 'NEUTRAL' ? 1.0 : 0.5;
    const glowAlpha = alpha * (world.isNight ? 0.6 : 0.3) * glowMult;
    p.noStroke();

    for (let g = 3; g >= 1; g--) {
      p.fill(colors.glow[0], colors.glow[1], colors.glow[2], glowAlpha * 20 * (4 - g));
      p.ellipse(food.position.x, food.position.y, 12 * pulse + g * 4, 12 * pulse + g * 4);
    }

    if (food.foodType === 'FAVORITE') {
      const sparkleAlpha = Math.sin(world.time * 0.12 + food.position.x) * 0.5 + 0.5;
      p.fill(255, 255, 200, sparkleAlpha * 60);
      p.ellipse(food.position.x - 3, food.position.y - 3, 2, 2);
    }

    p.fill(colors.fill[0], colors.fill[1], colors.fill[2], alpha * 200);
    p.stroke(colors.stroke[0], colors.stroke[1], colors.stroke[2], alpha * 180);
    p.strokeWeight(1.5);
    p.ellipse(food.position.x, food.position.y, 8 * pulse, 8 * pulse);

    if (food.foodType === 'AVOID') {
      p.noStroke();
      p.fill(50, 30, 20, alpha * 100);
      p.ellipse(food.position.x, food.position.y + 2, 6, 3);
    }

    const shimmer = Math.sin(world.time * 0.15 + food.position.x * 0.05) * 0.4 + 0.6;
    p.noStroke();
    p.fill(255, 255, 255, alpha * 80 * shimmer);
    p.ellipse(
      food.position.x - 1.5,
      food.position.y - 2,
      3 * pulse,
      2 * pulse,
    );
  }

  p.pop();
}

function drawObstacles(p: P5, world: WorldState): void {
  p.push();

  for (const obs of world.obstacles) {
    p.noStroke();

    p.fill(70, 65, 55, 200);
    p.ellipse(obs.position.x, obs.position.y + 3, obs.radius * 2, obs.radius * 1.5);

    p.fill(90, 80, 65, 220);
    p.ellipse(obs.position.x, obs.position.y, obs.radius * 2, obs.radius * 1.6);

    p.fill(150, 140, 120, 60);
    p.ellipse(
      obs.position.x - obs.radius * 0.2,
      obs.position.y - obs.radius * 0.3,
      obs.radius * 0.8,
      obs.radius * 0.4,
    );
  }

  p.pop();
}

function drawPositiveMemories(p: P5, world: WorldState): void {
  p.push();
  p.noStroke();

  for (const mem of world.positiveMemories) {
    const alpha = 10;
    p.fill(100, 240, 160, alpha);
    p.ellipse(mem.x, mem.y, 8, 8);
  }

  p.pop();
}

function drawScentMarkers(p: P5, world: WorldState): void {
  if (!world.showScent) return;
  p.push();
  p.noStroke();

  for (const marker of world.scentMarkers) {
    const alpha = (marker.strength / 100) * 15;
    p.fill(100, 200, 140, alpha);
    p.ellipse(marker.position.x, marker.position.y, 10, 10);
  }

  for (let c = 0; c < world.gridCols; c++) {
    for (let r = 0; r < world.gridRows; r++) {
      const visits = world.visitedGrid[c]?.[r] ?? 0;
      if (visits <= 0) continue;
      const alpha = Math.min(visits * 2, 25);
      p.fill(60, 180, 220, alpha);
      p.rect(c * world.cellSize, r * world.cellSize, world.cellSize, world.cellSize);
    }
  }

  p.pop();
}

function drawToy(p: P5, world: WorldState): void {
  if (!world.toyPos) return;
  p.push();
  p.noStroke();

  for (let g = 2; g >= 0; g--) {
    const pulse = Math.sin(world.time * 0.08) * 0.3 + 0.7;
    p.fill(255, 200, 80, 20 * pulse * (3 - g));
    p.ellipse(world.toyPos.x, world.toyPos.y, 14 + g * 6, 14 + g * 6);
  }

  p.fill(255, 220, 100, 200);
  p.ellipse(world.toyPos.x, world.toyPos.y, 10, 10);

  p.fill(255, 255, 220, 180);
  p.ellipse(world.toyPos.x - 2, world.toyPos.y - 2, 4, 3);

  p.pop();
}
