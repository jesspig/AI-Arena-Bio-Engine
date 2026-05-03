import type { Model } from '../data/models'

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
                {model.id === 'kimi-k2.6' && (
                  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d={model.iconPath} fill="#027AFF" />
                    <path d={model.iconPath2} fill={model.color} />
                  </svg>
                )}
                {model.id === 'glm-5.1' && (
                  <svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
                    <path d={model.iconPath!} fill={model.color} opacity="0.12" />
                    <path d={model.iconPath2!} fill={model.color} />
                    <path d={model.iconPath3!} fill={model.color} />
                  </svg>
                )}
                {model.id === 'deepseek-v4' && (
                  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                    <path d={model.iconPath} fill={model.color} />
                    <path d={model.iconPath2!} fill={model.color} />
                  </svg>
                )}
                {model.id === 'mimo-v2.5-pro' && (
                  <svg viewBox="0 0 808 808" xmlns="http://www.w3.org/2000/svg">
                    <path d={model.iconPath} fill={model.color} opacity="0.12" />
                    <path d={model.iconPath2!} fill={model.color} />
                  </svg>
                )}
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
