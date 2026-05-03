import type { Model } from '../data/models'
import { LogoMap } from '../data/logoMap'

interface Props {
  models: Model[]
}

export function QuickEntry({ models }: Props) {
  return (
    <section className="quick-entry">
      <div className="quick-entry-inner">
        <div className="quick-title">
          <h1>Bio-Engine</h1>
          <p>AI 模型能力对比测试</p>
        </div>

        <div className="quick-cards">
          {models.map((model) => (
            <a key={model.id} href={`/${model.id}`} className="quick-card" style={{ '--card-color': model.color } as React.CSSProperties}>
              <div className="quick-card-icon">
                <img src={LogoMap[model.iconFile]} alt={model.name} />
              </div>
              <div className="quick-card-content">
                <span className="quick-card-name">{model.name}</span>
                <span className="quick-card-tagline">{model.tagline.split(' ')[0]}</span>
              </div>
              <svg className="quick-card-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}