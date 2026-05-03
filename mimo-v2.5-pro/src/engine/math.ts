import type { Vec2 } from './types'

export function vec2(x: number, y: number): Vec2 {
  return { x, y }
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s }
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

export function distance(a: Vec2, b: Vec2): number {
  return length(sub(a, b))
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v)
  if (len < 0.0001) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

export function angleOf(from: Vec2, to: Vec2): number {
  return Math.atan2(to.y - from.y, to.x - from.x)
}

export function fromAngle(angle: number, len: number = 1): Vec2 {
  return { x: Math.cos(angle) * len, y: Math.sin(angle) * len }
}

export function rotate(v: Vec2, angle: number): Vec2 {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }
}

export function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x }
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomVec2InCircle(cx: number, cy: number, radius: number): Vec2 {
  const angle = Math.random() * Math.PI * 2
  const r = Math.sqrt(Math.random()) * radius
  return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
}

// Simple 2D noise (value noise with smooth interpolation)
const NOISE_PERM_SIZE = 256
const noisePerm: number[] = []

function initNoise(seed: number = 42): void {
  const p: number[] = []
  for (let i = 0; i < NOISE_PERM_SIZE; i++) p[i] = i
  // Fisher-Yates shuffle with seed
  let s = seed
  for (let i = NOISE_PERM_SIZE - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647
    const j = s % (i + 1)
    ;[p[i], p[j]] = [p[j], p[i]]
  }
  for (let i = 0; i < NOISE_PERM_SIZE * 2; i++) {
    noisePerm[i] = p[i % NOISE_PERM_SIZE]
  }
}

initNoise()

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3
  const u = h < 2 ? x : y
  const v = h < 2 ? y : x
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

export function noise2D(x: number, y: number): number {
  const xi = Math.floor(x) & (NOISE_PERM_SIZE - 1)
  const yi = Math.floor(y) & (NOISE_PERM_SIZE - 1)
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const u = fade(xf)
  const v = fade(yf)

  const aa = noisePerm[noisePerm[xi] + yi]
  const ab = noisePerm[noisePerm[xi] + yi + 1]
  const ba = noisePerm[noisePerm[xi + 1] + yi]
  const bb = noisePerm[noisePerm[xi + 1] + yi + 1]

  const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u)
  const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u)

  return (lerp(x1, x2, v) + 1) / 2
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}
