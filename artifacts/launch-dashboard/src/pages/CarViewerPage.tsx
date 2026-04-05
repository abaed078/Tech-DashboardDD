import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
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

useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");

// ─── Loading overlay ─────────────────────────────────────────────────────────

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
          color: "var(--neon-blue, #00f2ff)",
          fontFamily: "Orbitron, monospace",
        }}
      >
        <div
          style={{
            width: "140px",
            height: "3px",
            background: "rgba(0,242,255,0.15)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "var(--neon-blue, #00f2ff)",
              boxShadow: "0 0 8px #00f2ff",
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
          LOADING MODEL {Math.round(progress)}%
        </span>
      </div>
    </Html>
  );
}

// ─── Car model ───────────────────────────────────────────────────────────────

function CarModel() {
  const { scene } = useGLTF("/models/car.glb");
  const ref = useRef<THREE.Group>(null!);

  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.envMapIntensity = 1.5;
          }
        });
      } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
        mesh.material.envMapIntensity = 1.5;
      }
    }
  });

  return (
    <Center>
      <group ref={ref} scale={[0.4, 0.4, 0.4]}>
        <primitive object={scene} />
      </group>
    </Center>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
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
        <CarModel />

        <ContactShadows
          position={[0, -0.82, 0]}
          opacity={0.65}
          scale={8}
          blur={2.4}
          far={4}
          color="#000000"
        />

        <Environment preset="city" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={2}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.6}
        target={[0, 0, 0]}
      />
    </>
  );
}

// ─── Info panel ──────────────────────────────────────────────────────────────

function InfoPanel() {
  const specs = [
    { label: "ENGINE",    value: "V12 6.5L NA" },
    { label: "POWER",     value: "780 BHP" },
    { label: "TORQUE",    value: "720 Nm" },
    { label: "0–100",     value: "2.9 s" },
    { label: "TOP SPEED", value: "340 km/h" },
    { label: "WEIGHT",    value: "1,525 kg" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "28px",
        left: "28px",
        background: "rgba(5,10,20,0.82)",
        border: "1px solid rgba(0,242,255,0.2)",
        borderRadius: "8px",
        padding: "16px 20px",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: "180px",
      }}
    >
      <div
        style={{
          fontSize: "0.52rem",
          color: "var(--neon-blue, #00f2ff)",
          letterSpacing: "0.18em",
          marginBottom: "4px",
          borderBottom: "1px solid rgba(0,242,255,0.15)",
          paddingBottom: "8px",
        }}
      >
        VEHICLE SPECS
      </div>
      {specs.map(({ label, value }) => (
        <div
          key={label}
          style={{ display: "flex", justifyContent: "space-between", gap: "24px" }}
        >
          <span
            style={{
              fontSize: "0.5rem",
              color: "rgba(200,200,200,0.5)",
              letterSpacing: "0.1em",
              fontFamily: "Orbitron, monospace",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "0.5rem",
              color: "#e0e0e0",
              fontFamily: "Share Tech Mono, monospace",
              letterSpacing: "0.05em",
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function ControlsHint() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "28px",
        right: "28px",
        background: "rgba(5,10,20,0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "6px",
        padding: "10px 14px",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {[
        ["DRAG", "Rotate"],
        ["SCROLL", "Zoom"],
      ].map(([key, action]) => (
        <div key={key} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "0.44rem",
              color: "var(--neon-blue, #00f2ff)",
              fontFamily: "Orbitron, monospace",
              letterSpacing: "0.1em",
              minWidth: "44px",
            }}
          >
            {key}
          </span>
          <span style={{ fontSize: "0.44rem", color: "rgba(200,200,200,0.45)" }}>{action}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function CarViewerPage() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#05080f" }}>
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "28px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            color: "var(--neon-blue, #00f2ff)",
            fontFamily: "Orbitron, monospace",
            letterSpacing: "0.25em",
            textShadow: "0 0 12px rgba(0,242,255,0.5)",
          }}
        >
          3D CAR VIEWER
        </div>
        <div
          style={{
            fontSize: "0.44rem",
            color: "rgba(200,200,200,0.4)",
            fontFamily: "Share Tech Mono, monospace",
            letterSpacing: "0.12em",
            marginTop: "3px",
          }}
        >
          INTERACTIVE MODEL · REAL-TIME RENDERING
        </div>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        shadows
        camera={{ position: [3, 1.5, 4], fov: 40, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene />
      </Canvas>

      <InfoPanel />
      <ControlsHint />
    </div>
  );
}

useGLTF.preload("/models/car.glb");
