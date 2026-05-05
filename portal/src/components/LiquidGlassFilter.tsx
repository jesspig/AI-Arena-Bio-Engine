export function LiquidGlassFilter() {
  return (
    <svg className="liquid-glass-filters" width="0" height="0" style={{ display: 'none' }}>
      <defs>
        <filter id="liquid-refraction" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence 
            type="fractalNoise" 
            baseFrequency="0.015 0.02" 
            numOctaves="3" 
            seed="42" 
            result="noise"
          />
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale="3" 
            xChannelSelector="R" 
            yChannelSelector="G"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="0.5" result="blurred" />
          <feMerge>
            <feMergeNode in="blurred" />
          </feMerge>
        </filter>

        <filter id="liquid-dispersion" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence 
            type="turbulence" 
            baseFrequency="0.02" 
            numOctaves="2" 
            seed="17" 
            result="noise"
          />
          <feDisplacementMap 
            in="SourceGraphic" 
            in2="noise" 
            scale="5" 
            xChannelSelector="R" 
            yChannelSelector="G"
            result="displaced"
          />
          <feColorMatrix 
            type="saturate" 
            values="1.2" 
            result="saturated"
          />
        </filter>

        <filter id="liquid-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="fresnel-highlight" x="-50%" y="-50%" width="200%" height="200%">
          <feSpecularLighting 
            surfaceScale="2" 
            specularConstant="0.5" 
            specularExponent="20"
            lighting-color="white"
            result="specular"
          >
            <feDistantLight azimuth="45" elevation="60" />
          </feSpecularLighting>
          <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" />
        </filter>

        <radialGradient id="glass-shine" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.3" />
          <stop offset="50%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="glass-reflection" cx="20%" cy="20%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        <linearGradient id="edge-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
        </linearGradient>

        <filter id="chromatic-aberration" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset dx="1" dy="0" result="red" />
          <feOffset dx="-1" dy="0" result="blue" />
          <feMerge>
            <feMergeNode in="red" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="blue" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}