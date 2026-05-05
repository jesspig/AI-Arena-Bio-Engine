import { useEffect, useRef, useState, useCallback } from 'react'
import type { Model } from '../data/models'
import { LogoMap } from '../data/logoMap'

interface Props {
  model: Model
  index: number
}

const README_CONTENT: Record<string, { title: string; sections: { title: string; content: string; isQuote?: boolean }[] }> = {
  'kimi-k2.6': {
    title: 'Bio-Engine · Kimi-K2.6 实现',
    sections: [
      { title: '核心理念', content: '在代码中创造会呼吸的生命。这是一个程序化生物动画系统，不是播放预制的动画帧，而是让生物在每一帧都根据物理规则、行为逻辑和环境交互实时决定自己该怎么动。你看到的每一次扭动、每一步行走、每一次转向，都是算法当场计算出来的。', isQuote: true },
      { title: '程序化脊柱运动', content: '生物的身体由 18~36 个节段组成，采用位置插值跟随法实现链式运动。头部根据行为目标决定移动方向，每个后续节段朝前一节段的上一帧位置平滑插值移动。这种算法的优雅之处在于——不需要物理模拟就能产生类似物理的惯性效果。节段越多，尾巴的甩动越慵懒；插值越小，跟随越迟缓。' },
      { title: '简化的肢体 IK 与步态', content: '每条腿都是一个二关节链，使用解析法 IK 直接计算膝关节位置。配合脚的"吸附/释放"逻辑：脚在地上时保持不动，身体移动超过阈值后抬脚迈向新位置。' },
      { title: '行为状态机', content: '生物有四种状态：Idle（缓慢原地摆动）、Roam（随机选择目标点移动）、Chase（被鼠标吸引）、Flee（鼠标太近快速逃跑）。状态切换不是硬切的，每个状态有持续时间。' },
      { title: '粒子与呼吸光效', content: '两种粒子增强氛围：尾部拖尾粒子从生物尾部不断释放，随时间扩散消失；关节闪烁粒子沿脊柱随机生成，向上飘动。呼吸光效用正弦波控制整体发光强度的周期性变化。' },
      { title: '为什么这样设计', content: '位置插值在计算简单和运动自然之间取得了最佳平衡。解析法 IK 一次得解，O(1) 复杂度，比 FABRIK 快得多。粒子没有碰撞、没有力场，只有位置和生命周期——这种简化让系统能轻松支持数百个粒子而不掉帧。' },
    ]
  },
  'glm-5.1': {
    title: '深渊螈 · Abyss Salamander',
    sections: [
      { title: '这是什么', content: '深渊螈是一只完全由程序生成的虚拟爬行动物。它不是手工绘制每一帧动画，而是由一套自洽的规则系统驱动——脊柱如何跟随、肢体如何迈步、情绪如何切换、身体如何发光——所有行为都从算法中自然涌现。', isQuote: true },
      { title: '设计灵感', content: '蝾螈是一个绝佳的选择——它兼具蛇的柔韧和蜥蜴的四肢。深水蝾螈（如墨西哥钝口螈）天生就带着一种神秘的美感：半透明的皮肤、羽毛状的外鳃、在暗水中闪烁的微光——这些特征天然适合用程序化方式表达。', isQuote: true },
      { title: '脊柱系统', content: '24 节脊椎先做 4 轮距离约束迭代让身体自然跟随，再做角度约束确保相邻脊椎的弯曲不超过 63°。这样身体既柔韧又不失骨骼感——蛇的流畅 + 蜥蜴的结构。' },
      { title: '肢体系统', content: '四条腿分别附着在脊柱第 3 节和第 9 节，使用余弦定理直接求解膝关节位置。当目标超出可达范围时，将脚的位置钳制到最大可达距离处——这样即使在极限位置，肢体仍然保持合理的弯曲姿态。' },
      { title: '吸附-释放步态', content: '脚着地时固定不动，身体从脚上方移过。当臀部与脚的距离超过阈值（50px），脚松开并开始移动。新脚位 = 臀部位置 + 运动方向前方的偏移，步幅与移动速度成正比。' },
      { title: '行为系统', content: '四种情绪状态：漫游（冷蓝发光）、追踪（暖色偏移）、惊吓（红色闪烁 + 粒子爆发）、休息（暗淡柔和）。惊吓状态可以在任何其他状态中打断触发，这模拟了真实动物的本能反应。' },
      { title: '架构设计', content: '引擎层不调用任何绘图 API。spine.ts 不知道什么是 ellipse()，behavior.ts 不知道什么是 fill()。getCreatureSnapshot() 在每帧创建一份深拷贝的不可变快照传给渲染层，保证了数据流的单向性。' },
    ]
  },
  'deepseek-v4': {
    title: '翡翠蜈蚣 · Jade Centipede',
    sections: [
      { title: '一眼概览', content: '一条 28 节翡翠色的蜈蚣在幽暗的深林地面上蜿蜒爬行。它的身体像波浪一样起伏前进，56 条腿交替迈步，触角轻轻摆动，头部发出微弱的荧光。', isQuote: true },
      { title: '灵感来源', content: '小时候蹲在院子里看蚂蚁搬家，看蜈蚣在石缝间穿梭——它们的身体像一列微型火车，每一节都在重复同样的动作，但整体形成一种令人着迷的波浪。', isQuote: true },
      { title: '脊柱算法', content: '28 节身体使用双向距离约束迭代算法：头部朝目标移动，从头部到尾部依次向前推，从尾部到头部依次向后拉。重复 4 次迭代，每次误差减半。身体会有一个微小的正弦偏移，让运动看起来更像真实蜈蚣的 S 形前进。' },
      { title: '腿浪步态', content: '左右腿相位差 180°（左侧迈步时右侧着地）。沿身体从前到后，每条腿有递增的相位偏移。结果：腿从前往后依次抬起和放下，形成连绵的腿浪。这正是真实蜈蚣的步态模式！' },
      { title: '视觉设计', content: '翡翠配色：头部鲜绿 → 尾部青蓝。交叉的菱形纹路像蜈蚣的甲壳节片。头部有两只三层结构的眼睛：外层扩散光晕、中层主瞳孔、内层高光点。两条触角叠加多层正弦波动态计算弯曲路径。' },
      { title: '程序化动画的诗意', content: '每条腿都不知道其他腿在做什么，整个身体也不知道自己要去哪里，但合在一起，它看起来就像是有自己的想法。——这就是程序化动画的诗意。', isQuote: true },
    ]
  },
  'mimo-v2.5-pro': {
    title: 'MiMo V2.5 Pro — 程序化脊椎爬行动物',
    sections: [
      { title: '它是什么', content: '这是一个完全由程序驱动生成的虚拟生物。没有预制动画，没有关键帧，没有 sprite sheet。它的每一次蜿蜒、每一步行走、每一个呼吸，都是数学公式实时计算的结果。', isQuote: true },
      { title: '设计灵感', content: '从一条蛇的运动开始，给蛇加上腿。脊椎提供推进力、腿提供支撑力。而更有趣的是——当你把这种机制交给代码而不是手绘师，运动的"瑕疵"反而成了生命力的来源。腿偶尔抬得不够高、转弯时身体略微打滑、停下来时尾巴还在惯性中摆动……这些不是 bug，是 character。', isQuote: true },
      { title: '脊椎系统', content: '18 个节段，每个有独立的位置、角度、宽度。宽度从头部 16px 线性收窄到尾部约 5px。距离约束迭代法（3 次迭代/帧），天然稳定，不可能出现节段飞出去的情况。' },
      { title: '肢体系统', content: '6 条腿，每条有上臂（22px）+ 前臂（24px）两个关节。二关节解析 IK 用余弦定理直接求解膝关节位置。足部吸附/释放机制：当身体移动导致脚距自然位置超过 70% 腿长时，脚抬起。' },
      { title: 'Perlin 噪声漫游', content: '漫游方向用 noise2D(time, 0) 和 noise2D(0, time) 采样，保证连续性。结果是平滑的弧线路径，像真实动物在巡视领地。随机目标点的问题：方向突变，生物会突然 180° 掉头，看起来像抽搐。' },
      { title: '写在最后', content: '程序化动画最迷人的地方在于——你定义规则，系统创造表演。你不会知道它下一秒会往哪走，不会知道它转弯时尾巴会甩出什么弧度。这些都不是你画出来的，是数学长出来的。', isQuote: true },
    ]
  }
}

