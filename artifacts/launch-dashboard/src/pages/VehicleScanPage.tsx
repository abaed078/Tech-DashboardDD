import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text, Environment } from "@react-three/drei";
import * as THREE from "three";
import { QRCodeSVG } from "qrcode.react";
import { useLang } from "@/context/LanguageContext";

// ─── Sensor definitions ──────────────────────────────────────────────────────

type SensorStatus = "normal" | "warning" | "fault";

interface SensorDef {
  id: string;
  name: string;
  nameAr: string;
  position: [number, number, number];
  system: string;
  systemAr: string;
  voltage: string;
  dtc: string;
  description: string;
  descriptionAr: string;
}

const SENSORS: SensorDef[] = [
  { id: "maf",  name: "MAF Sensor",      nameAr: "حساس MAF",         position: [1.55, 0.55, 0.65],  system: "Engine",   systemAr: "المحرك",      voltage: "0–5V", dtc: "P0101", description: "Mass Air Flow – measures intake air mass",       descriptionAr: "يقيس كتلة هواء السحب للمحرك" },
  { id: "map",  name: "MAP Sensor",      nameAr: "حساس MAP",         position: [0.85, 0.6, 0],     system: "Engine",   systemAr: "المحرك",      voltage: "0–5V", dtc: "P0106", description: "Manifold Absolute Pressure sensor",              descriptionAr: "يقيس ضغط مشعب السحب المطلق" },
  { id: "tps",  name: "TPS Sensor",      nameAr: "حساس TPS",         position: [1.2, 0.52, -0.55], system: "Engine",   systemAr: "المحرك",      voltage: "0–5V", dtc: "P0122", description: "Throttle Position Sensor",                       descriptionAr: "يقيس موضع خانق الهواء" },
  { id: "cts",  name: "Coolant Temp",    nameAr: "حرارة التبريد",    position: [0.6, 0.75, -0.5],  system: "Cooling",  systemAr: "التبريد",     voltage: "NTC",  dtc: "P0116", description: "Engine Coolant Temperature sensor",              descriptionAr: "يقيس درجة حرارة سائل التبريد" },
  { id: "ckp",  name: "CKP Sensor",      nameAr: "حساس CKP",         position: [0.4, -0.1, 0.6],   system: "Engine",   systemAr: "المحرك",      voltage: "5V",   dtc: "P0335", description: "Crankshaft Position – RPM & timing",             descriptionAr: "يراقب وضع عمود المرفق وسرعة المحرك" },
  { id: "o2f",  name: "O2 Front",        nameAr: "لامبدا أمامي",     position: [1.0, -0.22, 0.2],  system: "Exhaust",  systemAr: "العادم",      voltage: "0–1V", dtc: "P0131", description: "Front O2 Lambda – Air/Fuel ratio upstream",      descriptionAr: "يقيس نسبة الهواء/وقود قبل المحفز" },
  { id: "o2r",  name: "O2 Rear",         nameAr: "لامبدا خلفي",      position: [-0.6, -0.22, 0.2], system: "Exhaust",  systemAr: "العادم",      voltage: "0–1V", dtc: "P0141", description: "Rear O2 Lambda – catalyst efficiency monitor",   descriptionAr: "يراقب كفاءة المحفز الحفازي" },
  { id: "bms",  name: "BMS / Battery",   nameAr: "BMS البطارية",     position: [-1.6, 0.35, 0.55], system: "Electrical", systemAr: "الكهرباء",  voltage: "12V",  dtc: "P0562", description: "Battery Management System – voltage & health",   descriptionAr: "يراقب جهد وصحة البطارية" },
  { id: "absfl",name: "ABS Front-L",     nameAr: "ABS أمام يسار",    position: [1.95, -0.15, 0.9], system: "Brakes",   systemAr: "الفرامل",     voltage: "5V",   dtc: "C0031", description: "ABS wheel speed sensor – front left",            descriptionAr: "يقيس سرعة العجلة الأمامية اليسرى" },
  { id: "absfr",name: "ABS Front-R",     nameAr: "ABS أمام يمين",    position: [1.95, -0.15,-0.9], system: "Brakes",   systemAr: "الفرامل",     voltage: "5V",   dtc: "C0034", description: "ABS wheel speed sensor – front right",           descriptionAr: "يقيس سرعة العجلة الأمامية اليمنى" },
  { id: "absrl",name: "ABS Rear-L",      nameAr: "ABS خلف يسار",     position: [-1.9, -0.15, 0.9], system: "Brakes",   systemAr: "الفرامل",     voltage: "5V",   dtc: "C0041", description: "ABS wheel speed sensor – rear left",             descriptionAr: "يقيس سرعة العجلة الخلفية اليسرى" },
  { id: "absrr",name: "ABS Rear-R",      nameAr: "ABS خلف يمين",     position: [-1.9, -0.15,-0.9], system: "Brakes",   systemAr: "الفرامل",     voltage: "5V",   dtc: "C0044", description: "ABS wheel speed sensor – rear right",            descriptionAr: "يقيس سرعة العجلة الخلفية اليمنى" },
];

