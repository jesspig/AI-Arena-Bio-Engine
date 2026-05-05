import { CreatureNeeds, CreatureConfig, MoodType } from './types';
import { clamp, toward, lerpScalar } from './math';

const MOOD_LINGER_FRAMES = 120;

export function createNeeds(): CreatureNeeds {
  return {
    hunger: 0,
    energy: 80,
    curiosity: 40,
    fear: 0,
    comfort: 60,
    mood: 'CONTENT',
  };
}

export function updateNeeds(
  needs: CreatureNeeds,
  config: CreatureConfig,
  dt: number,
  isMoving: boolean,
  isResting: boolean,
  isExploring: boolean,
  isInteracting: boolean,
  nearFood: boolean,
  petsPerSecond: number,
  threatLevel: number,
  moodTimer: number
): { needs: CreatureNeeds; moodTimer: number } {
  const ndt = dt * 60;

  let hunger = needs.hunger + config.hungerDecayRate * ndt * 0.016;

  const energyCost = isMoving ? config.energyMoveDecay : -config.energyRestoreRate * (isResting ? 1 : 0);
  let energy = needs.energy - energyCost * ndt * 0.016;

  let curiosity = needs.curiosity;
  if (isExploring) {
    curiosity += config.curiosityExploreGain * ndt * 0.016;
  } else {
    curiosity -= config.curiosityDecayRate * ndt * 0.016;
  }
  if (nearFood) {
    curiosity += 1.5 * ndt * 0.016;
  }

  let fear = needs.fear + threatLevel * 2.0 * ndt * 0.016;
  fear -= config.fearDecayRate * ndt * 0.016;

  let comfort = needs.comfort;
  comfort += petsPerSecond * config.comfortPetGain * ndt * 0.016;
  comfort -= config.comfortDecayRate * ndt * 0.016;
  if (isInteracting && comfort < 50) {
    comfort += 1.0 * ndt * 0.016;
  }

  hunger = clamp(hunger, 0, 100);
  energy = clamp(energy, 0, 100);
  curiosity = clamp(curiosity, 0, 100);
  fear = clamp(fear, 0, 100);
  comfort = clamp(comfort, 0, 100);

  let newMood = needs.mood;
  let newMoodTimer = moodTimer;
  const targetMood = determineMood(fear, curiosity, comfort, hunger);

  if (targetMood !== needs.mood) {
    newMoodTimer -= ndt * 0.016;
    if (newMoodTimer <= 0) {
      newMood = targetMood;
      newMoodTimer = MOOD_LINGER_FRAMES;
    }
  } else {
    newMoodTimer = MOOD_LINGER_FRAMES;
  }

  return {
    needs: { hunger, energy, curiosity, fear, comfort, mood: newMood },
    moodTimer: newMoodTimer,
  };
}

function determineMood(fear: number, curiosity: number, comfort: number, hunger: number): MoodType {
  if (fear > 70) return 'SCARED';
  if (fear > 40) return 'NERVOUS';
  if (comfort < 20) return 'NERVOUS';
  if (curiosity > 70 && comfort > 50) return 'EXCITED';
  if (curiosity > 60 || hunger > 60) return 'CURIOUS';
  if (comfort > 70 && hunger < 20 && fear < 10) return 'CONTENT';
  return 'CONTENT';
}

export function getMoodColor(mood: MoodType): [number, number, number] {
  switch (mood) {
    case 'SCARED': return [80, 140, 120];
    case 'NERVOUS': return [100, 170, 130];
    case 'EXCITED': return [50, 220, 130];
    case 'CURIOUS': return [60, 210, 140];
    case 'CONTENT': return [70, 190, 120];
  }
}

export function getMoodGlowIntensity(mood: MoodType): number {
  switch (mood) {
    case 'SCARED': return 0.15;
    case 'NERVOUS': return 0.3;
    case 'EXCITED': return 1.0;
    case 'CURIOUS': return 0.8;
    case 'CONTENT': return 0.5;
  }
}

export function getBehaviorLabelCn(mainState: string, subState: string): string {
  const labels: Record<string, string> = {
    WANDERING: '漫游',
    FORAGING: '觅食',
    HUNTING: '捕猎',
    EXPLORING: '探索',
    FLEEING: '逃离',
    RESTING: '休憩',
    INTERACTING: '互动',
    EATING: '进食',
    PLAY: '玩耍',
    BURROWING: '钻地',
  };
  if (mainState === 'SLEEPING') return '睡眠';
  return labels[subState] || subState;
}
