import { create } from "zustand";

export type NodeStatus = "healthy" | "warning" | "critical" | "healing";
export type ServerRole = "gateway" | "frontend" | "api" | "ai" | "database" | "cache";

export interface ServerNode {
  id: string;
  label: string;
  role: ServerRole;
  status: NodeStatus;
  position: [number, number, number];
  latency: number;
  cpu: number;
  load: number;
  errors: number;
  capacity: number;
}

export interface Edge {
  from: string;
  to: string;
  active: boolean;
  flowRate: number;
}

export type LogLevel = "info" | "warn" | "alert" | "heal" | "ok";
export interface DecisionLog {
  id: string;
  ts: number;
  level: LogLevel;
  message: string;
  reason?: string;
}

export interface FailureScenario {
  id: string;
  title: string;
  targetNodeId: string;
  injectionType: "kill" | "slow" | "overload";
  failureProbability: number;
  outcome: string;
}

export interface DeploymentMonitor {
  host: string;
  frontendPort: number;
  backendPort: number;
  frontendUrl: string;
  backendUrl: string;
  status: "idle" | "ok" | "slow" | "down";
  mode: "live" | "offline";
  overallScore: number;
  frontendScore: number;
  backendScore: number;
  summary: string;
  predictedFailureWindow?: string;
  lastChecked?: number;
}

export interface SimulationRun {
  id: string;
  scenarioTitle: string;
  intensity: number;
  predictedCrash: boolean;
  crashProbability?: number;
  recoverable?: boolean;
  predictedFailureStressLevel?: number | null;
  crashNodeId: string | null;
  resilienceScore: number;
  throughputAfter: number;
  summary: string;
  rerouteFix?: string;
  failoverTriggeredAt?: number | null;
  totalUsers?: number;
  realUsersKeptOnPrimary?: number;
  realUsersShiftedToBackup?: number;
  dummyUsersShiftedToBackup?: number;
  droppedDummyUsers?: number;
  backupServerUrl?: string;
  realUserRatio?: number;
  dummyUserRatio?: number;
  primaryTrafficShare?: number;
  backupTrafficShare?: number;
}

export interface SimulationSummary {
  runs: SimulationRun[];
  crashedRuns: number;
  totalRuns: number;
  crashThresholdStressLevel?: number | null;
  crashThresholdTraffic: number | null;
  likelyCrashNodeId: string | null;
  averageResilience: number;
  recommendation: string;
  lastRunAt?: number;
}

interface AnalysisResponse {
  scannedAt: string;
  target: {
    host: string;
    frontendUrl: string;
    backendUrl: string;
  };
  topology: {
    nodes: Array<Omit<ServerNode, "position">>;
    edges: Edge[];
  };
  health: {
    overallScore: number;
    frontendScore: number;
    backendScore: number;
    frontendReachable: boolean;
    backendReachable: boolean;
    predictedFailureNodeId: string | null;
    predictedFailureWindow: string;
    summary: string;
  };
  routing: {
    selectedPath: string[];
    alternatePath: string[];
    strategy: string;
  };
  healingDecisions: Array<{
    action: string;
    reason: string;
    impact: string;
  }>;
  failureScenarios: FailureScenario[];
}

interface SimState {
  nodes: ServerNode[];
  edges: Edge[];
  logs: DecisionLog[];
  trafficLevel: number;
  totalRps: number;
  monitor: DeploymentMonitor | null;
  selectedNodeId: string | null;
  predictedFailureId: string | null;
  failureScenarios: FailureScenario[];
  routingStrategy: string | null;
  healingDecisions: string[];
  simulationSummary: SimulationSummary | null;
  simulationRunning: boolean;
  activeSimulationRunId: string | null;

  setTraffic: (n: number) => void;
  selectNode: (id: string | null) => void;
  injectFailure: (kind: "kill" | "slow" | "overload", id: string) => void;
  triggerRandomFailure: () => void;
  analyzeDeployment: (input: {
    host: string;
    frontendPort: number;
    backendPort: number;
  }) => Promise<void>;
  checkMonitor: () => Promise<void>;
  runScenario: (scenarioId: string) => void;
  runStressSimulation: () => Promise<void>;
  setActiveSimulationRunId: (id: string | null) => void;
  pushLog: (l: Omit<DecisionLog, "id" | "ts">) => void;
  tick: () => void;
}

