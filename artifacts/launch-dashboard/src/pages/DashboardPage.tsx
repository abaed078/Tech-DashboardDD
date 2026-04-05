import { useState, useEffect } from "react";
import { Activity, AlertTriangle, Globe, Server, Shield, Wifi, Zap, Eye } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PanelBox } from "@/components/PanelBox";
import { MiniBarChart, SparkLine } from "@/components/MiniBarChart";
import { RadarChart } from "@/components/RadarChart";

const THREAT_LOG = [
  { time: "04:12:38", type: "INTRUSION", src: "185.220.101.47", status: "BLOCKED", severity: "HIGH" },
  { time: "04:09:14", type: "PORT SCAN", src: "94.102.49.190", status: "BLOCKED", severity: "MED" },
  { time: "04:05:51", type: "BRUTE FORCE", src: "45.33.32.156", status: "BLOCKED", severity: "HIGH" },
  { time: "03:58:22", type: "DDOS", src: "198.199.83.90", status: "MITIGATED", severity: "CRIT" },
  { time: "03:44:09", type: "SQL INJECT", src: "143.110.181.23", status: "BLOCKED", severity: "MED" },
  { time: "03:31:47", type: "XSS", src: "178.62.115.55", status: "BLOCKED", severity: "LOW" },
];

const SERVICES = [
  { name: "AUTH-SVC", status: "ONLINE", latency: "12ms", load: 22 },
  { name: "DATA-SVC", status: "ONLINE", latency: "8ms", load: 45 },
  { name: "API-GW", status: "ONLINE", latency: "5ms", load: 67 },
  { name: "CACHE-SVC", status: "DEGRADED", latency: "94ms", load: 88 },
  { name: "QUEUE-SVC", status: "ONLINE", latency: "3ms", load: 31 },
];

function useAnimatedCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--neon-blue)', fontSize: '0.7rem' }}>
      {time.toUTCString().slice(17, 25)} UTC
    </span>
  );
}

