import { useId } from 'react';

/**
 * HangerRender — a studio-lit, shaded "3D render" of a hanger.
 *
 * Replaces the old flat line art with volumetric, material-aware product
 * visuals. Every render shares one lighting model (key light top-left, soft
 * contact shadow, specular core highlight) so the whole catalogue looks like a
 * single photographed set. Pure inline SVG → resolution-independent, no network
 * request, no loading flash, and it tints naturally for light/dark themes.
 *
 * props:
 *   variant   'suit' | 'shirt' | 'trouser' | 'clip'
 *   material  'Wood' | 'Metal' | 'Plastic'
 *   floorShadow  draw the internal soft drop shadow (default true)
 */

const MATERIALS = {
  Wood: {
    body: [['0%', '#dcb079'], ['36%', '#b27c45'], ['70%', '#80512a'], ['100%', '#5c3a1d']],
    core: [['0%', '#f0d3a6'], ['100%', '#c89a62']],
    width: 17,
    grain: '#5c3a1d',
  },
  Metal: {
    body: [['0%', '#eef1f3'], ['26%', '#aab1b8'], ['50%', '#5d656d'], ['72%', '#cfd5da'], ['100%', '#828a91']],
    core: [['0%', '#ffffff'], ['100%', '#d9dee2']],
    width: 12,
    grain: null,
  },
  Plastic: {
    body: [['0%', '#6c7480'], ['46%', '#3d434b'], ['100%', '#262b32']],
    core: [['0%', '#b3bcc6'], ['100%', '#767f8a']],
    width: 15,
    grain: null,
  },
};

const CHROME = [['0%', '#f4f6f8'], ['30%', '#b7bec4'], ['54%', '#646c74'], ['78%', '#d6dbdf'], ['100%', '#8b9298']];

function Grad({ id, stops, vertical = true }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? '0' : '1'} y2={vertical ? '1' : '0'}>
      {stops.map(([offset, color]) => (
        <stop key={offset} offset={offset} stopColor={color} />
      ))}
    </linearGradient>
  );
}

export default function HangerRender({ variant = 'suit', material = 'Wood', floorShadow = true, className = '' }) {
  const rid = useId().replace(/:/g, '');
  const mat = MATERIALS[material] || MATERIALS.Wood;
  const w = mat.width;
  const bodyFill = `url(#b-${rid})`;
  const coreFill = `url(#c-${rid})`;
  const chrome = `url(#h-${rid})`;

  // Shared stroke for a "rounded tube" bar: dark base + lighter lit core.
  const Bar = ({ d, width = w }) => (
    <>
      <path d={d} fill="none" stroke={bodyFill} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={d}
        fill="none"
        stroke={coreFill}
        strokeWidth={width * 0.42}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </>
  );

  const FilledBar = ({ x, y, width, height, rx }) => (
    <>
      <rect x={x} y={y} width={width} height={height} rx={rx} fill={bodyFill} />
      <rect x={x + 4} y={y + 2} width={width - 8} height={height * 0.34} rx={rx * 0.6} fill={coreFill} opacity="0.8" />
    </>
  );

  const hook = (
    <>
      <path d="M200 104 L200 70 C200 51 175 48 172 67 C170 79 180 85 190 85" fill="none" stroke={chrome} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M200 104 L200 70 C200 51 175 48 172 67 C170 79 180 85 190 85" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />
    </>
  );

  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label={`${material} ${variant} hanger`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <Grad id={`b-${rid}`} stops={mat.body} />
        <Grad id={`c-${rid}`} stops={mat.core} />
        <Grad id={`h-${rid}`} stops={CHROME} />
        <filter id={`s-${rid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" floodColor="#000000" floodOpacity="0.22" />
        </filter>
        <radialGradient id={`f-${rid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--render-floor))" stopOpacity="0.5" />
          <stop offset="100%" stopColor="rgb(var(--render-floor))" stopOpacity="0" />
        </radialGradient>
      </defs>

      {floorShadow && <ellipse cx="200" cy="252" rx="128" ry="16" fill={`url(#f-${rid})`} />}

      <g filter={`url(#s-${rid})`}>
        {hook}

        {variant === 'suit' && (
          <Bar d="M200 102 C150 110 106 154 88 194 C84 201 89 206 96 206 L304 206 C311 206 316 201 312 194 C294 154 250 110 200 102 Z" />
        )}

        {variant === 'shirt' && (
          <Bar d="M92 202 C104 156 150 112 200 102 C250 112 296 156 308 202" />
        )}

        {variant === 'trouser' && (
          <>
            <Bar d="M200 106 L78 182" width={w * 0.78} />
            <Bar d="M200 106 L322 182" width={w * 0.78} />
            <FilledBar x={64} y={178} width={272} height={22} rx={11} />
          </>
        )}

        {variant === 'clip' && (
          <>
            <Bar d="M200 106 L106 152" width={w * 0.78} />
            <Bar d="M200 106 L294 152" width={w * 0.78} />
            <FilledBar x={92} y={150} width={216} height={17} rx={8.5} />
            {[132, 268].map((cx) => (
              <g key={cx}>
                <rect x={cx - 14} y={165} width={28} height={44} rx={6} fill={chrome} />
                <rect x={cx - 14} y={165} width={28} height={14} rx={6} fill="#ffffff" opacity="0.35" />
                <line x1={cx} y1={171} x2={cx} y2={203} stroke="#3a3f45" strokeWidth="1.5" opacity="0.5" />
                <rect x={cx - 14} y={196} width={28} height={13} rx={4} fill="#2f2a25" />
              </g>
            ))}
          </>
        )}

        {/* subtle wood grain */}
        {mat.grain && variant !== 'trouser' && variant !== 'clip' && (
          <g stroke={mat.grain} strokeWidth="1" opacity="0.10" fill="none" strokeLinecap="round">
            <path d="M120 150 C150 130 250 130 280 150" />
            <path d="M110 168 C150 150 250 150 290 168" />
          </g>
        )}
      </g>
    </svg>
  );
}
