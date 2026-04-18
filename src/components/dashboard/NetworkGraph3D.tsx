
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

const REAL_TRAFFIC_COLOR = "#4dffb8";
const DUMMY_BACKUP_COLOR = "#00f0ff";
const DUMMY_RISK_COLOR = "#ff4d6d";

type TrafficStream = {
  color: string;
  flowRate: number;
  particleCount?: number;
  size?: number;
  opacity?: number;
};

function NodeMesh({ node, isCrashFocus = false }: { node: ServerNode; isCrashFocus?: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
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
    const pulse = isCrashFocus ? 0.28 : node.status === "critical" ? 0.15 : node.status === "warning" ? 0.08 : 0.04;
    const speed = isCrashFocus ? 6.4 : 3;
    const scale = 1 + Math.sin(t * speed + node.position[0]) * pulse;
    ref.current.scale.setScalar(baseSize * scale);
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (isCrashFocus ? 1.1 : 0.5);
      ringRef.current.rotation.x = Math.PI / 2;
      const ringScale = isCrashFocus ? 1.18 + Math.sin(t * 4.6) * 0.12 : 1;
      ringRef.current.scale.setScalar(ringScale);
    }
    if (pulseRingRef.current) {
      pulseRingRef.current.rotation.x = Math.PI / 2;
      const outerPulse = 1.05 + ((Math.sin(t * 5.8) + 1) / 2) * 0.55;
      pulseRingRef.current.scale.setScalar(outerPulse);
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
      {isCrashFocus && (
        <mesh ref={pulseRingRef}>
          <torusGeometry args={[baseSize * 2.95, 0.028, 16, 64]} />
          <meshBasicMaterial color={DUMMY_RISK_COLOR} transparent opacity={0.75} />
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
          emissiveIntensity={
            isCrashFocus ? 2.3 : node.status === "critical" ? 1.4 : node.status === "warning" ? 0.9 : 0.55
          }
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Halo glow */}
      <mesh scale={baseSize * (isCrashFocus ? 3 : 2.2)}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={isCrashFocus ? DUMMY_RISK_COLOR : color} transparent opacity={isCrashFocus ? 0.18 : 0.08} />
      </mesh>
      <Html position={[0, baseSize + 0.35, 0]} center distanceFactor={10}>
        <div className="font-mono text-[10px] tracking-widest text-foreground/80 pointer-events-none whitespace-nowrap">
          {node.label}
        </div>
      </Html>
    </group>
  );
}

function EdgeLine({
  edge,
  nodes,
  colorOverride,
  opacityOverride,
  streams,
  label,
  labelColor,
}: {
  edge: Edge;
  nodes: ServerNode[];
  colorOverride?: string;
  opacityOverride?: number;
  streams?: TrafficStream[];
  label?: string;
  labelColor?: string;
}) {
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
  const labelPosition: [number, number, number] = [
    (from.position[0] + to.position[0]) / 2,
    (from.position[1] + to.position[1]) / 2 + 0.18,
    (from.position[2] + to.position[2]) / 2,
  ];
  const activeStreams =
    streams?.filter((stream) => stream.flowRate > 0.02) ??
    (edge.active ? [{ color: toColor, flowRate: edge.flowRate }] : []);

  return (
    <>
      <line>
        <bufferGeometry ref={lineRef}>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        
        <lineBasicMaterial
          color={colorOverride ?? (isUnhealthy ? "#ff2a5f" : edge.active ? fromColor : "#1e3a5f")}
          transparent
          opacity={opacityOverride ?? (edge.active ? 0.55 : 0.12)}
        />
      </line>
      {activeStreams.map((stream, index) => (
        <TrafficParticles
          key={`${edge.from}-${edge.to}-${stream.color}-${index}`}
          from={from}
          to={to}
          flowRate={stream.flowRate}
          color={stream.color}
          particleCount={stream.particleCount}
          size={stream.size}
          opacity={stream.opacity}
          phaseOffset={index * 0.17}
        />
      ))}
      {label && (
        <Html position={labelPosition} center distanceFactor={12}>
          <div
            className="pointer-events-none rounded-full border border-white/10 bg-black/55 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.22em] shadow-[0_0_20px_rgba(0,0,0,0.35)]"
            style={{ color: labelColor ?? "#d7f8ff" }}
          >
            {label}
          </div>
        </Html>
      )}
    </>
  );
}

function TrafficParticles({
  from,
  to,
  flowRate,
  color,
  particleCount = 4,
  size = 0.04,
  opacity = 0.9,
  phaseOffset = 0,
}: {
  from: ServerNode;
  to: ServerNode;
  flowRate: number;
  color: string;
  particleCount?: number;
  size?: number;
  opacity?: number;
  phaseOffset?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(
    () => Array.from({ length: particleCount }, (_, i) => i / Math.max(particleCount, 1)),
    [particleCount],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((mesh, i) => {
      const offset = particles[i];
      const progress = (t * (0.3 + flowRate * 0.6) + offset + phaseOffset) % 1;
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
          <sphereGeometry args={[size, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  const nodes = useSimStore((s) => s.nodes);
  const edges = useSimStore((s) => s.edges);
  const simulationSummary = useSimStore((s) => s.simulationSummary);
  const activeSimulationRunId = useSimStore((s) => s.activeSimulationRunId);

  const activeRun = simulationSummary?.runs.find((run) => run.id === activeSimulationRunId) ?? simulationSummary?.runs[0];
  const graphNodes = useMemo(() => {
    if (!activeRun?.backupServerUrl) return nodes;
    return [
      ...nodes,
      {
        id: "backup-server",
        label: "Backup Server",
        role: "api" as const,
        status: activeRun.predictedCrash ? "healing" as const : "healthy" as const,
        position: [4.6, -0.4, 1.9] as [number, number, number],
        latency: 28,
        cpu: Math.min(96, 24 + Math.round((activeRun.backupTrafficShare ?? 0) * 70)),
        load: Math.min(100, Math.round((activeRun.backupTrafficShare ?? 0) * 100)),
        errors: 0,
        capacity: 2800,
      },
    ];
  }, [nodes, activeRun]);

  const backupEdges: Edge[] = useMemo(() => {
    if (!activeRun?.backupServerUrl || !(activeRun.backupTrafficShare && activeRun.backupTrafficShare > 0.01)) {
      return [];
    }
    return [
      {
        from: "gateway",
        to: "backup-server",
        active: true,
        flowRate: Math.max(0.2, activeRun.backupTrafficShare),
      },
      {
        from: "frontend",
        to: "backup-server",
        active: true,
        flowRate: Math.max(0.2, activeRun.backupTrafficShare * 0.9),
      },
    ];
  }, [activeRun]);

  const mainPathIds = new Set(["gateway", "frontend", "api", "database"]);
  const backupTargetId = activeRun?.predictedCrash ? "backup-server" : null;
  const primarySharePct = Math.round((activeRun?.primaryTrafficShare ?? 0) * 100);
  const backupSharePct = Math.round((activeRun?.backupTrafficShare ?? 0) * 100);
  const realPrimaryShare = activeRun?.totalUsers
    ? (activeRun.realUsersKeptOnPrimary ?? 0) / activeRun.totalUsers
    : 0;
  const realBackupShare = activeRun?.totalUsers
    ? (activeRun.realUsersShiftedToBackup ?? 0) / activeRun.totalUsers
    : 0;
  const dummyBackupShare = activeRun?.totalUsers
    ? (activeRun.dummyUsersShiftedToBackup ?? 0) / activeRun.totalUsers
    : 0;
  const droppedDummyShare = activeRun?.totalUsers
    ? (activeRun.droppedDummyUsers ?? 0) / activeRun.totalUsers
    : 0;

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
      {edges.map((e, i) => {
        const isMainPath = mainPathIds.has(e.from) && mainPathIds.has(e.to);
        const isCrashEdge =
          activeRun?.crashNodeId && (e.from === activeRun.crashNodeId || e.to === activeRun.crashNodeId);
        return (
          <EdgeLine
            key={i}
            edge={e}
            nodes={graphNodes}
            colorOverride={isCrashEdge ? DUMMY_RISK_COLOR : isMainPath ? REAL_TRAFFIC_COLOR : undefined}
            opacityOverride={isCrashEdge ? 0.95 : isMainPath ? 0.75 : undefined}
            label={e.from === "gateway" && e.to === "frontend" && primarySharePct > 0 ? `Primary ${primarySharePct}%` : undefined}
            labelColor={REAL_TRAFFIC_COLOR}
            streams={
              isMainPath
                ? [
                    { color: REAL_TRAFFIC_COLOR, flowRate: Math.max(0.1, realPrimaryShare), particleCount: 5, size: 0.042 },
                    ...(isCrashEdge && droppedDummyShare > 0.01
                      ? [
                          {
                            color: DUMMY_RISK_COLOR,
                            flowRate: Math.max(0.12, droppedDummyShare),
                            particleCount: 4,
                            size: 0.034,
                            opacity: 0.95,
                          },
                        ]
                      : []),
                  ]
                : undefined
            }
          />
        );
      })}
      {backupEdges.map((edge, index) => (
        <EdgeLine
          key={`backup-${index}`}
          edge={edge}
          nodes={graphNodes}
          colorOverride={backupTargetId ? DUMMY_BACKUP_COLOR : "#1e3a5f"}
          opacityOverride={backupTargetId ? 0.9 : 0.2}
          label={index === 0 && backupSharePct > 0 ? `Backup ${backupSharePct}%` : undefined}
          labelColor={DUMMY_BACKUP_COLOR}
          streams={[
            {
              color: DUMMY_BACKUP_COLOR,
              flowRate: Math.max(0.12, dummyBackupShare),
              particleCount: 5,
              size: 0.04,
            },
            ...(realBackupShare > 0.01
              ? [
                  {
                    color: REAL_TRAFFIC_COLOR,
                    flowRate: Math.max(0.08, realBackupShare),
                    particleCount: 3,
                    size: 0.03,
                    opacity: 0.8,
                  },
                ]
              : []),
          ]}
        />
      ))}
      {graphNodes.map((n) => (
        <NodeMesh key={n.id} node={n} isCrashFocus={activeRun?.predictedCrash && activeRun.crashNodeId === n.id} />
      ))}
      {activeRun && (
        <Html position={[0, -3.5, 0]} center>
          <div className="rounded-xl border border-white/10 bg-surface-1/85 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-foreground/80 backdrop-blur">
            {activeRun.predictedCrash
              ? `Failover active: ${Math.round((activeRun.backupTrafficShare ?? 0) * 100)}% to backup`
              : `Main server normal: ${Math.round((activeRun.primaryTrafficShare ?? 0) * 100)}% on primary`}
          </div>
        </Html>
      )}
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
