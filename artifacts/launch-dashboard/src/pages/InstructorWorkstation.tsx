import { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import * as THREE from "three";
import { AutomotiveOscilloscope, type FaultType } from "@/components/AutomotiveOscilloscope";

// ─── Sensor master data ────────────────────────────────────────────────────────

interface SensorDef {
  id: string; name: string; nameAr: string;
  position: [number, number, number];
  system: string; dtc: string;
  nominalV: string; description: string;
}

const SENSORS: SensorDef[] = [
  { id: "maf",   name: "MAF Sensor",     nameAr: "حساس MAF",      position: [1.55, 0.55, 0.65],   system: "Induction",  dtc: "P0101", nominalV: "1.5V",  description: "Hot-wire mass air flow" },
  { id: "map",   name: "MAP Sensor",     nameAr: "حساس MAP",      position: [0.85, 0.62, 0.0],    system: "Induction",  dtc: "P0106", nominalV: "1.2V",  description: "Piezoresistive pressure" },
  { id: "tps",   name: "TPS",            nameAr: "حساس TPS",      position: [1.22, 0.52, -0.55],  system: "Induction",  dtc: "P0122", nominalV: "0.72V", description: "Rotary potentiometer" },
  { id: "cts",   name: "Coolant Temp",   nameAr: "حرارة التبريد", position: [0.62, 0.77, -0.5],   system: "Cooling",    dtc: "P0116", nominalV: "1.82V", description: "NTC thermistor" },
  { id: "ckp",   name: "CKP Sensor",     nameAr: "حساس CKP",     position: [0.42, -0.12, 0.6],   system: "Engine",     dtc: "P0335", nominalV: "AC 2.5Vp", description: "VR inductive, 60-2 tooth" },
  { id: "o2f",   name: "O2 Upstream",    nameAr: "لامبدا أمامي",  position: [1.02, -0.24, 0.22],  system: "Exhaust",    dtc: "P0131", nominalV: "0.5V",  description: "Zirconia lambda upstream" },
  { id: "o2r",   name: "O2 Downstream",  nameAr: "لامبدا خلفي",  position: [-0.6, -0.24, 0.22],  system: "Exhaust",    dtc: "P0141", nominalV: "0.5V",  description: "Zirconia lambda downstream" },
  { id: "bms",   name: "BMS / Battery",  nameAr: "BMS البطارية",  position: [-1.62, 0.38, 0.56],  system: "Electrical", dtc: "P0562", nominalV: "13.8V", description: "Battery management system" },
  { id: "absfl", name: "ABS Front-L",    nameAr: "ABS أمام يسار", position: [1.95, -0.18, 0.92],  system: "Brakes",     dtc: "C0031", nominalV: "5V sq", description: "Hall effect wheel speed" },
  { id: "absfr", name: "ABS Front-R",    nameAr: "ABS أمام يمين", position: [1.95, -0.18, -0.92], system: "Brakes",     dtc: "C0034", nominalV: "5V sq", description: "Hall effect wheel speed" },
  { id: "absrl", name: "ABS Rear-L",     nameAr: "ABS خلف يسار",  position: [-1.9, -0.18, 0.92],  system: "Brakes",     dtc: "C0041", nominalV: "5V sq", description: "Hall effect wheel speed" },
  { id: "absrr", name: "ABS Rear-R",     nameAr: "ABS خلف يمين",  position: [-1.9, -0.18, -0.92], system: "Brakes",     dtc: "C0044", nominalV: "5V sq", description: "Hall effect wheel speed" },
];

// Wire harness routing: realistic spline paths from sensor → ECU
const ECU: [number, number, number] = [0.1, 0.62, 0.5];
const WIRE_PATHS: Record<string, [number, number, number][]> = {
  maf:   [[1.55,0.55,0.65], [1.3,0.35,0.55], [0.85,0.32,0.48], [0.3,0.45,0.48], ECU],
  map:   [[0.85,0.62,0.0],  [0.7,0.5,0.2],   [0.4,0.45,0.38],  [0.2,0.52,0.46], ECU],
  tps:   [[1.22,0.52,-0.55],[1.0,0.32,-0.35], [0.6,0.3,0.0],   [0.3,0.44,0.35], ECU],
  cts:   [[0.62,0.77,-0.5], [0.55,0.5,-0.3],  [0.4,0.44,0.0],  [0.25,0.5,0.35], ECU],
  ckp:   [[0.42,-0.12,0.6], [0.38,0.08,0.55], [0.3,0.28,0.52], [0.18,0.48,0.5], ECU],
  o2f:   [[1.02,-0.24,0.22],[0.75,0.0,0.32],  [0.5,0.25,0.44], [0.25,0.48,0.48],ECU],
  o2r:   [[-0.6,-0.24,0.22],[-0.2,0.0,0.35],  [0.05,0.28,0.46],[0.1,0.5,0.5],   ECU],
  bms:   [[-1.62,0.38,0.56],[-1.0,0.32,0.52],[-0.3,0.3,0.52],[0.0,0.45,0.5],    ECU],
  absfl: [[1.95,-0.18,0.92],[1.55,-0.08,0.72],[1.1,0.05,0.62],[0.55,0.28,0.52],  ECU],
  absfr: [[1.95,-0.18,-0.92],[1.55,-0.08,-0.72],[1.1,0.05,-0.62],[0.55,0.28,-0.3], [0.3,0.38,0.1], ECU],
  absrl: [[-1.9,-0.18,0.92],[-1.3,-0.08,0.72],[-0.5,0.05,0.62],[0.0,0.3,0.55],  ECU],
  absrr: [[-1.9,-0.18,-0.92],[-1.3,-0.08,-0.72],[-0.5,0.05,-0.62],[0.0,0.3,-0.3],[0.05,0.42,0.2],ECU],
};

export type ViewMode = "xray" | "explode" | "dissect";
type SensorStatus = "normal" | "warning" | "fault";

// ─── 3D Components ────────────────────────────────────────────────────────────

function ClippingController({ dissect }: { dissect: boolean }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.localClippingEnabled = dissect;
    return () => { gl.localClippingEnabled = false; };
  }, [dissect, gl]);
  return null;
}

