interface MiniBarChartProps {
  data: number[];
  color?: string;
  height?: number;
  label?: string;
}

export function MiniBarChart({ data, color = "var(--neon-blue)", height = 40 }: MiniBarChartProps) {
  const max = Math.max(...data, 1);
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '3px',
      height: `${height}px`,
    }}>
      {data.map((val, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${(val / max) * 100}%`,
            background: color,
            boxShadow: `0 0 4px ${color}88`,
            borderRadius: '2px 2px 0 0',
            minHeight: '2px',
            opacity: i === data.length - 1 ? 1 : 0.5 + (i / data.length) * 0.5,
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparkLine({ data, color = "var(--neon-blue)", width = 100, height = 32 }: SparkLineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        filter="url(#glow)"
      />
      {/* Last point dot */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) / (data.length - 1) * width}
          cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
          r="3"
          fill={color}
          filter="url(#glow)"
        />
      )}
    </svg>
  );
}
