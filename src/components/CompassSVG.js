import React from 'react';

/**
 * QIBLA COMPASS — Korrekt logik:
 *
 * - KAABAN är ALLTID fast på 12 o'clock, utanför ringen (precis som referensbilden)
 * - RINGEN (med grader/N/S/E/W) roterar baserat på: -(qiblaDir - deviceHeading)
 *   → När du pekar mot Qibla är ringen roterad så att rätt grad är vid 12 o'clock
 * - PILEN pekar alltid upp (12 o'clock) mot Kaaban
 * - GRADEN I MITTEN visar hur många grader du just nu pekar (deviceHeading, live)
 * - Grön ring när du är inriktad mot Qibla (±5°)
 *
 * animNeedle = rotation av ringen = -(qiblaDir - deviceHeading) = deviceHeading - qiblaDir
 * Men vi skickar in needleAngle från parent som redan är qiblaDir - heading,
 * så vi roterar ringen med -animNeedle för att hålla Kaaban vid 12.
 */
export default function CompassSVG({ animNeedle, qiblaDir, heading, isAligned, theme: T, size = 300 }) {
  const C    = size / 2;
  const KR   = size / 2 - 2;   // Kaaba radius (utanför ringen)
  const OR   = size / 2 - 32;  // Outer ring radius
  const IR   = OR - 48;        // Inner ring radius (tick area width = 48)
  const CR   = IR - 8;         // Center circle radius

  const nc = isAligned ? '#4CAF82' : T.accent;
  const gc = isAligned ? '#4CAF82' : T.accent;

  // Rota ringen: ringen ska rotera så att graden = qiblaDir hamnar vid 12 o'clock
  // animNeedle = qiblaDir - heading (från parent/useQibla)
  // Vi roterar ringen med animNeedle → graden vid 12 o'clock = qiblaDir när heading=0
  // Men vi vill att ringen ska visa AKTUELL HEADING vid 12 o'clock
  // Lösning: rotera ringen med -heading (ringen följer Nord)
  // animNeedle skickas in som qiblaDir - heading → ring rotation = animNeedle roterar så Kaaba hamnar vid 12
  // Enklast: ring roteras med animNeedle direkt (som parent beräknar)

  // Ticks every 1° (360 st) men rita bara var 5e
  const ticks = Array.from({ length: 360 }, (_, i) => i);

  // Grader label var 10e
  const degLabels = Array.from({ length: 36 }, (_, i) => i * 10);

  const toRad = a => (a - 90) * Math.PI / 180;
  const tx = (a, r) => C + Math.cos(toRad(a)) * r;
  const ty = (a, r) => C + Math.sin(toRad(a)) * r;

  // Visa aktuell heading i mitten (vart du pekar)
  const displayDeg = Math.round(((heading % 360) + 360) % 360);

  return (
    <svg width={size} height={size} style={{ display:'block', overflow:'visible' }}>
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={T.card} />
          <stop offset="100%" stopColor={T.bgSecondary} />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="kaabaglow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── STATIC KAABA at 12 o'clock, always ── */}
      <g filter="url(#kaabaglow)">
        {/* Glow disc */}
        <circle cx={C} cy={C - KR + 14} r={20}
          fill={isAligned ? '#4CAF82' : T.accent} opacity={isAligned ? 0.35 : 0.2} />
        {/* Kaaba emoji */}
        <text x={C} y={C - KR + 22}
          textAnchor="middle" fontSize="28" dominantBaseline="middle">🕋</text>
      </g>

      {/* ── ROTATING RING ── */}
      <g transform={`rotate(${animNeedle}, ${C}, ${C})`}>

        {/* Outer bezel */}
        <circle cx={C} cy={C} r={OR + 6}
          fill={T.bgSecondary}
          stroke={isAligned ? '#4CAF82' : T.border}
          strokeWidth={isAligned ? 2.5 : 1}
          opacity={isAligned ? 1 : 0.6} />

        {/* Ring background */}
        <circle cx={C} cy={C} r={OR} fill={T.card} />

        {/* Tick marks */}
        {ticks.map(d => {
          const is10  = d % 10 === 0;
          const is30  = d % 30 === 0;
          const is90  = d % 90 === 0;
          if (!is10) return null; // skip 1° ticks for perf — only draw 5° and up
          const tl = is90 ? 14 : is30 ? 10 : is10 ? 6 : 3;
          const sw = is90 ? 2.5 : is30 ? 1.5 : 1;
          const col = is90 ? gc : is30 ? T.textSecondary : T.textMuted;
          const op  = is90 ? 1 : is30 ? 0.7 : 0.35;
          return (
            <line key={d}
              x1={tx(d, OR)}    y1={ty(d, OR)}
              x2={tx(d, OR-tl)} y2={ty(d, OR-tl)}
              stroke={col} strokeWidth={sw} opacity={op} />
          );
        })}

        {/* 5° ticks too */}
        {Array.from({length:72},(_,i)=>i*5).map(d => {
          if (d % 10 === 0) return null; // already drawn above
          return (
            <line key={`5_${d}`}
              x1={tx(d, OR)}   y1={ty(d, OR)}
              x2={tx(d, OR-4)} y2={ty(d, OR-4)}
              stroke={T.border} strokeWidth={0.8} opacity={0.25} />
          );
        })}

        {/* Degree numbers every 10° — two rows, tight to ring */}
        {degLabels.map(d => {
          const r1 = OR - 20;
          const r2 = OR - 32;
          // Dual degree display like reference image: actual + (actual+180)%360
          const opp = (d + 180) % 360;
          return (
            <g key={`deg_${d}`}>
              <text
                x={tx(d, r1)} y={ty(d, r1) + 3.5}
                textAnchor="middle" fontSize="7.5" fontWeight="700"
                fill={d % 90 === 0 ? gc : T.text}
                opacity={d % 30 === 0 ? 0.9 : 0.5}
                fontFamily="'DM Sans',system-ui,sans-serif"
                transform={`rotate(${d},${tx(d,r1)},${ty(d,r1)})`}>
                {d}
              </text>
              <text
                x={tx(d, r2)} y={ty(d, r2) + 3}
                textAnchor="middle" fontSize="6.5" fontWeight="500"
                fill={T.textMuted} opacity={0.35}
                fontFamily="'DM Sans',system-ui,sans-serif"
                transform={`rotate(${d},${tx(d,r2)},${ty(d,r2)})`}>
                {opp}
              </text>
            </g>
          );
        })}

        {/* Cardinal N S E W */}
        {[{l:'N',d:0},{l:'O',d:90},{l:'S',d:180},{l:'V',d:270}].map(({l,d})=>(
          <text key={l}
            x={tx(d, IR+14)} y={ty(d, IR+14)+4}
            textAnchor="middle" fontSize="11" fontWeight="800"
            fill={l==='N' ? gc : T.textSecondary}
            opacity={0.8}
            fontFamily="'DM Sans',system-ui,sans-serif"
            transform={`rotate(${d},${tx(d,IR+14)},${ty(d,IR+14)})`}>
            {l}
          </text>
        ))}

        {/* Inner ring edge */}
        <circle cx={C} cy={C} r={IR} fill={T.bg} stroke={T.border} strokeWidth="1" opacity="0.5" />
      </g>
      {/* ── END ROTATING RING ── */}

      {/* ── CENTER CIRCLE (static) ── */}
      <circle cx={C} cy={C} r={CR}
        fill={T.bg}
        stroke={isAligned ? '#4CAF82' : T.border}
        strokeWidth={isAligned ? 2 : 1}
        opacity={isAligned ? 0.6 : 0.4} />

      {/* Live heading degrees in center */}
      <text x={C} y={C - 6}
        textAnchor="middle" fontSize="30" fontWeight="800"
        fill={isAligned ? '#4CAF82' : T.text}
        fontFamily="'DM Sans',system-ui,sans-serif"
        filter={isAligned ? 'url(#glow)' : undefined}>
        {displayDeg}°
      </text>
      <text x={C} y={C + 16}
        textAnchor="middle" fontSize="10" fontWeight="600"
        fill={T.textMuted} fontFamily="'DM Sans',system-ui,sans-serif">
        {isAligned ? 'QIBLA ✓' : `Qibla: ${qiblaDir != null ? Math.round(qiblaDir) : '—'}°`}
      </text>

      {/* ── STATIC ARROW pointing up at Kaaba ── */}
      {/* Arrow shaft */}
      <line x1={C} y1={C - (CR - 8)} x2={C} y2={C - (IR - 4)}
        stroke={nc} strokeWidth="3.5" strokeLinecap="round"
        filter={isAligned ? 'url(#glow)' : undefined} />
      {/* Arrowhead */}
      <polygon
        points={`${C},${C-(IR-4)} ${C-9},${C-(IR-24)} ${C+9},${C-(IR-24)}`}
        fill={nc}
        filter={isAligned ? 'url(#glow)' : undefined} />
      {/* Arrow tail */}
      <line x1={C} y1={C+(CR-8)} x2={C} y2={C+18}
        stroke={nc} strokeWidth="2.5" strokeLinecap="round" opacity="0.25" />

      {/* Pivot dot */}
      <circle cx={C} cy={C} r={6} fill={nc} opacity="0.3" />
      <circle cx={C} cy={C} r={3.5} fill={nc} />
      <circle cx={C} cy={C} r={1.5} fill={T.bg} />

      {/* Green alignment ring */}
      {isAligned && (
        <circle cx={C} cy={C} r={OR + 10}
          fill="none" stroke="#4CAF82" strokeWidth="3"
          opacity="0.5" strokeDasharray="20 8"
          filter="url(#glow)" />
      )}
    </svg>
  );
}
