import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useDeckStore } from "../lib/useStore";
import { STATUS_COLOR } from "../lib/types";

export function FlowCore() {
  const activeFlow = useDeckStore((s) => s.activeFlow);
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const status = activeFlow?.status ?? "created";
  const color = STATUS_COLOR[status] ?? STATUS_COLOR.created;

  const orbitGeometry = useMemo(() => new THREE.RingGeometry(2.35, 2.42, 96), []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.1;
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.6;
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.55 + Math.sin(t * 2) * 0.25;
    }
    if (haloRef.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.03;
      haloRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {/* 轨道环 */}
        <mesh geometry={orbitGeometry} rotation={[Math.PI / 2.1, 0, 0]}>
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {/* 内发光环（HUD 风格分段） */}
        <mesh ref={ringRef} rotation={[Math.PI / 2.1, 0, 0]}>
          <torusGeometry args={[2.1, 0.014, 8, 90]} />
          <meshBasicMaterial color={color} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      </group>

      {/* 核心球体：金属 + 自发光 */}
      <mesh>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshStandardMaterial
          color={color}
          metalness={0.92}
          roughness={0.18}
          emissive={color}
          emissiveIntensity={0.45}
        />
      </mesh>
      {/* 光晕 */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[1.05, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* 垂直光束 */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 3.2, 8, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 标题标签 */}
      {activeFlow && (
        <Html position={[0, 1.8, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: color,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              textShadow: `0 0 12px ${color}`,
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {activeFlow.title}
          </div>
        </Html>
      )}
    </group>
  );
}
