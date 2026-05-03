export interface Feature {
  title: string
  desc: string
}

export interface Model {
  id: string
  name: string
  tagline: string
  desc: string
  color: string
  bgColor: string
  textColor: string
  accentColor: string
  tagColor: string
  iconFile: string
  features: Feature[]
  designNote: string
  architecture: string
  tags: string[]
  port: number
}

export const MODELS: Model[] = [
  {
    id: 'kimi-k2.6',
    name: 'Kimi-K2.6',
    tagline: '在代码中创造会呼吸的生命',
    desc: '月之暗面出品的新一代大模型',
    color: '#1a88ff',
    bgColor: 'rgba(26,136,255,0.03)',
    textColor: '#1a88ff',
    accentColor: 'rgba(26,136,255,0.12)',
    tagColor: 'rgba(26,136,255,0.15)',
    iconFile: 'kimi.png',
    features: [
      { title: '程序化脊柱运动', desc: '18~36 个节段的位置插值跟随法，无需物理模拟即可产生自然的惯性甩尾效果。' },
      { title: '简化肢体 IK', desc: '二关节解析法 IK，配合脚的「吸附/释放」逻辑，计算极快且视觉 convincing。' },
      { title: '行为状态机', desc: 'Idle、Roam、Chase、Flee 四种状态，鼠标交互强制覆盖，创造「生物在注意你」的感觉。' },
      { title: '粒子与呼吸光效', desc: '尾部拖尾粒子 + 关节闪烁粒子，配合独立脉冲相位的呼吸节奏。' }
    ],
    designNote: '视觉风格源于深海发光生物的想象——科幻霓虹感。深色背景让发光效果更突出，HSB 色彩空间让色调变化流畅自然，多层半透明光晕模拟生物发光器官。',
    architecture: '引擎与渲染严格分离。引擎层（types / math / creature / particles / world）零外部依赖，只通过纯函数接收和返回数据。渲染层（p5Renderer）将引擎数据可视化。',
    tags: ['算法创造力', '视觉表现'],
    port: 5100
  },
  {
    id: 'glm-5.1',
    name: 'GLM-5.1',
    tagline: '深渊螈 · 在代码的深渊中苏醒',
    desc: '智谱 AI 最新大语言模型',
    color: '#1041f3',
    bgColor: 'rgba(16,65,243,0.03)',
    textColor: '#1041f3',
    accentColor: 'rgba(16,65,243,0.12)',
    tagColor: 'rgba(16,65,243,0.15)',
    iconFile: 'glm.svg',
    features: [
      { title: '混合约束脊柱', desc: '4 轮距离约束迭代 + 角度约束（MAX_BEND_ANGLE = 63°），蛇的流畅 + 蜥蜴的结构。' },
      { title: '吸附-释放步态', desc: '脚着地时固定不动，身体移过阈值后抬脚迈向新位置。步态从物理约束中自然涌现。' },
      { title: '四状态有限状态机', desc: '漫游、追踪、惊吓、休息。惊吓可打断任何状态，模拟真实动物的本能反应。' },
      { title: '七层渲染管线', desc: 'BodyGlow → Body → Limbs → SpineDetails → Head → Eyes → Gills，层层叠加营造体积感。' }
    ],
    designNote: '深水蝾螈（墨西哥钝口螈）——半透明皮肤、羽毛状外鳃，暗水中闪烁的微光。身体宽度曲线尾部使用二次衰减，从粗壮到纤细的过渡更加戏剧化。',
    architecture: '引擎层（vec2 / types / spine / limb / behavior / creature）零绘图 API。快照模式 getCreatureSnapshot() 每帧创建深拷贝不可变快照，保证数据流单向性。',
    tags: ['代码架构', '系统设计'],
    port: 5200
  },
  {
    id: 'deepseek-v4',
    name: 'DeepSeek-V4',
    tagline: '翡翠蜈蚣 · 56 条腿的算法之舞',
    desc: '深度求索的开源大模型',
    color: '#4D6BFE',
    bgColor: 'rgba(77,107,254,0.03)',
    textColor: '#4D6BFE',
    accentColor: 'rgba(77,107,254,0.12)',
    tagColor: 'rgba(77,107,254,0.15)',
    iconFile: 'deepseek.svg',
    features: [
      { title: '双向距离约束迭代', desc: '28 节身体，前推后拉 4 次迭代，每次误差减半。横向正弦偏移让运动更像真实蜈蚣的 S 形前进。' },
      { title: '交替波浪步态', desc: '左右腿相位差 180°，沿身体从前到后递增相位偏移。腿从前往后依次波动，形成连绵的「腿浪」。' },
      { title: '鳞甲与发光眼睛', desc: '翡翠绿渐变 + 交叉菱形鳞甲纹理 + 三层结构眼睛（光晕/瞳孔/高光），亮度随时间脉动。' },
      { title: '触角动态弯曲', desc: '两条触角叠加多层正弦波动态计算弯曲路径，像在空气中轻轻探索。' }
    ],
    designNote: '灵感来自小时候观察蜈蚣——身体像一列微型火车，无数条腿交替迈动形成连绵不绝的「腿浪」。翡翠配色从头部鲜绿渐变到尾部青蓝，深色墨绿背景营造深夜森林地表氛围。',
    architecture: 'engine/（types / math / spine / leg / behavior / creature）纯算法层。render/ 负责 p5.js 可视化。严格分离意味着更换渲染技术只需替换 render/ 目录。',
    tags: ['功能完整', '技术创新'],
    port: 5300
  },
  {
    id: 'mimo-v2.5-pro',
    name: 'Mimo-V2.5-Pro',
    tagline: '一条不存在于自然界、却活在代码里的蜥蜴',
    desc: '小米推出的多模态大模型',
    color: '#ff6900',
    bgColor: 'rgba(255,105,0,0.03)',
    textColor: '#ff6900',
    accentColor: 'rgba(255,105,0,0.12)',
    tagColor: 'rgba(255,105,0,0.15)',
    iconFile: 'mimo.svg',
    features: [
      { title: 'Perlin 噪声漫游', desc: 'noise2D 采样保证方向连续变化，漫游路径是平滑弧线而非锯齿折线，像真实动物巡视领地。' },
      { title: '竖瞳与情绪表达', desc: '爬行动物特征的垂直瞳孔，逃离时变细变长（应激反应），好奇时头顶出现「眉弓」弧线。' },
      { title: '呼吸白雾粒子', desc: '全身宽度随 sin(breathPhase) 微量脉动，呼气时从口部喷出白雾粒子，随头部朝向飘散。' },
      { title: '六腿协作步态', desc: '6 条腿附着于脊椎第 3/7/12 节，二关节解析 IK + 足部吸附释放，相邻腿共用锚点但膝关节方向相反。' }
    ],
    designNote: '从蛇的运动开始，给蛇加上腿——脊椎提供推进力、腿提供支撑力。运动的「瑕疵」成了生命力的来源：腿偶尔抬得不够高、转弯时身体略微打滑、停下时尾巴还在惯性中摆动……这些不是 bug，是 character。',
    architecture: 'engine/ 纯数据 + 数学，renderer/ p5.js 绘图，components/ React UI 桥接。每帧从引擎复制状态（spine 数组深拷贝），数据流单向：engine → snapshot → render。',
    tags: ['多模态', '推理能力'],
    port: 5400
  }
]