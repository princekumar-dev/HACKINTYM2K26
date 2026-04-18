
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useSimStore, type ServerNode, type Edge, type NodeStatus } from "@/store/simStore";

const STATUS_COLOR: Record<NodeStatus, string> = {
  healthy: "#00ffa3",
  warning: "#ffaa00",
  critical: "#ff2a5f",
  healing: "#00f0ff",
};

function NodeMesh({ node }: { node: ServerNode }) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const selectedId = useSimStore((s) => s.selectedNodeId);
  const select = useSimStore((s) => s.selectNode);
  const predictedId = useSimStore((s) => s.predictedFailureId);

  const color = STATUS_COLOR[node.status];
  const isCore = node.role === "gateway";
  const isSelected = selectedId === node.id;
  const isPredicted = predictedId === node.id;
  const baseSize = isCore ? 0.55 : 0.32;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = node.status === "critical" ? 0.15 : node.status === "warning" ? 0.08 : 0.04;
    ref.current.scale.setScalar(baseSize * (1 + Math.sin(t * 3 + node.position[0]) * pulse));
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = Math.PI / 2;
    }
  });

  return (
    <group position={node.position}>
      {/* Outer glow ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[baseSize * 1.8, 0.015, 16, 64]} />
        <meshBasicMaterial color={color} transparent opacity={isSelected ? 0.9 : 0.35} />
      </mesh>
      {/* Predicted failure warning ring */}
      {isPredicted && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[baseSize * 2.6, 0.01, 16, 64]} />
          <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
        </mesh>
      )}
      {/* Core sphere */}
      <mesh
        ref={ref}
        onClick={(e) => {
          e.stopPropagation();
          select(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={node.status === "critical" ? 1.4 : node.status === "warning" ? 0.9 : 0.55}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Halo glow */}
      <mesh scale={baseSize * 2.2}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} />
      </mesh>
      <Html position={[0, baseSize + 0.35, 0]} center distanceFactor={10}>
        <div className="font-mono text-[10px] tracking-widest text-foreground/80 pointer-events-none whitespace-nowrap">
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function EdgeLine({ edge, nodes }: { edge: Edge; nodes: ServerNode[] }) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  const lineRef = useRef<THREE.BufferGeometry>(null);

  const points = useMemo(() => {
    if (!from || !to) return new Float32Array();
    return new Float32Array([...from.position, ...to.position]);
  }, [from, to]);

  if (!from || !to) return null;

  const fromColor = STATUS_COLOR[from.status];
  const toColor = STATUS_COLOR[to.status];
  const isUnhealthy = from.status === "critical" || to.status === "critical";

  return (
    <>
      <line>
        <bufferGeometry ref={lineRef}>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        
        <lineBasicMaterial
          color={isUnhealthy ? "#ff2a5f" : edge.active ? fromColor : "#1e3a5f"}
          transparent
          opacity={edge.active ? 0.55 : 0.12}
        />
      </line>
      {edge.active && <TrafficParticles from={from} to={to} flowRate={edge.flowRate} color={toColor} />}
    </>
  );
}

function TrafficParticles({
  from,
  to,
  flowRate,
  color,
}: {
  from: ServerNode;
  to: ServerNode;
  flowRate: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const PARTICLE_COUNT = 4;
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }, (_, i) => i / PARTICLE_COUNT), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((mesh, i) => {
      const offset = particles[i];
      const progress = ((t * (0.3 + flowRate * 0.6) + offset) % 1);
      const x = THREE.MathUtils.lerp(from.position[0], to.position[0], progress);
      const y = THREE.MathUtils.lerp(from.position[1], to.position[1], progress);
      const z = THREE.MathUtils.lerp(from.position[2], to.position[2], progress);
      mesh.position.set(x, y, z);
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  const nodes = useSimStore((s) => s.nodes);
  const edges = useSimStore((s) => s.edges);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={1.2} color="#00f0ff" distance={10} />
      <pointLight position={[5, 5, 5]} intensity={0.4} color="#00ffa3" />
      {/* Background grid sphere for depth */}
      <mesh>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color="#070d18" side={THREE.BackSide} />
      </mesh>
      {edges.map((e, i) => (
        <EdgeLine key={i} edge={e} nodes={nodes} />
      ))}
      {nodes.map((n) => (
        <NodeMesh key={n.id} node={n} />
      ))}
    </>
  );
}

export default function NetworkGraph3D() {
  return (
    <Canvas camera={{ position: [0, 1, 8], fov: 55 }} dpr={[1, 2]}>
      <Scene />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={14}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </Canvas>
  );
}
