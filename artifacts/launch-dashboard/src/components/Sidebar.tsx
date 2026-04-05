import { PageId } from "@/App";
import {
  Activity,
  AlertTriangle,
  Globe,
  LayoutDashboard,
  Lock,
  Server,
  Terminal,
  Zap,
} from "lucide-react";

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  status?: "online" | "warning" | "alert";
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "DASHBOARD", icon: <LayoutDashboard size={16} />, status: "online" },
  { id: "network", label: "NETWORK", icon: <Globe size={16} />, status: "online" },
  { id: "security", label: "SECURITY", icon: <Lock size={16} />, status: "warning" },
  { id: "systems", label: "SYSTEMS", icon: <Server size={16} />, status: "online" },
  { id: "terminal", label: "TERMINAL", icon: <Terminal size={16} /> },
  { id: "alerts", label: "ALERTS", icon: <AlertTriangle size={16} />, status: "alert" },
];

const STATUS_COLOR = {
  online: "var(--success-green)",
  warning: "var(--warning-amber)",
  alert: "var(--launch-red)",
};

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside style={{
      background: 'var(--dark-surface)',
      borderRight: '1px solid var(--border-dim)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      gap: '0',
      overflow: 'hidden',
    }}>
      {/* Logo / Title */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
        }}>
          <Zap size={20} color="var(--launch-red)" />
          <span style={{
            fontSize: '0.85rem',
            fontWeight: '700',
            color: 'var(--text-bright)',
            letterSpacing: '0.15em',
          }}>LAUNCH<span style={{ color: 'var(--launch-red)' }}>OPS</span></span>
        </div>
        <div style={{
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
        }}>CONTROL INTERFACE v2.4.1</div>
      </div>

      {/* System Status Indicator */}
      <div style={{
        margin: '14px 16px',
        padding: '10px 14px',
        background: 'rgba(0,255,136,0.06)',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'var(--success-green)',
          boxShadow: '0 0 6px var(--success-green)',
          animation: 'pulse-green 2s ease-in-out infinite',
          flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--success-green)', letterSpacing: '0.1em' }}>SYSTEM ONLINE</div>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginTop: '2px' }}>ALL CORES OPERATIONAL</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.15em', padding: '4px 8px 8px', marginTop: '4px' }}>
          NAVIGATION
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                background: isActive ? 'rgba(230,0,18,0.12)' : '#252525',
                border: `1px solid ${isActive ? 'var(--launch-red)' : 'var(--border-mid)'}`,
                color: isActive ? 'var(--text-bright)' : 'var(--text-primary)',
                padding: '11px 14px',
                borderRadius: '6px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                fontFamily: 'Orbitron, sans-serif',
                boxShadow: isActive ? '0 0 12px rgba(230,0,18,0.25)' : 'none',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--launch-red)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(230,0,18,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = 'var(--border-mid)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <span style={{ color: isActive ? 'var(--launch-red)' : 'var(--text-muted)', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.status && (
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: STATUS_COLOR[item.status],
                  boxShadow: `0 0 4px ${STATUS_COLOR[item.status]}`,
                  animation: item.status === 'alert' ? 'pulse-red 1.5s ease-in-out infinite' : undefined,
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom stats */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-dim)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CPU LOAD</span>
          <span style={{ fontSize: '0.55rem', color: 'var(--neon-blue)', fontFamily: 'Share Tech Mono, monospace' }}>43%</span>
        </div>
        <div style={{
          height: '3px',
          background: 'var(--border-dim)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{ width: '43%', height: '100%', background: 'var(--neon-blue)', boxShadow: '0 0 6px var(--neon-blue)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MEM USAGE</span>
          <span style={{ fontSize: '0.55rem', color: 'var(--warning-amber)', fontFamily: 'Share Tech Mono, monospace' }}>71%</span>
        </div>
        <div style={{
          height: '3px',
          background: 'var(--border-dim)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{ width: '71%', height: '100%', background: 'var(--warning-amber)', boxShadow: '0 0 6px var(--warning-amber)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
          <Activity size={10} color="var(--text-muted)" />
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>UPTIME: 14D 07H 32M</span>
        </div>
      </div>
    </aside>
  );
}
