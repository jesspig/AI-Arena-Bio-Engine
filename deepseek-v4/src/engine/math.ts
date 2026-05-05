import { Vec2 } from './types';
import { createNoise2D } from 'simplex-noise';

const noise2D = createNoise2D();

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v);
  if (len < 0.0001) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b));
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function lerpScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function rotate(v: Vec2, a: number): Vec2 {
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

export function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function randomInCircle(radius: number): Vec2 {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * radius;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}

export function createVec2(x: number, y: number): Vec2 {
  return { x, y };
}

export function limit(v: Vec2, max: number): Vec2 {
  const len = length(v);
  if (len > max && len > 0.0001) {
    return scale(v, max / len);
  }
  return { x: v.x, y: v.y };
}

export function setMag(v: Vec2, mag: number): Vec2 {
  const len = length(v);
  if (len < 0.0001) return { x: mag, y: 0 };
  return scale(v, mag / len);
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

export function lerpColor(
  a: [number, number, number, number],
  b: [number, number, number, number],
  t: number
): [number, number, number, number] {
  const ct = clamp(t, 0, 1);
  return [
    a[0] + (b[0] - a[0]) * ct,
    a[1] + (b[1] - a[1]) * ct,
    a[2] + (b[2] - a[2]) * ct,
    a[3] + (b[3] - a[3]) * ct,
  ];
}

export function perlin2D(x: number, y: number): number {
  return noise2D(x, y);
}

export function perlinAngle(x: number, y: number, scale: number): number {
  return perlin2D(x * scale, y * scale) * Math.PI * 2;
}

export function perlinOffset(x: number, y: number, scale: number, amplitude: number): number {
  return perlin2D(x * scale, y * scale) * amplitude;
}

export function levyFlightStep(minStep: number, maxStep: number, levyIndex: number = 1.5): number {
  const u = Math.random();
  const step = minStep * Math.pow(u, -1 / levyIndex);
  return clamp(step, minStep, maxStep);
}

export function toward(a: number, b: number, maxDelta: number): number {
  const diff = b - a;
  if (Math.abs(diff) <= maxDelta) return b;
  return a + Math.sign(diff) * maxDelta;
}

export function smoothDamp(
  current: number,
  target: number,
  currentVelocity: { value: number },
  smoothTime: number,
  dt: number,
  maxSpeed: number = Infinity,
): number {
  const omega = 2 / Math.max(smoothTime, 0.0001);
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (currentVelocity.value + omega * change) * dt;
  currentVelocity.value = (currentVelocity.value - omega * temp) * exp;

  let output = target + (change + temp) * exp;

  if (maxSpeed !== Infinity) {
    const maxChange = maxSpeed * smoothTime;
    output = clamp(output, target - maxChange, target + maxChange);
  }

  return output;
}

export function smoothDampVec2(
  current: Vec2,
  target: Vec2,
  currentVelocity: Vec2,
  smoothTime: number,
  dt: number,
  maxSpeed: number = Infinity,
): Vec2 {
  return {
    x: smoothDamp(current.x, target.x, { value: currentVelocity.x }, smoothTime, dt, maxSpeed),
    y: smoothDamp(current.y, target.y, { value: currentVelocity.y }, smoothTime, dt, maxSpeed),
  };
}

export function withinBounds(pos: Vec2, minX: number, minY: number, maxX: number, maxY: number, margin: number = 0): boolean {
  return (
    pos.x >= minX + margin &&
    pos.x <= maxX - margin &&
    pos.y >= minY + margin &&
    pos.y <= maxY - margin
  );
}
