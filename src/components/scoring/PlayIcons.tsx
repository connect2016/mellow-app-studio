import React from 'react';
import { ConceptIcon } from '@/components/icons/ConceptIcon';

interface PlayIconProps {
  type: string;
  size?: number;
  selected?: boolean;
  sealColor?: 'green' | 'blue';
}

const GRAPHITE = '#4B4B4B';
const IVY_GREEN = 'hsl(160, 52%, 15%)';
const CUBS_BLUE = 'hsl(222, 82%, 29%)';

/** Hand-drawn pencil-mark icons inside wax-seal circles */
export function PlayIcon({ type, size = 48, selected = false, sealColor = 'green' }: PlayIconProps) {
  const seal = sealColor === 'blue' ? CUBS_BLUE : IVY_GREEN;
  const r = size / 2;
  const strokeW = size * 0.045;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Wax seal circle - slightly irregular */}
      <circle
        cx={r} cy={r} r={r - 2}
        stroke={selected ? seal : `${GRAPHITE}44`}
        strokeWidth={selected ? 2.5 : 1.5}
        fill={selected ? `${seal}15` : 'transparent'}
        strokeDasharray={selected ? 'none' : '3 1'}
        style={{ filter: selected ? `drop-shadow(0 0 3px ${seal}40)` : 'none' }}
      />
      {/* Inner mark */}
      {renderMark(type, size, GRAPHITE, selected ? seal : GRAPHITE, strokeW)}
    </svg>
  );
}

function renderMark(type: string, size: number, graphite: string, activeColor: string, sw: number) {
  const cx = size / 2;
  const cy = size / 2;
  const fs = size * 0.36;
  const fsSmall = size * 0.28;

  const textStyle: React.CSSProperties = {
    fontFamily: "'Graduate', serif",
    fontWeight: 900,
    fontSize: fs,
    fill: activeColor,
    dominantBaseline: 'central',
    textAnchor: 'middle',
    // Slight slant for athletic feel
    transform: `rotate(-3, ${cx}, ${cy})`,
  };

  const textStyleSmall: React.CSSProperties = {
    ...textStyle,
    fontSize: fsSmall,
  };

  switch (type) {
    case '1b':
      return <text x={cx} y={cy} style={textStyle}>1B</text>;
    case '2b':
      return <text x={cx} y={cy} style={textStyle}>2B</text>;
    case '3b':
      return <text x={cx} y={cy} style={textStyle}>3B</text>;
    case 'hr':
      return <text x={cx} y={cy} style={{ ...textStyle, fontSize: fs * 1.05, fill: '#C62828' }}>HR</text>;
    case 'k':
      return <text x={cx} y={cy} style={{ ...textStyle, fontSize: fs * 1.1 }}>K</text>;
    case 'k_looking':
      // Backwards K
      return (
        <text x={cx} y={cy} style={{ ...textStyle, fontSize: fs * 1.1, transform: `scale(-1, 1) translate(${-size}, 0)` }}>
          K
        </text>
      );
    case 'bb':
      return <text x={cx} y={cy} style={{ ...textStyleSmall, fontFamily: "'Legend M54', 'Bebas Neue', sans-serif", letterSpacing: '1px' }}>BB</text>;
    case 'out':
      // Diagonal slash through a circle
      return (
        <g>
          <circle cx={cx} cy={cy} r={size * 0.2} stroke={activeColor} strokeWidth={sw * 1.2} fill="none" />
          <line
            x1={cx - size * 0.18} y1={cy + size * 0.18}
            x2={cx + size * 0.18} y2={cy - size * 0.18}
            stroke={activeColor} strokeWidth={sw * 1.5} strokeLinecap="round"
          />
        </g>
      );
    case 'dp':
      // Linked D and P
      return (
        <g>
          <text x={cx - size * 0.07} y={cy} style={{ ...textStyleSmall, textAnchor: 'end' }}>D</text>
          <text x={cx + size * 0.07} y={cy} style={{ ...textStyleSmall, textAnchor: 'start' }}>P</text>
          {/* Link arc between D and P */}
          <path
            d={`M ${cx - size * 0.02} ${cy + size * 0.12} Q ${cx} ${cy + size * 0.18} ${cx + size * 0.02} ${cy + size * 0.12}`}
            stroke={activeColor} strokeWidth={sw} fill="none" strokeLinecap="round"
          />
        </g>
      );
    default:
      return <text x={cx} y={cy} style={textStyleSmall}></text>;
  }
}

/** Mini baseball diamond SVG with lit-up bases */
export function MiniDiamond({ playType, size = 80 }: { playType: string; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const d = size * 0.32; // distance from center to base

  // Which bases light up based on play
  const basesLit = getBasesForPlay(playType);

  const bases = [
    { key: 'first', x: cx + d, y: cy, lit: basesLit.includes('first') },
    { key: 'second', x: cx, y: cy - d, lit: basesLit.includes('second') },
    { key: 'third', x: cx - d, y: cy, lit: basesLit.includes('third') },
    { key: 'home', x: cx, y: cy + d, lit: basesLit.includes('home') },
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* Diamond lines */}
      <path
        d={`M ${cx} ${cy - d} L ${cx + d} ${cy} L ${cx} ${cy + d} L ${cx - d} ${cy} Z`}
        stroke={`${IVY_GREEN}40`}
        strokeWidth={1.5}
        fill="none"
      />
      {/* Infield grass hint */}
      <path
        d={`M ${cx} ${cy - d * 0.5} L ${cx + d * 0.5} ${cy} L ${cx} ${cy + d * 0.5} L ${cx - d * 0.5} ${cy} Z`}
        fill={`${IVY_GREEN}08`}
      />
      {/* Bases */}
      {bases.map(b => (
        <g key={b.key}>
          <rect
            x={b.x - 5} y={b.y - 5} width={10} height={10}
            rx={b.key === 'home' ? 0 : 1.5}
            transform={`rotate(45, ${b.x}, ${b.y})`}
            fill={b.lit ? CUBS_BLUE : '#E8E4D8'}
            stroke={b.lit ? CUBS_BLUE : `${GRAPHITE}30`}
            strokeWidth={1}
            style={{
              filter: b.lit ? `drop-shadow(0 0 4px ${CUBS_BLUE}60)` : 'none',
              transition: 'all 0.3s ease',
            }}
          />
          {b.lit && (
            <rect
              x={b.x - 5} y={b.y - 5} width={10} height={10}
              rx={b.key === 'home' ? 0 : 1.5}
              transform={`rotate(45, ${b.x}, ${b.y})`}
              fill={`${CUBS_BLUE}30`}
              className="animate-pulse"
            />
          )}
        </g>
      ))}
      {/* Pitcher's mound */}
      <circle cx={cx} cy={cy} r={3} fill={`${IVY_GREEN}30`} stroke={`${IVY_GREEN}20`} strokeWidth={0.5} />
    </svg>
  );
}

function getBasesForPlay(type: string): string[] {
  switch (type) {
    case '1b': return ['first'];
    case '2b': return ['first', 'second'];
    case '3b': return ['first', 'second', 'third'];
    case 'hr': return ['first', 'second', 'third', 'home'];
    case 'bb': return ['first'];
    case 'k': case 'k_looking': return [];
    case 'out': return [];
    case 'dp': return [];
    default: return [];
  }
}
