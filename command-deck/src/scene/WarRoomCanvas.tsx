import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Starfield } from "./Starfield";
import { FlowCore } from "./FlowCore";
import { TaskRing } from "./TaskRing";
import { EventPulse } from "./EventPulse";

export function WarRoomCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 6.5, 13], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#04070d"]} />
      <fog attach="fog" args={["#04070d", 16, 34]} />

      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 0]} intensity={60} color="#00e5ff" />
      <pointLight position={[-6, -3, 6]} intensity={40} color="#3a5bff" />
      <pointLight position={[6, -3, -6]} intensity={30} color="#ff3d5a" />

      <Starfield count={1400} />
      <FlowCore />
      <TaskRing />
      <EventPulse />

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={26}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.35}
      />
    </Canvas>
  );
}
