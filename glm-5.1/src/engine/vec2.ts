export interface Vec2 {
  x: number
  y: number
}

export function createVec2(x: number, y: number): Vec2 {
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

export function lengthSq(v: Vec2): number {
  return v.x * v.x + v.y * v.y
}

export function normalize(v: Vec2): Vec2 {
  const len = length(v)
  if (len < 1e-8) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

export function dist(a: Vec2, b: Vec2): number {
  return length(sub(a, b))
}

export function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  }
}

export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x)
}

export function fromAngle(a: number): Vec2 {
  return { x: Math.cos(a), y: Math.sin(a) }
}

export function rotate(v: Vec2, a: number): Vec2 {
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  }
}

export function perpendicular(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x }
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function constrainDist(point: Vec2, anchor: Vec2, targetDist: number): Vec2 {
  const diff = sub(point, anchor)
  const currentDist = length(diff)
  if (currentDist < 1e-8) {
    return add(anchor, { x: targetDist, y: 0 })
  }
  const ratio = targetDist / currentDist
  return add(anchor, scale(diff, ratio))
}
