import { useState } from "react";
import { AlertTriangle, Bell, CheckCircle, XCircle, Info } from "lucide-react";

interface Alert {
  id: string;
  time: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  title: string;
  desc: string;
  service: string;
  ack: boolean;
}

const INITIAL_ALERTS: Alert[] = [
  { id: "ALT-001", time: "04:12:38", severity: "CRITICAL", title: "INTRUSION DETECTED", desc: "Unauthorized access attempt from 185.220.101.47 on port 22. Blocked by firewall rule FW-001.", service: "AUTH-SVC", ack: false },
  { id: "ALT-002", time: "04:05:51", severity: "HIGH", title: "BRUTE FORCE ATTACK", desc: "500+ failed auth attempts from 45.33.32.156 in 60 seconds. Auto-ban applied.", service: "AUTH-SVC", ack: false },
  { id: "ALT-003", time: "03:58:22", severity: "CRITICAL", title: "DDoS MITIGATED", desc: "Volumetric DDoS attack from botnet 198.199.83.90/16. 12Gbps traffic absorbed by mitigation layer.", service: "API-GW", ack: true },
  { id: "ALT-004", time: "03:44:09", severity: "HIGH", title: "HIGH MEMORY USAGE", desc: "CACHE-SVC memory at 88%. Cache eviction rate increasing. Consider scaling.", service: "CACHE-SVC", ack: false },
  { id: "ALT-005", time: "03:31:47", severity: "MEDIUM", title: "NODE DEGRADED", desc: "NODE-004 in AP-SOUTH reporting 87ms latency. Auto-failover enabled.", service: "NETWORK", ack: true },
  { id: "ALT-006", time: "03:18:22", severity: "HIGH", title: "SSL CERT EXPIRING", desc: "Certificate for api.launchops.io expires in 7 days. Renewal required.", service: "API-GW", ack: false },
  { id: "ALT-007", time: "03:01:05", severity: "LOW", title: "BACKUP COMPLETED", desc: "Full system backup completed successfully. 234 GB stored to cold storage.", service: "DATA-SVC", ack: true },
  { id: "ALT-008", time: "02:45:17", severity: "INFO", title: "SYSTEM UPDATE", desc: "Security patch applied to 12 services. All services restarted successfully.", service: "SYSTEM", ack: true },
];

const SEV_CONFIG: Record<string, { color: string; icon: React.ReactNode; bg: string }> = {
  CRITICAL: { color: 'var(--launch-red)', icon: <XCircle size={14} />, bg: 'rgba(230,0,18,0.08)' },
  HIGH: { color: 'var(--warning-amber)', icon: <AlertTriangle size={14} />, bg: 'rgba(255,184,0,0.08)' },
  MEDIUM: { color: 'var(--neon-blue)', icon: <Bell size={14} />, bg: 'rgba(0,242,255,0.08)' },
  LOW: { color: 'var(--text-muted)', icon: <Info size={14} />, bg: 'rgba(255,255,255,0.04)' },
  INFO: { color: 'var(--success-green)', icon: <Info size={14} />, bg: 'rgba(0,255,136,0.06)' },
};

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const [filter, setFilter] = useState<"ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

  const ackAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
  };

  const ackAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, ack: true })));
  };

  const filtered = alerts.filter(a => filter === "ALL" || a.severity === filter);
  const unacked = alerts.filter(a => !a.ack).length;

  const tabStyle = (f: string) => ({
    padding: '6px 14px',
    border: 'none',
    background: filter === f ? 'rgba(230,0,18,0.12)' : 'transparent',
    color: filter === f ? 'var(--launch-red)' : 'var(--text-muted)',
    borderBottom: `2px solid ${filter === f ? 'var(--launch-red)' : 'transparent'}`,
    cursor: 'pointer',
    fontSize: '0.58rem',
    letterSpacing: '0.12em',
    fontFamily: 'Orbitron, sans-serif',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--panel-bg)',
        padding: '12px 22px',
        borderBottom: '2px solid var(--launch-red)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="var(--launch-red)" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', color: 'var(--text-bright)' }}>ALERT CENTER</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--launch-red)', letterSpacing: '0.1em' }}>
              {unacked} UNACKNOWLEDGED ALERTS
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            {[
              { sev: 'CRITICAL', color: 'var(--launch-red)' },
              { sev: 'HIGH', color: 'var(--warning-amber)' },
              { sev: 'MEDIUM', color: 'var(--neon-blue)' },
            ].map(s => {
              const count = alerts.filter(a => a.severity === s.sev && !a.ack).length;
              return count > 0 ? (
                <div key={s.sev} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.8rem', color: s.color, fontFamily: 'Share Tech Mono, monospace', fontWeight: '700' }}>{count}</div>
                  <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.sev}</div>
                </div>
              ) : null;
            })}
          </div>
          <button
            onClick={ackAll}
            style={{
              padding: '6px 14px',
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.3)',
              color: 'var(--success-green)',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '0.55rem',
              letterSpacing: '0.1em',
              fontFamily: 'Orbitron, sans-serif',
            }}
          >
            ACK ALL
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', background: 'var(--dark-surface)', borderBottom: '1px solid var(--border-dim)', flexShrink: 0 }}>
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
          <button key={f} style={tabStyle(f)} onClick={() => setFilter(f)}>
            {f}{f !== 'ALL' ? ` (${alerts.filter(a => a.severity === f).length})` : ''}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
            NO ALERTS IN THIS CATEGORY
          </div>
        )}
        {filtered.map((alert) => {
          const cfg = SEV_CONFIG[alert.severity];
          return (
            <div
              key={alert.id}
              style={{
                background: alert.ack ? 'rgba(255,255,255,0.02)' : cfg.bg,
                border: `1px solid ${alert.ack ? 'var(--border-dim)' : cfg.color + '44'}`,
                borderLeft: `3px solid ${alert.ack ? 'var(--border-dim)' : cfg.color}`,
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
                opacity: alert.ack ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ color: alert.ack ? 'var(--text-muted)' : cfg.color, flexShrink: 0, marginTop: '2px' }}>
                {cfg.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '700', color: alert.ack ? 'var(--text-muted)' : 'var(--text-bright)', letterSpacing: '0.1em' }}>{alert.title}</span>
                    <span style={{ fontSize: '0.48rem', padding: '1px 6px', borderRadius: '3px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}44`, color: cfg.color, letterSpacing: '0.08em' }}>{alert.severity}</span>
                    <span style={{ fontSize: '0.48rem', padding: '1px 6px', borderRadius: '3px', background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.2)', color: 'var(--neon-blue)', letterSpacing: '0.06em' }}>{alert.service}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>{alert.time}</span>
                    <span style={{ fontSize: '0.48rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>{alert.id}</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.58rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '8px' }}>{alert.desc}</p>
                {!alert.ack ? (
                  <button
                    onClick={() => ackAlert(alert.id)}
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(0,255,136,0.08)',
                      border: '1px solid rgba(0,255,136,0.25)',
                      color: 'var(--success-green)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.5rem',
                      letterSpacing: '0.1em',
                      fontFamily: 'Orbitron, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <CheckCircle size={10} />
                    ACKNOWLEDGE
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.5rem', color: 'var(--success-green)', letterSpacing: '0.08em' }}>
                    <CheckCircle size={10} />
                    ACKNOWLEDGED
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
