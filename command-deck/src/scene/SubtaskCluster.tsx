import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STATUS_COLOR } from "../lib/types";

interface Props {
  task: { id: string; title: string; status: string; subtasks?: Array<{ id: string; status: string; title: string }> | null };
  angle: number;
}

// 每个任务下方展开的子任务簇（攻击链细分节点）
export function SubtaskCluster({ task, angle }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const subs = task.subtasks ?? [];

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    // 向外呼吸
    const t = performance.now() / 1000;
    const s = 1 + Math.sin(t * 1.2 + angle * 2) * 0.04;
    groupRef.current.scale.setScalar(s);
    // 轻微向心旋转补偿（保持相对环稳定）
    groupRef.current.rotation.y += delta * 0.05;
  });

  const R = 1.5; // 子节点分布半径
  const n = Math.max(subs.length, 1);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {subs.map((sub, i) => {
        const a = (i / n) * Math.PI * 2 + angle;
        const x = Math.cos(a) * R;
        const z = Math.sin(a) * R;
        const color = STATUS_COLOR[sub.status] ?? STATUS_COLOR.created;
        return (
          <group key={sub.id} position={[x, 0, z]}>
            {/* 连接线 */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([0, 0, 0, -x * 0.4, 0, -z * 0.4]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={color} transparent opacity={0.25} />
            </line>
            <mesh>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color={color}
                metalness={0.8}
                roughness={0.3}
                emissive={color}
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
