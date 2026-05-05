import type { Sketch } from '@p5-wrapper/react'
import type { Vec2 } from './engine/vec2'
import { createCreature, updateCreature, getCreatureSnapshot } from './engine/creature'
import type { Creature } from './engine/creature'
import { createEnvironment, updateEnvironment, addFoodAt } from './engine/environment'
import type { EnvironmentState } from './engine/environment'
import { ParticleSystem, spawnAmbientParticles, spawnBubbles, spawnEatParticles, spawnStartleParticles, spawnGlowParticles, spawnSleepParticles, spawnHappyParticles } from './renderer/particles'
import {
  renderCreature,
  renderEnvironment,
  renderFoods,
  renderParticles,
  renderBehaviorIndicator,
  renderBackground,
} from './renderer/creatureRenderer'

export const sketchState = {
  behaviorState: 'wander' as string,
  emotion: { fear: 0, curiosity: 0, energy: 1, satisfaction: 0.5, hunger: 0.1, happiness: 0.5 } as { fear: number; curiosity: number; energy: number; satisfaction: number; hunger: number; happiness: number },
  intent: '探索周围环境' as string,
}

const DOUBLE_CLICK_THRESHOLD = 300
const LONG_PRESS_THRESHOLD = 500

const sketch: Sketch = (p) => {
  let creature: Creature
  let environment: EnvironmentState
  let particleSystem: ParticleSystem
  let mousePos: Vec2 | null = null
  let lastClickTime = 0
  let mouseDownTime = 0
  let isMouseDown = false

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    p.colorMode(p.HSB, 360, 100, 100, 255)
    creature = createCreature(p.width / 2, p.height / 2)
    environment = createEnvironment(p.width, p.height)
    particleSystem = new ParticleSystem()
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }

  p.draw = () => {
    renderBackground(p, p.width, p.height, p.frameCount)

    const isLongPress = isMouseDown && p.millis() - mouseDownTime > LONG_PRESS_THRESHOLD

    if (isLongPress && p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height) {
      mousePos = { x: p.mouseX, y: p.mouseY }
    } else if (p.mouseIsPressed) {
      mousePos = { x: p.mouseX, y: p.mouseY }
    } else {
      mousePos = (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height)
        ? { x: p.mouseX, y: p.mouseY }
        : null
    }

    updateEnvironment(environment, p.width, p.height, p.frameCount)

    const { eatenFoods } = updateCreature(creature, mousePos, p.width, p.height, environment)

    for (const eaten of eatenFoods) {
      spawnEatParticles(particleSystem, eaten.pos, eaten.category)
    }

    const snapshot = getCreatureSnapshot(creature, environment)

    sketchState.behaviorState = snapshot.behavior.state
    sketchState.emotion = { ...snapshot.behavior.emotion }
    sketchState.intent = snapshot.behavior.intent

    spawnAmbientParticles(particleSystem, p.width, p.height, p.frameCount)

    if (p.frameCount % 4 === 0 && snapshot.behavior.state !== 'sleep') {
      const tailSeg = snapshot.spine[snapshot.spine.length - 1]
      particleSystem.spawn(tailSeg.pos, 170 + Math.random() * 40, 1)
    }

    if (snapshot.behavior.state === 'startle' && p.frameCount % 2 === 0) {
      spawnStartleParticles(particleSystem, snapshot.headPos)
    }

    if (p.frameCount % 8 === 0 && snapshot.behavior.state !== 'sleep') {
      const midSeg = snapshot.spine[Math.floor(snapshot.spine.length / 2)]
      spawnGlowParticles(particleSystem, midSeg.pos, 170)
    }

    if (p.frameCount % 35 === 0 && snapshot.behavior.state !== 'sleep') {
      const gillSeg = snapshot.spine[3]
      spawnBubbles(particleSystem, gillSeg.pos, 1)
    }

    if (snapshot.behavior.state === 'sleep' && p.frameCount % 10 === 0) {
      spawnSleepParticles(particleSystem, snapshot.headPos)
    }

    if (snapshot.behavior.emotion.happiness > 0.7 && p.frameCount % 8 === 0) {
      spawnHappyParticles(particleSystem, snapshot.headPos)
    }

    if (isLongPress && p.frameCount % 5 === 0) {
      spawnGlowParticles(particleSystem, { x: p.mouseX, y: p.mouseY }, 50)
    }

    particleSystem.update()

    renderEnvironment(p, snapshot)
    renderParticles(p, particleSystem.particles)
    renderFoods(p, snapshot)
    renderCreature(p, snapshot)
    renderBehaviorIndicator(p, snapshot)
  }

  p.mousePressed = () => {
    const now = p.millis()
    isMouseDown = true
    mouseDownTime = now

    if (now - lastClickTime < DOUBLE_CLICK_THRESHOLD) {
      if (creature) {
        creature.behavior.state = 'startle'
        creature.behavior.stateTimer = 60
        creature.behavior.speed = 3.5
        creature.behavior.emotion.fear = Math.min(1, creature.behavior.emotion.fear + 0.4)
        creature.behavior.intent = '被突然惊吓，赶紧逃跑'
        const fleeDir = { x: creature.headPos.x - p.mouseX, y: creature.headPos.y - p.mouseY }
        const d = Math.sqrt(fleeDir.x * fleeDir.x + fleeDir.y * fleeDir.y)
        if (d > 0) {
          creature.behavior.target = {
            x: creature.headPos.x + (fleeDir.x / d) * 200,
            y: creature.headPos.y + (fleeDir.y / d) * 200,
          }
        }
        spawnStartleParticles(particleSystem, { x: p.mouseX, y: p.mouseY })
      }
      lastClickTime = 0
    } else {
      lastClickTime = now
    }
  }

  p.mouseReleased = () => {
    const pressDuration = p.millis() - mouseDownTime
    isMouseDown = false

    if (pressDuration < LONG_PRESS_THRESHOLD && pressDuration > 50) {
      addFoodAt(environment, { x: p.mouseX, y: p.mouseY }, p.frameCount)
      spawnBubbles(particleSystem, { x: p.mouseX, y: p.mouseY }, 3)
    }
  }

  p.touchStarted = () => {
    p.mousePressed()
    return false
  }

  p.touchEnded = () => {
    p.mouseReleased()
    return false
  }
}

export default sketch
