export interface Vec2 {
  x: number
  y: number
}

export interface SpineSegment {
  pos: Vec2
  angle: number
  width: number
}

export interface LegConfig {
  attachIndex: number
  side: -1 | 1
  upperLength: number
  lowerLength: number
  restAngle: number
}

export interface LegState {
  footPos: Vec2
  targetPos: Vec2
  isPlanted: boolean
  liftPhase: number
  kneeSide: -1 | 1
}

export enum BehaviorState {
  IDLE = 'idle',
  WANDERING = 'wandering',
  CURIOUS = 'curious',
  FLEEING = 'fleeing',
}

export interface BehaviorConfig {
  wanderSpeed: number
  curiousSpeed: number
  fleeSpeed: number
  turnRate: number
  curiosityRadius: number
  fleeRadius: number
  idleDuration: [number, number]
  wanderDuration: [number, number]
}

export interface CreatureConfig {
  segmentCount: number
  segmentLength: number
  headWidth: number
  tailTaper: number
  legs: LegConfig[]
  behavior: BehaviorConfig
  color: {
    head: string
    body: string
    tail: string
    eye: string
    glow: string
  }
}

export interface CreatureState {
  spine: SpineSegment[]
  legs: LegState[]
  behaviorState: BehaviorState
  target: Vec2 | null
  velocity: Vec2
  heading: number
  noiseOffset: number
  stateTimer: number
  breathPhase: number
}

export interface Particle {
  pos: Vec2
  vel: Vec2
  life: number
  maxLife: number
  size: number
  color: string
  alpha: number
}

export interface WorldBounds {
  width: number
  height: number
}