const STATUS_COLOR: Record<SensorStatus, string> = {
  normal: "#00ff88",
  warning: "#f59e0b",
  fault: "#ef4444",
};

const STATUS_THREE: Record<SensorStatus, THREE.Color> = {
  normal:  new THREE.Color("#00ff88"),
  warning: new THREE.Color("#f59e0b"),
  fault:   new THREE.Color("#ef4444"),
};

// ─── Car body ─────────────────────────────────────────────────────────────────

function CarBody({ xray, explode }: { xray: boolean; explode: boolean }) {
  const matProps = {
    color: xray ? "#0a1628" : "#111827",
    wireframe: false,
    transparent: true,
    opacity: xray ? 0.18 : 0.92,
    metalness: 0.8,
    roughness: 0.2,
  };
  const panelMat = { ...matProps, color: xray ? "#091420" : "#0d1520" };

  const ex = explode ? 1 : 0;
  const ease = (v: number) => v;

  return (
    <group>
      {/* Main body hull */}
      <mesh position={[0, 0.35 + ease(ex) * 0.0, 0]}>
        <boxGeometry args={[4.3, 0.72, 1.9]} />
        <meshStandardMaterial {...matProps} />
      </mesh>

      {/* Cabin */}
      <mesh position={[-0.25, 0.98 + ease(ex) * 0.6, 0]}>
        <boxGeometry args={[2.1, 0.75, 1.62]} />
        <meshStandardMaterial {...matProps} color={xray ? "#091a30" : "#0f1e2e"} />
      </mesh>

      {/* Hood */}
      <mesh position={[1.35, 0.68 + ease(ex) * 0.4, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[1.45, 0.09, 1.78]} />
        <meshStandardMaterial {...panelMat} />
      </mesh>

      {/* Trunk lid */}
      <mesh position={[-1.55, 0.68 + ease(ex) * 0.4, 0]}>
        <boxGeometry args={[0.85, 0.08, 1.72]} />
        <meshStandardMaterial {...panelMat} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[2.2 + ease(ex) * 0.8, 0.28, 0]}>
        <boxGeometry args={[0.12, 0.38, 1.88]} />
        <meshStandardMaterial color={xray ? "#0a2040" : "#1a2a3a"} transparent opacity={xray ? 0.2 : 0.9} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rear bumper */}
      <mesh position={[-2.2 - ease(ex) * 0.8, 0.28, 0]}>
        <boxGeometry args={[0.12, 0.38, 1.88]} />
        <meshStandardMaterial color={xray ? "#0a2040" : "#1a2a3a"} transparent opacity={xray ? 0.2 : 0.9} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Front windshield */}
      <mesh position={[0.72, 1.02 + ease(ex) * 0.6, 0]} rotation={[0, 0, -0.55]}>
        <boxGeometry args={[0.08, 0.82, 1.55]} />
        <meshStandardMaterial color="#0af" transparent opacity={xray ? 0.08 : 0.25} metalness={0.1} roughness={0.0} />
      </mesh>

      {/* Rear windshield */}
      <mesh position={[-1.2, 1.02 + ease(ex) * 0.6, 0]} rotation={[0, 0, 0.52]}>
        <boxGeometry args={[0.08, 0.82, 1.55]} />
        <meshStandardMaterial color="#0af" transparent opacity={xray ? 0.08 : 0.25} metalness={0.1} roughness={0.0} />
      </mesh>

      {/* Wheels ×4 */}
      {[
        [1.9 + ease(ex) * 0.4, -0.05, 0.98 + ease(ex) * 0.4],
        [1.9 + ease(ex) * 0.4, -0.05, -0.98 - ease(ex) * 0.4],
        [-1.85 - ease(ex) * 0.4, -0.05, 0.98 + ease(ex) * 0.4],
        [-1.85 - ease(ex) * 0.4, -0.05, -0.98 - ease(ex) * 0.4],
      ].map((pos, i) => (
        <group key={i}>
          <mesh position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.38, 0.38, 0.26, 32]} />
            <meshStandardMaterial color="#050505" metalness={0.3} roughness={0.9} />
          </mesh>
          {/* Rim */}
          <mesh position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.27, 16]} />
            <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Hub */}
          <mesh position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.28, 8]} />
            <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      {/* X-ray internals — engine block, ECU, battery, wiring */}
      {xray && (
        <group>
          {/* Engine block */}
          <mesh position={[0.9 + ease(ex) * 0.3, 0.32, 0]} renderOrder={1}>
            <boxGeometry args={[1.1, 0.42, 0.9]} />
            <meshStandardMaterial color="#1a3a5c" transparent opacity={0.6} wireframe={false} metalness={0.6} roughness={0.4} />
          </mesh>
          {/* ECU */}
          <mesh position={[0.1 + ease(ex) * 0.2, 0.65, 0.5]}>
            <boxGeometry args={[0.35, 0.06, 0.25]} />
            <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.4} transparent opacity={0.8} />
          </mesh>
          {/* Battery */}
          <mesh position={[-1.55 - ease(ex) * 0.3, 0.38, 0.55]}>
            <boxGeometry args={[0.45, 0.32, 0.38]} />
            <meshStandardMaterial color="#1a4a1a" emissive="#00ff00" emissiveIntensity={0.15} transparent opacity={0.7} />
          </mesh>
          {/* Exhaust pipes */}
          <mesh position={[0.2, -0.18, 0.22]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 3.2, 12]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
          </mesh>
          {/* Drive shaft */}
          <mesh position={[0, -0.18, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 2.8, 8]} />
            <meshStandardMaterial color="#444" metalness={0.9} transparent opacity={0.5} />
          </mesh>
        </group>
      )}

      {/* Neon accent lines */}
      <mesh position={[2.2, 0.08, 0]}>
        <boxGeometry args={[0.02, 0.02, 1.9]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-2.2, 0.08, 0]}>
        <boxGeometry args={[0.02, 0.02, 1.9]} />
        <meshStandardMaterial color="#e60012" emissive="#e60012" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ─── Sensor marker ────────────────────────────────────────────────────────────

