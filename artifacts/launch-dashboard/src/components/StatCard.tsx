interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  glow?: boolean;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ label, value, sub, color = "var(--neon-blue)", glow, icon, trend }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: `1px solid var(--border-dim)`,
      borderRadius: '10px',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: glow ? `0 0 20px ${color}20` : undefined,
    }}>
      {/* Corner accent */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '3px',
        height: '40px',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        borderRadius: '0 0 2px 0',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.15em',
          paddingLeft: '10px',
        }}>{label}</span>
        {icon && <span style={{ color, opacity: 0.7 }}>{icon}</span>}
      </div>

      <div style={{
        fontSize: '1.6rem',
        fontWeight: '700',
        color,
        textShadow: glow ? `0 0 10px ${color}` : undefined,
        paddingLeft: '10px',
        lineHeight: 1,
        fontFamily: 'Share Tech Mono, monospace',
      }}>
        {value}
      </div>

      {sub && (
        <div style={{
          fontSize: '0.55rem',
          color: trend === 'up' ? 'var(--success-green)' : trend === 'down' ? 'var(--launch-red)' : 'var(--text-muted)',
          paddingLeft: '10px',
          letterSpacing: '0.08em',
        }}>
          {trend === 'up' ? '▲ ' : trend === 'down' ? '▼ ' : ''}{sub}
        </div>
      )}
    </div>
  );
}
