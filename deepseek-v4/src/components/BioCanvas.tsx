import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { CreatureState, Vec2 } from '../engine/types';
import { createCreature, updateCreature } from '../engine/creature';
import { drawCreature, drawTargetIndicator, drawBackground, drawBehaviorLabel } from '../render/creatureRender';

interface BioCanvasProps {
  creatureRef: React.MutableRefObject<CreatureState | null>;
  segmentCount: number;
  moveSpeed: number;
}

export default function BioCanvas({ creatureRef, segmentCount, moveSpeed }: BioCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseTargetRef = useRef<Vec2 | null>(null);
  const timeRef = useRef(0);
  const paramsRef = useRef({ segmentCount, moveSpeed });
  paramsRef.current = { segmentCount, moveSpeed };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let creature: CreatureState | null = null;

    const sketch = (p: p5) => {
      p.setup = () => {
        const w = container.clientWidth || 800;
        const h = container.clientHeight || 600;
        p.createCanvas(w, h);

        creature = createCreature(
          {
            segmentCount: paramsRef.current.segmentCount,
            moveSpeed: paramsRef.current.moveSpeed,
          },
          { x: w / 2, y: h / 2 },
        );
        creatureRef.current = creature;
        timeRef.current = 0;
      };

      p.draw = () => {
        const dt = Math.min(p.deltaTime / 1000, 0.05);
        timeRef.current += dt;

        if (!creature) return;

        creature.config.segmentCount = paramsRef.current.segmentCount;
        creature.config.moveSpeed = paramsRef.current.moveSpeed;

        drawBackground(p, timeRef.current);

        updateCreature(
          creature,
          mouseTargetRef.current,
          dt,
          { width: p.width, height: p.height },
          timeRef.current,
        );

        drawCreature(p, creature, timeRef.current);
        drawTargetIndicator(p, mouseTargetRef.current);
        drawBehaviorLabel(p, creature);

        p.fill(100, 180, 140, 100);
        p.noStroke();
        p.textSize(10);
        p.textAlign(p.LEFT, p.TOP);
        p.text(
          `节段: ${creature.config.segmentCount} | 速度: ${Math.round(creature.config.moveSpeed)} | 状态: ${creature.behavior}`,
          12,
          12,
        );

        creatureRef.current = creature;
      };

      p.mousePressed = () => {
        if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
          mouseTargetRef.current = { x: p.mouseX, y: p.mouseY };
        }
      };

      p.mouseReleased = () => {
        mouseTargetRef.current = null;
      };

      p.windowResized = () => {
        if (container) {
          p.resizeCanvas(container.clientWidth, container.clientHeight);
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
    />
  );
}
