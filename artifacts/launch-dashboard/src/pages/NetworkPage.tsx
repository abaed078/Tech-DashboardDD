import { useState } from "react";
import { Globe, Wifi, ArrowUpDown, Activity } from "lucide-react";
import { PanelBox } from "@/components/PanelBox";
import { MiniBarChart } from "@/components/MiniBarChart";

const NODES = [
  { id: "NODE-001", ip: "10.0.1.1", region: "US-EAST", latency: 4, status: "ACTIVE", type: "GATEWAY" },
  { id: "NODE-002", ip: "10.0.1.12", region: "US-WEST", latency: 12, status: "ACTIVE", type: "RELAY" },
  { id: "NODE-003", ip: "10.0.2.4", region: "EU-WEST", latency: 38, status: "ACTIVE", type: "ENDPOINT" },
  { id: "NODE-004", ip: "10.0.3.7", region: "AP-SOUTH", latency: 87, status: "DEGRADED", type: "RELAY" },
  { id: "NODE-005", ip: "10.0.4.2", region: "AP-EAST", latency: 102, status: "ACTIVE", type: "ENDPOINT" },
  { id: "NODE-006", ip: "10.0.5.9", region: "SA-EAST", latency: 67, status: "ACTIVE", type: "RELAY" },
  { id: "NODE-007", ip: "10.0.6.1", region: "AF-SOUTH", latency: 145, status: "OFFLINE", type: "ENDPOINT" },
];

const ROUTES = [
  { from: "US-EAST", to: "EU-WEST", hops: 3, bw: "1.2 Gb/s", status: "OPTIMAL" },
  { from: "US-WEST", to: "AP-EAST", hops: 4, bw: "890 Mb/s", status: "OPTIMAL" },
  { from: "EU-WEST", to: "AP-SOUTH", hops: 5, bw: "340 Mb/s", status: "DEGRADED" },
  { from: "US-EAST", to: "SA-EAST", hops: 4, bw: "220 Mb/s", status: "OPTIMAL" },
];

