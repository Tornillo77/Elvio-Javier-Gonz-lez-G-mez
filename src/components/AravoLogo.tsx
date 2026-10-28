import React from 'react';

interface AravoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  showSubtitle?: boolean;
  customText?: string;
  subtitleText?: string;
  variant?: 'default' | 'minimal' | 'badge' | 'glow';
  className?: string;
}

export const AravoIcon: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  glow?: boolean;
}> = ({ size = 'md', className = '', glow = true }) => {
  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 52,
    xl: 72,
    '2xl': 96,
  };

  const dim = typeof size === 'number' ? size : pixelSizes[size] || 40;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: dim, height: dim }}
    >
      {/* Dynamic ambient backdrop glow */}
      {glow && (
        <div
          className="absolute inset-0 bg-sky-500/25 rounded-xl blur-lg pointer-events-none transition-opacity duration-300"
          style={{ transform: 'scale(1.15)' }}
        />
      )}

      <svg
        viewBox="0 0 100 100"
        width={dim}
        height={dim}
        className="w-full h-full relative z-10 drop-shadow-md overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main Left Wing Gradient: Cyan to Vivid Sky Blue */}
          <linearGradient
            id="aravo-grad-left-comp"
            x1="15%"
            y1="90%"
            x2="85%"
            y2="10%"
          >
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="40%" stopColor="#0ea5e9" />
            <stop offset="80%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#a5f3fc" />
          </linearGradient>

          {/* Right Wing Gradient: Electric Blue to Cobalt */}
          <linearGradient
            id="aravo-grad-right-comp"
            x1="20%"
            y1="90%"
            x2="80%"
            y2="10%"
          >
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Ascending Arrow Gradient: High contrast upward thrust */}
          <linearGradient
            id="aravo-grad-arrow-comp"
            x1="25%"
            y1="85%"
            x2="75%"
            y2="15%"
          >
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="80%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Filter for crisp metallic glow */}
          <filter id="aravo-inner-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
            <feFlood floodColor="#38bdf8" floodOpacity="0.4" />
            <feComposite in2="shadowDiff" operator="in" />
            <feComposite in2="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* Ambient subtle glow ring */}
        <circle cx="50" cy="50" r="42" fill="#0369a1" fillOpacity="0.12" />

        {/* --- LEFT BEAM / LEG OF THE 'A' --- */}
        <path
          d="M 23 83
             L 15 83
             C 13.5 83 12.6 81.6 13.4 80.3
             L 45.2 21.2
             C 46.4 19 49.6 19 50.8 21.2
             L 57.5 34
             L 48 51.5
             L 37 71
             C 36 73 34 83 23 83 Z"
          fill="url(#aravo-grad-left-comp)"
          filter="url(#aravo-inner-glow)"
        />

        {/* --- RIGHT BASE & LEG OF THE 'A' --- */}
        <path
          d="M 59 83
             L 85 83
             C 86.8 83 87.8 81.4 86.8 79.8
             L 69.5 49
             L 59.5 49
             L 50.5 65
             C 47.5 70.5 50 83 59 83 Z"
          fill="url(#aravo-grad-right-comp)"
        />

        {/* --- ASCENDING ARROW (Upward trajectory) --- */}
        <path
          d="M 40 54
             L 53.5 28.5
             C 54.8 26 58.2 26 59.5 28.5
             L 73 53
             L 64 53
             L 56.5 39
             L 49 53
             Z"
          fill="url(#aravo-grad-arrow-comp)"
        />

        {/* Apex spark / prism jewel */}
        <polygon
          points="52,20 57,29 47,29"
          fill="#f0f9ff"
          opacity="0.95"
        />

        {/* Bottom subtle ground anchor line */}
        <path
          d="M 18 87.5 L 82 87.5"
          stroke="#0284c7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    </div>
  );
};

export const AravoLogo: React.FC<AravoLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  customText,
  subtitleText = 'Gestión Integral & Tiempos de Máquina',
  variant = 'default',
  className = '',
}) => {
  const brandName = customText || 'ARAVO';

  // Text sizing classes aligned with icon scale
  const textSizes = {
    xs: { text: 'text-sm', sub: 'text-[9px]' },
    sm: { text: 'text-base', sub: 'text-[10px]' },
    md: { text: 'text-xl', sub: 'text-[11px]' },
    lg: { text: 'text-2xl', sub: 'text-xs' },
    xl: { text: 'text-3xl', sub: 'text-sm' },
    '2xl': { text: 'text-4xl', sub: 'text-base' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Aravo Emblem Icon */}
      {variant === 'badge' ? (
        <div className="p-2 rounded-2xl bg-slate-900/90 border border-sky-500/30 shadow-xl shadow-sky-500/10">
          <AravoIcon size={size} glow={true} />
        </div>
      ) : (
        <AravoIcon size={size} glow={variant !== 'minimal'} />
      )}

      {/* Brand Wordmark & Typography */}
      {showText && (
        <div className="flex flex-col justify-center leading-tight">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-[0.16em] uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-sky-200 ${textSizes.text}`}
              style={{
                fontFamily:
                  'Plus Jakarta Sans, system-ui, -apple-system, sans-serif',
                textShadow: '0 2px 10px rgba(14, 165, 233, 0.25)',
              }}
            >
              {brandName}
            </span>
          </div>

          {showSubtitle && (
            <span
              className={`text-slate-400 font-medium tracking-normal mt-0.5 ${textSizes.sub}`}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