const DISSECT_PLANE = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.52)];

function matProps(xray: boolean, dissect: boolean, color: string, emissive?: string) {
  return {
    color,
    emissive: emissive ?? "#000000",
    emissiveIntensity: emissive ? 0.3 : 0,
    transparent: true,
    opacity: xray ? 0.12 : dissect ? 0.35 : 0.92,
    metalness: 0.75,
    roughness: 0.28,
    clippingPlanes: dissect ? DISSECT_PLANE : [],
    clipShadows: true,
  } as const;
}

function EngineCutaway({ dissect, xray }: { dissect: boolean; xray: boolean }) {
  if (!dissect && !xray) return null;
  const opacity = dissect ? 0.88 : 0.45;
  return (
    <group>
      {/* Engine block — cast iron texture */}
      <mesh position={[0.9, 0.32, 0]}>
        <boxGeometry args={[1.1, 0.44, 0.92]} />
        <meshPhysicalMaterial color="#1c1c1c" metalness={0.6} roughness={0.85} transparent opacity={opacity} clearcoat={0.1} clippingPlanes={dissect ? DISSECT_PLANE : []} clipShadows />
      </mesh>
      {/* 4 Cylinders (bores) */}
      {[-0.32, -0.1, 0.12, 0.34].map((x, i) => (
        <group key={i}>
          <mesh position={[0.9 + x, 0.38, 0]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.072, 0.072, 0.38, 16]} />
            <meshPhysicalMaterial color="#1a1a1a" metalness={0.5} roughness={0.9} transparent opacity={opacity} clippingPlanes={dissect ? DISSECT_PLANE : []} />
          </mesh>
          {/* Piston */}
          <mesh position={[0.9 + x, 0.28 + Math.sin(i * 1.57) * 0.06, 0]}>
            <cylinderGeometry args={[0.068, 0.068, 0.075, 16]} />
            <meshPhysicalMaterial color="#c0c0c0" metalness={0.92} roughness={0.12} transparent opacity={opacity} clippingPlanes={dissect ? DISSECT_PLANE : []} />
          </mesh>
          {/* Piston rings */}
          {[0.015, 0.0, -0.015].map((ry, ri) => (
            <mesh key={ri} position={[0.9 + x, 0.28 + Math.sin(i * 1.57) * 0.06 + ry, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.068, 0.004, 6, 24]} />
              <meshPhysicalMaterial color="#888" metalness={0.95} roughness={0.05} transparent opacity={opacity} clippingPlanes={dissect ? DISSECT_PLANE : []} />
            </mesh>
          ))}
          {/* Connecting rod */}
          <mesh position={[0.9 + x, 0.18, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
            <meshPhysicalMaterial color="#777" metalness={0.9} roughness={0.2} transparent opacity={opacity * 0.8} clippingPlanes={dissect ? DISSECT_PLANE : []} />
          </mesh>
        </group>
      ))}
      {/* Crankshaft */}
      <mesh position={[0.9, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.038, 0.038, 1.05, 16]} />
        <meshPhysicalMaterial color="#aaa" metalness={0.95} roughness={0.08} transparent opacity={opacity} clippingPlanes={dissect ? DISSECT_PLANE : []} />
      </mesh>
      {/* Camshaft */}
      <mesh position={[0.9, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 1.05, 12]} />
        <meshPhysicalMaterial color="#bbb" metalness={0.9} roughness={0.1} transparent opacity={opacity * 0.7} clippingPlanes={dissect ? DISSECT_PLANE : []} />
      </mesh>
      {/* ECU module */}
      <mesh position={ECU}>
        <boxGeometry args={[0.28, 0.055, 0.2]} />
        <meshPhysicalMaterial color="#0a1a2a" emissive="#00f2ff" emissiveIntensity={0.5} metalness={0.5} roughness={0.3} transparent opacity={0.9} clippingPlanes={dissect ? DISSECT_PLANE : []} />
      </mesh>
      {/* ECU label */}
      <Text position={[ECU[0], ECU[1] + 0.06, ECU[2]]} fontSize={0.048} color="#00f2ff" anchorX="center">ECU</Text>
      {/* Battery pack */}
      <mesh position={[-1.62, 0.36, 0.56]}>
        <boxGeometry args={[0.46, 0.3, 0.38]} />
        <meshPhysicalMaterial color="#0a1a0a" emissive="#00ff00" emissiveIntensity={0.15} metalness={0.4} roughness={0.7} transparent opacity={opacity} clippingPlanes={dissect ? DISSECT_PLANE : []} />
      </mesh>
    </group>
  );
}

function CarBody({ xray, explode, dissect }: { xray: boolean; explode: boolean; dissect: boolean }) {
  const ex = explode ? 1 : 0;
  const mp = (c: string, em?: string) => matProps(xray, dissect, c, em);

  return (
    <group>
      {/* Main hull */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[4.3, 0.73, 1.92]} />
        <meshPhysicalMaterial {...mp("#0d141f")} clearcoat={0.8} clearcoatRoughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[-0.26, 0.99 + ex * 0.55, 0]}>
        <boxGeometry args={[2.12, 0.76, 1.64]} />
        <meshPhysicalMaterial {...mp("#0b1825")} clearcoat={0.6} />
      </mesh>
      {/* Hood */}
      <mesh position={[1.36, 0.69 + ex * 0.3, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[1.46, 0.09, 1.78]} />
        <meshPhysicalMaterial {...mp("#0c1520")} clearcoat={0.9} />
      </mesh>
      {/* Trunk */}
      <mesh position={[-1.56, 0.69 + ex * 0.3, 0]}>
        <boxGeometry args={[0.86, 0.08, 1.72]} />
        <meshPhysicalMaterial {...mp("#0c1520")} clearcoat={0.9} />
      </mesh>
      {/* Front bumper */}
      <mesh position={[2.22 + ex * 0.7, 0.28, 0]}>
        <boxGeometry args={[0.14, 0.38, 1.9]} />
        <meshPhysicalMaterial {...mp("#162030")} clearcoat={0.5} />
      </mesh>
      {/* Rear bumper */}
      <mesh position={[-2.22 - ex * 0.7, 0.28, 0]}>
        <boxGeometry args={[0.14, 0.38, 1.9]} />
        <meshPhysicalMaterial {...mp("#162030")} clearcoat={0.5} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0.73, 1.03 + ex * 0.55, 0]} rotation={[0, 0, -0.56]}>
        <boxGeometry args={[0.07, 0.82, 1.56]} />
        <meshPhysicalMaterial color="#0af" transparent opacity={xray ? 0.05 : 0.2} metalness={0.05} roughness={0} transmission={xray ? 0 : 0.6} />
      </mesh>
      {/* Rear glass */}
      <mesh position={[-1.22, 1.03 + ex * 0.55, 0]} rotation={[0, 0, 0.53]}>
        <boxGeometry args={[0.07, 0.82, 1.56]} />
        <meshPhysicalMaterial color="#0af" transparent opacity={xray ? 0.05 : 0.2} metalness={0.05} roughness={0} />
      </mesh>
      {/* 4 Wheels */}
      {([
        [1.92 + ex * 0.35, -0.05, 0.99 + ex * 0.35],
        [1.92 + ex * 0.35, -0.05, -0.99 - ex * 0.35],
        [-1.86 - ex * 0.35, -0.05, 0.99 + ex * 0.35],
        [-1.86 - ex * 0.35, -0.05, -0.99 - ex * 0.35],
      ] as [number,number,number][]).map((p, i) => (
        <group key={i}>
          <mesh position={p} rotation={[0,0,Math.PI/2]}>
            <cylinderGeometry args={[0.39, 0.39, 0.27, 32]} />
            <meshPhysicalMaterial color="#060606" metalness={0.2} roughness={0.95} transparent opacity={xray ? 0.2 : 1} />
          </mesh>
          <mesh position={p} rotation={[0,0,Math.PI/2]}>
            <cylinderGeometry args={[0.25, 0.25, 0.28, 16]} />
            <meshPhysicalMaterial color="#3a3a3a" metalness={0.92} roughness={0.1} transparent opacity={xray ? 0.3 : 1} />
          </mesh>
          <mesh position={p} rotation={[0,0,Math.PI/2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.29, 8]} />
            <meshPhysicalMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}
      {/* Neon underline */}
      <mesh position={[2.22, 0.05, 0]}>
        <boxGeometry args={[0.015, 0.015, 1.95]} />
        <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={3} />
      </mesh>
      <mesh position={[-2.22, 0.05, 0]}>
        <boxGeometry args={[0.015, 0.015, 1.95]} />
        <meshStandardMaterial color="#e60012" emissive="#e60012" emissiveIntensity={3} />
      </mesh>
      <EngineCutaway dissect={dissect} xray={xray} />
    </group>
  );
}

function SensorMarker({ sensor, status, selected, fault, onClick }: {
  sensor: SensorDef; status: SensorStatus; selected: boolean;
  fault: FaultType; onClick: () => void;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const shockRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);

  const color = status === "fault" ? new THREE.Color("#ef4444")
    : status === "warning" ? new THREE.Color("#f59e0b")
    : new THREE.Color("#00ff88");

  useFrame((_, delta) => {
    t.current += delta;
    const isFault = status === "fault";
    const speed = isFault ? 5 : 1.4;
    if (sphereRef.current) {
      sphereRef.current.scale.setScalar(isFault
        ? (Math.sin(t.current * 8) > 0 ? 1.1 : 0.7)
        : 1 + Math.sin(t.current * speed) * 0.15);
      (sphereRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        selected ? 2.2 : 0.8 + Math.sin(t.current * speed) * 0.5;
    }
    [ring1, ring2].forEach((ref, i) => {
      if (ref.current) {
        const phase = ((t.current * 0.9 + i * 0.6) % 1.5) / 1.5;
        ref.current.scale.setScalar(0.4 + phase * 2.8);
        (ref.current.material as THREE.MeshStandardMaterial).opacity = (1 - phase) * 0.55;
      }
    });
    if (shockRef.current) {
      if (isFault) {
        const sp = (t.current * 2.2) % 1;
        shockRef.current.scale.setScalar(1 + sp * 5);
        (shockRef.current.material as THREE.MeshStandardMaterial).opacity = (1 - sp) * 0.85;
        shockRef.current.visible = true;
      } else {
        shockRef.current.visible = false;
      }
    }
  });

  return (
    <group position={sensor.position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.95} />
      </mesh>
      {[ring1, ring2].map((ref, i) => (
        <mesh key={i} ref={ref} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.007, 8, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.5} />
        </mesh>
      ))}
      <mesh ref={shockRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.016, 6, 24]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} transparent opacity={0.8} />
      </mesh>
      {selected && (
        <mesh>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={0.12} wireframe />
        </mesh>
      )}
    </group>
  );
}