function SensorMarker({
  sensor,
  status,
  selected,
  onClick,
  explode,
  showDataFlow,
}: {
  sensor: SensorDef;
  status: SensorStatus;
  selected: boolean;
  onClick: () => void;
  explode: boolean;
  showDataFlow: boolean;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const color = STATUS_THREE[status];

  const ECU_POS: [number, number, number] = [0.1, 0.65, 0.5];

  useFrame((_, delta) => {
    t.current += delta;
    const isFault = status === "fault";
    const speed = isFault ? 4 : 1.2;

    if (sphereRef.current) {
      const pulse = 1 + Math.sin(t.current * speed) * 0.18;
      sphereRef.current.scale.setScalar(isFault ? (Math.sin(t.current * 8) > 0 ? 1 : 0.7) : pulse);
      (sphereRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        selected ? 2 : 0.8 + Math.sin(t.current * speed) * 0.5;
    }

    // Expanding rings
    [ring1Ref, ring2Ref, ring3Ref].forEach((ref, i) => {
      if (ref.current) {
        const phase = ((t.current * 0.8 + i * 0.5) % 1.5) / 1.5;
        ref.current.scale.setScalar(0.5 + phase * 2.5);
        (ref.current.material as THREE.MeshStandardMaterial).opacity = (1 - phase) * 0.6;
      }
    });

    // Shock wave on fault
    if (shockRef.current) {
      if (isFault) {
        const shockPhase = (t.current * 2) % 1;
        shockRef.current.scale.setScalar(1 + shockPhase * 4);
        (shockRef.current.material as THREE.MeshStandardMaterial).opacity = (1 - shockPhase) * 0.8;
        shockRef.current.visible = true;
      } else {
        shockRef.current.visible = false;
      }
    }
  });

  const pos = sensor.position;

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {/* Core sphere */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Expanding rings */}
      {[ring1Ref, ring2Ref, ring3Ref].map((ref, i) => (
        <mesh key={i} ref={ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.008, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Shock wave ring (fault only) */}
      <mesh ref={shockRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 6, 24]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} transparent opacity={0.7} />
      </mesh>

      {/* Selection indicator */}
      {selected && (
        <mesh>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.15} wireframe />
        </mesh>
      )}

      {/* Data flow line to ECU */}
      {showDataFlow && (
        <DataFlowLine from={[0, 0, 0]} to={[ECU_POS[0] - pos[0], ECU_POS[1] - pos[1], ECU_POS[2] - pos[2]]} color={STATUS_COLOR[status]} />
      )}
    </group>
  );
}

// ─── Data flow line ───────────────────────────────────────────────────────────

function DataFlowLine({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const particleRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random());

  useFrame((_, delta) => {
    t.current = (t.current + delta * 0.6) % 1;
    if (particleRef.current) {
      const x = from[0] + (to[0] - from[0]) * t.current;
      const y = from[1] + (to[1] - from[1]) * t.current;
      const z = from[2] + (to[2] - from[2]) * t.current;
      particleRef.current.position.set(x, y, z);
    }
  });

  const points: [number, number, number][] = [from, to];

  return (
    <group>
      <Line points={points} color={color} lineWidth={0.5} transparent opacity={0.25} dashed dashScale={4} dashSize={0.3} gapSize={0.2} />
      <mesh ref={particleRef} position={from}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// ─── ECU Node ─────────────────────────────────────────────────────────────────

function ECUNode() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(clock.getElapsedTime() * 2) * 0.3;
    }
  });
  return (
    <group position={[0.1, 0.65, 0.5]}>
      <mesh ref={ref}>
        <boxGeometry args={[0.25, 0.06, 0.18]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.6} metalness={0.5} roughness={0.2} />
      </mesh>
      <Text position={[0, 0.07, 0]} fontSize={0.055} color="#00f2ff" anchorX="center" anchorY="bottom">
        ECU
      </Text>
    </group>
  );
}

