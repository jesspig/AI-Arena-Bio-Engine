import type { Sketch } from '@p5-wrapper/react'
import type p5 from 'p5'
import type { Vec2 } from './engine/vec2'
import { createCreature, updateCreature, getCreatureSnapshot } from './engine/creature'
import type { Creature } from './engine/creature'
import { ParticleSystem, spawnAmbientParticles } from './renderer/particles'
import {
  renderCreature,
  renderParticles,
  renderBehaviorIndicator,
  renderBackground,
} from './renderer/creatureRenderer'

const sketch: Sketch = (p) => {
  let creature: Creature
  let particleSystem: ParticleSystem
  let mousePos: Vec2 | null = null

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight)
    p.colorMode(p.HSB, 360, 100, 100, 255)
    creature = createCreature(p.width / 2, p.height / 2)
    particleSystem = new ParticleSystem()
  }

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight)
  }

  p.draw = () => {
    renderBackground(p, p.width, p.height, p.frameCount)

    mousePos = p.mouseIsPressed
      ? { x: p.mouseX, y: p.mouseY }
      : (p.mouseX > 0 && p.mouseX < p.width && p.mouseY > 0 && p.mouseY < p.height)
        ? { x: p.mouseX, y: p.mouseY }
        : null

    updateCreature(creature, mousePos, p.width, p.height)

    const snapshot = getCreatureSnapshot(creature)

    spawnAmbientParticles(particleSystem, p.width, p.height, p.frameCount)

    if (p.frameCount % 3 === 0) {
      const tailSeg = snapshot.spine[snapshot.spine.length - 1]
      particleSystem.spawn(tailSeg.pos, 170 + Math.random() * 40, 1)
    }

    if (snapshot.behavior.state === 'startle' && p.frameCount % 2 === 0) {
      particleSystem.spawn(snapshot.headPos, 20, 2)
    }

    particleSystem.update()

    renderParticles(p, particleSystem.particles)
    renderCreature(p, snapshot)
    renderBehaviorIndicator(p, snapshot)

    renderHUD(p, snapshot)
  }

  p.mousePressed = () => {
    if (creature) {
      creature.behavior.state = 'hunt'
      creature.behavior.stateTimer = 300
      creature.behavior.speed = 2.5
      creature.behavior.target = { x: p.mouseX, y: p.mouseY }
    }
  }
}

function renderHUD(p: p5, snapshot: ReturnType<typeof getCreatureSnapshot>): void {
  const stateLabels: Record<string, string> = {
    wander: '漫游',
    hunt: '追踪',
    startle: '惊吓',
    rest: '休息',
  }

  p.push()
  p.colorMode(p.HSB, 360, 100, 100, 255)
  p.noStroke()
  p.fill(0, 0, 60, 150)
  p.textSize(13)
  p.textFont('monospace')
  p.textAlign(p.LEFT, p.TOP)
  p.text(`深渊螈  ·  ${stateLabels[snapshot.behavior.state] ?? snapshot.behavior.state}`, 16, 16)
  p.textSize(11)
  p.fill(0, 0, 40, 120)
  p.text('点击画布吸引生物  |  靠近触发惊吓', 16, 36)
  p.pop()
}

export default sketch