function NetworkTopology() {
  const cx = 300, cy = 160;
  const nodeCoords = [
    { x: 300, y: 40 },   // US-EAST (top center)
    { x: 100, y: 120 },  // US-WEST
    { x: 500, y: 120 },  // EU-WEST
    { x: 160, y: 250 },  // AP-SOUTH
    { x: 480, y: 250 },  // AP-EAST
    { x: 300, y: 290 },  // SA-EAST
    { x: 60, y: 250 },   // AF-SOUTH
  ];
  const edges = [[0,1],[0,2],[1,3],[2,4],[0,5],[3,6]];

  return (
    <svg width="100%" viewBox="0 0 600 320" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <filter id="glow-net">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="600" height="320" fill="url(#bg-grad)" rx="8" />

      {/* Grid */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 50} y1={0} x2={i * 50} y2={320} stroke="#1a1a1a" strokeWidth="0.5" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={`h${i}`} x1={0} y1={i * 50} x2={600} y2={i * 50} stroke="#1a1a1a" strokeWidth="0.5" />
      ))}

      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodeCoords[a].x} y1={nodeCoords[a].y}
          x2={nodeCoords[b].x} y2={nodeCoords[b].y}
          stroke="#00f2ff"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.4"
          filter="url(#glow-net)"
        />
      ))}

      {/* Nodes */}
      {NODES.map((node, i) => {
        const { x, y } = nodeCoords[i];
        const color = node.status === 'ACTIVE' ? '#00ff88' : node.status === 'DEGRADED' ? '#ffb800' : '#e60012';
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={18} fill="#1e1e1e" stroke={color} strokeWidth="1.5" filter="url(#glow-net)" />
            <circle cx={x} cy={y} r={5} fill={color} filter="url(#glow-net)" />
            <text x={x} y={y + 32} textAnchor="middle" fontSize="7" fill="#888" fontFamily="Orbitron, sans-serif">
              {node.region}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"topology" | "nodes" | "routes">("topology");

  const tabStyle = (tab: string) => ({
    padding: '7px 16px',
    border: 'none',
    background: activeTab === tab ? 'rgba(0,242,255,0.12)' : 'transparent',
    color: activeTab === tab ? 'var(--neon-blue)' : 'var(--text-muted)',
    borderBottom: `2px solid ${activeTab === tab ? 'var(--neon-blue)' : 'transparent'}`,
    cursor: 'pointer',
    fontSize: '0.6rem',
    letterSpacing: '0.12em',
    fontFamily: 'Orbitron, sans-serif',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--panel-bg)',
        padding: '12px 22px',
        borderBottom: '2px solid var(--neon-blue)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={16} color="var(--neon-blue)" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', color: 'var(--text-bright)' }}>NETWORK TOPOLOGY</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>GLOBAL MESH — 247 ACTIVE NODES</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>TOTAL BW:</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--neon-blue)', fontFamily: 'Share Tech Mono, monospace' }}>2.65 Gb/s</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--dark-surface)', borderBottom: '1px solid var(--border-dim)', flexShrink: 0 }}>
        {(['topology', 'nodes', 'routes'] as const).map(t => (
          <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {activeTab === 'topology' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <PanelBox title="GLOBAL NETWORK MAP" accentColor="var(--neon-blue)" badge="LIVE MESH">
              <div style={{ padding: '16px' }}>
                <NetworkTopology />
              </div>
            </PanelBox>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'ACTIVE NODES', value: '244', color: 'var(--success-green)' },
                { label: 'DEGRADED', value: '2', color: 'var(--warning-amber)' },
                { label: 'OFFLINE', value: '1', color: 'var(--launch-red)' },
                { label: 'AVG LATENCY', value: '65ms', color: 'var(--neon-blue)' },
              ].map((s, i) => (
                <div key={i} style={{
                  background: 'var(--panel-bg)',
                  border: '1px solid var(--border-dim)',
                  borderRadius: '8px',
                  padding: '14px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '6px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.4rem', color: s.color, fontFamily: 'Share Tech Mono, monospace', fontWeight: '700' }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'nodes' && (
          <PanelBox title="NODE REGISTRY" accentColor="var(--neon-blue)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['NODE ID', 'IP ADDRESS', 'REGION', 'TYPE', 'LATENCY', 'STATUS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: '400' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NODES.map((n, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--neon-blue)' }}>{n.id}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{n.ip}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.6rem', color: 'var(--text-primary)', letterSpacing: '0.08em' }}>{n.region}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{n.type}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: n.latency > 100 ? 'var(--launch-red)' : n.latency > 50 ? 'var(--warning-amber)' : 'var(--success-green)' }}>{n.latency}ms</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '0.5rem',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: n.status === 'ACTIVE' ? 'rgba(0,255,136,0.1)' : n.status === 'DEGRADED' ? 'rgba(255,184,0,0.1)' : 'rgba(230,0,18,0.1)',
                        border: `1px solid ${n.status === 'ACTIVE' ? 'rgba(0,255,136,0.3)' : n.status === 'DEGRADED' ? 'rgba(255,184,0,0.3)' : 'rgba(230,0,18,0.3)'}`,
                        color: n.status === 'ACTIVE' ? 'var(--success-green)' : n.status === 'DEGRADED' ? 'var(--warning-amber)' : 'var(--launch-red)',
                        letterSpacing: '0.08em',
                      }}>{n.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelBox>
        )}

        {activeTab === 'routes' && (
          <PanelBox title="ROUTING TABLE" accentColor="var(--success-green)">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['FROM', 'TO', 'HOPS', 'BANDWIDTH', 'STATUS'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: '400' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontSize: '0.6rem', color: 'var(--neon-blue)', letterSpacing: '0.08em', fontFamily: 'Share Tech Mono, monospace' }}>{r.from}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.6rem', color: 'var(--neon-blue)', letterSpacing: '0.08em', fontFamily: 'Share Tech Mono, monospace' }}>{r.to}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>{r.hops}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.6rem', color: 'var(--success-green)', fontFamily: 'Share Tech Mono, monospace' }}>{r.bw}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '0.5rem',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        background: r.status === 'OPTIMAL' ? 'rgba(0,255,136,0.1)' : 'rgba(255,184,0,0.1)',
                        border: `1px solid ${r.status === 'OPTIMAL' ? 'rgba(0,255,136,0.3)' : 'rgba(255,184,0,0.3)'}`,
                        color: r.status === 'OPTIMAL' ? 'var(--success-green)' : 'var(--warning-amber)',
                        letterSpacing: '0.08em',
                      }}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelBox>
        )}
      </div>
    </div>
  );
}
