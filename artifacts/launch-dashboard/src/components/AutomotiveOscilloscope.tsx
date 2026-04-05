import { useEffect, useRef } from "react";

export type FaultType = "stg" | "oc" | "oor" | null;

interface ScopeConfig {
  timeDivMs: number;
  voltDiv: number;
  vCenter: number;
  vMin: number;
  vMax: number;
  label: string;
  frequency: string;
  waveform: (t: number, fault: FaultType) => number;
  color: string;
}

const CONFIGS: Record<string, ScopeConfig> = {
  ckp: {
    timeDivMs: 2, voltDiv: 1, vCenter: 0, vMin: -5, vMax: 5,
    label: "CKP — VR Inductive (60-2 Tooth)", frequency: "800 Hz @ 800 RPM",
    color: "#00f2ff",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 4.5 + (Math.random() - 0.5) * 0.9;
      if (fault === "oor") return 8.2;
      // 60-2 tooth wheel at 800 RPM → 800 Hz tooth rate
      const toothHz = 800;
      const phase = (t * toothHz) % 60;
      // Missing 2 teeth at positions 57-59
      if (phase >= 57.0 && phase < 59.5) return 0;
      return 2.5 * Math.sin(2 * Math.PI * toothHz * t) + (Math.random() - 0.5) * 0.08;
    },
  },
  o2f: {
    timeDivMs: 400, voltDiv: 0.2, vCenter: 0.5, vMin: 0, vMax: 1,
    label: "O2 — Zirconia Lambda (Upstream)", frequency: "1.2 Hz (closed-loop)",
    color: "#f59e0b",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 4.5;
      if (fault === "oor") return 0.94; // stuck rich
      return 0.5 + 0.38 * Math.sin(2 * Math.PI * 1.2 * t) + (Math.random() - 0.5) * 0.022;
    },
  },
  o2r: {
    timeDivMs: 400, voltDiv: 0.2, vCenter: 0.5, vMin: 0, vMax: 1,
    label: "O2 — Zirconia Lambda (Downstream)", frequency: "0.4 Hz (catalyst ref.)",
    color: "#f59e0b",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 4.5;
      if (fault === "oor") return 0.75;
      return 0.5 + 0.06 * Math.sin(2 * Math.PI * 0.4 * t) + (Math.random() - 0.5) * 0.015;
    },
  },
  tps: {
    timeDivMs: 200, voltDiv: 1, vCenter: 2.5, vMin: 0, vMax: 5,
    label: "TPS — Rotary Potentiometer", frequency: "DC (idle: 0.72V)",
    color: "#4ade80",
    waveform: (t, fault) => {
      if (fault === "stg") return 0.04;
      if (fault === "oc") return 5.0;
      if (fault === "oor") return 4.85;
      return 0.72 + (Math.random() - 0.5) * 0.018;
    },
  },
  maf: {
    timeDivMs: 100, voltDiv: 1, vCenter: 2.5, vMin: 0, vMax: 5,
    label: "MAF — Hot Wire (Frequency based)", frequency: "~4 Hz intake pulsation",
    color: "#a78bfa",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 5.0;
      if (fault === "oor") return 0.08; // contaminated wire
      return 1.48 + 0.19 * Math.sin(2 * Math.PI * 4 * t) + 0.04 * Math.sin(2 * Math.PI * 12 * t) + (Math.random() - 0.5) * 0.025;
    },
  },
  map: {
    timeDivMs: 150, voltDiv: 1, vCenter: 2.5, vMin: 0, vMax: 5,
    label: "MAP — Piezoresistive Pressure", frequency: "~6.7 Hz @ 800 RPM",
    color: "#38bdf8",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 5.0;
      if (fault === "oor") return 4.92;
      return 1.2 + 0.15 * Math.sin(2 * Math.PI * 6.67 * t) + 0.05 * Math.sin(2 * Math.PI * 13.3 * t) + (Math.random() - 0.5) * 0.03;
    },
  },
  cts: {
    timeDivMs: 500, voltDiv: 0.5, vCenter: 2.0, vMin: 0, vMax: 5,
    label: "CTS — NTC Thermistor (90°C)", frequency: "DC quasi-static",
    color: "#f87171",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 4.82;
      if (fault === "oor") return 4.87; // open circuit / cold read
      return 1.82 + 0.012 * Math.sin(2 * Math.PI * 0.05 * t) + (Math.random() - 0.5) * 0.014;
    },
  },
  absfl: {
    timeDivMs: 5, voltDiv: 1, vCenter: 2.5, vMin: -1, vMax: 6,
    label: "ABS FL — Hall Effect WSS", frequency: "~200 Hz @ 30 mph",
    color: "#34d399",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 5;
      if (fault === "oor") return Math.random() > 0.5 ? 5 : 0;
      return (t * 200) % 1 > 0.5 ? 5.0 : 0.0;
    },
  },
  absfr: {
    timeDivMs: 5, voltDiv: 1, vCenter: 2.5, vMin: -1, vMax: 6,
    label: "ABS FR — Hall Effect WSS", frequency: "~200 Hz @ 30 mph",
    color: "#34d399",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 5;
      return (t * 200 + 0.25) % 1 > 0.5 ? 5.0 : 0.0;
    },
  },
  absrl: {
    timeDivMs: 5, voltDiv: 1, vCenter: 2.5, vMin: -1, vMax: 6,
    label: "ABS RL — Hall Effect WSS", frequency: "~195 Hz @ 30 mph",
    color: "#34d399",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 5;
      return (t * 195) % 1 > 0.5 ? 5.0 : 0.0;
    },
  },
  absrr: {
    timeDivMs: 5, voltDiv: 1, vCenter: 2.5, vMin: -1, vMax: 6,
    label: "ABS RR — Hall Effect WSS", frequency: "~195 Hz",
    color: "#34d399",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 5;
      return (t * 195 + 0.5) % 1 > 0.5 ? 5.0 : 0.0;
    },
  },
  bms: {
    timeDivMs: 5, voltDiv: 1, vCenter: 14, vMin: 10, vMax: 16,
    label: "BMS — Battery (Charging state)", frequency: "120 Hz alternator ripple",
    color: "#fbbf24",
    waveform: (t, fault) => {
      if (fault === "stg") return 0;
      if (fault === "oc") return 0;
      if (fault === "oor") return 10.1; // low battery / failing alternator
      return 13.8 + 0.28 * Math.sin(2 * Math.PI * 120 * t) + 0.06 * Math.sin(2 * Math.PI * 360 * t) + (Math.random() - 0.5) * 0.045;
    },
  },
};

