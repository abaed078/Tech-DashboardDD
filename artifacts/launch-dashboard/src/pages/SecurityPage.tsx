import { Lock, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { PanelBox } from "@/components/PanelBox";
import { RadarChart } from "@/components/RadarChart";

const VULN_LIST = [
  { id: "CVE-2024-1234", severity: "CRITICAL", affected: "AUTH-SVC", desc: "Remote code execution via JWT bypass", status: "PATCHING" },
  { id: "CVE-2024-5678", severity: "HIGH", affected: "API-GW", desc: "SQL injection in query parameter handler", status: "MITIGATED" },
  { id: "CVE-2024-9101", severity: "HIGH", affected: "CACHE-SVC", desc: "Memory disclosure via buffer overflow", status: "OPEN" },
  { id: "CVE-2024-1121", severity: "MEDIUM", affected: "DATA-SVC", desc: "Improper input validation in file upload", status: "MITIGATED" },
  { id: "CVE-2024-3141", severity: "LOW", affected: "QUEUE-SVC", desc: "Information leakage in error messages", status: "OPEN" },
];

const FIREWALL_RULES = [
  { id: "FW-001", action: "DENY", proto: "TCP", src: "0.0.0.0/0", dst: "10.0.0.0/8", port: "22", active: true },
  { id: "FW-002", action: "ALLOW", proto: "TCP", src: "172.16.0.0/12", dst: "ANY", port: "443", active: true },
  { id: "FW-003", action: "DENY", proto: "UDP", src: "0.0.0.0/0", dst: "ANY", port: "53", active: false },
  { id: "FW-004", action: "ALLOW", proto: "TCP", src: "10.0.0.0/8", dst: "ANY", port: "8080", active: true },
  { id: "FW-005", action: "DENY", proto: "ANY", src: "185.220.0.0/16", dst: "ANY", port: "ANY", active: true },
];

const SEV_COLOR: Record<string, string> = {
  CRITICAL: 'var(--launch-red)',
  HIGH: 'var(--warning-amber)',
  MEDIUM: 'var(--neon-blue)',
  LOW: 'var(--text-muted)',
};

export function SecurityPage() {
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--panel-bg)',
        padding: '12px 22px',
        borderBottom: '2px solid var(--warning-amber)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Lock size={16} color="var(--warning-amber)" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', color: 'var(--text-bright)' }}>SECURITY CENTER</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--warning-amber)', letterSpacing: '0.1em' }}>2 HIGH SEVERITY VULNERABILITIES OPEN</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { label: 'CRITICAL', count: 1, color: 'var(--launch-red)' },
            { label: 'HIGH', count: 2, color: 'var(--warning-amber)' },
            { label: 'MEDIUM', count: 1, color: 'var(--neon-blue)' },
            { label: 'LOW', count: 1, color: 'var(--text-muted)' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: s.color, fontFamily: 'Share Tech Mono, monospace' }}>{s.count}</div>
              <div style={{ fontSize: '0.45rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '14px' }}>
          {/* Vulnerabilities */}
          <PanelBox title="VULNERABILITY SCAN RESULTS" accentColor="var(--launch-red)" badge="5 FINDINGS">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                  {['CVE ID', 'SEVERITY', 'SERVICE', 'DESCRIPTION', 'STATUS'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: '400' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VULN_LIST.map((v, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--neon-blue)' }}>{v.id}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '0.5rem',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        background: `${SEV_COLOR[v.severity]}18`,
                        border: `1px solid ${SEV_COLOR[v.severity]}44`,
                        color: SEV_COLOR[v.severity],
                        letterSpacing: '0.08em',
                      }}>{v.severity}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.6rem', color: 'var(--text-primary)', fontFamily: 'Share Tech Mono, monospace' }}>{v.affected}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.55rem', color: 'var(--text-muted)', maxWidth: '200px' }}>{v.desc}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '0.5rem',
                        padding: '2px 7px',
                        borderRadius: '3px',
                        background: v.status === 'MITIGATED' ? 'rgba(0,255,136,0.1)' : v.status === 'PATCHING' ? 'rgba(255,184,0,0.1)' : 'rgba(230,0,18,0.1)',
                        border: `1px solid ${v.status === 'MITIGATED' ? 'rgba(0,255,136,0.3)' : v.status === 'PATCHING' ? 'rgba(255,184,0,0.3)' : 'rgba(230,0,18,0.3)'}`,
                        color: v.status === 'MITIGATED' ? 'var(--success-green)' : v.status === 'PATCHING' ? 'var(--warning-amber)' : 'var(--launch-red)',
                        letterSpacing: '0.08em',
                      }}>{v.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </PanelBox>

          {/* Radar */}
          <PanelBox title="THREAT VECTOR" accentColor="var(--warning-amber)">
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <RadarChart points={radarData} color="var(--warning-amber)" size={158} />
              <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: '6px' }}>
                POSTURE SCORE: <span style={{ color: 'var(--warning-amber)' }}>79/100</span>
              </div>
            </div>
          </PanelBox>
        </div>

        {/* Firewall Rules */}
        <PanelBox title="FIREWALL RULESET" accentColor="var(--neon-blue)" badge={`${FIREWALL_RULES.length} RULES`}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-dim)' }}>
                {['RULE ID', 'ACTION', 'PROTOCOL', 'SOURCE', 'DESTINATION', 'PORT', 'ACTIVE'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: '400' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FIREWALL_RULES.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: r.active ? 1 : 0.4 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--neon-blue)' }}>{r.id}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: '0.5rem',
                      padding: '2px 8px',
                      borderRadius: '3px',
                      background: r.action === 'ALLOW' ? 'rgba(0,255,136,0.1)' : 'rgba(230,0,18,0.1)',
                      border: `1px solid ${r.action === 'ALLOW' ? 'rgba(0,255,136,0.3)' : 'rgba(230,0,18,0.3)'}`,
                      color: r.action === 'ALLOW' ? 'var(--success-green)' : 'var(--launch-red)',
                      letterSpacing: '0.08em',
                    }}>{r.action}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{r.proto}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-primary)' }}>{r.src}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-primary)' }}>{r.dst}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{r.port}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {r.active
                      ? <CheckCircle size={12} color="var(--success-green)" />
                      : <AlertTriangle size={12} color="var(--text-muted)" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelBox>
      </div>
    </div>
  );
}