export function DashboardPage() {
  const threats = useAnimatedCounter(1347);
  const nodes = useAnimatedCounter(247);
  const packets = useAnimatedCounter(89423);

  const cpuData = [34, 45, 38, 52, 61, 48, 55, 43, 58, 65, 47, 53, 43];
  const netData = [120, 145, 132, 178, 210, 189, 225, 198, 243, 267, 251, 289, 312];

  const radarData = [
    { label: "FIREWALL", value: 87 },
    { label: "ENDPOINT", value: 72 },
    { label: "NETWORK", value: 91 },
    { label: "DATA", value: 65 },
    { label: "APP", value: 78 },
    { label: "IDENTITY", value: 83 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--panel-bg)',
        padding: '12px 22px',
        borderBottom: '2px solid var(--launch-red)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', color: 'var(--text-bright)' }}>
              COMMAND OVERVIEW
            </div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '1px' }}>
              REAL-TIME SYSTEM INTELLIGENCE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.6rem',
            color: 'var(--success-green)',
            letterSpacing: '0.1em',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--success-green)',
              boxShadow: '0 0 6px var(--success-green)',
            }} />
            VCI ACTIVE
          </div>
          <LiveClock />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'rgba(230,0,18,0.1)',
            border: '1px solid var(--launch-red)',
            borderRadius: '4px',
            fontSize: '0.55rem',
            color: 'var(--launch-red)',
            letterSpacing: '0.1em',
            cursor: 'pointer',
          }}>
            <Eye size={10} />
            LIVE MONITOR
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Stat Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <StatCard
            label="THREATS BLOCKED"
            value={threats.toLocaleString()}
            sub="+23 IN LAST HOUR"
            color="var(--launch-red)"
            glow
            icon={<Shield size={14} />}
            trend="up"
          />
          <StatCard
            label="ACTIVE NODES"
            value={nodes.toString()}
            sub="3 PENDING APPROVAL"
            color="var(--neon-blue)"
            icon={<Globe size={14} />}
          />
          <StatCard
            label="PACKETS / SEC"
            value={packets.toLocaleString()}
            sub="▲ 12% VS YESTERDAY"
            color="var(--success-green)"
            glow
            icon={<Activity size={14} />}
            trend="up"
          />
          <StatCard
            label="LATENCY AVG"
            value="14ms"
            sub="NOMINAL RANGE"
            color="var(--warning-amber)"
            icon={<Wifi size={14} />}
          />
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '14px', flex: 1, minHeight: 0 }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>

            {/* Charts row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <PanelBox
                title="CPU UTILIZATION"
                accentColor="var(--neon-blue)"
                badge="LIVE"
                badgeColor="var(--success-green)"
              >
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CURRENT LOAD</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--neon-blue)', fontFamily: 'Share Tech Mono, monospace' }}>43%</span>
                  </div>
                  <MiniBarChart data={cpuData} color="var(--neon-blue)" height={52} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>12 CORES ACTIVE</span>
                    <SparkLine data={cpuData} color="var(--neon-blue)" width={60} height={18} />
                  </div>
                </div>
              </PanelBox>

              <PanelBox
                title="NETWORK THROUGHPUT"
                accentColor="var(--success-green)"
                badge="LIVE"
                badgeColor="var(--success-green)"
              >
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>BANDWIDTH</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--success-green)', fontFamily: 'Share Tech Mono, monospace' }}>312 Mb/s</span>
                  </div>
                  <MiniBarChart data={netData} color="var(--success-green)" height={52} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)' }}>INGRESS / EGRESS</span>
                    <SparkLine data={netData} color="var(--success-green)" width={60} height={18} />
                  </div>
                </div>
              </PanelBox>
            </div>

            {/* Threat log */}
            <PanelBox
              title="THREAT ACTIVITY LOG"
              accentColor="var(--launch-red)"
              badge={`${THREAT_LOG.length} EVENTS`}
              badgeColor="var(--launch-red)"
              style={{ flex: 1, minHeight: 0 }}
            >
              <div style={{ overflow: 'auto', height: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                      {['TIME', 'TYPE', 'SOURCE IP', 'STATUS', 'SEV'].map(h => (
                        <th key={h} style={{
                          padding: '8px 14px',
                          textAlign: 'left',
                          fontSize: '0.5rem',
                          color: 'var(--text-muted)',
                          letterSpacing: '0.12em',
                          fontWeight: '400',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {THREAT_LOG.map((row, i) => (
                      <tr key={i} style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '9px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{row.time}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-primary)' }}>{row.type}</td>
                        <td style={{ padding: '9px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--neon-blue)' }}>{row.src}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{
                            fontSize: '0.5rem',
                            padding: '2px 7px',
                            borderRadius: '3px',
                            background: row.status === 'BLOCKED' ? 'rgba(0,255,136,0.1)' : 'rgba(255,184,0,0.1)',
                            border: `1px solid ${row.status === 'BLOCKED' ? 'rgba(0,255,136,0.3)' : 'rgba(255,184,0,0.3)'}`,
                            color: row.status === 'BLOCKED' ? 'var(--success-green)' : 'var(--warning-amber)',
                            letterSpacing: '0.08em',
                          }}>{row.status}</span>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{
                            fontSize: '0.5rem',
                            color: row.severity === 'CRIT' ? 'var(--launch-red)' : row.severity === 'HIGH' ? 'var(--warning-amber)' : row.severity === 'MED' ? 'var(--neon-blue)' : 'var(--text-muted)',
                            fontFamily: 'Share Tech Mono, monospace',
                          }}>{row.severity}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelBox>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: 0 }}>

            {/* Radar */}
            <PanelBox title="SECURITY POSTURE" accentColor="var(--launch-red)">
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <RadarChart points={radarData} color="var(--launch-red)" size={150} />
                <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textAlign: 'center' }}>
                  OVERALL SCORE: <span style={{ color: 'var(--launch-red)' }}>79/100</span>
                </div>
              </div>
            </PanelBox>

            {/* Services */}
            <PanelBox
              title="SERVICE REGISTRY"
              accentColor="var(--neon-blue)"
              style={{ flex: 1, minHeight: 0 }}
            >
              <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'auto', height: '100%' }}>
                {SERVICES.map((svc, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-dim)',
                    borderRadius: '6px',
                    transition: 'border-color 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-mid)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-dim)')}
                  >
                    <Server size={12} color={svc.status === 'ONLINE' ? 'var(--success-green)' : 'var(--warning-amber)'} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-primary)', letterSpacing: '0.08em', fontFamily: 'Share Tech Mono, monospace' }}>{svc.name}</div>
                      <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>LATENCY: {svc.latency}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        fontSize: '0.5rem',
                        color: svc.status === 'ONLINE' ? 'var(--success-green)' : 'var(--warning-amber)',
                        letterSpacing: '0.08em',
                      }}>{svc.status}</div>
                      <div style={{
                        width: '50px',
                        height: '3px',
                        background: 'var(--border-dim)',
                        borderRadius: '2px',
                        marginTop: '4px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${svc.load}%`,
                          height: '100%',
                          background: svc.load > 80 ? 'var(--launch-red)' : svc.load > 60 ? 'var(--warning-amber)' : 'var(--success-green)',
                          boxShadow: `0 0 4px ${svc.load > 80 ? 'var(--launch-red)' : svc.load > 60 ? 'var(--warning-amber)' : 'var(--success-green)'}`,
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PanelBox>
          </div>
        </div>
      </div>
    </div>
  );
}
