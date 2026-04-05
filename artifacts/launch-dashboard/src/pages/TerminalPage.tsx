import { useState, useRef, useEffect } from "react";
import { Terminal } from "lucide-react";

interface LogLine {
  type: "input" | "output" | "error" | "success" | "info";
  text: string;
  time: string;
}

const COMMANDS: Record<string, string[]> = {
  help: [
    "Available commands:",
    "  status     — Show system status",
    "  ping <ip>  — Ping a host",
    "  nodes      — List active nodes",
    "  threats    — Show recent threats",
    "  scan       — Run security scan",
    "  uptime     — Show system uptime",
    "  clear      — Clear terminal",
    "  version    — Show system version",
  ],
  status: [
    "SYSTEM STATUS REPORT",
    "================================",
    "  Auth-SVC     : ONLINE  [12ms]",
    "  Data-SVC     : ONLINE  [8ms]",
    "  API-GW       : ONLINE  [5ms]",
    "  Cache-SVC    : DEGRADED [94ms]",
    "  Queue-SVC    : ONLINE  [3ms]",
    "================================",
    "Overall: DEGRADED (1/5 services affected)",
  ],
  nodes: [
    "ACTIVE NODE LIST",
    "================================",
    "  NODE-001  10.0.1.1   US-EAST   4ms",
    "  NODE-002  10.0.1.12  US-WEST   12ms",
    "  NODE-003  10.0.2.4   EU-WEST   38ms",
    "  NODE-004  10.0.3.7   AP-SOUTH  87ms [DEGRADED]",
    "  NODE-005  10.0.4.2   AP-EAST   102ms",
    "  NODE-006  10.0.5.9   SA-EAST   67ms",
    "  NODE-007  10.0.6.1   AF-SOUTH  -- [OFFLINE]",
    "================================",
    "Total: 247 nodes | Online: 244 | Offline: 1",
  ],
  threats: [
    "RECENT THREAT LOG (LAST 24H)",
    "================================",
    "  04:12:38  INTRUSION   185.220.101.47  BLOCKED",
    "  04:09:14  PORT SCAN   94.102.49.190   BLOCKED",
    "  04:05:51  BRUTE FORCE 45.33.32.156    BLOCKED",
    "  03:58:22  DDOS        198.199.83.90   MITIGATED",
    "  03:44:09  SQL INJECT  143.110.181.23  BLOCKED",
    "================================",
    "Total blocked today: 1,347 threats",
  ],
  scan: [
    "Initializing security scan...",
    "[=====>    ] 50% — Scanning endpoints...",
    "[=========] 100% — Scan complete",
    "",
    "SCAN RESULTS:",
    "  Critical: 1  (CVE-2024-1234)",
    "  High:     2  (CVE-2024-5678, CVE-2024-9101)",
    "  Medium:   1  (CVE-2024-1121)",
    "  Low:      1  (CVE-2024-3141)",
    "",
    "Action required: Patch CVE-2024-1234 immediately",
  ],
  uptime: [
    "SYSTEM UPTIME",
    "================================",
    "  Current uptime : 14 days 07h 32m",
    "  Last restart   : 2024-03-21 20:44:01 UTC",
    "  Boot reason    : Scheduled maintenance",
    "  Load avg (1m)  : 0.43",
    "  Load avg (5m)  : 0.38",
    "  Load avg (15m) : 0.35",
  ],
  version: [
    "LAUNCHOPS CONTROL INTERFACE",
    "Version: 2.4.1-stable",
    "Build:   20240405-0814",
    "Kernel:  Linux 6.1.0-launchops #1 SMP",
    "Arch:    x86_64",
  ],
};

function getTime() {
  return new Date().toTimeString().slice(0, 8);
}

export function TerminalPage() {
  const [history, setHistory] = useState<LogLine[]>([
    { type: "info", text: "LAUNCHOPS CONTROL TERMINAL v2.4.1", time: getTime() },
    { type: "info", text: "Type 'help' for available commands.", time: getTime() },
    { type: "info", text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", time: getTime() },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;

    const newLines: LogLine[] = [
      { type: "input", text: `root@launchops:~$ ${input}`, time: getTime() },
    ];

    if (cmd === "clear") {
      setHistory([{ type: "info", text: "Terminal cleared.", time: getTime() }]);
      setInput("");
      return;
    }

    const baseCmd = cmd.split(" ")[0];

    if (cmd.startsWith("ping ")) {
      const host = cmd.split(" ")[1];
      newLines.push({ type: "output", text: `PING ${host}: 56 data bytes`, time: getTime() });
      newLines.push({ type: "success", text: `64 bytes from ${host}: icmp_seq=0 ttl=64 time=12.3 ms`, time: getTime() });
      newLines.push({ type: "success", text: `64 bytes from ${host}: icmp_seq=1 ttl=64 time=11.8 ms`, time: getTime() });
      newLines.push({ type: "output", text: `--- ${host} ping statistics ---`, time: getTime() });
      newLines.push({ type: "output", text: `2 packets transmitted, 2 received, 0% packet loss`, time: getTime() });
    } else if (COMMANDS[baseCmd]) {
      COMMANDS[baseCmd].forEach(line => {
        newLines.push({ type: "output", text: line, time: getTime() });
      });
    } else {
      newLines.push({ type: "error", text: `Command not found: ${cmd}. Type 'help' for available commands.`, time: getTime() });
    }

    setHistory(prev => [...prev, ...newLines]);
    setCmdHistory(prev => [cmd, ...prev]);
    setHistIdx(-1);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      const idx = histIdx + 1;
      if (idx < cmdHistory.length) {
        setHistIdx(idx);
        setInput(cmdHistory[idx]);
      }
    } else if (e.key === "ArrowDown") {
      const idx = histIdx - 1;
      if (idx < 0) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(idx);
        setInput(cmdHistory[idx]);
      }
    }
  };

  const lineColor = {
    input: "var(--neon-blue)",
    output: "var(--text-primary)",
    error: "var(--launch-red)",
    success: "var(--success-green)",
    info: "var(--warning-amber)",
  };

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
          <Terminal size={16} color="var(--success-green)" />
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.2em', color: 'var(--text-bright)' }}>CONTROL TERMINAL</div>
            <div style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>root@launchops — SECURE SHELL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-green)', boxShadow: '0 0 6px var(--success-green)' }} />
          <span style={{ fontSize: '0.55rem', color: 'var(--success-green)', letterSpacing: '0.1em' }}>CONNECTED</span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px',
          background: '#050505',
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          cursor: 'text',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {history.map((line, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontSize: '0.6rem', marginTop: '1px' }}>{line.time}</span>
            <span style={{ color: lineColor[line.type], whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{line.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        background: '#050505',
        borderTop: '1px solid var(--border-dim)',
        flexShrink: 0,
      }}>
        <span style={{ color: 'var(--success-green)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', flexShrink: 0 }}>
          root@launchops:~$
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--neon-blue)',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.7rem',
            caretColor: 'var(--neon-blue)',
          }}
          placeholder="type a command..."
          spellCheck={false}
        />
        <span style={{
          width: '8px',
          height: '14px',
          background: 'var(--neon-blue)',
          animation: 'blink 1s step-end infinite',
        }} />
      </form>
    </div>
  );
}
