interface PanelBoxProps {
  title: string;
  children: React.ReactNode;
  accentColor?: string;
  badge?: string;
  badgeColor?: string;
  style?: React.CSSProperties;
  action?: React.ReactNode;
}

export function PanelBox({
  title,
  children,
  accentColor = "var(--neon-blue)",
  badge,
  badgeColor,
  style,
  action,
}: PanelBoxProps) {
  return (
    <div style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--border-dim)',
      borderRadius: '10px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: `1px solid ${accentColor}33`,
        background: `linear-gradient(90deg, ${accentColor}0a 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '3px',
            height: '14px',
            background: accentColor,
            boxShadow: `0 0 6px ${accentColor}`,
            borderRadius: '2px',
          }} />
          <span style={{
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            color: 'var(--text-primary)',
            fontWeight: '600',
          }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: '0.5rem',
              padding: '2px 6px',
              background: `${badgeColor || accentColor}22`,
              border: `1px solid ${badgeColor || accentColor}55`,
              borderRadius: '3px',
              color: badgeColor || accentColor,
              letterSpacing: '0.08em',
            }}>{badge}</span>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
