interface RadarPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  points: RadarPoint[];
  color?: string;
  size?: number;
}

export function RadarChart({ points, color = "var(--neon-blue)", size = 120 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 16;
  const n = points.length;

  const getCoord = (index: number, radius: number) => {
    const angle = (index * 2 * Math.PI) / n - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  const outerPoints = points.map((_, i) => getCoord(i, maxRadius));
  const valuePoints = points.map((p, i) => getCoord(i, (p.value / 100) * maxRadius));

  const outerPath = outerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
  const valuePath = valuePoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';

  // Grid rings
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="radar-glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {gridLevels.map((level, li) => {
        const ringPts = points.map((_, i) => getCoord(i, maxRadius * level));
        const path = ringPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
        return (
          <path key={li} d={path} fill="none" stroke="var(--border-dim)" strokeWidth="0.5" />
        );
      })}

      {/* Axis lines */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-dim)" strokeWidth="0.5" />
      ))}

      {/* Outer boundary */}
      <path d={outerPath} fill="none" stroke="var(--border-dim)" strokeWidth="1" />

      {/* Value fill */}
      <path d={valuePath} fill={`${color}20`} stroke={color} strokeWidth="1.5" filter="url(#radar-glow)" />

      {/* Value dots */}
      {valuePoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} filter="url(#radar-glow)" />
      ))}

      {/* Labels */}
      {outerPoints.map((p, i) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const lx = cx + (maxRadius + 12) * (dx / maxRadius);
        const ly = cy + (maxRadius + 12) * (dy / maxRadius);
        return (
          <text
            key={i}
            x={lx}
            y={ly + 4}
            textAnchor="middle"
            fontSize="7"
            fill="var(--text-muted)"
            fontFamily="Orbitron, sans-serif"
            letterSpacing="0.05em"
          >
            {points[i].label}
          </text>
        );
      })}
    </svg>
  );
}
