import type { Needs, Personality } from './types'
import { clamp, exponentialDecay } from './math'

const DECAY_RATES = {
  hunger: 0.015,
  energy: 0.01,
  curiosity: 0.008,
  social: 0.012,
}

const RECOVERY_RATES = {
  hunger: 0.3,
  energy: 0.08,
  curiosity: 0.05,
  social: 0.1,
}

export function createDefaultNeeds(): Needs {
  return {
    hunger: 0.3,
    energy: 0.8,
    curiosity: 0.5,
    social: 0.5,
    mood: 0.7,
  }
}

export function updateNeeds(
  needs: Needs,
  personality: Personality,
  isMoving: boolean,
  isNearUser: boolean,
  isEating: boolean,
  isSleeping: boolean,
  daylight: number,
  dt: number
): Needs {
  const newNeeds = { ...needs }

  newNeeds.hunger += DECAY_RATES.hunger * dt * (isMoving ? 1.3 : 1.0)
  newNeeds.hunger = clamp(newNeeds.hunger, 0, 1)

  if (isSleeping) {
    newNeeds.energy += RECOVERY_RATES.energy * dt * 2
  } else if (!isMoving) {
    newNeeds.energy += RECOVERY_RATES.energy * dt * 0.5
  } else {
    newNeeds.energy -= DECAY_RATES.energy * dt * (isMoving ? 1.5 : 0.5)
  }
  newNeeds.energy = clamp(newNeeds.energy, 0, 1)

  if (isEating) {
    newNeeds.hunger -= RECOVERY_RATES.hunger * dt
    newNeeds.hunger = clamp(newNeeds.hunger, 0, 1)
  }

  newNeeds.curiosity += DECAY_RATES.curiosity * dt * personality.curiosity
  newNeeds.curiosity = clamp(newNeeds.curiosity, 0, 1)

  if (isNearUser) {
    newNeeds.social += RECOVERY_RATES.social * dt * personality.sociability
  } else {
    newNeeds.social -= DECAY_RATES.social * dt
  }
  newNeeds.social = clamp(newNeeds.social, 0, 1)

  const hungerPenalty = newNeeds.hunger > 0.7 ? (newNeeds.hunger - 0.7) * 2 : 0
  const energyPenalty = newNeeds.energy < 0.3 ? (0.3 - newNeeds.energy) * 1.5 : 0
  const socialPenalty = newNeeds.social < 0.2 ? (0.2 - newNeeds.social) * 1.0 : 0
  const curiosityBonus = newNeeds.curiosity > 0.6 ? (newNeeds.curiosity - 0.6) * 0.5 : 0

  const targetMood = clamp(0.7 - hungerPenalty - energyPenalty - socialPenalty + curiosityBonus, 0, 1)
  newNeeds.mood = exponentialDecay(newNeeds.mood, targetMood, 2, dt)

  return newNeeds
}

export function getMostUrgentNeed(needs: Needs): { name: string; value: number } {
  const entries: Array<{ name: string; value: number }> = [
    { name: 'hunger', value: needs.hunger },
    { name: 'energy', value: 1 - needs.energy },
    { name: 'curiosity', value: needs.curiosity },
    { name: 'social', value: 1 - needs.social },
  ]
  entries.sort((a, b) => b.value - a.value)
  return entries[0]
}

export function getMoodEmoji(mood: number): string {
  if (mood > 0.8) return 'happy'
  if (mood > 0.5) return 'neutral'
  if (mood > 0.3) return 'sad'
  return 'distressed'
}
