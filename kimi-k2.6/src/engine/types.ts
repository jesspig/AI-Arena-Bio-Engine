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

export type CreatureState =
  | 'idle'
  | 'roam'
  | 'chase'
  | 'flee'
  | 'rest'
  | 'eat'
  | 'social'
  | 'curious'
  | 'play'
  | 'sleep'
  | 'hunt';

export type EmotionalState =
  | 'calm'
  | 'happy'
  | 'anxious'
  | 'excited'
  | 'tired'
  | 'scared'
  | 'hungry'
  | 'sleepy'
  | 'playful'
  | 'content';

export interface CreatureNeeds {
  energy: number;
  hunger: number;
  curiosity: number;
  social: number;
  comfort: number;
  fun: number;
}

export interface Memory {
  position: Vector2;
  type: 'food' | 'danger' | 'friend' | 'interesting' | 'play';
  timestamp: number;
  intensity: number;
}

export interface Perception {
  mouseVisible: boolean;
  mouseDistance: number;
  mouseAngle: number;
  nearbyCreatures: { creature: Creature; distance: number; angle: number }[];
  nearbyFood: { position: Vector2; distance: number; type: FoodType; preference: number }[];
  threats: { position: Vector2; distance: number; intensity: number }[];
}

export interface Antenna {
  angle: number;
  length: number;
  tipPosition: Vector2;
  swayPhase: number;
}

export interface Footprint {
  position: Vector2;
  angle: number;
  life: number;
  maxLife: number;
  side: number;
}

export type FoodType = 'favorite' | 'normal' | 'disliked';

export interface FoodSource {
  position: Vector2;
  amount: number;
  maxAmount: number;
  radius: number;
  hue: number;
  pulsePhase: number;
  type: FoodType;
  nutritionValue: number;
}

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
  perceptionRadius: number;
  memoryCapacity: number;
  metabolismRate: number;
  socialRadius: number;
  curiosityRadius: number;
  favoriteFoodHue: number;
  dislikedFoodHue: number;
}

export interface BehaviorIntent {
  targetPosition: Vector2 | null;
  desiredSpeed: number;
  desiredHeading: number;
  urgency: number;
}

export interface Creature {
  id: string;
  segments: Segment[];
  legs: Leg[];
  state: CreatureState;
  emotionalState: EmotionalState;
  targetPosition: Vector2 | null;
  velocity: Vector2;
  heading: number;
  stateTimer: number;
  noiseOffset: number;
  config: CreatureConfig;
  pulsePhase: number;
  breathPhase: number;
  needs: CreatureNeeds;
  memories: Memory[];
  perception: Perception;
  antennas: Antenna[];
  lastStateChange: number;
  stateHistory: CreatureState[];
  personality: {
    boldness: number;
    curiosity: number;
    sociability: number;
    laziness: number;
    playfulness: number;
    pickiness: number;
  };
  footprints: Footprint[];
  age: number;
  growthStage: number;
  intent: BehaviorIntent;
  stateCooldown: number;
  lastEatTime: number;
  lastRestTime: number;
  lastPlayTime: number;
  isSatiated: boolean;
  satiationTimer: number;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export interface Obstacle {
  position: Vector2;
  radius: number;
  type: 'rock' | 'plant' | 'water';
}

export interface WorldState {
  creatures: Creature[];
  particles: Particle[];
  foodSources: FoodSource[];
  footprints: Footprint[];
  obstacles: Obstacle[];
  width: number;
  height: number;
  mousePosition: Vector2;
  mouseActive: boolean;
  time: number;
  weather: {
    windDirection: number;
    windStrength: number;
    lightLevel: number;
  };
  selectedCreatureIds: Set<string>;
}