interface ResilienceSimulationResponse {
  simulatedAt: string;
  target: {
    host: string;
    frontendUrl: string;
    backendUrl: string;
    cloneBackendUrl: string;
  };
  summary: {
    totalScenarios: number;
    crashedScenarios: number;
    earliestFailureStressLevel: number | null;
    earliestFailureRequestCount: number | null;
    likelyCrashNodeId: string | null;
    stressLevel: number;
    recommendation: string;
  };
  scenarios: Array<{
    id: string;
    title: string;
    targetNodeId: string;
    stressLevel: number;
    crashProbability: number;
    recoverable: boolean;
    predictedFailureStressLevel: number | null;
    predictedFailureRequestCount: number | null;
    crashNodeId: string | null;
    failoverTriggeredAtRequestCount: number | null;
    totalUsersAtFailure: number;
    realUserRatio: number;
    dummyUserRatio: number;
    realUsersKeptOnPrimary: number;
    realUsersShiftedToBackup: number;
    dummyUsersShiftedToBackup: number;
    droppedDummyUsers: number;
    backupServerUrl: string;
    primaryTrafficShare: number;
    backupTrafficShare: number;
    availabilityBeforeFix: number;
    availabilityAfterFix: number;
    rerouteFix: string;
    failureReason: string;
    timeline: Array<{
      requestCount: number;
      concurrency: number;
      latency: number;
      cpu: number;
      errorRate: number;
      status: "stable" | "degraded" | "critical" | "crashed";
    }>;
  }>;
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const MATRIX_STRESS_LEVELS = [25, 50, 75, 100] as const;

const ROLE_CAPACITY: Record<ServerRole, number> = {
  gateway: 5200,
  frontend: 3800,
  api: 3200,
  ai: 2600,
  database: 2100,
  cache: 6400,
};

const POSITION_BY_ID: Record<string, [number, number, number]> = {
  gateway: [0, 2.2, 0.3],
  frontend: [-2.8, 0.9, 1.3],
  api: [2.5, 0.6, -1.1],
  "ai-engine": [0.1, -0.8, 2.3],
  cache: [-1.7, -2.0, -1.8],
  database: [2.0, -2.2, 0.7],
};

const fallbackNodes: ServerNode[] = [
  {
    id: "gateway",
    label: "Ingress Gateway",
    role: "gateway",
    status: "healthy",
    position: POSITION_BY_ID.gateway,
    latency: 12,
    cpu: 28,
    load: 46,
    errors: 0,
    capacity: ROLE_CAPACITY.gateway,
  },
  {
    id: "frontend",
    label: "Frontend:8000",
    role: "frontend",
    status: "healthy",
    position: POSITION_BY_ID.frontend,
    latency: 40,
    cpu: 42,
    load: 54,
    errors: 0,
    capacity: ROLE_CAPACITY.frontend,
  },
  {
    id: "api",
    label: "Backend:8001",
    role: "api",
    status: "warning",
    position: POSITION_BY_ID.api,
    latency: 110,
    cpu: 69,
    load: 67,
    errors: 2,
    capacity: ROLE_CAPACITY.api,
  },
  {
    id: "ai-engine",
    label: "Healing AI",
    role: "ai",
    status: "healthy",
    position: POSITION_BY_ID["ai-engine"],
    latency: 52,
    cpu: 48,
    load: 41,
    errors: 0,
    capacity: ROLE_CAPACITY.ai,
  },
  {
    id: "cache",
    label: "Priority Cache",
    role: "cache",
    status: "healthy",
    position: POSITION_BY_ID.cache,
    latency: 14,
    cpu: 22,
    load: 35,
    errors: 0,
    capacity: ROLE_CAPACITY.cache,
  },
  {
    id: "database",
    label: "State Store",
    role: "database",
    status: "healthy",
    position: POSITION_BY_ID.database,
    latency: 38,
    cpu: 44,
    load: 39,
    errors: 0,
    capacity: ROLE_CAPACITY.database,
  },
];

const fallbackEdges: Edge[] = [
  { from: "gateway", to: "frontend", active: true, flowRate: 0.92 },
  { from: "frontend", to: "api", active: true, flowRate: 0.77 },
  { from: "api", to: "ai-engine", active: true, flowRate: 0.58 },
  { from: "api", to: "database", active: true, flowRate: 0.61 },
  { from: "frontend", to: "cache", active: true, flowRate: 0.36 },
  { from: "cache", to: "api", active: true, flowRate: 0.34 },
];

const fallbackScenarios: FailureScenario[] = [
  {
    id: "frontend-overload",
    title: "Frontend spike",
    targetNodeId: "frontend",
    injectionType: "overload",
    failureProbability: 58,
    outcome: "Traffic is throttled and repeated content is served from cache.",
  },
  {
    id: "api-timeout",
    title: "Backend timeout",
    targetNodeId: "api",
    injectionType: "slow",
    failureProbability: 74,
    outcome: "Requests are rerouted through the alternate path while the API recovers.",
  },
  {
    id: "database-failure",
    title: "State-store disruption",
    targetNodeId: "database",
    injectionType: "kill",
    failureProbability: 49,
    outcome: "Read-heavy traffic stays alive through cache until database healing finishes.",
  },
  {
    id: "cache-saturation",
    title: "Cache saturation",
    targetNodeId: "cache",
    injectionType: "overload",
    failureProbability: 56,
    outcome: "Cache misses push more traffic directly into the backend path.",
  },
  {
    id: "ai-control-lag",
    title: "AI control lag",
    targetNodeId: "ai-engine",
    injectionType: "slow",
    failureProbability: 52,
    outcome: "Rule-based fallback healing takes over while AI decisions catch up.",
  },
];

let logCounter = 0;
const newId = () => `${Date.now()}-${++logCounter}`;

const classify = (n: ServerNode): NodeStatus => {
  if (n.cpu >= 98 || n.errors > 12) return "critical";
  if (n.latency > 220 || n.cpu > 80 || n.errors > 4) return "warning";
  return "healthy";
};

const statusFromScore = (score: number): DeploymentMonitor["status"] => {
  if (score < 45) return "down";
  if (score < 70) return "slow";
  return "ok";
};

const applyScenarioToNode = (
  node: ServerNode,
  scenario: FailureScenario,
  intensity: number,
): ServerNode => {
  if (node.id !== scenario.targetNodeId) return node;
  const scale = intensity / 100;

  if (scenario.injectionType === "kill") {
    return {
      ...node,
      status: "critical",
      cpu: 100,
      load: Math.min(100, node.load + 30 * scale),
      latency: 900 + intensity,
      errors: 14 + Math.round(14 * scale),
    };
  }

  if (scenario.injectionType === "slow") {
    return {
      ...node,
      status: node.status === "healthy" ? "warning" : node.status,
      cpu: Math.min(100, node.cpu + 18 * scale),
      load: Math.min(100, node.load + 14 * scale),
      latency: Math.max(node.latency + 120 * scale, 180 + intensity * 2.2),
      errors: node.errors + Math.round(5 * scale),
    };
  }

  return {
    ...node,
    status: node.status === "healthy" ? "warning" : node.status,
    cpu: Math.min(100, node.cpu + 32 * scale),
    load: Math.min(100, node.load + 24 * scale),
    latency: node.latency + 80 * scale,
    errors: node.errors + Math.round(3 * scale),
  };
};

const buildSimulationSummary = (
  nodes: ServerNode[],
  scenarios: FailureScenario[],
  monitor: DeploymentMonitor | null,
): SimulationSummary => {
  const intensities = [45, 65, 80, 95];
  const runs: SimulationRun[] = [];

  for (const scenario of scenarios.slice(0, 5)) {
    for (const intensity of intensities) {
      const projected = nodes.map((node) => {
        const trafficLift = intensity / 7;
        const next = {
          ...node,
          cpu: Math.min(100, node.cpu + trafficLift),
          load: Math.min(100, node.load + trafficLift * 0.9),
          latency: node.latency + trafficLift * (node.role === "gateway" ? 1.2 : 2.4),
        };
        return applyScenarioToNode(next, scenario, intensity);
      });

      const crashNode =
        projected.find((node) => node.role === "api" && (node.cpu > 95 || node.errors > 10)) ??
        projected.find((node) => node.role === "frontend" && node.latency > 420) ??
        projected.find((node) => node.role === "database" && (node.errors > 8 || node.latency > 320)) ??
        projected.find((node) => node.status === "critical");

      const degradedCount = projected.filter(
        (node) => node.status === "critical" || node.cpu > 94 || node.latency > 380 || node.errors > 9,
      ).length;
      const throughputAfter = Math.round(
        projected.reduce(
          (sum, node) =>
            sum +
            (node.status === "critical" ? 0 : node.capacity * Math.max(0.18, 1 - node.cpu / 130) * (node.load / 100)),
          0,
        ),
      );
      const baseline = Math.max(
        1,
        nodes.reduce((sum, node) => sum + node.capacity * (node.load / 100), 0),
      );
      const resilienceScore = Math.max(
        4,
        Math.min(99, Math.round((throughputAfter / baseline) * 70 + (4 - degradedCount) * 7)),
      );
      const predictedCrash =
        Boolean(crashNode) || degradedCount >= 2 || throughputAfter / baseline < 0.45;
      const totalUsers = Math.max(40, Math.round((baseline / 100) * intensity));
      const realUserRatio = Math.max(0.35, 0.8 - intensity / 250);
      const dummyUserRatio = 1 - realUserRatio;
      const realUsersKeptOnPrimary = Math.round(totalUsers * realUserRatio);
      const realUsersShiftedToBackup = predictedCrash && intensity > 88 ? Math.round(realUsersKeptOnPrimary * 0.08) : 0;
      const dummyUsers = Math.max(0, totalUsers - realUsersKeptOnPrimary);
      const dummyUsersShiftedToBackup = predictedCrash
        ? Math.round(dummyUsers * Math.min(0.95, 0.45 + intensity / 100))
        : Math.round(dummyUsers * Math.min(0.75, 0.2 + intensity / 200));
      const droppedDummyUsers = Math.max(0, dummyUsers - dummyUsersShiftedToBackup);
      const failoverTriggeredAt = predictedCrash ? Math.max(20, Math.round(intensity * 2.2)) : null;
      const primaryTrafficShare = Math.max(
        0.2,
        Math.min(1, (realUsersKeptOnPrimary - realUsersShiftedToBackup) / Math.max(1, totalUsers)),
      );
      const backupTrafficShare = Math.min(
        0.8,
        (dummyUsersShiftedToBackup + realUsersShiftedToBackup) / Math.max(1, totalUsers),
      );

      runs.push({
        id: `${scenario.id}-${intensity}`,
        scenarioTitle: scenario.title,
        intensity,
        predictedCrash,
        crashNodeId: crashNode?.id ?? null,
        resilienceScore,
        throughputAfter,
        summary: predictedCrash
          ? `${scenario.title} is likely to crash the ${
              crashNode?.label ?? "service chain"
            } around ${intensity}% stress.`
          : `${scenario.title} stays recoverable at ${intensity}% stress with rerouting enabled.`,
        rerouteFix: predictedCrash
          ? `Keep real users on the primary path and redirect dummy traffic to ${monitor ? `http://${monitor.host}:${monitor.backendPort + 100}` : "the backup server"} before failure.`
          : `No hard failover needed yet; pre-warm the backup server and move only dummy traffic first.`,
        failoverTriggeredAt,
        totalUsers,
        realUsersKeptOnPrimary,
        realUsersShiftedToBackup,
        dummyUsersShiftedToBackup,
        droppedDummyUsers,
        backupServerUrl: monitor ? `http://${monitor.host}:${monitor.backendPort + 100}` : "backup://clone-server",
        realUserRatio,
        dummyUserRatio,
        primaryTrafficShare,
        backupTrafficShare,
      });
    }
  }

  const crashedRuns = runs.filter((run) => run.predictedCrash);
  const crashThresholdTraffic =
    crashedRuns.length > 0
      ? Math.min(...crashedRuns.map((run) => run.intensity))
      : null;
  const crashCounts = new Map<string, number>();
  for (const run of crashedRuns) {
    if (!run.crashNodeId) continue;
    crashCounts.set(run.crashNodeId, (crashCounts.get(run.crashNodeId) ?? 0) + 1);
  }
  const likelyCrashNodeId =
    [...crashCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    ((monitor?.backendScore && monitor.backendScore < monitor.frontendScore)
      ? "api"
      : monitor
      ? "frontend"
      : null);
  const averageResilience =
    runs.reduce((sum, run) => sum + run.resilienceScore, 0) / Math.max(1, runs.length);

  return {
    runs,
    crashedRuns: crashedRuns.length,
    totalRuns: runs.length,
    crashThresholdStressLevel: crashThresholdTraffic,
    crashThresholdTraffic,
    likelyCrashNodeId,
    averageResilience: Math.round(averageResilience),
    recommendation:
      crashThresholdTraffic !== null && crashThresholdTraffic <= 65
        ? "Crash risk is early. Add backend replicas or cache more read-heavy traffic before demo time."
        : "The app survives moderate stress. Focus on protecting the highest-risk tier with failover and throttling.",
    lastRunAt: Date.now(),
  };
};

const withPositions = (nodes: Array<Omit<ServerNode, "position">>): ServerNode[] =>
  nodes.map((node, index) => ({
    ...node,
    capacity: node.capacity || ROLE_CAPACITY[node.role],
    position:
      POSITION_BY_ID[node.id] ??
      ([
        Math.cos((index / Math.max(nodes.length, 1)) * Math.PI * 2) * 2.8,
        Math.sin((index / Math.max(nodes.length, 1)) * Math.PI * 2) * 2.2,
        index % 2 === 0 ? 1.1 : -1.1,
      ] as [number, number, number]),
  }));

const buildFallbackMonitor = (host: string, frontendPort: number, backendPort: number): DeploymentMonitor => ({
  host,
  frontendPort,
  backendPort,
  frontendUrl: `http://${host}:${frontendPort}`,
  backendUrl: `http://${host}:${backendPort}`,
  status: "down",
  mode: "offline",
  overallScore: 21,
  frontendScore: 18,
  backendScore: 15,
  summary: "Frontend or backend port is not reachable right now. Auto-healing is paused until the app comes back online.",
  predictedFailureWindow: "Unavailable while ports are down",
  lastChecked: Date.now(),
});

const toSimulationRun = (
  scenario: ResilienceSimulationResponse["scenarios"][number],
  totalRps: number,
): SimulationRun => ({
  id: `${scenario.id}-${scenario.stressLevel}-${scenario.predictedFailureRequestCount ?? "stable"}`,
  scenarioTitle: `${scenario.title} @ ${scenario.stressLevel}%`,
  intensity: scenario.stressLevel,
  predictedCrash: scenario.predictedFailureRequestCount !== null,
  crashProbability: scenario.crashProbability,
  recoverable: scenario.recoverable,
  predictedFailureStressLevel: scenario.predictedFailureStressLevel,
  crashNodeId: scenario.crashNodeId,
  resilienceScore: Math.max(5, scenario.availabilityAfterFix),
  throughputAfter: Math.max(100, Math.round((scenario.availabilityAfterFix / 100) * totalRps)),
  summary: scenario.failureReason,
  rerouteFix: scenario.rerouteFix,
  failoverTriggeredAt: scenario.failoverTriggeredAtRequestCount,
  totalUsers: scenario.totalUsersAtFailure,
  realUserRatio: scenario.realUserRatio,
  dummyUserRatio: scenario.dummyUserRatio,
  realUsersKeptOnPrimary: scenario.realUsersKeptOnPrimary,
  realUsersShiftedToBackup: scenario.realUsersShiftedToBackup,
  dummyUsersShiftedToBackup: scenario.dummyUsersShiftedToBackup,
  droppedDummyUsers: scenario.droppedDummyUsers,
  backupServerUrl: scenario.backupServerUrl,
  primaryTrafficShare: scenario.primaryTrafficShare,
  backupTrafficShare: scenario.backupTrafficShare,
});

const buildMatrixSummary = (
  reports: ResilienceSimulationResponse[],
  totalRps: number,
): SimulationSummary => {
  const runs = reports
    .flatMap((report) => report.scenarios.map((scenario) => toSimulationRun(scenario, totalRps)))
    .sort((left, right) => left.intensity - right.intensity || left.scenarioTitle.localeCompare(right.scenarioTitle));

  const crashedRuns = runs.filter((run) => run.predictedCrash);
  const crashCounts = new Map<string, number>();
  for (const run of crashedRuns) {
    if (!run.crashNodeId) continue;
    crashCounts.set(run.crashNodeId, (crashCounts.get(run.crashNodeId) ?? 0) + 1);
  }

  const earliestFailureRequestCount = reports
    .map((report) => report.summary.earliestFailureRequestCount)
    .filter((count): count is number => count !== null);
  const earliestFailureStressLevel = reports
    .map((report) => report.summary.earliestFailureStressLevel)
    .filter((level): level is number => level !== null);
  const recommendation = `Stress levels tested: ${MATRIX_STRESS_LEVELS.join("%, ")}%. ${
    reports
      .map((report) => `${report.summary.stressLevel}%: ${report.summary.recommendation}`)
      .join(" ")
  }`;

  return {
    runs,
    crashedRuns: crashedRuns.length,
    totalRuns: runs.length,
    crashThresholdStressLevel:
      earliestFailureStressLevel.length > 0 ? Math.min(...earliestFailureStressLevel) : null,
    crashThresholdTraffic:
      earliestFailureRequestCount.length > 0 ? Math.min(...earliestFailureRequestCount) : null,
    likelyCrashNodeId:
      [...crashCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      reports.find((report) => report.summary.likelyCrashNodeId)?.summary.likelyCrashNodeId ??
      null,
    averageResilience:
      runs.reduce((sum, run) => sum + run.resilienceScore, 0) / Math.max(1, runs.length),
    recommendation,
    lastRunAt: Date.now(),
  };
};

const buildOfflineNodes = (frontendPort: number, backendPort: number): ServerNode[] =>
  withPositions(
    fallbackNodes.map((node) => {
      if (node.id === "gateway") {
        return {
          ...node,
          status: "warning",
          latency: 180,
          cpu: 52,
          load: 26,
          errors: 3,
        };
      }

      if (node.id === "frontend") {
        return {
          ...node,
          label: `Frontend:${frontendPort}`,
          status: "critical",
          latency: 999,
          cpu: 100,
          load: 0,
          errors: 18,
        };
      }

      if (node.id === "api") {
        return {
          ...node,
          label: `Backend:${backendPort}`,
          status: "critical",
          latency: 999,
          cpu: 100,
          load: 0,
          errors: 22,
        };
      }

      if (node.id === "ai-engine") {
        return {
          ...node,
          status: "warning",
          latency: 260,
          cpu: 72,
          load: 33,
          errors: 4,
        };
      }

      return {
        ...node,
        status: "warning",
        latency: node.id === "cache" ? 110 : 190,
        cpu: node.id === "cache" ? 44 : 58,
        load: Math.max(12, node.load - 10),
        errors: node.id === "database" ? 2 : 1,
      };
    }),
  );

const buildOfflineEdges = (): Edge[] =>
  fallbackEdges.map((edge) => ({
    ...edge,
    active:
      edge.from !== "frontend" &&
      edge.to !== "frontend" &&
      edge.from !== "api" &&
      edge.to !== "api",
    flowRate:
      edge.from !== "frontend" &&
      edge.to !== "frontend" &&
      edge.from !== "api" &&
      edge.to !== "api"
        ? Math.min(edge.flowRate, 0.16)
        : 0,
  }));

export const useSimStore = create<SimState>((set, get) => ({
  nodes: fallbackNodes,
  edges: fallbackEdges,
  logs: [
    { id: newId(), ts: Date.now(), level: "info", message: "Digital twin initialized for self-healing network demo." },
    { id: newId(), ts: Date.now(), level: "ok", message: "Enter frontend and backend ports to scan a running web app." },
  ],
  trafficLevel: 46,
  totalRps: 11840,
  monitor: null,
  selectedNodeId: null,
  predictedFailureId: "api",
  failureScenarios: fallbackScenarios,
  routingStrategy: "Primary route stays active while cache-assisted failover remains warm.",
  healingDecisions: [
    "Predictive healing watches latency and CPU before failure happens.",
    "Routing favors the lowest-risk path based on recent performance.",
  ],
  simulationSummary: null,
  simulationRunning: false,
  activeSimulationRunId: null,

  setTraffic: (n) => set({ trafficLevel: Math.max(0, Math.min(100, n)) }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setActiveSimulationRunId: (id) => set({ activeSimulationRunId: id }),

  pushLog: (l) =>
    set((s) => ({
      logs: [...s.logs, { ...l, id: newId(), ts: Date.now() }].slice(-100),
    })),

  analyzeDeployment: async ({ host, frontendPort, backendPort }) => {
    const cleanHost = host.trim() || "localhost";
    const payload = {
      host: cleanHost,
      frontendPort,
      backendPort,
    };

    get().pushLog({
      level: "info",
      message: `[SCAN] Inspecting deployment on ${cleanHost}:${frontendPort}/${backendPort}`,
      reason: "Building a topology twin from the running application ports",
    });

    try {
      const response = await fetch(`${API_BASE}/api/monitoring/analyze-app-topology`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Topology API returned ${response.status}`);
      }

      const data: AnalysisResponse = await response.json();
      const nodes = withPositions(data.topology.nodes);
      const totalRps = Math.round(
        nodes.reduce(
          (sum, node) => sum + (node.status === "critical" ? 0 : node.capacity * (node.load / 100)),
          0,
        ),
      );
      const monitor: DeploymentMonitor = {
        host: data.target.host,
        frontendPort,
        backendPort,
        frontendUrl: data.target.frontendUrl,
        backendUrl: data.target.backendUrl,
        status:
          !data.health.frontendReachable || !data.health.backendReachable
            ? "down"
            : statusFromScore(data.health.overallScore),
        mode:
          !data.health.frontendReachable || !data.health.backendReachable
            ? "offline"
            : "live",
        overallScore: data.health.overallScore,
        frontendScore: data.health.frontendScore,
        backendScore: data.health.backendScore,
        summary: data.health.summary,
        predictedFailureWindow: data.health.predictedFailureWindow,
        lastChecked: new Date(data.scannedAt).getTime(),
      };

      set({
        nodes,
        edges: data.topology.edges,
        totalRps,
        monitor,
        predictedFailureId: data.health.predictedFailureNodeId,
        failureScenarios: data.failureScenarios,
        routingStrategy: data.routing.strategy,
        healingDecisions: data.healingDecisions.map(
          (decision) => `${decision.action}: ${decision.reason} ${decision.impact}`,
        ),
        simulationSummary: null,
        simulationRunning: false,
        activeSimulationRunId: null,
      });

      get().pushLog({
        level: "ok",
        message: `[SCAN] Topology mapped for ${data.target.frontendUrl} -> ${data.target.backendUrl}`,
        reason: data.health.summary,
      });

      data.healingDecisions.forEach((decision) => {
        get().pushLog({
          level: "heal",
          message: `[AI] ${decision.action}`,
          reason: `${decision.reason} ${decision.impact}`,
        });
      });
    } catch (error) {
      const fallbackMonitor = buildFallbackMonitor(cleanHost, frontendPort, backendPort);
      set({
        nodes: buildOfflineNodes(frontendPort, backendPort),
        edges: buildOfflineEdges(),
        totalRps: 1480,
        monitor: fallbackMonitor,
        predictedFailureId: "api",
        failureScenarios: fallbackScenarios,
        routingStrategy:
          "Ports are offline. Primary traffic is blocked, backup automation is on hold, and the graph reflects the live failure state until a re-scan succeeds.",
        healingDecisions: [
          "Auto-heal disabled: the scanner detected that the requested frontend/backend ports are not responding.",
          "Ingress is warning because upstream services are unavailable, not because traffic was successfully rerouted.",
          "Use Re-scan after the ports are running to restore live topology mapping and healing decisions.",
        ],
        simulationSummary: null,
        simulationRunning: false,
        activeSimulationRunId: null,
      });

      get().pushLog({
        level: "warn",
        message: `[SCAN] ${cleanHost}:${frontendPort}/${backendPort} is offline`,
        reason: error instanceof Error ? error.message : "Unknown analysis error",
      });
    }
  },

  checkMonitor: async () => {
    const monitor = get().monitor;
    if (!monitor) return;
    await get().analyzeDeployment({
      host: monitor.host,
      frontendPort: monitor.frontendPort,
      backendPort: monitor.backendPort,
    });
  },

  injectFailure: (kind, id) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;

    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== id) return n;
        if (kind === "kill") return { ...n, status: "critical", cpu: 100, errors: 25, latency: 999 };
        if (kind === "slow") return { ...n, status: "warning", latency: Math.max(n.latency, 420), errors: n.errors + 2 };
        return {
          ...n,
          status: n.status === "healthy" ? "warning" : n.status,
          cpu: Math.min(100, n.cpu + 38),
          load: Math.min(100, n.load + 28),
          latency: n.latency + 40,
        };
      }),
      predictedFailureId: id,
    }));

    get().pushLog({
      level: "alert",
      message: `[INJECT] ${kind.toUpperCase()} fault on ${node.label}`,
      reason: `Failure scenario executed against ${node.role} tier`,
    });
  },

  runScenario: (scenarioId) => {
    const scenario = get().failureScenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;

    get().injectFailure(scenario.injectionType, scenario.targetNodeId);
    get().pushLog({
      level: "warn",
      message: `[SCENARIO] ${scenario.title}`,
      reason: scenario.outcome,
    });
  },

  runStressSimulation: async () => {
    const { nodes, failureScenarios, monitor, totalRps } = get();
    set({ simulationRunning: true });
    get().pushLog({
      level: "info",
      message: "[SIM] Running stress matrix",
      reason: monitor
        ? `Testing ${failureScenarios.length} scenarios against ${monitor.frontendUrl} and ${monitor.backendUrl} across ${MATRIX_STRESS_LEVELS.join("%, ")}% stress`
        : "Testing fallback digital twin because no live deployment is connected",
    });

    if (!monitor) {
      const simulationSummary = buildSimulationSummary(nodes, failureScenarios, monitor);
      set({
        simulationSummary,
        predictedFailureId: simulationSummary.likelyCrashNodeId ?? get().predictedFailureId,
        simulationRunning: false,
        activeSimulationRunId: simulationSummary.runs[0]?.id ?? null,
      });
      get().pushLog({
        level: simulationSummary.crashedRuns > 0 ? "warn" : "ok",
        message: `[SIM] Stress matrix finished`,
        reason:
          simulationSummary.crashThresholdTraffic !== null
            ? `First predicted crash at about ${simulationSummary.crashThresholdTraffic}% stress`
            : "No crash predicted in fallback simulation range",
      });
      return;
    }

    try {
      const reports = await Promise.all(
        MATRIX_STRESS_LEVELS.map(async (stressLevel) => {
          const response = await fetch(`${API_BASE}/api/monitoring/simulate-app-resilience`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: monitor.host,
              frontendPort: monitor.frontendPort,
              backendPort: monitor.backendPort,
              stressLevel,
              sampleSize: 4,
              maxRequests: 240,
              requestStep: 20,
              clonePortOffset: 100,
            }),
          });

          if (!response.ok) {
            throw new Error(`Resilience API returned ${response.status} at ${stressLevel}% stress`);
          }

          return (await response.json()) as ResilienceSimulationResponse;
        }),
      );

      const simulationSummary = buildMatrixSummary(reports, totalRps);
      const likelyCrashNodeId =
        simulationSummary.likelyCrashNodeId ?? get().predictedFailureId;

      set({
        simulationSummary,
        predictedFailureId: likelyCrashNodeId,
        simulationRunning: false,
        activeSimulationRunId: simulationSummary.runs[0]?.id ?? null,
      });

      reports.forEach((report) => {
        get().pushLog({
          level: report.summary.crashedScenarios > 0 ? "warn" : "ok",
          message: `[SIM] ${report.summary.stressLevel}% stress batch finished`,
          reason:
            report.summary.earliestFailureRequestCount !== null
              ? `First failure near ${report.summary.earliestFailureRequestCount} requests. ${report.summary.recommendation}`
              : report.summary.recommendation,
        });
      });
      get().pushLog({
        level: simulationSummary.crashedRuns > 0 ? "warn" : "ok",
        message: `[SIM] Stress matrix finished`,
        reason:
          simulationSummary.crashThresholdTraffic !== null
            ? `Matrix tested ${MATRIX_STRESS_LEVELS.join("%, ")}%. First failure appears near ${simulationSummary.crashThresholdTraffic} requests`
            : `Matrix tested ${MATRIX_STRESS_LEVELS.join("%, ")}% with no predicted crash`,
      });
    } catch (error) {
      const simulationSummary = buildSimulationSummary(nodes, failureScenarios, monitor);
      set({
        simulationSummary,
        predictedFailureId: simulationSummary.likelyCrashNodeId ?? get().predictedFailureId,
        simulationRunning: false,
        activeSimulationRunId: simulationSummary.runs[0]?.id ?? null,
      });
      get().pushLog({
        level: "warn",
        message: "[SIM] Live resilience simulation failed, fallback model used",
        reason: error instanceof Error ? error.message : "Unknown simulation error",
      });
      get().pushLog({
        level: simulationSummary.crashedRuns > 0 ? "warn" : "ok",
        message: `[SIM] Fallback stress matrix finished`,
        reason:
          simulationSummary.crashThresholdTraffic !== null
            ? `Fallback predicts crash around ${simulationSummary.crashThresholdTraffic}% stress`
            : "Fallback model predicts no crash in the tested range",
      });
    }
  },

  triggerRandomFailure: () => {
    const scenarios = get().failureScenarios;
    if (!scenarios.length) return;
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    get().runScenario(scenario.id);
  },

  tick: () => {
    const { trafficLevel, nodes, edges, pushLog, monitor } = get();
    const autoHealEnabled = monitor?.mode !== "offline";
    const trafficMul = 0.45 + trafficLevel / 100;
    const updated: ServerNode[] = nodes.map((n) => {
      let { cpu, latency, errors, load, status } = n;
      const baseCpu = 18 + Math.random() * 9;
      const trafficCpu = trafficMul * (n.role === "database" ? 32 : n.role === "api" ? 30 : 22);

      if (status === "critical") {
        cpu = Math.min(100, cpu + (Math.random() - 0.25) * 4);
        latency = Math.max(500, latency * 0.98 + 50);
        errors = Math.min(50, errors + Math.floor(Math.random() * 3));
      } else if (status === "warning") {
        cpu = Math.min(100, baseCpu + trafficCpu + 18 + (Math.random() - 0.5) * 10);
        latency = Math.max(120, latency * 0.95 + (Math.random() - 0.5) * 55);
        errors = Math.max(0, errors + (Math.random() < 0.35 ? 1 : -1));
      } else if (status === "healing") {
        if (autoHealEnabled) {
          cpu = Math.max(18, cpu * 0.9);
          latency = Math.max(18, latency * 0.86);
          errors = Math.max(0, errors - 2);
        } else {
          status = "critical";
          cpu = Math.min(100, cpu + 2);
          latency = Math.max(600, latency);
          errors = Math.min(50, errors + 1);
        }
      } else {
        cpu = baseCpu + trafficCpu * 0.72 + (Math.random() - 0.5) * 6;
        latency = 10 + Math.random() * 28 + trafficMul * (n.role === "gateway" ? 8 : 18);
        errors = Math.max(0, errors - 1);
      }

      load = Math.max(8, Math.min(100, load + (Math.random() - 0.5) * 8 + (trafficLevel > 70 ? 1.2 : 0)));
      const next: ServerNode = { ...n, cpu, latency, errors, load };
      const newStatus = status === "healing" && cpu < 52 && errors < 2 ? "healthy" : classify(next);
      next.status = autoHealEnabled
        ? status === "healing" && newStatus !== "healthy"
          ? "healing"
          : newStatus
        : n.status === "critical"
        ? "critical"
        : n.status === "warning"
        ? "warning"
        : newStatus;
      return next;
    });

    let predictedFailureId: string | null = null;
    const newEdges = [...edges];

    for (const node of updated) {
      if (node.status === "healthy" && node.cpu > 74 && node.latency > 90 && Math.random() < 0.4) {
        predictedFailureId = node.id;
        pushLog({
          level: "warn",
          message: `[PREDICT] ${node.label} is trending toward failure`,
          reason: `CPU ${node.cpu.toFixed(0)}% and latency ${node.latency.toFixed(0)}ms crossed the warning slope`,
        });
      }

      if (node.status === "critical") {
        newEdges.forEach((edge) => {
          if (edge.from === node.id || edge.to === node.id) {
            edge.active = false;
            edge.flowRate = 0;
          }
        });

        if (!autoHealEnabled) {
          continue;
        }

        const peer = updated.find(
          (candidate) =>
            candidate.id !== node.id &&
            candidate.role !== "database" &&
            candidate.status !== "critical" &&
            (candidate.role === node.role || candidate.role === "cache" || candidate.role === "ai"),
        );

        if (peer) {
          peer.load = Math.min(100, peer.load + 16);
          peer.status = peer.status === "healthy" ? "warning" : peer.status;
          node.status = "healing";
          node.errors = Math.max(0, node.errors - 5);
          pushLog({
            level: "heal",
            message: `[AUTONOMIC] Rerouting ${node.label} traffic to ${peer.label}`,
            reason: `Primary path failed; ${peer.role} layer can absorb the workload`,
          });
        }
      }

      if (autoHealEnabled && node.status === "warning" && node.cpu > 88 && Math.random() < 0.35) {
        node.load = Math.max(22, node.load - 24);
        node.cpu = Math.max(38, node.cpu - 14);
        pushLog({
          level: "heal",
          message: `[AUTONOMIC] Traffic prioritization engaged on ${node.label}`,
          reason: "Low-priority requests were delayed to protect critical flows",
        });
      }
    }

    for (const edge of newEdges) {
      const fromNode = updated.find((node) => node.id === edge.from);
      const toNode = updated.find((node) => node.id === edge.to);
      if (!fromNode || !toNode) continue;

      if (autoHealEnabled && fromNode.status !== "critical" && toNode.status !== "critical" && !edge.active) {
        edge.active = true;
        pushLog({
          level: "ok",
          message: `[AUTONOMIC] Route restored ${edge.from} -> ${edge.to}`,
        });
      }

      const baseFlow = 0.28 + (trafficLevel / 100) * 0.72;
      edge.flowRate = edge.active ? baseFlow * (0.55 + toNode.load / 180) : 0;
    }

    const totalRps = Math.round(
      updated.reduce(
        (sum, node) => sum + (node.status === "critical" ? 0 : node.capacity * (node.load / 100)),
        0,
      ),
    );

    set({
      nodes: updated,
      edges: newEdges,
      totalRps,
      predictedFailureId: predictedFailureId ?? get().predictedFailureId,
      monitor: monitor
        ? {
            ...monitor,
            status:
              monitor.mode === "offline"
                ? "down"
                : statusFromScore(
                    Math.max(
                      5,
                      monitor.overallScore -
                        updated.filter((node) => node.status === "critical").length * 7 -
                        updated.filter((node) => node.status === "warning").length * 3,
                    ),
                  ),
          }
        : null,
    });
  },
}));