interface ItemProgress {
  opacity: number
  translateY: number
  scale: number
}

export function ModelSection({ model, index }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [itemProgress, setItemProgress] = useState<ItemProgress[]>([])
  const isAltBg = index % 2 === 1

  const readme = README_CONTENT[model.id]
  if (!readme) return null

  useEffect(() => {
    const section = sectionRef.current
    const content = contentRef.current
    if (!section || !content) return

    let rafId: number

    const updateProgress = () => {
      rafId = requestAnimationFrame(() => {
        const rect = section.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const contentRect = content.getBoundingClientRect()

        const sectionTop = rect.top
        const sectionHeight = rect.height
        const viewportProgress = -sectionTop / (sectionHeight - viewportHeight)

        const clampedProgress = Math.max(0, Math.min(1, viewportProgress))

        const items = content.querySelectorAll('.readme-section')
        const newProgress: ItemProgress[] = []

        items.forEach((item, i) => {
          const itemRect = item.getBoundingClientRect()
          const itemTop = itemRect.top - viewportHeight * 0.3
          const itemProgress = Math.max(0, Math.min(1, 1 - itemTop / (viewportHeight * 0.7)))

          const easedProgress = easeOutExpo(itemProgress)

          newProgress.push({
            opacity: easedProgress,
            translateY: (1 - easedProgress) * 40,
            scale: 0.95 + easedProgress * 0.05
          })
        })

        setItemProgress(newProgress)
      })
    }

    const handleScroll = () => {
      updateProgress()
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      id={model.id}
      className={`model-section ${isAltBg ? 'alt-bg' : ''}`}
    >
      <div className="model-layout">
        <div className="model-sidebar">
          <div className="sidebar-sticky">
            <div className="sidebar-visual" style={{ background: `linear-gradient(135deg, ${model.color}15 0%, transparent 70%)` }}>
              <div className="sidebar-icon" style={{ background: `${model.color}20`, border: `1px solid ${model.color}40` }}>
                <img src={LogoMap[model.iconFile]} alt={model.name} />
              </div>
              <div className="sidebar-glow" style={{ background: `radial-gradient(circle, ${model.color}30 0%, transparent 70%)` }} />
            </div>

            <div className="sidebar-info">
              <span className="sidebar-index" style={{ color: model.color }}>0{index + 1}</span>
              <h2 className="sidebar-name" style={{ color: model.color }}>{model.name}</h2>
              <p className="sidebar-tagline">{model.tagline}</p>
            </div>

            <div className="sidebar-tags">
              {model.tags.map((tag) => (
                <span key={tag} className="sidebar-tag" style={{ background: model.tagColor, color: model.color }}>
                  {tag}
                </span>
              ))}
            </div>

            <a
              href={`/${model.id}`}
              className="sidebar-cta"
              style={{ background: model.color, boxShadow: `0 4px 24px ${model.color}30` }}
            >
              <span>在线体验</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        <div className="model-content" ref={contentRef}>
          <div className="content-header">
            <h3 className="content-title">{readme.title}</h3>
          </div>

          <div className="readme-sections">
            {readme.sections.map((sec, i) => {
              const progress = itemProgress[i] || { opacity: 0, translateY: 40, scale: 0.95 }
              return (
                <div
                  key={i}
                  className={`readme-section ${sec.isQuote ? 'is-quote' : ''}`}
                  style={{
                    opacity: progress.opacity,
                    transform: `translateY(${progress.translateY}px) scale(${progress.scale})`,
                  }}
                >
                  <h4 className="readme-section-title">
                    {sec.isQuote && <span className="quote-mark" style={{ color: model.color }}>"</span>}
                    {sec.title}
                  </h4>
                  <p className="readme-section-content">{sec.content}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
}