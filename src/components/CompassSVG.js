import React from 'react';

/**
 * Qibla Compass
 *
 * The ROSE (ring with N/S/E/W) rotates with the device heading so N always tracks real North.
 * The KAABA marker sits at angle = qiblaDir on the rose, so it shows the TRUE geographic
 * direction of Mecca regardless of device orientation.
 * The static NEEDLE always points straight up (12 o'clock = toward Kaaba when aligned).
 *
 * animNeedle = qiblaDir - deviceHeading  (rose rotation passed from parent)
 * qiblaDir   = absolute bearing to Mecca from user's location
 */
export default function CompassSVG({ animNeedle, qiblaDir, isAligned, theme: T, size = 280 }) {
  const C   = size / 2;
  const OR  = size / 2 - 6;
  const RR  = OR - 20;
  const IR  = RR - 16;

  const rad = a => (a - 90) * Math.PI / 180;
  const px  = (a, r) => C + Math.cos(rad(a)) * r;
  const py  = (a, r) => C + Math.sin(rad(a)) * r;

  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);
  const cardinals = [
    { l:'N', d:0 }, { l:'NO', d:45 }, { l:'O', d:90 }, { l:'SO', d:135 },
    { l:'S', d:180 }, { l:'SV', d:225 }, { l:'V', d:270 }, { l:'NV', d:315 },
  ];

  const nc = isAligned ? '#4CAF82' : T.accent;

  // The Kaaba is placed at qiblaDir degrees on the rose
  // Since the rose rotates by animNeedle (= qiblaDir - heading),
  // the Kaaba's absolute screen position = animNeedle + qiblaDir rotation within rose
  // But since qiblaDir is fixed relative to the rose, we just place it at qiblaDir on the rose
  // and let the rose rotation handle everything.
  const kaabaAngle = qiblaDir != null ? qiblaDir : 0;
  const kaabaR = RR - 8;

  return (
    <svg width={size} height={size} style={{ display:'block', overflow:'visible' }}>
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={T.card} />
          <stop offset="100%" stopColor={T.bgSecondary} />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="kaaba-glow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Outer bezel */}
      <circle cx={C} cy={C} r={OR + 4}
        fill={T.bgSecondary}
        stroke={isAligned ? '#4CAF82' : T.border}
        strokeWidth={isAligned ? 3 : 1.5} />

      {/* === ROTATING ROSE === */}
      <g transform={`rotate(${animNeedle}, ${C}, ${C})`}>
        {/* Rose background */}
        <circle cx={C} cy={C} r={OR} fill="url(#bg-grad)" stroke={T.border} strokeWidth="1" />

        {/* Tick marks */}
        {ticks.map(d => {
          const isMaj = d % 90 === 0;
          const isMid = d % 45 === 0;
          const is10  = d % 10 === 0;
          const r1 = OR - 1;
          const tl = isMaj ? 13 : isMid ? 8 : is10 ? 5 : 3;
          return (
            <line key={d}
              x1={px(d,r1)} y1={py(d,r1)}
              x2={px(d,r1-tl)} y2={py(d,r1-tl)}
              stroke={isMaj ? T.accent : is10 ? T.textMuted : T.border}
              strokeWidth={isMaj ? 2.5 : is10 ? 1.2 : 0.8}
              opacity={isMaj ? 1 : is10 ? 0.5 : 0.18} />
          );
        })}

        {/* Degree numbers every 30° */}
        {[0,30,60,90,120,150,180,210,240,270,300,330].map(d => (
          <text key={d}
            x={px(d, OR-31)} y={py(d, OR-31) + 4}
            textAnchor="middle" fontSize="8" fill={T.textMuted} opacity=".5"
            fontFamily="'DM Sans',system-ui,sans-serif"
            transform={`rotate(${d}, ${px(d,OR-31)}, ${py(d,OR-31)})`}>
            {d}
          </text>
        ))}

        {/* Cardinal labels */}
        {cardinals.map(({ l, d }) => {
          const isCard = l.length === 1;
          const isN    = l === 'N';
          return (
            <text key={l}
              x={px(d, RR-4)} y={py(d, RR-4) + 5}
              textAnchor="middle"
              fontSize={isCard ? 13 : 8}
              fontWeight={isCard ? 800 : 600}
              fill={isN ? T.accent : isCard ? T.text : T.textMuted}
              opacity={isCard ? 1 : 0.6}
              fontFamily="'DM Sans',system-ui,sans-serif"
              transform={`rotate(${d}, ${px(d,RR-4)}, ${py(d,RR-4)})`}>
              {l}
            </text>
          );
        })}

        {/* Inner circle */}
        <circle cx={C} cy={C} r={IR} fill={T.card} stroke={T.border} strokeWidth="1" />

        {/* Degrees inside circle */}
        {qiblaDir != null && (
          <text x={C} y={C + 5} textAnchor="middle"
            fontSize="22" fontWeight="800"
            fill={T.text} fontFamily="'DM Sans',system-ui,sans-serif"
            opacity=".85">
            {Math.round(qiblaDir)}°
          </text>
        )}

        {/* === KAABA at exact qiblaDir bearing on rose === */}
        {qiblaDir != null && (() => {
          const kx = px(kaabaAngle, kaabaR);
          const ky = py(kaabaAngle, kaabaR);
          return (
            <g transform={`translate(${kx}, ${ky})`}>
              {/* Glow ring */}
              <circle cx={0} cy={0} r={18} fill={T.accent} opacity=".2" filter="url(#kaaba-glow)" />
              <circle cx={0} cy={0} r={14} fill={T.accent} opacity=".15" />
              {/* Kaaba emoji — large */}
              <text x={0} y={9} textAnchor="middle" fontSize="22"
                filter="url(#kaaba-glow)">🕋</text>
            </g>
          );
        })()}

        {/* Alignment arc */}
        {isAligned && (
          <circle cx={C} cy={C} r={IR + 4}
            fill="none" stroke="#4CAF82" strokeWidth="2" opacity=".4"
            strokeDasharray="18 6" />
        )}
      </g>
      {/* === END ROTATING ROSE === */}

      {/* === STATIC NEEDLE (always 12 o'clock) === */}
      <line x1={C} y1={C} x2={C} y2={C - (IR - 14)}
        stroke={nc} strokeWidth="3.5" strokeLinecap="round"
        filter={isAligned ? 'url(#glow)' : undefined} />
      {/* Arrowhead */}
      <path d={`M${C},${C-(IR-14)} L${C-8},${C-(IR-14)+20} L${C+8},${C-(IR-14)+20}Z`}
        fill={nc} filter={isAligned ? 'url(#glow)' : undefined} />
      {/* Tail */}
      <line x1={C} y1={C} x2={C} y2={C+20}
        stroke={nc} strokeWidth="2.5" strokeLinecap="round" opacity=".3" />
      {/* Pivot */}
      <circle cx={C} cy={C} r={9}  fill={nc} opacity=".2" />
      <circle cx={C} cy={C} r={5.5} fill={nc} />
      <circle cx={C} cy={C} r={2}  fill={T.bg} />
    </svg>
  );
}
