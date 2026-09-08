import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useDeckStore } from "../lib/useStore";
import { STATUS_COLOR } from "../lib/types";
import { SubtaskCluster } from "./SubtaskCluster";

const RING_RADIUS = 4.6;
const RING_TILT = 0.38; // 轨道倾角

export function TaskRing() {
  const tasks = useDeckStore((s) => s.tasks);
  const groupRef = useRef<THREE.Group>(null);

  const ring = useMemo(() => new THREE.TorusGeometry(RING_RADIUS, 0.008, 6, 128), []);

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.05;
  });

  return (
    <group rotation={[RING_TILT, 0, 0]}>
      {/* 轨道线 */}
      <mesh geometry={ring}>
        <meshBasicMaterial color="#1a3f5c" transparent opacity={0.6} depthWrite={false} />
      </mesh>

      {tasks.map((task, i) => {
        const angle = (i / Math.max(tasks.length, 1)) * Math.PI * 2;
        const x = Math.cos(angle) * RING_RADIUS;
        const z = Math.sin(angle) * RING_RADIUS;
        return (
          <group key={task.id} position={[x, 0, z]}>
            <TaskNode task={task} angle={angle} index={i} />
            <SubtaskCluster task={task} angle={angle} />
          </group>
        );
      })}
    </group>
  );
}

function TaskNode({
  task,
  angle,
  index,
}: {
  task: { id: string; title: string; status: string };
  angle: number;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const color = STATUS_COLOR[task.status] ?? STATUS_COLOR.created;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.8;
    meshRef.current.rotation.y = t * 1.1 + index;
    const s = hovered ? 1.28 : 1;
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, s, 0.12));
  });

  return (
    <group>
      {/* 连接线：节点 → 中心 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([0, 0, 0, -Math.cos(angle) * RING_RADIUS * 0.22, 0, -Math.sin(angle) * RING_RADIUS * 0.22]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={hovered ? 0.9 : 0.35} />
      </line>

      {/* 任务节点 */}
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "default";
        }}
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={color}
          metalness={0.85}
          roughness={0.22}
          emissive={color}
          emissiveIntensity={hovered ? 0.85 : 0.3}
        />
      </mesh>

      {/* 节点标签 */}
      <Html position={[0, 0.55, 0]} center distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 10,
            color: hovered ? color : "#8a94a6",
            textShadow: hovered ? `0 0 8px ${color}` : "none",
            whiteSpace: "nowrap",
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            textAlign: "center",
            border: `1px solid ${hovered ? color : "rgba(138,148,166,0.3)"}`,
            padding: "2px 6px",
            background: "rgba(4,7,13,0.65)",
            borderRadius: 3,
          }}
        >
          {task.title}
        </div>
      </Html>
    </group>
  );
}
