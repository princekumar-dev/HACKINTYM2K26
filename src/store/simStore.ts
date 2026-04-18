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
  overallScore: number;
  frontendScore: number;
  backendScore: number;
  summary: string;
  predictedFailureWindow?: string;
  lastChecked?: number;
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
  pushLog: (l: Omit<DecisionLog, "id" | "ts">) => void;
  tick: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

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
  status: "slow",
  overallScore: 68,
  frontendScore: 74,
  backendScore: 63,
  summary: "Live port scan was unavailable, so the dashboard switched to a local demo twin of the app topology.",
  predictedFailureWindow: "5-10 minutes",
  lastChecked: Date.now(),
});

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

  setTraffic: (n) => set({ trafficLevel: Math.max(0, Math.min(100, n)) }),
  selectNode: (id) => set({ selectedNodeId: id }),

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
        status: statusFromScore(data.health.overallScore),
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
        nodes: withPositions(
          fallbackNodes.map((node) => ({
            ...node,
            label:
              node.id === "frontend"
                ? `Frontend:${frontendPort}`
                : node.id === "api"
                ? `Backend:${backendPort}`
                : node.label,
          })),
        ),
        edges: fallbackEdges,
        totalRps: 11840,
        monitor: fallbackMonitor,
        predictedFailureId: "api",
        failureScenarios: fallbackScenarios,
        routingStrategy:
          "Fallback twin keeps the cache-assisted route ready while the backend path is monitored for slowdown.",
        healingDecisions: [
          "Predictive healing: the backend port is treated as the highest-risk node in the fallback model.",
          "Self-learning routing: repeat reads are sent through cache to reduce API load.",
          "Traffic prioritization: low-priority browsing is shed before transactional paths.",
        ],
      });

      get().pushLog({
        level: "warn",
        message: `[SCAN] Live analyzer unavailable, running simulated twin for ${cleanHost}`,
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

  triggerRandomFailure: () => {
    const scenarios = get().failureScenarios;
    if (!scenarios.length) return;
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    get().runScenario(scenario.id);
  },

  tick: () => {
    const { trafficLevel, nodes, edges, pushLog, monitor } = get();
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
        cpu = Math.max(18, cpu * 0.9);
        latency = Math.max(18, latency * 0.86);
        errors = Math.max(0, errors - 2);
      } else {
        cpu = baseCpu + trafficCpu * 0.72 + (Math.random() - 0.5) * 6;
        latency = 10 + Math.random() * 28 + trafficMul * (n.role === "gateway" ? 8 : 18);
        errors = Math.max(0, errors - 1);
      }

      load = Math.max(8, Math.min(100, load + (Math.random() - 0.5) * 8 + (trafficLevel > 70 ? 1.2 : 0)));
      const next: ServerNode = { ...n, cpu, latency, errors, load };
      const newStatus = status === "healing" && cpu < 52 && errors < 2 ? "healthy" : classify(next);
      next.status = status === "healing" && newStatus !== "healthy" ? "healing" : newStatus;
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

      if (node.status === "warning" && node.cpu > 88 && Math.random() < 0.35) {
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

      if (fromNode.status !== "critical" && toNode.status !== "critical" && !edge.active) {
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
            status: statusFromScore(
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
