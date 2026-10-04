/** Diagrama animado del flujo de fondos: Inversor ⇄ Escrow PDA ⇄ PyME. */
const NODES = [
  { x: 110, title: "Investor", sub: "funds with USDC" },
  { x: 500, title: "Escrow PDA", sub: "Aura Fint program", core: true },
  { x: 890, title: "SME", sub: "invoice → RWA" },
];
const NODE_W = 180;
const NODE_Y = 84;
const NODE_H = 120;

export function FlowDiagram() {
  const fund = "M200 116 L800 116";
  const repay = "M800 172 L200 172";
  const rwa = "M440 84 Q 300 4 160 84";

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-4 md:p-8">
      <svg viewBox="0 0 1000 240" className="w-full" role="img" aria-label="Aura Fint fund flow">
        <defs>
          <linearGradient id="flow-node" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <filter id="flow-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path d={fund} className="flow-line" stroke="#34d399" strokeOpacity="0.45" />
        <path d={repay} className="flow-line flow-line-rev" stroke="#a78bfa" strokeOpacity="0.45" />
        <path d={rwa} className="flow-line" stroke="#fbbf24" strokeOpacity="0.4" />

        {[0, 0.95, 1.9].map((b) => (
          <circle key={`f${b}`} r="7" fill="#34d399" filter="url(#flow-glow)">
            <animateMotion dur="2.85s" begin={`${b}s`} repeatCount="indefinite" path={fund} />
          </circle>
        ))}
        {[0.4, 1.35, 2.3].map((b) => (
          <circle key={`r${b}`} r="7" fill="#a78bfa" filter="url(#flow-glow)">
            <animateMotion dur="2.85s" begin={`${b}s`} repeatCount="indefinite" path={repay} />
          </circle>
        ))}
        <rect x="-7" y="-7" width="14" height="14" rx="3" fill="#fbbf24" filter="url(#flow-glow)">
          <animateMotion dur="3.2s" repeatCount="indefinite" path={rwa} rotate="auto" />
        </rect>

        <text x="305" y="104" textAnchor="middle" className="flow-label" fill="#6ee7b7">USDC →</text>
        <text x="695" y="104" textAnchor="middle" className="flow-label" fill="#6ee7b7">instant liquidity →</text>
        <text x="305" y="196" textAnchor="middle" className="flow-label" fill="#c4b5fd">← principal + yield</text>
        <text x="695" y="196" textAnchor="middle" className="flow-label" fill="#c4b5fd">← repayment</text>
        <text x="300" y="26" textAnchor="middle" className="flow-label" fill="#fcd34d">1 RWA · collateral</text>

        {NODES.map((n) => (
          <g key={n.title}>
            {n.core && (
              <rect
                x={n.x - NODE_W / 2}
                y={NODE_Y}
                width={NODE_W}
                height={NODE_H}
                rx="22"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                className="flow-pulse"
              />
            )}
            <rect
              x={n.x - NODE_W / 2}
              y={NODE_Y}
              width={NODE_W}
              height={NODE_H}
              rx="22"
              fill="#0b1120"
              stroke="url(#flow-node)"
              strokeWidth={n.core ? 2.5 : 1.5}
              strokeOpacity={n.core ? 1 : 0.6}
            />
            <text x={n.x} y="140" textAnchor="middle" className="flow-title" fill="#fff">
              {n.title}
            </text>
            <text x={n.x} y="166" textAnchor="middle" className="flow-sub" fill="#94a3b8">
              {n.sub}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
