import { Vector2 } from './types';

export function createVector(x: number, y: number): Vector2 {
  return { x, y };
}

export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function multiplyVector(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

export function vectorMagnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function normalizeVector(v: Vector2): Vector2 {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
}

export function distanceBetween(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerpScalar(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVectors(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: lerpScalar(a.x, b.x, t),
    y: lerpScalar(a.y, b.y, t),
  };
}

export function angleBetweenVectors(from: Vector2, to: Vector2): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function perpendicularVector(v: Vector2): Vector2 {
  return { x: -v.y, y: v.x };
}

export function rotateVector(v: Vector2, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

export function copyVector(v: Vector2): Vector2 {
  return { x: v.x, y: v.y };
}
