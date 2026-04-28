export interface Vec2 {
  x: number;
  y: number;
}

export interface LegJoint {
  shoulder: Vec2;
  knee: Vec2;
  foot: Vec2;
}

export interface LegState {
  joints: LegJoint;
  planted: boolean;
  plantPos: Vec2;
  swingPhase: number;
  side: 'left' | 'right';
}

export interface BodySegment {
  position: Vec2;
  prevPosition: Vec2;
  width: number;
  legLeft: LegState;
  legRight: LegState;
}

export type BehaviorType = 'WANDER' | 'CHASE' | 'REST' | 'EXPLORE';

export interface CreatureConfig {
  segmentCount: number;
  segmentLength: number;
  legSegment1: number;
  legSegment2: number;
  bodyWidthBase: number;
  bodyWidthTip: number;
  moveSpeed: number;
  turnSpeed: number;
  spineIterations: number;
}

export const DEFAULT_CONFIG: CreatureConfig = {
  segmentCount: 28,
  segmentLength: 14,
  legSegment1: 18,
  legSegment2: 22,
  bodyWidthBase: 16,
  bodyWidthTip: 6,
  moveSpeed: 90,
  turnSpeed: 4,
  spineIterations: 4,
};

export interface CreatureState {
  segments: BodySegment[];
  headPos: Vec2;
  headAngle: number;
  target: Vec2 | null;
  behavior: BehaviorType;
  behaviorTimer: number;
  config: CreatureConfig;
  wanderTarget: Vec2;
  restTimer: number;
}

export interface WorldState {
  creatures: CreatureState[];
  mouseTarget: Vec2 | null;
  bounds: { width: number; height: number };
}