const DEFAULT_CONFIG: ScopeConfig = {
  timeDivMs: 100, voltDiv: 1, vCenter: 2.5, vMin: 0, vMax: 5,
  label: "Generic Sensor", frequency: "---", color: "#00f2ff",
  waveform: (_, fault) => fault === "stg" ? 0 : fault === "oc" ? 4.9 : 2.5 + (Math.random() - 0.5) * 0.04,
};

const BUFFER_SIZE = 1000;

interface Props {
  sensorId: string | null;
  fault: FaultType;
  lang?: string;
}

export function AutomotiveOscilloscope({ sensorId, fault, lang = "en" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const voltBuffer = useRef(new Float32Array(BUFFER_SIZE).fill(2.5));
  const bufIdx = useRef(0);
  const lastT = useRef(0);
  const startT = useRef(performance.now());
  const isAr = lang === "ar";

  useEffect(() => {
    // Reset buffer on sensor/fault change
    const cfg = (sensorId && CONFIGS[sensorId]) || DEFAULT_CONFIG;
    voltBuffer.current.fill(cfg.vCenter);
    bufIdx.current = 0;
    lastT.current = 0;
    startT.current = performance.now();
  }, [sensorId, fault]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = (sensorId && CONFIGS[sensorId]) || DEFAULT_CONFIG;

    // How much real-time corresponds to the full canvas?
    const totalTimeS = (cfg.timeDivMs * 10) / 1000;
    const samplesPerSec = BUFFER_SIZE / totalTimeS;

    const draw = () => {
      const nowMs = performance.now();
      const nowS = (nowMs - startT.current) / 1000;
      const elapsed = nowS - lastT.current;
      const newSamples = Math.min(Math.floor(elapsed * samplesPerSec), BUFFER_SIZE);

      for (let i = 0; i < newSamples; i++) {
        const t = lastT.current + i / samplesPerSec;
        voltBuffer.current[bufIdx.current % BUFFER_SIZE] = cfg.waveform(t, fault);
        bufIdx.current++;
      }
      if (newSamples > 0) lastT.current += newSamples / samplesPerSec;

      const W = canvas.width;
      const H = canvas.height;

      // ── Background
      ctx.fillStyle = "#020c18";
      ctx.fillRect(0, 0, W, H);

      const GRID_COLS = 10;
      const GRID_ROWS = 8;
      const cellW = W / GRID_COLS;
      const cellH = H / GRID_ROWS;

      // ── Minor grid dots
      ctx.fillStyle = "rgba(0,100,80,0.25)";
      for (let c = 0; c <= GRID_COLS * 5; c++) {
        for (let r = 0; r <= GRID_ROWS * 5; r++) {
          ctx.fillRect((c / 5) * cellW - 0.5, (r / 5) * cellH - 0.5, 1, 1);
        }
      }

      // ── Major grid lines
      ctx.strokeStyle = "rgba(0,140,100,0.30)";
      ctx.lineWidth = 0.7;
      for (let c = 0; c <= GRID_COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, H);
        ctx.stroke();
      }
      for (let r = 0; r <= GRID_ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(W, r * cellH);
        ctx.stroke();
      }

      // ── Center axes
      ctx.strokeStyle = "rgba(0,200,120,0.55)";
      ctx.lineWidth = 1;
      // Time axis (horizontal center)
      const vRange = cfg.vMax - cfg.vMin;
      const zeroY = H - ((0 - cfg.vMin) / vRange) * H;
      if (zeroY >= 0 && zeroY <= H) {
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(W, zeroY);
        ctx.stroke();
      }

      // ── Voltage scale labels
      ctx.fillStyle = "rgba(0,220,140,0.7)";
      ctx.font = `bold ${Math.max(9, Math.round(H * 0.045))}px Share Tech Mono, monospace`;
      ctx.textAlign = "right";
      for (let r = 0; r <= GRID_ROWS; r++) {
        const v = cfg.vMax - (r / GRID_ROWS) * vRange;
        ctx.fillText(v.toFixed(Math.abs(v) < 2 ? 1 : 0) + "V", 36, r * cellH + 3);
      }

      // ── Time scale labels (bottom)
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,200,120,0.55)";
      ctx.font = `${Math.max(8, Math.round(H * 0.038))}px Share Tech Mono, monospace`;
      for (let c = 0; c <= GRID_COLS; c++) {
        const ms = (c - GRID_COLS / 2) * cfg.timeDivMs;
        ctx.fillText(ms + "ms", c * cellW, H - 3);
      }

      // ── Trigger line
      ctx.strokeStyle = "rgba(255,200,0,0.5)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      const trigY = H - ((cfg.vCenter - cfg.vMin) / vRange) * H;
      ctx.beginPath();
      ctx.moveTo(0, trigY);
      ctx.lineTo(W, trigY);
      ctx.stroke();
      ctx.setLineDash([]);

      // ── Waveform
      const waveColor = fault === "stg" ? "#ef4444" : fault === "oc" ? "#f59e0b" : fault === "oor" ? "#f97316" : cfg.color;
      ctx.strokeStyle = waveColor;
      ctx.lineWidth = fault ? 1.8 : 1.5;
      ctx.shadowColor = waveColor;
      ctx.shadowBlur = fault ? 6 : 3;

      ctx.beginPath();
      let moved = false;
      for (let px = 0; px < W; px++) {
        const bufPos = (bufIdx.current - W + px + BUFFER_SIZE * 2) % BUFFER_SIZE;
        const v = voltBuffer.current[bufPos];
        const y = H - ((v - cfg.vMin) / vRange) * H;
        const yc = Math.max(0, Math.min(H, y));
        if (!moved) { ctx.moveTo(px, yc); moved = true; }
        else ctx.lineTo(px, yc);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Fault annotation
      if (fault) {
        ctx.fillStyle = fault === "stg" ? "rgba(239,68,68,0.15)" : fault === "oc" ? "rgba(245,158,11,0.15)" : "rgba(249,115,22,0.15)";
        ctx.fillRect(0, 0, W, H);
        const faultLabel = fault === "stg" ? "SHORT TO GROUND" : fault === "oc" ? "OPEN CIRCUIT" : "OUT OF RANGE";
        ctx.fillStyle = fault === "stg" ? "#ef4444" : fault === "oc" ? "#f59e0b" : "#f97316";
        ctx.font = `bold ${Math.round(H * 0.085)}px Orbitron, monospace`;
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(nowS * 2));
        ctx.fillText(faultLabel, W / 2, H / 2 - 4);
        ctx.globalAlpha = 1;
      }

      // ── Info panel (top-right)
      const panelX = W - 4;
      ctx.textAlign = "right";
      ctx.font = `bold 10px Share Tech Mono, monospace`;
      ctx.fillStyle = cfg.color;
      ctx.fillText(cfg.label, panelX, 14);
      ctx.fillStyle = "rgba(0,200,120,0.7)";
      ctx.font = `9px Share Tech Mono, monospace`;
      ctx.fillText(cfg.frequency, panelX, 27);
      ctx.fillText(`${cfg.timeDivMs}ms/div  ${cfg.voltDiv}V/div`, panelX, 40);

      // Live measurement
      const lastV = voltBuffer.current[(bufIdx.current - 1 + BUFFER_SIZE) % BUFFER_SIZE];
      ctx.fillStyle = fault ? (fault === "stg" ? "#ef4444" : "#f59e0b") : "#ffffff";
      ctx.font = `bold 11px Share Tech Mono, monospace`;
      ctx.fillText(lastV.toFixed(3) + " V", panelX, 57);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [sensorId, fault]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#020c18", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", borderBottom: "1px solid rgba(0,200,120,0.2)", flexShrink: 0 }}>
        <span style={{ fontSize: "0.55rem", color: "#00e090", fontFamily: "Orbitron, monospace", letterSpacing: "0.12em" }}>
          {isAr ? "أوسيلوسكوب السيارة" : "AUTOMOTIVE OSCILLOSCOPE"}
        </span>
        <div style={{ display: "flex", gap: "12px" }}>
          {["CH1", "CH2"].map((ch, i) => (
            <div key={ch} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "20px", height: "2px", background: i === 0 ? "#00f2ff" : "#f59e0b" }} />
              <span style={{ fontSize: "0.5rem", color: "#555", fontFamily: "Share Tech Mono, monospace" }}>{ch}: {i === 0 ? (sensorId?.toUpperCase() ?? "---") : "REF"}</span>
            </div>
          ))}
          <span style={{ fontSize: "0.5rem", color: "#00e090", fontFamily: "Share Tech Mono, monospace", border: "1px solid rgba(0,200,120,0.3)", padding: "1px 5px", borderRadius: "2px" }}>RUN</span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      {/* Measurement bar */}
      <div style={{ display: "flex", gap: "20px", padding: "4px 12px", borderTop: "1px solid rgba(0,200,120,0.15)", background: "#010a14", flexShrink: 0 }}>
        {[
          ["Vpp", fault === "stg" ? "0.00V" : fault === "oc" ? "---" : `${((CONFIGS[sensorId ?? ""] || DEFAULT_CONFIG).vMax - (CONFIGS[sensorId ?? ""] || DEFAULT_CONFIG).vMin).toFixed(2)}V`],
          ["Freq", (CONFIGS[sensorId ?? ""] || DEFAULT_CONFIG).frequency],
          ["Trigger", `${(CONFIGS[sensorId ?? ""] || DEFAULT_CONFIG).vCenter.toFixed(2)}V`],
          ["Scale", `${(CONFIGS[sensorId ?? ""] || DEFAULT_CONFIG).timeDivMs}ms/div`],
          ["Status", fault ? fault.toUpperCase() : "OK"],
        ].map(([label, value]) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span style={{ fontSize: "0.42rem", color: "#444", fontFamily: "Share Tech Mono, monospace", letterSpacing: "0.1em" }}>{label}</span>
            <span style={{ fontSize: "0.58rem", color: fault && label === "Status" ? "#ef4444" : "#00e090", fontFamily: "Share Tech Mono, monospace" }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
