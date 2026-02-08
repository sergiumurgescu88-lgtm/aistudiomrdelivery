import React, { useMemo } from 'react';

const DetailedSnowflake = ({ size, opacity, blur, rotation }: { size: string, opacity: number, blur: string, rotation: number }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: size,
        height: size,
        opacity,
        filter: `blur(${blur}) drop-shadow(0 0 2px rgba(255,255,255,0.5))`,
        color: 'white',
        transform: `rotate(${rotation}deg)`
      }}
    >
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <g key={angle} transform={`rotate(${angle} 50 50)`}>
            <line x1="50" y1="50" x2="50" y2="10" />
            <line x1="50" y1="25" x2="40" y2="15" />
            <line x1="50" y1="25" x2="60" y2="15" />
          </g>
        ))}
        <circle cx="50" cy="50" r="3" fill="currentColor" />
      </g>
    </svg>
  );
};

const Snowfall: React.FC = () => {
  const flakes = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * -20}s`,
      animationDuration: `${12 + Math.random() * 20}s`,
      size: `${12 + Math.random() * 18}px`,
      opacity: 0.3 + Math.random() * 0.7,
      blur: Math.random() > 0.85 ? '1px' : '0px',
      rotation: Math.random() * 360,
      rotationSpeed: 8 + Math.random() * 15,
      sway: 20 + Math.random() * 40,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-fall"
          style={{
            left: flake.left,
            animationDelay: flake.animationDelay,
            animationDuration: flake.animationDuration,
            top: '-50px',
            '--sway-amount': `${flake.sway}px`
          } as React.CSSProperties}
        >
          <div
            className="animate-spin-slow"
            style={{
              animationDuration: `${flake.rotationSpeed}s`,
            }}
          >
            <DetailedSnowflake size={flake.size} opacity={flake.opacity} blur={flake.blur} rotation={flake.rotation} />
          </div>
        </div>
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(50vh) translateX(var(--sway-amount)); }
          100% { transform: translateY(110vh) translateX(0); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-fall {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .animate-spin-slow {
          animation-name: spinSlow;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  );
};

export default Snowfall;
