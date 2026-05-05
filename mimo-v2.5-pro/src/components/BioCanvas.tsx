import { useEffect, useRef, useCallback, useMemo } from 'react'
import p5 from 'p5'
import type { CreatureConfig, CreatureState, Vec2, Particle } from '../engine/types'
import { BehaviorState, GaitMode } from '../engine/types'
import { createCreature, updateCreature, createDefaultConfig } from '../engine/creature'
import {
  drawCreature, drawParticles, drawBackground, drawMouseIndicator,
  drawDebugInfo, drawFoodItems, drawObstacles, drawEmotionBubbles, drawEnvStimuli,
} from '../renderer/creatureRenderer'
import {
  updateParticles, emitTrailParticles, emitBreathParticles,
  emitPettingParticles, emitFootprintParticles, emitFireflyParticles,
} from '../renderer/particles'
import { createFood, createObstacle } from '../engine/interaction'
import { distance } from '../engine/math'

interface BioCanvasProps {
  showDebug: boolean
  config?: Partial<CreatureConfig>
  onStateChange?: (state: string) => void
  onNeedsChange?: (needs: { hunger: number; energy: number; curiosity: number; social: number; mood: number }) => void
  onReset?: () => void
}

export default function BioCanvas({ showDebug, config: configOverrides, onStateChange, onNeedsChange }: BioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const p5Ref = useRef<p5 | null>(null)

  const showDebugRef = useRef(showDebug)
  showDebugRef.current = showDebug

  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange

  const onNeedsChangeRef = useRef(onNeedsChange)
  onNeedsChangeRef.current = onNeedsChange

  const stableConfig = useMemo(() => configOverrides, [JSON.stringify(configOverrides)])

  const sketchRef = useRef<{
    creature: { state: CreatureState; config: CreatureConfig }
    particles: Particle[]
    time: number
    mousePos: Vec2 | null
    mouseDown: boolean
    lastMouseDown: boolean
    mouseVel: Vec2
    lastMousePos: Vec2 | null
    clickCount: number
    lastClickTime: number
    lastState: string
    lastNeedsReport: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const sketch = (p: p5) => {
      const fullConfig = { ...createDefaultConfig(), ...stableConfig }
      const initial = createCreature(p.windowWidth / 2, p.windowHeight / 2, fullConfig)

      sketchRef.current = {
        creature: initial,
        particles: [],
        time: 0,
        mousePos: null,
        mouseDown: false,
        lastMouseDown: false,
        mouseVel: { x: 0, y: 0 },
        lastMousePos: null,
        clickCount: 0,
        lastClickTime: 0,
        lastState: initial.state.behaviorState,
        lastNeedsReport: 0,
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.frameRate(60)
      }

      p.mouseClicked = () => {
        if (!sketchRef.current) return
        const now = Date.now()
        const timeSinceLastClick = now - sketchRef.current.lastClickTime
        sketchRef.current.clickCount = timeSinceLastClick < 400 ? sketchRef.current.clickCount + 1 : 1
        sketchRef.current.lastClickTime = now

        const mousePos: Vec2 = { x: p.mouseX, y: p.mouseY }
        const headPos = sketchRef.current.creature.state.spine[0].pos
        const dist = distance(mousePos, headPos)

        if (sketchRef.current.clickCount >= 2) {
          sketchRef.current.creature.state.target = { ...mousePos }
          sketchRef.current.creature.state.emotionBubbles = [
            ...sketchRef.current.creature.state.emotionBubbles,
          ]
          sketchRef.current.clickCount = 0
        } else if (dist < 60) {
          const food = createFood({
            x: headPos.x + Math.cos(sketchRef.current.creature.state.heading) * 30,
            y: headPos.y + Math.sin(sketchRef.current.creature.state.heading) * 30,
          })
          sketchRef.current.creature.state.foodItems = [
            ...sketchRef.current.creature.state.foodItems,
            food,
          ]
        } else {
          const food = createFood(mousePos)
          sketchRef.current.creature.state.foodItems = [
            ...sketchRef.current.creature.state.foodItems,
            food,
          ]
        }
      }

      p.mousePressed = () => {
        if (!sketchRef.current) return
      }

      p.draw = () => {
        if (!sketchRef.current) return

        const s = sketchRef.current
        const dt = Math.min(p.deltaTime / 1000, 0.05)
        s.time += dt

        const mousePos: Vec2 | null = p.mouseX > 0 && p.mouseY > 0
          ? { x: p.mouseX, y: p.mouseY }
          : null

        if (mousePos && s.lastMousePos) {
          s.mouseVel = {
            x: (mousePos.x - s.lastMousePos.x) / dt,
            y: (mousePos.y - s.lastMousePos.y) / dt,
          }
        }
        s.lastMousePos = mousePos ? { ...mousePos } : null
        s.mousePos = mousePos
        s.lastMouseDown = s.mouseDown
        s.mouseDown = p.mouseIsPressed

        if (s.mouseDown && mousePos) {
          const headPos = s.creature.state.spine[0].pos
          if (distance(mousePos, headPos) < 40) {
            s.particles = emitPettingParticles(mousePos, s.particles, 40)
            if (s.creature.state.interactionCooldown <= 0) {
              s.creature.state.needs = {
                ...s.creature.state.needs,
                social: Math.min(1, s.creature.state.needs.social + 0.015),
              }
              s.creature.state.interactionCooldown = 0.15
            }
          }
        }

        s.creature.state = updateCreature(
          s.creature.state,
          s.creature.config,
          mousePos,
          p.mouseIsPressed,
          { width: p.width, height: p.height },
          dt
        )

        if (s.creature.state.behaviorState !== s.lastState) {
          s.lastState = s.creature.state.behaviorState
          onStateChangeRef.current?.(s.lastState)
        }

        s.lastNeedsReport += dt
        if (s.lastNeedsReport > 0.2) {
          s.lastNeedsReport = 0
          onNeedsChangeRef.current?.({
            hunger: s.creature.state.needs.hunger,
            energy: s.creature.state.needs.energy,
            curiosity: s.creature.state.needs.curiosity,
            social: s.creature.state.needs.social,
            mood: s.creature.state.needs.mood,
          })
        }

        s.particles = updateParticles(s.particles, dt)

        const head = s.creature.state.spine[0]
        s.particles = emitTrailParticles(head.pos, s.creature.state.velocity, s.particles, 80)
        s.particles = emitBreathParticles(
          head.pos, s.creature.state.heading,
          s.creature.state.breathPhase, s.particles, 40
        )

        if (s.creature.state.gaitMode === GaitMode.WALK && Math.random() < 0.1) {
          for (const leg of s.creature.state.legs) {
            if (leg.isPlanted && Math.random() < 0.05) {
              s.particles = emitFootprintParticles(leg.footPos, s.particles, 80)
            }
          }
        }

        if (s.creature.state.circadian.daylight < 0.5) {
          s.particles = emitFireflyParticles({ width: p.width, height: p.height }, s.particles, 15)
        }

        drawBackground(p, s.time, s.creature.state.circadian)
        drawParticles(p, s.particles)
        drawFoodItems(p, s.creature.state.foodItems)
        drawObstacles(p, s.creature.state.obstacles)
        drawEnvStimuli(p, s.creature.state.envStimuli)
        drawCreature(p, s.creature.state, s.creature.config)
        drawEmotionBubbles(p, s.creature.state.emotionBubbles)
        drawMouseIndicator(p, s.mousePos, s.mouseDown)

        if (showDebugRef.current) {
          drawDebugInfo(p, s.creature.state, p.frameRate())
        }
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
      }
    }

    p5Ref.current = new p5(sketch, containerRef.current)

    return () => {
      p5Ref.current?.remove()
      p5Ref.current = null
    }
  }, [stableConfig])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-crosshair"
      onContextMenu={(e) => e.preventDefault()}
    />
  )
}
