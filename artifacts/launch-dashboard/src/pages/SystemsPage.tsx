import { Server, HardDrive, Cpu, Activity } from "lucide-react";
import { PanelBox } from "@/components/PanelBox";
import { MiniBarChart } from "@/components/MiniBarChart";

const SERVERS = [
  { id: "SRV-ALPHA", role: "PRIMARY DB", ip: "10.0.1.5", cpu: 34, mem: 68, disk: 42, temp: 47, status: "NOMINAL" },
  { id: "SRV-BETA", role: "REPLICA DB", ip: "10.0.1.6", cpu: 18, mem: 51, disk: 38, temp: 44, status: "NOMINAL" },
  { id: "SRV-GAMMA", role: "APP SERVER", ip: "10.0.2.1", cpu: 72, mem: 88, disk: 61, temp: 63, status: "WARNING" },
  { id: "SRV-DELTA", role: "CACHE", ip: "10.0.2.5", cpu: 8, mem: 34, disk: 22, temp: 39, status: "NOMINAL" },
  { id: "SRV-EPSILON", role: "QUEUE", ip: "10.0.3.2", cpu: 55, mem: 71, disk: 48, temp: 52, status: "NOMINAL" },
  { id: "SRV-ZETA", role: "MONITOR", ip: "10.0.4.1", cpu: 12, mem: 29, disk: 18, temp: 41, status: "NOMINAL" },
];

function GaugeRing({ value, color, size = 60, label }: { value: number; color: string; size?: number; label: string }) {
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const stroke = circumference * (1 - value / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <svg width={size} height={size}>
        <defs>
          <filter id={`gauge-glow-${label}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--border-dim)" strokeWidth="5"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter={`url(#gauge-glow-${label})`}
        />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fontSize="10" fill={color} fontFamily="Share Tech Mono, monospace">
          {value}%
        </text>
      </svg>
      <span style={{ fontSize: '0.45rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
    </div>
  );
}

export function SystemsPage() {
  const histData = [22, 28, 34, 31, 45, 52, 48, 55, 61, 58, 67, 72, 68];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--panel-bg)',
        padding: '12px 22px',
        borderBottom: '2px solid var(--success-green)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={16} color="var(--success-green)" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', color: 'var(--text-bright)' }}>SYSTEM RESOURCES</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>6 SERVERS — 1 WARNING</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: 'AVG CPU', val: '33%', color: 'var(--neon-blue)' },
            { label: 'AVG MEM', val: '57%', color: 'var(--warning-amber)' },
            { label: 'TOTAL DISK', val: '38%', color: 'var(--success-green)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: s.color, fontFamily: 'Share Tech Mono, monospace', fontWeight: '700' }}>{s.val}</div>
              <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Resource history chart */}
        <PanelBox title="CPU LOAD HISTORY (24H)" accentColor="var(--neon-blue)" badge="ALL SERVERS">
          <div style={{ padding: '14px 16px' }}>
            <MiniBarChart data={histData} color="var(--neon-blue)" height={60} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>24H AGO</span>
              <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>NOW</span>
            </div>
          </div>
        </PanelBox>

        {/* Server cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {SERVERS.map((srv, i) => (
            <PanelBox
              key={i}
              title={srv.id}
              accentColor={srv.status === 'WARNING' ? 'var(--warning-amber)' : 'var(--success-green)'}
              badge={srv.role}
              badgeColor={srv.status === 'WARNING' ? 'var(--warning-amber)' : 'var(--neon-blue)'}
            >
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>{srv.ip}</span>
                  <span style={{
                    fontSize: '0.5rem',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    background: srv.status === 'NOMINAL' ? 'rgba(0,255,136,0.1)' : 'rgba(255,184,0,0.1)',
                    border: `1px solid ${srv.status === 'NOMINAL' ? 'rgba(0,255,136,0.3)' : 'rgba(255,184,0,0.3)'}`,
                    color: srv.status === 'NOMINAL' ? 'var(--success-green)' : 'var(--warning-amber)',
                    letterSpacing: '0.08em',
                  }}>{srv.status}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <GaugeRing
                    value={srv.cpu}
                    color={srv.cpu > 70 ? 'var(--launch-red)' : srv.cpu > 50 ? 'var(--warning-amber)' : 'var(--neon-blue)'}
                    label="CPU"
                  />
                  <GaugeRing
                    value={srv.mem}
                    color={srv.mem > 80 ? 'var(--launch-red)' : srv.mem > 60 ? 'var(--warning-amber)' : 'var(--success-green)'}
                    label="MEM"
                  />
                  <GaugeRing
                    value={srv.disk}
                    color={srv.disk > 75 ? 'var(--launch-red)' : 'var(--neon-blue)'}
                    label="DISK"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--border-dim)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Activity size={9} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>TEMP</span>
                  </div>
                  <span style={{
                    fontSize: '0.6rem',
                    fontFamily: 'Share Tech Mono, monospace',
                    color: srv.temp > 60 ? 'var(--launch-red)' : srv.temp > 50 ? 'var(--warning-amber)' : 'var(--success-green)',
                  }}>{srv.temp}°C</span>
                </div>
              </div>
            </PanelBox>
          ))}
        </div>
      </div>
    </div>
  );
}
