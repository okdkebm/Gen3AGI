import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useDeckStore } from "../lib/useStore";
import { STATUS_COLOR } from "../lib/types";

interface Pulse {
  id: number;
  angle: number;
  born: number;
  color: string;
}

// 工具调用事件 → 核心外扩冲击波（实时活动可视化）
export function EventPulse() {
  const toolCalls = useDeckStore((s) => s.toolCalls);
  const pulsesRef = useRef<Pulse[]>([]);
  const counter = useRef(0);

  // 新工具调用产生脉冲
  const lastLen = useRef(0);
  useEffect(() => {
    if (toolCalls.length <= lastLen.current) {
      lastLen.current = toolCalls.length;
      return;
    }
    const fresh = toolCalls.slice(lastLen.current);
    lastLen.current = toolCalls.length;
    const baseAngle = Math.random() * Math.PI * 2;
    fresh.forEach((tc, i) => {
      counter.current += 1;
      pulsesRef.current.push({
        id: counter.current,
        angle: baseAngle + (i * Math.PI * 2) / Math.max(fresh.length, 1),
        born: performance.now(),
        color: STATUS_COLOR[tc.status] ?? STATUS_COLOR.running,
      });
    });
  }, [toolCalls]);

  useFrame(() => {
    const now = performance.now();
    pulsesRef.current = pulsesRef.current.filter((p) => now - p.born < 1600);
  });

  return (
    <group>
      {pulsesRef.current.map((p) => (
        <PulseRing key={p.id} pulse={p} />
      ))}
    </group>
  );
}

function PulseRing({ pulse }: { pulse: Pulse }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useRef(new THREE.RingGeometry(0.9, 1.0, 72)).current;

  useFrame(() => {
    if (!meshRef.current) return;
    const t = (performance.now() - pulse.born) / 1600; // 0 → 1
    const scale = 0.4 + t * 4.2;
    meshRef.current.scale.setScalar(scale);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = (1 - t) * 0.8;
  });

  const x = Math.cos(pulse.angle) * 2.1;
  const z = Math.sin(pulse.angle) * 2.1;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[x, 0.05, z]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <meshBasicMaterial
        color={pulse.color}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
