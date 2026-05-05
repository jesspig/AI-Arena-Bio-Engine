import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { WorldState, CreatureState, InteractionMode, FoodType } from '../engine/types';
import { createCreature, updateCreature } from '../engine/creature';
import { createWorld, updateWorld, checkFoodConsumption, addFood, addObstacle, removeObstacles } from '../engine/world';
import { drawCreature, drawTargetIndicator, drawBehaviorLabel } from '../render/creatureRender';
import { drawEnvironment } from '../render/environmentRender';
import { drawParticles } from '../render/particleRender';
import { distance } from '../engine/math';

interface BioCanvasProps {
  worldRef: React.MutableRefObject<WorldState | null>;
  onCreatureInit: (creature: CreatureState) => void;
  onInteractionChange: (mode: InteractionMode) => void;
}

const SEGMENT_COUNT = 40;
const MOVE_SPEED = 200;
const DAY_SPEED = 1;

export default function BioCanvas({
  worldRef,
  onCreatureInit,
  onInteractionChange,
}: BioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let world: WorldState;

    const sketch = (p: p5) => {
      p.setup = () => {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        p.createCanvas(w, h).parent(container);
        p.frameRate(60);

        world = createWorld(w, h);
        const creature = createCreature(
          {
            segmentCount: SEGMENT_COUNT,
            moveSpeed: MOVE_SPEED,
          },
          { x: w / 2, y: h / 2 },
        );
        world.creature = creature;
        worldRef.current = world;
        onCreatureInit(creature);
      };

      p.draw = () => {
        if (!world || !world.creature) return;
        const dt = Math.min(p.deltaTime / 1000, 0.05);
        world.width = p.width;
        world.height = p.height;
        world.dayLength = Math.floor(3600 / DAY_SPEED);

        world.creature.config.segmentCount = SEGMENT_COUNT;
        world.creature.config.moveSpeed = MOVE_SPEED;

        world.mousePos = { x: p.mouseX, y: p.mouseY };
        world.mousePrevPos = { x: p.pmouseX, y: p.pmouseY };

        const dtMouse = distance(world.mousePos, world.mousePrevPos);
        if (p.mouseIsPressed && dtMouse > 2) {
          world.mouseDragPos = { x: p.mouseX, y: p.mouseY };
          world.mouseActive = true;
          world.interactionMode = 'TOY';
        } else if (!p.mouseIsPressed) {
          world.mouseDragPos = null;
          const head = world.creature.headPos;
          const distToHead = distance(head, world.mousePos);

          if (distToHead < 40 && p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            world.mouseActive = true;
            world.interactionMode = 'PETTING';
          } else if (
            p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height
          ) {
            world.mouseActive = false;
            world.interactionMode = 'NONE';
          } else if (world.interactionMode === 'PETTING') {
            world.mouseActive = true;
            world.interactionMode = 'NONE';
          }
        }

        onInteractionChange(world.interactionMode);

        updateWorld(world);
        updateCreature(world, dt);
        checkFoodConsumption(world);

        drawEnvironment(p, world);
        drawCreature(p, world.creature, world);
        drawParticles(p, world);

        const timeSec = world.time * 0.016;
        drawTargetIndicator(p, world.creature.target, timeSec);
        drawBehaviorLabel(p, world.creature, timeSec);

        p.push();
        p.fill(120, 220, 160, 140);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        const moodEmoji = getMoodEmoji(world.creature.needs.mood);
        const foodCount = world.foodItems.filter((f) => !f.eaten).length;
        p.text(
          `${moodEmoji} 食物:${foodCount} 饥饿:${Math.round(world.creature.needs.hunger)} 精力:${Math.round(world.creature.needs.energy)}`,
          12,
          12,
        );
        p.pop();

        worldRef.current = world;
      };

      p.mousePressed = (e?: MouseEvent) => {
        if (!world || !world.creature) return;
        world.mousePressed = true;

        if (e && e.button === 2) {
          const head = world.creature.headPos;
          const d = distance(head, world.mousePos);
          if (d < 80) {
            world.creature.needs.fear = Math.min(100, world.creature.needs.fear + 40);
            world.creature.fleeingFrom = { x: world.mousePos.x, y: world.mousePos.y };
            world.creature.needs.comfort = Math.max(0, world.creature.needs.comfort - 20);
            world.interactionMode = 'POKING';
          }
          return;
        }

        if (p.mouseX < world.width - 260) {
          const shiftKey = e?.shiftKey || false;
          const ctrlKey = e?.ctrlKey || false;

          let foodType: FoodType = 'NEUTRAL';
          if (shiftKey) foodType = 'FAVORITE';
          if (ctrlKey) foodType = 'AVOID';

          addFood(world, p.mouseX, p.mouseY, foodType);
        }
      };

      p.mouseReleased = () => {
        if (!world) return;
        world.mousePressed = false;
        world.mouseDragPos = null;
        world.interactionMode = 'NONE';
        onInteractionChange('NONE');
      };

      p.doubleClicked = () => {
        if (!world) return true;
        if (p.mouseX < world.width - 260) {
          addObstacle(world, p.mouseX, p.mouseY);
        }
        return false;
      };

      p.keyPressed = () => {
        if (!world) return;
        switch (p.key.toLowerCase()) {
          case 'd':
            world.timeOfDay = (world.timeOfDay + 0.3) % 1;
            world.isNight = world.timeOfDay > 0.6 || world.timeOfDay < 0.2;
            break;
          case 'f':
            for (let i = 0; i < 5; i++) {
              const types: FoodType[] = ['FAVORITE', 'NEUTRAL', 'AVOID'];
              addFood(world, p.mouseX + (Math.random() - 0.5) * 100, p.mouseY + (Math.random() - 0.5) * 100, types[Math.floor(Math.random() * 3)]);
            }
            break;
          case 'r':
            removeObstacles(world);
            world.positiveMemories = [];
            break;
          case 'h':
            world.showHUD = !world.showHUD;
            break;
          case 'c':
            world.showControls = !world.showControls;
            break;
          case 'b':
            if (world.creature && world.creature.subState !== 'BURROWING') {
              world.creature.subState = 'RESTING';
              world.creature.mainState = 'AWAKE';
              world.creature.stateTimer = 0;
              world.creature.needs.comfort = Math.min(100, world.creature.needs.comfort + 5);
            }
            break;
          case 'p':
            world.toyPos = { x: p.mouseX, y: p.mouseY };
            world.interactionMode = 'TOY';
            break;
          case 'l':
            world.showScent = !world.showScent;
            break;
        }
      };

      p.windowResized = () => {
        if (container) {
          p.resizeCanvas(container.clientWidth, container.clientHeight);
          if (world) {
            world.width = container.clientWidth;
            world.height = container.clientHeight;
          }
        }
      };
    };

    const p5Instance = new p5(sketch, container);
    return () => {
      p5Instance.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function getMoodEmoji(mood: string): string {
  switch (mood) {
    case 'EXCITED':
      return '✨';
    case 'CURIOUS':
      return '🔍';
    case 'NERVOUS':
      return '😰';
    case 'SCARED':
      return '💨';
    case 'CONTENT':
      return '😊';
    default:
      return '';
  }
}
