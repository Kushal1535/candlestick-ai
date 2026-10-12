import React from 'react';

interface CandlestickLogoProps {
  className?: string;
  size?: number;
}

export const CandlestickLogo: React.FC<CandlestickLogoProps> = ({
  className = 'w-10 h-10',
  size = 40,
}) => {
  return (
    <div
      className={`relative rounded-xl bg-gradient-to-br from-[#0c1a38] via-[#09142b] to-[#040a17] border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-950/50 overflow-hidden group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Background neural glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_70%)]" />

      {/* SVG Canvas for Candlesticks integrated with Neural Network */}
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1.5 relative z-10"
      >
        <defs>
          <linearGradient id="bullCandleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="cyanCandleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Neural Network Circuit Connectors / Synaptic Traces */}
        <path
          d="M 12 18 L 24 10 L 36 14"
          stroke="#06b6d4"
          strokeWidth="1.2"
          strokeOpacity="0.7"
          strokeDasharray="2 1"
        />
        <path
          d="M 12 28 L 24 22 L 36 32"
          stroke="#10b981"
          strokeWidth="1.2"
          strokeOpacity="0.7"
          strokeDasharray="2 1"
        />
        <path
          d="M 12 18 L 24 38 L 36 14"
          stroke="#00f0ff"
          strokeWidth="0.8"
          strokeOpacity="0.4"
        />

        {/* CANDLESTICK 1 (Left - Green Bullish) */}
        {/* Wick */}
        <line x1="12" y1="8" x2="12" y2="38" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
        {/* Body */}
        <rect
          x="9"
          y="15"
          width="6"
          height="14"
          rx="1"
          fill="url(#bullCandleGrad)"
          stroke="#10b981"
          strokeWidth="0.8"
        />

        {/* CANDLESTICK 2 (Middle - Electric Cyan Core) */}
        {/* Wick */}
        <line x1="24" y1="6" x2="24" y2="42" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
        {/* Body */}
        <rect
          x="20.5"
          y="12"
          width="7"
          height="18"
          rx="1"
          fill="url(#cyanCandleGrad)"
          stroke="#22d3ee"
          strokeWidth="1"
        />

        {/* CANDLESTICK 3 (Right - Emerald Green Accent) */}
        {/* Wick */}
        <line x1="36" y1="10" x2="36" y2="36" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" />
        {/* Body */}
        <rect
          x="33"
          y="18"
          width="6"
          height="12"
          rx="1"
          fill="url(#bullCandleGrad)"
          stroke="#34d399"
          strokeWidth="0.8"
        />

        {/* Neural Network Nodes (Glowing Synaptic Junctions) */}
        {/* Node 1 */}
        <circle cx="12" cy="18" r="2.2" fill="#10b981" filter="url(#neonGlow)" />
        <circle cx="12" cy="18" r="1" fill="#ffffff" />

        {/* Node 2 - Apex */}
        <circle cx="24" cy="10" r="2.5" fill="#00f0ff" filter="url(#neonGlow)" />
        <circle cx="24" cy="10" r="1.2" fill="#ffffff" />

        {/* Node 3 */}
        <circle cx="36" cy="14" r="2.2" fill="#06b6d4" filter="url(#neonGlow)" />
        <circle cx="36" cy="14" r="1" fill="#ffffff" />

        {/* Node 4 - Center Synapse */}
        <circle cx="24" cy="22" r="2.5" fill="#10b981" filter="url(#neonGlow)" />
        <circle cx="24" cy="22" r="1" fill="#ffffff" />

        {/* Node 5 - Lower Node */}
        <circle cx="24" cy="38" r="2" fill="#00f0ff" filter="url(#neonGlow)" />
        <circle cx="24" cy="38" r="0.9" fill="#ffffff" />

        <circle cx="36" cy="32" r="2" fill="#34d399" filter="url(#neonGlow)" />
        <circle cx="12" cy="28" r="2" fill="#06b6d4" filter="url(#neonGlow)" />
      </svg>
    </div>
  );
};
