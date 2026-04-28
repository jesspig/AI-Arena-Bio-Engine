export interface Vector2 {
  x: number;
  y: number;
}

export interface Segment {
  position: Vector2;
  previousPosition: Vector2;
  angle: number;
}

export interface Leg {
  rootIndex: number;
  side: number;
  segments: Vector2[];
  footPosition: Vector2;
  targetPosition: Vector2;
  isGrounded: boolean;
  stepProgress: number;
}

export type CreatureState = 'idle' | 'roam' | 'chase' | 'flee';

export interface CreatureConfig {
  segmentCount: number;
  segmentLength: number;
  segmentRadius: number;
  followFactor: number;
  legCount: number;
  legLength: number;
  colorHue: number;
  glowIntensity: number;
  speed: number;
  turnSpeed: number;
}

export interface Creature {
  id: string;
  segments: Segment[];
  legs: Leg[];
  state: CreatureState;
  targetPosition: Vector2 | null;
  velocity: Vector2;
  heading: number;
  stateTimer: number;
  noiseOffset: number;
  config: CreatureConfig;
  pulsePhase: number;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export interface WorldState {
  creatures: Creature[];
  particles: Particle[];
  width: number;
  height: number;
  mousePosition: Vector2;
  mouseActive: boolean;
  time: number;
}