function WirePath({ sensor, status, fault, showFlow }: {
  sensor: SensorDef; status: SensorStatus; fault: FaultType; showFlow: boolean;
}) {
  const particleRef = useRef<THREE.Mesh>(null);
  const tRef = useRef(Math.random());
  const pathPts = WIRE_PATHS[sensor.id] ?? [sensor.position, ECU];

  const curve = useMemo(() =>
    new THREE.CatmullRomCurve3(pathPts.map(p => new THREE.Vector3(...p))),
  [sensor.id]);

  const linePoints = useMemo(() =>
    curve.getPoints(60).map(p => [p.x, p.y, p.z] as [number, number, number]),
  [curve]);

  const isFault = status === "fault" || fault !== null;
  const lineColor = fault === "stg" ? "#ef4444"
    : fault === "oc" ? "#f59e0b"
    : fault === "oor" ? "#f97316"
    : status === "fault" ? "#ef4444"
    : status === "warning" ? "#f59e0b"
    : "#00f2ff";

  useFrame((_, delta) => {
    if (!particleRef.current || isFault || !showFlow) return;
    tRef.current = (tRef.current + delta * 0.45) % 1;
    const pt = curve.getPoint(tRef.current);
    particleRef.current.position.copy(pt);
  });

  if (!showFlow) return null;

  // For short-to-ground: show the line "cut" partway
  const stgCutPoint = fault === "stg" ? 0.25 : 1;
  const displayPoints = fault === "stg"
    ? curve.getPoints(60).slice(0, Math.floor(60 * stgCutPoint + 3)).map(p => [p.x, p.y, p.z] as [number, number, number])
    : linePoints;

  return (
    <group>
      {displayPoints.length > 1 && (
        <Line
          points={displayPoints}
          color={lineColor}
          lineWidth={isFault ? 1.6 : 0.75}
          transparent
          opacity={isFault ? 0.85 : 0.3}
          dashed={fault === "oc"}
          dashScale={3}
          dashSize={0.12}
          gapSize={0.12}
        />
      )}
      {/* STG break point indicator */}
      {fault === "stg" && (() => {
        const bp = curve.getPoint(stgCutPoint);
        return (
          <mesh position={[bp.x, bp.y, bp.z]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
          </mesh>
        );
      })()}
      {/* Flowing particle */}
      {!isFault && showFlow && (
        <mesh ref={particleRef} position={sensor.position as [number, number, number]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          <meshStandardMaterial color="#00f2ff" emissive="#00f2ff" emissiveIntensity={3.5} />
        </mesh>
      )}
    </group>
  );
}

function Scene({ statuses, faults, selected, onSelect, viewMode, showFlow }: {
  statuses: Record<string, SensorStatus>;
  faults: Record<string, FaultType>;
  selected: string | null;
  onSelect: (id: string) => void;
  viewMode: ViewMode;
  showFlow: boolean;
}) {
  const xray = viewMode === "xray";
  const explode = viewMode === "explode";
  const dissect = viewMode === "dissect";

  return (
    <>
      <ClippingController dissect={dissect} />
      <color attach="background" args={["#040d1a"]} />
      <fog attach="fog" args={["#040d1a", 9, 22]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 7, 4]} intensity={0.9} color="#ffffff" castShadow />
      <pointLight position={[-3, 3, -3]} intensity={0.4} color="#0033ff" />
      <pointLight position={[3, 1, 3]} intensity={0.35} color="#ff4400" />
      <pointLight position={[0, 5, 0]} intensity={0.3} color="#00f2ff" />
      <gridHelper args={[14, 28, "#0a2a4a", "#050f1c"]} position={[0, -0.43, 0]} />

      <CarBody xray={xray} explode={explode} dissect={dissect} />

      {SENSORS.map(s => (
        <group key={s.id}>
          <SensorMarker
            sensor={s}
            status={statuses[s.id] ?? "normal"}
            selected={selected === s.id}
            fault={faults[s.id] ?? null}
            onClick={() => onSelect(s.id)}
          />
          <WirePath
            sensor={s}
            status={statuses[s.id] ?? "normal"}
            fault={faults[s.id] ?? null}
            showFlow={showFlow}
          />
        </group>
      ))}

      <OrbitControls enablePan enableZoom minDistance={2.5} maxDistance={15} target={[0, 0.4, 0]} />
    </>
  );
}

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

function AIPanel({ lang, selected, faults, onClose }: {
  lang: string; selected: string | null; faults: Record<string, FaultType>; onClose: () => void;
}) {
  const isAr = lang === "ar";
  const [msgs, setMsgs] = useState<{ role: "user"|"ai"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, content: input };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })), lang }),
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let aiContent = "";
      setMsgs(p => [...p, { role: "ai", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n").filter(l => l.startsWith("data: "))) {
          const json = JSON.parse(line.slice(6));
          if (json.content) {
            aiContent += json.content;
            setMsgs(p => { const u = [...p]; u[u.length-1] = { role: "ai", content: aiContent }; return u; });
            if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }
      }
    } catch { }
    setLoading(false);
  };

  const border = "1px solid rgba(0,242,255,0.15)";
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(3,8,18,0.98)" }}>
      <div style={{ padding: "8px 12px", borderBottom: border, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ color: "#00f2ff", fontSize: "0.6rem", fontFamily: "Orbitron, monospace", letterSpacing: "0.1em" }}>
          🤖 {isAr ? "المساعد الذكي" : "AI INSTRUCTOR"}
        </span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}>×</button>
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {msgs.length === 0 && (
          <div style={{ color: "#2a2a2a", fontSize: "0.58rem", textAlign: "center", marginTop: "24px" }}>
            {isAr ? "اسأل عن أي حساس أو كود عطل" : "Ask about any sensor or fault code"}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "90%", padding: "6px 10px", borderRadius: "7px", background: m.role === "user" ? "rgba(0,242,255,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "user" ? "rgba(0,242,255,0.2)" : "rgba(255,255,255,0.06)"}`, fontSize: "0.58rem", color: "#ccc", lineHeight: "1.55", whiteSpace: "pre-wrap" }}>
              {m.content || <span style={{ opacity: 0.3 }}>▋</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 10px", borderTop: border, display: "flex", gap: "6px", flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder={isAr ? "اسأل..." : "Ask diagnostics..."}
          dir={isAr ? "rtl" : "ltr"}
          style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(0,242,255,0.15)", borderRadius: "4px", color: "#ddd", padding: "5px 8px", fontSize: "0.6rem", outline: "none", fontFamily: isAr ? "Cairo, sans-serif" : "Share Tech Mono, monospace" }} />
        <button onClick={send} disabled={loading}
          style={{ padding: "5px 11px", background: "rgba(0,242,255,0.12)", border: "1px solid rgba(0,242,255,0.25)", borderRadius: "4px", color: "#00f2ff", cursor: "pointer", fontSize: "0.58rem" }}>
          {isAr ? "↵" : "→"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Workstation ─────────────────────────────────────────────────────────

interface Props {
  onExit: () => void;
  lang: string;
  isRTL: boolean;
}

const DEFAULT_STATUSES: Record<string, SensorStatus> = Object.fromEntries(SENSORS.map(s => [s.id, "normal"]));
const DEFAULT_FAULTS: Record<string, FaultType> = Object.fromEntries(SENSORS.map(s => [s.id, null]));

export function InstructorWorkstation({ onExit, lang, isRTL }: Props) {
  const isAr = lang === "ar";
  const [viewMode, setViewMode] = useState<ViewMode>("xray");
  const [mainView, setMainView] = useState<"twin"|"scope"|"split">("twin");
  const [selected, setSelected] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, SensorStatus>>(DEFAULT_STATUSES);
  const [faults, setFaults] = useState<Record<string, FaultType>>(DEFAULT_FAULTS);
  const [showFlow, setShowFlow] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const injectFault = useCallback((sensorId: string, faultType: FaultType) => {
    setFaults(prev => ({ ...prev, [sensorId]: faultType }));
    setStatuses(prev => ({
      ...prev,
      [sensorId]: faultType === null ? "normal" : faultType === "oor" ? "warning" : "fault",
    }));
  }, []);

  const clearAll = useCallback(() => {
    setFaults(DEFAULT_FAULTS);
    setStatuses(DEFAULT_STATUSES);
  }, []);

  const selectedSensor = SENSORS.find(s => s.id === selected);

  const b = (active: boolean, col = "#00f2ff") => ({
    padding: "4px 12px",
    background: active ? `rgba(${col === "#00f2ff" ? "0,242,255" : col === "#a78bfa" ? "167,139,250" : "74,222,128"},0.15)` : "rgba(255,255,255,0.04)",
    border: `1px solid ${active ? col : "rgba(255,255,255,0.1)"}`,
    borderRadius: "4px",
    color: active ? col : "#555",
    cursor: "pointer",
    fontSize: "0.55rem",
    fontFamily: isAr ? "Cairo, sans-serif" : "Orbitron, monospace",
    letterSpacing: isAr ? "0" : "0.06em",
    transition: "all 0.2s",
  });

  const faultColors: Record<string, string> = { stg: "#ef4444", oc: "#f59e0b", oor: "#f97316" };
  const faultLabels: Record<string, string> = { stg: "Short to GND", oc: "Open Circuit", oor: "Out of Range" };
  const faultLabelsAr: Record<string, string> = { stg: "قصر للأرضي", oc: "دائرة مفتوحة", oor: "خارج النطاق" };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#020810", overflow: "hidden" }}>

      {/* ── Top Bar ── */}
      <div style={{ height: "40px", flexShrink: 0, background: "#030e1c", borderBottom: "1px solid rgba(0,242,255,0.12)", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginRight: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444", animation: "pulse-red 1.5s infinite" }} />
          <span style={{ fontSize: "0.55rem", color: "#ef4444", fontFamily: "Orbitron, monospace", letterSpacing: "0.1em" }}>
            {isAr ? "وضع المحاضر" : "INSTRUCTOR MODE"}
          </span>
        </div>

        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />

        {/* Main view */}
        {(["twin","scope","split"] as const).map(v => (
          <button key={v} onClick={() => setMainView(v)} style={b(mainView === v)}>
            {v === "twin" ? (isAr ? "🚗 النموذج 3D" : "3D TWIN")
              : v === "scope" ? (isAr ? "📊 أوسيلوسكوب" : "OSCILLOSCOPE")
              : (isAr ? "⊟ مقسم" : "SPLIT")}
          </button>
        ))}

        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />

        {/* Vis mode */}
        {(["xray","explode","dissect"] as const).map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={b(viewMode === m, "#a78bfa")}>
            {m === "xray" ? (isAr ? "أشعة X" : "X-RAY")
              : m === "explode" ? (isAr ? "تشريح" : "EXPLODE")
              : (isAr ? "مقطع" : "CUTAWAY")}
          </button>
        ))}

        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" }} />

        <button onClick={() => setShowFlow(p => !p)} style={b(showFlow, "#4ade80")}>
          {isAr ? "تدفق الإشارة" : "SIGNAL FLOW"}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setAiOpen(p => !p)} style={b(aiOpen, "#a78bfa")}>
            🤖 {isAr ? "مساعد ذكي" : "AI"}
          </button>
          <button onClick={() => { clearAll(); }} style={{ ...b(false), color: "#888" }}>
            {isAr ? "إعادة ضبط" : "RESET"}
          </button>
          <button onClick={onExit} style={{ padding: "4px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#ef4444", cursor: "pointer", fontSize: "0.55rem", fontFamily: "Orbitron, monospace", letterSpacing: "0.06em" }}>
            {isAr ? "خروج" : "EXIT"}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: Sensor list + Fault injector */}
        <div style={{ width: "220px", flexShrink: 0, background: "rgba(2,6,14,0.9)", borderRight: "1px solid rgba(0,242,255,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sensor list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ padding: "6px 10px 3px", fontSize: "0.45rem", color: "#444", letterSpacing: "0.12em" }}>
              {isAr ? "الحساسات — 12 نقطة" : "SENSORS — 12 NODES"}
            </div>
            {SENSORS.map(s => {
              const st = statuses[s.id] ?? "normal";
              const ft = faults[s.id];
              const isSelected = selected === s.id;
              const stColor = st === "fault" ? "#ef4444" : st === "warning" ? "#f59e0b" : "#00ff88";
              return (
                <button key={s.id} onClick={() => setSelected(isSelected ? null : s.id)}
                  style={{ display: "block", width: "100%", padding: "6px 10px", background: isSelected ? "rgba(0,242,255,0.06)" : "transparent", border: "none", borderLeft: `2px solid ${stColor}`, cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}>
                  <div style={{ fontSize: "0.57rem", color: isSelected ? "#ddd" : "#999", fontFamily: isAr ? "Cairo, sans-serif" : "Share Tech Mono, monospace" }}>
                    {isAr ? s.nameAr : s.name}
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                    <span style={{ fontSize: "0.46rem", color: stColor }}>{ft ? (isAr ? faultLabelsAr[ft] : faultLabels[ft]) : (st === "normal" ? "OK" : st.toUpperCase())}</span>
                    <span style={{ fontSize: "0.46rem", color: "#333" }}>{s.dtc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fault Injector */}
          <div style={{ flexShrink: 0, borderTop: "1px solid rgba(0,242,255,0.08)", padding: "10px" }}>
            <div style={{ fontSize: "0.46rem", color: "#444", letterSpacing: "0.1em", marginBottom: "8px" }}>
              {isAr ? "حقن الأعطال — SAE J1979" : "FAULT INJECTION — SAE J1979"}
            </div>

            {selected ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ fontSize: "0.54rem", color: "#00f2ff", marginBottom: "4px", fontFamily: isAr ? "Cairo, sans-serif" : "Share Tech Mono, monospace" }}>
                  {isAr ? selectedSensor?.nameAr : selectedSensor?.name}
                </div>
                {(["stg","oc","oor"] as const).map(ft => (
                  <button key={ft} onClick={() => injectFault(selected, faults[selected] === ft ? null : ft)}
                    style={{ padding: "5px 8px", background: faults[selected] === ft ? `rgba(${ft === "stg" ? "239,68,68" : ft === "oc" ? "245,158,11" : "249,115,22"},0.2)` : "rgba(255,255,255,0.03)", border: `1px solid ${faults[selected] === ft ? faultColors[ft] : "rgba(255,255,255,0.1)"}`, borderRadius: "4px", color: faults[selected] === ft ? faultColors[ft] : "#666", cursor: "pointer", fontSize: "0.53rem", textAlign: "left", fontFamily: isAr ? "Cairo, sans-serif" : "Share Tech Mono, monospace", transition: "all 0.15s" }}>
                    {isAr ? faultLabelsAr[ft] : faultLabels[ft]}
                  </button>
                ))}
                <button onClick={() => injectFault(selected, null)}
                  style={{ padding: "4px 8px", background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "4px", color: "#444", cursor: "pointer", fontSize: "0.5rem", textAlign: "left", marginTop: "2px" }}>
                  {isAr ? "✕ مسح العطل" : "✕ Clear Fault"}
                </button>

                {/* Sensor info */}
                <div style={{ marginTop: "8px", padding: "6px 8px", background: "rgba(0,242,255,0.04)", border: "1px solid rgba(0,242,255,0.1)", borderRadius: "4px" }}>
                  {[
                    ["System", selectedSensor?.system ?? ""],
                    ["DTC", selectedSensor?.dtc ?? ""],
                    ["Nominal", selectedSensor?.nominalV ?? ""],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                      <span style={{ fontSize: "0.44rem", color: "#444" }}>{k}</span>
                      <span style={{ fontSize: "0.5rem", color: "#888", fontFamily: "Share Tech Mono, monospace" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: "0.48rem", color: "#555", lineHeight: "1.4", marginTop: "4px" }}>{selectedSensor?.description}</div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "0.54rem", color: "#333", textAlign: "center", padding: "8px 0" }}>
                {isAr ? "اختر حساساً من القائمة أو النموذج ثلاثي الأبعاد" : "Select a sensor to inject faults"}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main view area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* 3D Twin */}
          {(mainView === "twin" || mainView === "split") && (
            <div style={{ flex: mainView === "split" ? "0 0 60%" : 1, position: "relative", minHeight: 0 }}>
              <Canvas camera={{ position: [5, 3.5, 5], fov: 45 }} gl={{ antialias: true }}>
                <Suspense fallback={null}>
                  <Scene
                    statuses={statuses}
                    faults={faults}
                    selected={selected}
                    onSelect={setSelected}
                    viewMode={viewMode}
                    showFlow={showFlow}
                  />
                </Suspense>
              </Canvas>

              {/* Mode badge */}
              <div style={{ position: "absolute", top: "8px", left: "50%", transform: "translateX(-50%)", background: "rgba(3,8,20,0.9)", border: "1px solid rgba(167,139,250,0.35)", borderRadius: "4px", padding: "3px 12px", fontSize: "0.5rem", color: "#a78bfa", fontFamily: "Orbitron, monospace", pointerEvents: "none" }}>
                {viewMode === "xray" ? "X-RAY MODE" : viewMode === "explode" ? "EXPLODED VIEW" : "CUTAWAY / DISSECTION"}
              </div>
            </div>
          )}

          {/* Split divider */}
          {mainView === "split" && (
            <div style={{ height: "1px", background: "rgba(0,242,255,0.15)", flexShrink: 0 }} />
          )}

          {/* Oscilloscope */}
          {(mainView === "scope" || mainView === "split") && (
            <div style={{ flex: mainView === "split" ? "0 0 40%" : 1, minHeight: 0, overflow: "hidden" }}>
              <AutomotiveOscilloscope
                sensorId={selected}
                fault={selected ? (faults[selected] ?? null) : null}
                lang={lang}
              />
            </div>
          )}
        </div>

        {/* Right: AI Panel */}
        {aiOpen && (
          <div style={{ width: "300px", flexShrink: 0, borderLeft: "1px solid rgba(0,242,255,0.1)", overflow: "hidden" }}>
            <AIPanel lang={lang} selected={selected} faults={faults} onClose={() => setAiOpen(false)} />
          </div>
        )}
      </div>

      {/* ── Status strip ── */}
      <div style={{ height: "24px", flexShrink: 0, background: "#020810", borderTop: "1px solid rgba(0,242,255,0.06)", display: "flex", alignItems: "center", gap: "20px", padding: "0 14px", overflowX: "auto" }}>
        {SENSORS.map(s => {
          const st = statuses[s.id] ?? "normal";
          const c = st === "fault" ? "#ef4444" : st === "warning" ? "#f59e0b" : "#00ff88";
          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: c, boxShadow: `0 0 4px ${c}` }} />
              <span style={{ fontSize: "0.42rem", color: st === "normal" ? "#333" : c, fontFamily: "Share Tech Mono, monospace", whiteSpace: "nowrap" }}>{s.id.toUpperCase()}</span>
            </div>
          );
        })}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <span style={{ fontSize: "0.42rem", color: "#555", fontFamily: "Share Tech Mono, monospace", letterSpacing: "0.1em" }}>
            {isAr ? "اضغط Esc للخروج | F ملء الشاشة" : "ESC: EXIT  |  F: FULLSCREEN  |  SAE J2012 / Bosch Automotive"}
          </span>
        </div>
      </div>
    </div>
  );
}