// ─── Ground grid ──────────────────────────────────────────────────────────────

function GroundGrid() {
  return (
    <gridHelper args={[12, 24, "#0a2a4a", "#0a1a2a"]} position={[0, -0.42, 0]} />
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
  statuses,
  selected,
  onSelect,
  xray,
  explode,
  showDataFlow,
}: {
  statuses: Record<string, SensorStatus>;
  selected: string | null;
  onSelect: (id: string) => void;
  xray: boolean;
  explode: boolean;
  showDataFlow: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#050a14"]} />
      <fog attach="fog" args={["#050a14", 8, 20]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[4, 6, 4]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-3, 3, -3]} intensity={0.5} color="#0044ff" />
      <pointLight position={[3, 1, 3]} intensity={0.4} color="#ff4400" />
      <pointLight position={[0, 4, 0]} intensity={0.3} color="#00f2ff" />

      <GroundGrid />
      <CarBody xray={xray} explode={explode} />
      <ECUNode />

      {SENSORS.map((s) => (
        <SensorMarker
          key={s.id}
          sensor={s}
          status={statuses[s.id] ?? "normal"}
          selected={selected === s.id}
          onClick={() => onSelect(s.id)}
          explode={explode}
          showDataFlow={showDataFlow}
        />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        minDistance={3}
        maxDistance={14}
        target={[0, 0.4, 0]}
        autoRotate={false}
      />
    </>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

interface ChatMsg { role: "user" | "ai"; content: string }

function InstructorAIPanel({
  lang,
  selectedSensor,
  statuses,
  onClose,
}: {
  lang: string;
  selectedSensor: string | null;
  statuses: Record<string, SensorStatus>;
  onClose: () => void;
}) {
  const isAr = lang === "ar";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<{ q: string; options: string[]; answer: number; explanation: string }[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [suggestion, setSuggestion] = useState<string>("");
  const chatRef = useRef<HTMLDivElement>(null);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const scrollDown = () => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  };

  useEffect(() => {
    const faultSensors = Object.entries(statuses)
      .filter(([, s]) => s !== "normal")
      .map(([id]) => id);
    if (faultSensors.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`${BASE}/api/ai/adaptive-suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPage: "3D Vehicle Scan", recentSensors: faultSensors, lang }),
        });
        const data = await r.json();
        if (data.suggestion) setSuggestion(data.suggestion);
      } catch (_) {}
    }, 1500);
    return () => clearTimeout(timer);
  }, [statuses, lang]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMsg = { role: "user", content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);
    scrollDown();

    try {
      const resp = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })), lang }),
      });

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const json = JSON.parse(line.slice(6));
          if (json.content) {
            aiContent += json.content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: "ai", content: aiContent };
              return updated;
            });
            scrollDown();
          }
          if (json.done) break;
        }
      }
    } catch (_) {
      setMessages((prev) => [...prev, { role: "ai", content: isAr ? "⚠️ الاتصال بالذكاء الاصطناعي غير متوفر حالياً" : "⚠️ AI connection unavailable" }]);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    setQuizLoading(true);
    setQuiz(null);
    setQuizAnswers({});
    const ctx = selectedSensor
      ? `${SENSORS.find((s) => s.id === selectedSensor)?.name} sensor diagnostics`
      : "automotive sensor diagnostics and DTC fault codes";
    try {
      const r = await fetch(`${BASE}/api/ai/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: ctx, lang }),
      });
      const data = await r.json();
      setQuiz(data.questions ?? []);
    } catch (_) {}
    setQuizLoading(false);
  };

  const panelBg = "rgba(5,12,25,0.97)";
  const border = "1px solid rgba(0,242,255,0.2)";

  return (
    <div style={{
      width: "340px",
      height: "100%",
      background: panelBg,
      borderLeft: isAr ? "none" : border,
      borderRight: isAr ? border : "none",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "10px 14px", borderBottom: border, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "#00f2ff", fontSize: "0.65rem", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em" }}>
          {isAr ? "🤖 المساعد الذكي" : "🤖 AI INSTRUCTOR"}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem" }}>×</button>
      </div>

      {/* Adaptive suggestion */}
      {suggestion && (
        <div style={{ margin: "8px", padding: "8px 10px", background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: "6px", fontSize: "0.62rem", color: "#4ade80", lineHeight: "1.5" }}>
          <span style={{ opacity: 0.6 }}>{isAr ? "اقتراح: " : "Suggestion: "}</span>{suggestion}
        </div>
      )}

      {/* Quiz section */}
      <div style={{ padding: "8px 10px", borderBottom: border }}>
        <button
          onClick={generateQuiz}
          disabled={quizLoading}
          style={{ width: "100%", padding: "7px", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "5px", color: "#a78bfa", cursor: "pointer", fontSize: "0.62rem", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em" }}
        >
          {quizLoading ? (isAr ? "جاري التوليد..." : "Generating...") : (isAr ? "✨ توليد كويز" : "✨ Generate Quiz")}
        </button>
      </div>

      {/* Quiz display */}
      {quiz && quiz.length > 0 && (
        <div style={{ padding: "8px 10px", borderBottom: border, maxHeight: "260px", overflowY: "auto" }}>
          {quiz.map((q, qi) => (
            <div key={qi} style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "0.62rem", color: "#e0e0e0", marginBottom: "5px", lineHeight: "1.4" }}>
                <span style={{ color: "#00f2ff" }}>Q{qi + 1}: </span>{q.q}
              </div>
              {q.options.map((opt, oi) => {
                const answered = quizAnswers[qi] !== undefined;
                const isCorrect = oi === q.answer;
                const isSelected = quizAnswers[qi] === oi;
                let bg = "rgba(255,255,255,0.04)";
                if (answered && isCorrect) bg = "rgba(0,255,136,0.18)";
                else if (answered && isSelected && !isCorrect) bg = "rgba(239,68,68,0.18)";
                return (
                  <button
                    key={oi}
                    onClick={() => !answered && setQuizAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    style={{ display: "block", width: "100%", textAlign: isAr ? "right" : "left", marginBottom: "3px", padding: "4px 8px", background: bg, border: `1px solid ${answered && isCorrect ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: "4px", color: "#ccc", fontSize: "0.58rem", cursor: answered ? "default" : "pointer" }}
                  >
                    {opt}
                  </button>
                );
              })}
              {quizAnswers[qi] !== undefined && (
                <div style={{ fontSize: "0.55rem", color: "#888", marginTop: "3px", lineHeight: "1.4" }}>{q.explanation}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <div style={{ color: "#333", fontSize: "0.6rem", textAlign: "center", marginTop: "20px", lineHeight: "1.8" }}>
            {isAr ? "اسأل عن أي حساس أو كود عطل..." : "Ask about any sensor or fault code..."}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? (isAr ? "flex-start" : "flex-end") : (isAr ? "flex-end" : "flex-start") }}>
            <div style={{
              maxWidth: "88%",
              padding: "7px 10px",
              borderRadius: "8px",
              background: m.role === "user" ? "rgba(0,242,255,0.12)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${m.role === "user" ? "rgba(0,242,255,0.2)" : "rgba(255,255,255,0.08)"}`,
              fontSize: "0.6rem",
              color: m.role === "user" ? "#e0f7ff" : "#d0d0d0",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
            }}>
              {m.content || <span style={{ opacity: 0.4 }}>▋</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 10px", borderTop: border, display: "flex", gap: "6px" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={isAr ? "اسأل الذكاء الاصطناعي..." : "Ask AI about diagnostics..."}
          dir={isAr ? "rtl" : "ltr"}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,242,255,0.2)", borderRadius: "5px", color: "#e0e0e0", padding: "6px 9px", fontSize: "0.62rem", outline: "none", fontFamily: isAr ? "Cairo, sans-serif" : "Share Tech Mono, monospace" }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{ padding: "6px 12px", background: loading ? "rgba(0,242,255,0.05)" : "rgba(0,242,255,0.15)", border: "1px solid rgba(0,242,255,0.3)", borderRadius: "5px", color: "#00f2ff", cursor: loading ? "default" : "pointer", fontSize: "0.6rem" }}
        >
          {isAr ? "إرسال" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const DEFAULT_STATUSES: Record<string, SensorStatus> = {
  maf: "normal", map: "normal", tps: "normal", cts: "normal",
  ckp: "normal", o2f: "normal", o2r: "normal", bms: "normal",
  absfl: "normal", absfr: "normal", absrl: "normal", absrr: "normal",
};

const FAULT_SCENARIO: Record<string, SensorStatus> = {
  ...DEFAULT_STATUSES, maf: "fault", o2f: "warning", bms: "fault", absfl: "warning",
};

export function VehicleScanPage() {
  const { lang, isRTL } = useLang();
  const isAr = lang === "ar";

  const [statuses, setStatuses] = useState<Record<string, SensorStatus>>(DEFAULT_STATUSES);
  const [selected, setSelected] = useState<string | null>(null);
  const [xray, setXray] = useState(false);
  const [explode, setExplode] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [showDataFlow, setShowDataFlow] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [faultExplanation, setFaultExplanation] = useState<string>("");
  const [faultLoading, setFaultLoading] = useState(false);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const selectedSensor = selected ? SENSORS.find((s) => s.id === selected) : null;

  const runScan = async () => {
    setScanRunning(true);
    setScanDone(false);
    setStatuses(DEFAULT_STATUSES);
    await new Promise((r) => setTimeout(r, 2200));
    setStatuses(FAULT_SCENARIO);
    setScanRunning(false);
    setScanDone(true);
  };

  const resetScan = () => {
    setStatuses(DEFAULT_STATUSES);
    setScanDone(false);
    setSelected(null);
    setFaultExplanation("");
  };

  const explainFault = async (sensor: SensorDef) => {
    setFaultLoading(true);
    setFaultExplanation("");
    try {
      const r = await fetch(`${BASE}/api/ai/fault-explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faultCode: sensor.dtc, sensorName: isAr ? sensor.nameAr : sensor.name, lang }),
      });
      const data = await r.json();
      setFaultExplanation(data.explanation ?? "");
    } catch (_) {
      setFaultExplanation(isAr ? "تعذر الاتصال بالذكاء الاصطناعي" : "AI unavailable");
    }
    setFaultLoading(false);
  };

  const btnStyle = (active: boolean, color = "#00f2ff") => ({
    padding: "5px 12px",
    background: active ? `rgba(${color === "#00f2ff" ? "0,242,255" : color === "#a78bfa" ? "167,139,250" : color === "#4ade80" ? "74,222,128" : "245,158,11"},0.18)` : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
    borderRadius: "5px",
    color: active ? color : "#666",
    cursor: "pointer",
    fontSize: "0.58rem",
    fontFamily: isAr ? "Cairo, sans-serif" : "Orbitron, sans-serif",
    letterSpacing: isAr ? "0.01em" : "0.06em",
    transition: "all 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#050a14", overflow: "hidden" }}>

      {/* ── Toolbar ── */}
      <div style={{ padding: "6px 14px", borderBottom: "1px solid rgba(0,242,255,0.1)", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flexShrink: 0 }}>
        <span style={{ fontSize: "0.6rem", color: "#00f2ff", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.12em", marginRight: "4px" }}>
          {isAr ? "فحص السيارة ثلاثي الأبعاد" : "3D VEHICLE SCAN"}
        </span>

        <button onClick={runScan} disabled={scanRunning} style={{ ...btnStyle(scanRunning, "#4ade80"), padding: "5px 16px" }}>
          {scanRunning ? (isAr ? "⟳ جاري الفحص..." : "⟳ SCANNING...") : (isAr ? "▶ فحص ذكي" : "▶ AI SCAN")}
        </button>

        {scanDone && (
          <button onClick={resetScan} style={{ ...btnStyle(false), color: "#f87171" }}>
            {isAr ? "إعادة ضبط" : "RESET"}
          </button>
        )}

        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)" }} />

        <button onClick={() => setXray(!xray)} style={btnStyle(xray, "#00f2ff")}>
          {isAr ? "أشعة X" : "X-RAY"}
        </button>

        <button onClick={() => setExplode(!explode)} style={btnStyle(explode, "#a78bfa")}>
          {isAr ? "تشريح" : "EXPLODE"}
        </button>

        <button onClick={() => setShowDataFlow(!showDataFlow)} style={btnStyle(showDataFlow, "#f59e0b")}>
          {isAr ? "تدفق البيانات" : "DATA FLOW"}
        </button>

        <button onClick={() => setCompareMode(!compareMode)} style={btnStyle(compareMode, "#4ade80")}>
          {isAr ? "مقارنة" : "COMPARE"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
          <button onClick={() => setAiOpen(!aiOpen)} style={btnStyle(aiOpen, "#a78bfa")}>
            {isAr ? "🤖 مساعد ذكي" : "🤖 AI ASSIST"}
          </button>
          <button onClick={() => setShowQR(!showQR)} style={btnStyle(showQR)}>
            {isAr ? "QR مشاركة" : "SHARE QR"}
          </button>
        </div>
      </div>

      {/* ── Status bar ── */}
      {(scanRunning || scanDone) && (
        <div style={{ padding: "4px 14px", background: scanDone ? "rgba(239,68,68,0.08)" : "rgba(0,255,136,0.06)", borderBottom: "1px solid rgba(0,242,255,0.08)", display: "flex", gap: "16px", alignItems: "center", flexShrink: 0 }}>
          {scanRunning && (
            <span style={{ fontSize: "0.58rem", color: "#4ade80", fontFamily: "Share Tech Mono, monospace" }}>
              ⟳ {isAr ? "جاري تحليل CAN-Bus..." : "Analyzing CAN-Bus protocols..."}
            </span>
          )}
          {scanDone && (
            <>
              {Object.values(statuses).filter((s) => s === "fault").length > 0 && (
                <span style={{ fontSize: "0.58rem", color: "#ef4444", fontFamily: "Share Tech Mono, monospace" }}>
                  ✕ {Object.values(statuses).filter((s) => s === "fault").length} {isAr ? "عطل مكتشف" : "FAULT(S) DETECTED"}
                </span>
              )}
              {Object.values(statuses).filter((s) => s === "warning").length > 0 && (
                <span style={{ fontSize: "0.58rem", color: "#f59e0b", fontFamily: "Share Tech Mono, monospace" }}>
                  ⚠ {Object.values(statuses).filter((s) => s === "warning").length} {isAr ? "تحذير" : "WARNING(S)"}
                </span>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* Sensor list sidebar */}
        <div style={{ width: "200px", background: "rgba(0,0,0,0.4)", borderRight: "1px solid rgba(0,242,255,0.1)", overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "8px 10px 4px", fontSize: "0.5rem", color: "#555", letterSpacing: "0.12em" }}>
            {isAr ? "الحساسات" : "SENSORS"}
          </div>
          {SENSORS.map((s) => {
            const st = statuses[s.id] ?? "normal";
            const isSelected = selected === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(isSelected ? null : s.id)}
                style={{ display: "block", width: "100%", padding: "7px 10px", background: isSelected ? "rgba(0,242,255,0.08)" : "transparent", border: "none", borderLeft: `2px solid ${STATUS_COLOR[st]}`, cursor: "pointer", textAlign: isAr ? "right" : "left", marginBottom: "1px", transition: "all 0.15s" }}
              >
                <div style={{ fontSize: "0.58rem", color: isSelected ? "#e0e0e0" : "#aaa", fontFamily: isAr ? "Cairo, sans-serif" : "Share Tech Mono, monospace" }}>
                  {isAr ? s.nameAr : s.name}
                </div>
                <div style={{ fontSize: "0.5rem", color: STATUS_COLOR[st], marginTop: "2px" }}>
                  {st === "normal" ? (isAr ? "طبيعي" : "NORMAL") : st === "warning" ? (isAr ? "تحذير" : "WARNING") : (isAr ? "عطل" : "FAULT")} · {s.dtc}
                </div>
              </button>
            );
          })}
        </div>

        {/* 3D Canvas(es) */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Primary canvas */}
          <div style={{ flex: 1, position: "relative" }}>
            <Canvas camera={{ position: [5, 3.5, 5], fov: 45 }}>
              <Suspense fallback={null}>
                <Scene statuses={statuses} selected={selected} onSelect={setSelected} xray={xray} explode={explode} showDataFlow={showDataFlow} />
              </Suspense>
            </Canvas>

            {/* Labels overlay */}
            {compareMode && (
              <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "4px", padding: "3px 12px", fontSize: "0.55rem", color: "#f87171", fontFamily: "Share Tech Mono, monospace" }}>
                {isAr ? "سيارة معطوبة" : "FAULTY VEHICLE"}
              </div>
            )}

            {/* Scan animation overlay */}
            {scanRunning && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                <div style={{ position: "absolute", width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, #00f2ff, transparent)", animation: "scanLine 1.8s linear infinite" }} />
              </div>
            )}
          </div>

          {/* Compare canvas */}
          {compareMode && (
            <div style={{ flex: 1, position: "relative", borderLeft: "1px solid rgba(0,242,255,0.15)" }}>
              <Canvas camera={{ position: [5, 3.5, 5], fov: 45 }}>
                <Suspense fallback={null}>
                  <Scene statuses={DEFAULT_STATUSES} selected={null} onSelect={() => {}} xray={xray} explode={explode} showDataFlow={showDataFlow} />
                </Suspense>
              </Canvas>
              <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,255,136,0.15)", border: "1px solid rgba(0,255,136,0.4)", borderRadius: "4px", padding: "3px 12px", fontSize: "0.55rem", color: "#4ade80", fontFamily: "Share Tech Mono, monospace" }}>
                {isAr ? "سيارة سليمة" : "HEALTHY VEHICLE"}
              </div>
            </div>
          )}
        </div>

        {/* Sensor detail panel */}
        {selectedSensor && (
          <div style={{ width: "240px", background: "rgba(5,10,20,0.95)", borderLeft: "1px solid rgba(0,242,255,0.15)", padding: "14px", overflowY: "auto", flexShrink: 0 }}>
            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "0.65rem", color: "#00f2ff", fontFamily: "Orbitron, sans-serif", marginBottom: "4px" }}>
                {isAr ? selectedSensor.nameAr : selectedSensor.name}
              </div>
              <div style={{ display: "inline-block", padding: "2px 8px", borderRadius: "3px", fontSize: "0.55rem", background: `${STATUS_COLOR[statuses[selectedSensor.id] ?? "normal"]}22`, border: `1px solid ${STATUS_COLOR[statuses[selectedSensor.id] ?? "normal"]}66`, color: STATUS_COLOR[statuses[selectedSensor.id] ?? "normal"] }}>
                {selectedSensor.dtc} · {(statuses[selectedSensor.id] ?? "normal").toUpperCase()}
              </div>
            </div>

            {[
              [isAr ? "النظام" : "System", isAr ? selectedSensor.systemAr : selectedSensor.system],
              [isAr ? "الجهد" : "Voltage", selectedSensor.voltage],
              [isAr ? "الوصف" : "Description", isAr ? selectedSensor.descriptionAr : selectedSensor.description],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "0.48rem", color: "#555", letterSpacing: "0.1em", marginBottom: "2px" }}>{label}</div>
                <div style={{ fontSize: "0.6rem", color: "#ccc", lineHeight: "1.4" }}>{value}</div>
              </div>
            ))}

            {statuses[selectedSensor.id] !== "normal" && (
              <button
                onClick={() => explainFault(selectedSensor)}
                disabled={faultLoading}
                style={{ width: "100%", padding: "7px", marginTop: "8px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "5px", color: "#f87171", cursor: faultLoading ? "default" : "pointer", fontSize: "0.6rem", fontFamily: isAr ? "Cairo, sans-serif" : "Orbitron, sans-serif" }}
              >
                {faultLoading ? (isAr ? "جاري الشرح..." : "Analyzing...") : (isAr ? "🤖 شرح العطل بالذكاء الاصطناعي" : "🤖 AI Fault Explanation")}
              </button>
            )}

            {faultExplanation && (
              <div style={{ marginTop: "10px", padding: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "0.58rem", color: "#c0c0c0", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                {faultExplanation}
              </div>
            )}
          </div>
        )}

        {/* AI Panel */}
        {aiOpen && (
          <InstructorAIPanel lang={lang} selectedSensor={selected} statuses={statuses} onClose={() => setAiOpen(false)} />
        )}

        {/* QR Code overlay */}
        {showQR && (
          <div style={{ position: "absolute", bottom: "20px", right: "20px", background: "rgba(5,10,20,0.97)", border: "1px solid rgba(0,242,255,0.3)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "0.55rem", color: "#00f2ff", letterSpacing: "0.1em", fontFamily: "Orbitron, sans-serif" }}>
              {isAr ? "امسح للمتابعة" : "SCAN TO FOLLOW"}
            </div>
            <QRCodeSVG value={window.location.href} size={110} bgColor="#050a14" fgColor="#00f2ff" level="M" />
            <div style={{ fontSize: "0.48rem", color: "#444", maxWidth: "110px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {window.location.host}
            </div>
            <button onClick={() => setShowQR(false)} style={{ fontSize: "0.55rem", color: "#555", background: "none", border: "none", cursor: "pointer" }}>
              {isAr ? "إغلاق" : "close"}
            </button>
          </div>
        )}
      </div>

      {/* Scan line animation */}
      <style>{`
        @keyframes scanLine {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
}
