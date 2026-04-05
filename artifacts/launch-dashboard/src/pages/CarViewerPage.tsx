import { Suspense, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useGLTF,
  Center,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OrbitControlsImpl = any;

useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewerMode = "user" | "presenter";

type EnvPreset =
  | "city"
  | "sunset"
  | "dawn"
  | "night"
  | "warehouse"
  | "forest"
  | "apartment"
  | "studio"
  | "lobby";

interface SceneConfig {
  autoRotate: boolean;
  autoRotateSpeed: number;
  exposure: number;
  envPreset: EnvPreset;
  showWireframe: boolean;
}

// ─── Loading overlay ──────────────────────────────────────────────────────────

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          color: "#00f2ff",
          fontFamily: "Orbitron, monospace",
        }}
      >
        <div
          style={{
            width: "160px",
            height: "2px",
            background: "rgba(0,242,255,0.12)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#00f2ff",
              boxShadow: "0 0 8px #00f2ff",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span style={{ fontSize: "0.52rem", letterSpacing: "0.2em" }}>
          LOADING MODEL {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

// ─── Car model ────────────────────────────────────────────────────────────────

function CarModel({ wireframe }: { wireframe: boolean }) {
  const { scene } = useGLTF("/models/car.glb");

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat: THREE.Material) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.envMapIntensity = 1.5;
          mat.wireframe = wireframe;
        }
      });
    }
  });

  return (
    <Center>
      <group scale={[0.4, 0.4, 0.4]}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

// ─── Tone-mapping setter ──────────────────────────────────────────────────────

function RendererSetup({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function Scene({
  config,
  controlsRef,
}: {
  config: SceneConfig;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  return (
    <>
      <RendererSetup exposure={config.exposure} />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      <Suspense fallback={<Loader />}>
        <CarModel wireframe={config.showWireframe} />

        <ContactShadows
          position={[0, -0.82, 0]}
          opacity={0.65}
          scale={8}
          blur={2.4}
          far={4}
          color="#000000"
        />

        <Environment preset={config.envPreset} />
      </Suspense>

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={8}
        autoRotate={config.autoRotate}
        autoRotateSpeed={config.autoRotateSpeed}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ─── Overlay fade wrapper ─────────────────────────────────────────────────────

function Fade({
  visible,
  children,
  style,
}: {
  visible: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        transition: "opacity 0.35s ease, transform 0.35s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        pointerEvents: visible ? "auto" : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Vehicle specs ────────────────────────────────────────────────────────────

function InfoPanel() {
  const specs = [
    { label: "ENGINE",    value: "V12 6.5L NA" },
    { label: "POWER",     value: "780 BHP"      },
    { label: "TORQUE",    value: "720 Nm"       },
    { label: "0–100",     value: "2.9 s"        },
    { label: "TOP SPEED", value: "340 km/h"     },
    { label: "WEIGHT",    value: "1,525 kg"     },
  ];

  return (
    <div
      style={{
        background: "rgba(5,10,20,0.85)",
        border: "1px solid rgba(0,242,255,0.2)",
        borderRadius: "8px",
        padding: "16px 20px",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: "7px",
        minWidth: "190px",
      }}
    >
      <div
        style={{
          fontSize: "0.5rem",
          color: "#00f2ff",
          letterSpacing: "0.18em",
          marginBottom: "4px",
          borderBottom: "1px solid rgba(0,242,255,0.12)",
          paddingBottom: "8px",
          fontFamily: "Orbitron, monospace",
        }}
      >
        VEHICLE SPECS
      </div>
      {specs.map(({ label, value }) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "24px" }}>
          <span style={{ fontSize: "0.48rem", color: "rgba(200,200,200,0.45)", letterSpacing: "0.1em", fontFamily: "Orbitron, monospace" }}>
            {label}
          </span>
          <span style={{ fontSize: "0.48rem", color: "#e0e0e0", fontFamily: "Share Tech Mono, monospace" }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Basic controls hint ──────────────────────────────────────────────────────

function ControlsHint() {
  return (
    <div
      style={{
        background: "rgba(5,10,20,0.72)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "6px",
        padding: "10px 14px",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        gap: "5px",
      }}
    >
      {[["DRAG", "Rotate"], ["SCROLL", "Zoom"]].map(([key, action]) => (
        <div key={key} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "0.43rem", color: "#00f2ff", fontFamily: "Orbitron, monospace", letterSpacing: "0.1em", minWidth: "46px" }}>
            {key}
          </span>
          <span style={{ fontSize: "0.43rem", color: "rgba(200,200,200,0.4)" }}>{action}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Presenter advanced panel ─────────────────────────────────────────────────

const ENV_PRESETS: EnvPreset[] = ["city", "sunset", "dawn", "night", "warehouse", "forest", "apartment", "studio", "lobby"];

function PresenterPanel({
  config,
  onChange,
  onResetCamera,
}: {
  config: SceneConfig;
  onChange: (patch: Partial<SceneConfig>) => void;
  onResetCamera: () => void;
}) {
  const labelStyle: React.CSSProperties = {
    fontSize: "0.44rem",
    color: "rgba(200,200,200,0.5)",
    letterSpacing: "0.12em",
    fontFamily: "Orbitron, monospace",
    display: "block",
    marginBottom: "5px",
  };

  const sectionHead: React.CSSProperties = {
    fontSize: "0.46rem",
    color: "#00f2ff",
    letterSpacing: "0.2em",
    fontFamily: "Orbitron, monospace",
    borderBottom: "1px solid rgba(0,242,255,0.1)",
    paddingBottom: "6px",
    marginBottom: "10px",
  };

  const rangeStyle: React.CSSProperties = {
    width: "100%",
    accentColor: "#00f2ff",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "60px",
        right: "16px",
        width: "210px",
        background: "rgba(4,8,18,0.92)",
        border: "1px solid rgba(0,242,255,0.18)",
        borderRadius: "10px",
        padding: "16px",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        zIndex: 20,
        boxShadow: "0 4px 32px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,242,255,0.05)",
        maxHeight: "calc(100vh - 130px)",
        overflowY: "auto",
      }}
    >
      {/* Rendering */}
      <div>
        <div style={sectionHead}>RENDERING</div>

        <label style={labelStyle}>
          EXPOSURE &nbsp;
          <span style={{ color: "#e0e0e0", fontFamily: "Share Tech Mono, monospace" }}>
            {config.exposure.toFixed(2)}
          </span>
        </label>
        <input
          type="range" min={0.3} max={2.5} step={0.05}
          value={config.exposure}
          onChange={e => onChange({ exposure: parseFloat(e.target.value) })}
          style={rangeStyle}
        />

        <div style={{ marginTop: "10px" }}>
          <label style={labelStyle}>ENVIRONMENT</label>
          <select
            value={config.envPreset}
            onChange={e => onChange({ envPreset: e.target.value as EnvPreset })}
            style={{
              width: "100%",
              background: "rgba(0,242,255,0.05)",
              border: "1px solid rgba(0,242,255,0.2)",
              borderRadius: "4px",
              color: "#e0e0e0",
              fontSize: "0.5rem",
              padding: "5px 8px",
              fontFamily: "Share Tech Mono, monospace",
              letterSpacing: "0.05em",
              cursor: "pointer",
            }}
          >
            {ENV_PRESETS.map(p => (
              <option key={p} value={p} style={{ background: "#0a0f1a" }}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Camera */}
      <div>
        <div style={sectionHead}>CAMERA</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "0.44rem", color: "rgba(200,200,200,0.5)", fontFamily: "Orbitron, monospace", letterSpacing: "0.1em" }}>
            AUTO ROTATE
          </span>
          <button
            onClick={() => onChange({ autoRotate: !config.autoRotate })}
            style={{
              padding: "3px 10px",
              borderRadius: "4px",
              border: `1px solid ${config.autoRotate ? "rgba(0,242,255,0.4)" : "rgba(255,255,255,0.12)"}`,
              background: config.autoRotate ? "rgba(0,242,255,0.1)" : "transparent",
              color: config.autoRotate ? "#00f2ff" : "rgba(200,200,200,0.4)",
              fontSize: "0.42rem",
              fontFamily: "Orbitron, monospace",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {config.autoRotate ? "ON" : "OFF"}
          </button>
        </div>

        {config.autoRotate && (
          <>
            <label style={labelStyle}>
              SPEED &nbsp;
              <span style={{ color: "#e0e0e0", fontFamily: "Share Tech Mono, monospace" }}>
                {config.autoRotateSpeed.toFixed(1)}
              </span>
            </label>
            <input
              type="range" min={0.1} max={4} step={0.1}
              value={config.autoRotateSpeed}
              onChange={e => onChange({ autoRotateSpeed: parseFloat(e.target.value) })}
              style={rangeStyle}
            />
          </>
        )}

        <button
          onClick={onResetCamera}
          style={{
            marginTop: "10px",
            width: "100%",
            padding: "7px",
            borderRadius: "5px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(200,200,200,0.6)",
            fontSize: "0.44rem",
            fontFamily: "Orbitron, monospace",
            letterSpacing: "0.12em",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(0,242,255,0.3)";
            e.currentTarget.style.color = "#00f2ff";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
            e.currentTarget.style.color = "rgba(200,200,200,0.6)";
          }}
        >
          RESET CAMERA
        </button>
      </div>

      {/* Debug */}
      <div>
        <div style={sectionHead}>DEBUG</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.44rem", color: "rgba(200,200,200,0.5)", fontFamily: "Orbitron, monospace", letterSpacing: "0.1em" }}>
            WIREFRAME
          </span>
          <button
            onClick={() => onChange({ showWireframe: !config.showWireframe })}
            style={{
              padding: "3px 10px",
              borderRadius: "4px",
              border: `1px solid ${config.showWireframe ? "rgba(230,0,18,0.5)" : "rgba(255,255,255,0.12)"}`,
              background: config.showWireframe ? "rgba(230,0,18,0.1)" : "transparent",
              color: config.showWireframe ? "#e60012" : "rgba(200,200,200,0.4)",
              fontSize: "0.42rem",
              fontFamily: "Orbitron, monospace",
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {config.showWireframe ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Phase 2 placeholder */}
      <div>
        <div style={sectionHead}>PHASE 2</div>
        <div
          style={{
            padding: "10px",
            background: "rgba(230,0,18,0.05)",
            border: "1px dashed rgba(230,0,18,0.2)",
            borderRadius: "5px",
            fontSize: "0.42rem",
            color: "rgba(230,0,18,0.5)",
            fontFamily: "Share Tech Mono, monospace",
            letterSpacing: "0.05em",
            lineHeight: 1.6,
          }}
        >
          Advanced diagnostics &amp; sensor overlay will load here.
          <br />
          Switching to Presenter Mode automatically.
        </div>
      </div>
    </div>
  );
}

// ─── Mode toggle button ───────────────────────────────────────────────────────

function ModeToggle({ mode, onToggle }: { mode: ViewerMode; onToggle: () => void }) {
  const isPresenter = mode === "presenter";
  return (
    <button
      onClick={onToggle}
      style={{
        position: "absolute",
        top: "16px",
        right: "16px",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "6px 14px",
        borderRadius: "6px",
        border: `1px solid ${isPresenter ? "rgba(230,0,18,0.4)" : "rgba(0,242,255,0.3)"}`,
        background: isPresenter ? "rgba(230,0,18,0.1)" : "rgba(0,242,255,0.07)",
        color: isPresenter ? "#e60012" : "#00f2ff",
        fontSize: "0.5rem",
        fontFamily: "Orbitron, monospace",
        letterSpacing: "0.12em",
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        boxShadow: isPresenter
          ? "0 0 14px rgba(230,0,18,0.2)"
          : "0 0 14px rgba(0,242,255,0.12)",
        transition: "all 0.3s ease",
      }}
    >
      {/* icon */}
      {isPresenter ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )}
      {isPresenter ? "USER MODE" : "PRESENTER MODE"}
    </button>
  );
}

// ─── Mode badge ───────────────────────────────────────────────────────────────

function ModeBadge({ mode }: { mode: ViewerMode }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "28px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            fontSize: "0.65rem",
            color: "#00f2ff",
            fontFamily: "Orbitron, monospace",
            letterSpacing: "0.25em",
            textShadow: "0 0 12px rgba(0,242,255,0.5)",
          }}
        >
          3D CAR VIEWER
        </div>
        <div
          style={{
            padding: "1px 8px",
            borderRadius: "3px",
            background: mode === "presenter" ? "rgba(230,0,18,0.15)" : "rgba(0,242,255,0.08)",
            border: `1px solid ${mode === "presenter" ? "rgba(230,0,18,0.35)" : "rgba(0,242,255,0.2)"}`,
            color: mode === "presenter" ? "#e60012" : "#00f2ff",
            fontSize: "0.38rem",
            fontFamily: "Orbitron, monospace",
            letterSpacing: "0.15em",
            transition: "all 0.3s",
          }}
        >
          {mode === "presenter" ? "PRESENTER" : "USER"}
        </div>
      </div>
      <div style={{ fontSize: "0.44rem", color: "rgba(200,200,200,0.35)", fontFamily: "Share Tech Mono, monospace", letterSpacing: "0.12em" }}>
        INTERACTIVE MODEL · REAL-TIME RENDERING
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SceneConfig = {
  autoRotate: true,
  autoRotateSpeed: 0.6,
  exposure: 1.1,
  envPreset: "city",
  showWireframe: false,
};

export function CarViewerPage() {
  const [mode, setMode] = useState<ViewerMode>("user");
  const [config, setConfig] = useState<SceneConfig>(DEFAULT_CONFIG);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const toggleMode = useCallback(() => {
    setMode(prev => (prev === "user" ? "presenter" : "user"));
  }, []);

  const patchConfig = useCallback((patch: Partial<SceneConfig>) => {
    setConfig(prev => ({ ...prev, ...patch }));
  }, []);

  const resetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  // Phase 2 hook — uncomment to auto-activate presenter mode when Phase 2 loads
  // useEffect(() => {
  //   setMode("presenter");
  // }, []);

  const isPresenter = mode === "presenter";

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#05080f", overflow: "hidden" }}>

      {/* ── Always visible: mode toggle ── */}
      <ModeToggle mode={mode} onToggle={toggleMode} />

      {/* ── User Mode: minimal placeholder (no 3D, no header) ── */}
      {!isPresenter && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            zIndex: 5,
          }}
        >
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(0,242,255,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <div style={{ fontSize: "0.6rem", color: "rgba(0,242,255,0.35)", fontFamily: "Orbitron, monospace", letterSpacing: "0.22em" }}>
              3D VIEWER
            </div>
            <div style={{ fontSize: "0.48rem", color: "rgba(200,200,200,0.25)", fontFamily: "Share Tech Mono, monospace", letterSpacing: "0.1em" }}>
              غير متاح في وضع المستخدم
            </div>
            <div style={{ fontSize: "0.44rem", color: "rgba(200,200,200,0.18)", fontFamily: "Share Tech Mono, monospace", letterSpacing: "0.08em" }}>
              Not available in User Mode
            </div>
          </div>

          <button
            onClick={toggleMode}
            style={{
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 22px",
              borderRadius: "7px",
              border: "1px solid rgba(230,0,18,0.35)",
              background: "rgba(230,0,18,0.08)",
              color: "#e60012",
              fontSize: "0.52rem",
              fontFamily: "Orbitron, monospace",
              letterSpacing: "0.15em",
              cursor: "pointer",
              transition: "all 0.25s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(230,0,18,0.16)";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(230,0,18,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(230,0,18,0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            تفعيل وضع المحاضر
          </button>
        </div>
      )}

      {/* ── Presenter Mode: full 3D viewer + all overlays ── */}
      {isPresenter && (
        <>
          {/* Header + mode badge */}
          <ModeBadge mode={mode} />

          {/* Three.js Canvas */}
          <Canvas
            shadows
            camera={{ position: [3, 1.5, 4], fov: 40, near: 0.1, far: 100 }}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: config.exposure,
              outputColorSpace: THREE.SRGBColorSpace,
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <Scene config={config} controlsRef={controlsRef} />
          </Canvas>

          {/* Controls hint */}
          <div style={{ position: "absolute", bottom: "28px", right: "28px", zIndex: 10 }}>
            <ControlsHint />
          </div>

          {/* Vehicle specs */}
          <div style={{ position: "absolute", bottom: "28px", left: "28px", zIndex: 10 }}>
            <InfoPanel />
          </div>

          <PresenterPanel
            config={config}
            onChange={patchConfig}
            onResetCamera={resetCamera}
          />
        </>
      )}

    </div>
  );
}

useGLTF.preload("/models/car.glb");
