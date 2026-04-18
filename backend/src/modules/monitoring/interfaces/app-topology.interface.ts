export type TopologyNodeStatus = 'healthy' | 'warning' | 'critical' | 'healing';
export type TopologyNodeRole =
  | 'gateway'
  | 'frontend'
  | 'api'
  | 'ai'
  | 'database'
  | 'cache';

export interface TopologyNode {
  id: string;
  label: string;
  role: TopologyNodeRole;
  status: TopologyNodeStatus;
  cpu: number;
  latency: number;
  load: number;
  errors: number;
  capacity: number;
}

export interface TopologyEdge {
  from: string;
  to: string;
  active: boolean;
  flowRate: number;
}

export interface HealingDecision {
  action: string;
  reason: string;
  impact: string;
}

export interface FailureScenario {
  id: string;
  title: string;
  targetNodeId: string;
  injectionType: 'kill' | 'slow' | 'overload';
  failureProbability: number;
  outcome: string;
}

export interface AppTopologyAnalysis {
  scannedAt: string;
  target: {
    host: string;
    frontendUrl: string;
    backendUrl: string;
  };
  topology: {
    nodes: TopologyNode[];
    edges: TopologyEdge[];
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
  healingDecisions: HealingDecision[];
  failureScenarios: FailureScenario[];
}

export interface ProbeSnapshot {
  url: string;
  samples: number;
  successRate: number;
  avgLatency: number;
  peakLatency: number;
  unhealthyResponses: number;
}

export interface SimulationStep {
  requestCount: number;
  concurrency: number;
  latency: number;
  cpu: number;
  errorRate: number;
  status: 'stable' | 'degraded' | 'critical' | 'crashed';
}

export interface ScenarioSimulation {
  id: string;
  title: string;
  targetNodeId: string;
  failureMode: 'kill' | 'slow' | 'overload';
  stressLevel: number;
  crashProbability: number;
  recoverable: boolean;
  predictedFailureStressLevel: number | null;
  predictedFailureRequestCount: number | null;
  crashNodeId: string | null;
  failureReason: string;
  rerouteFix: string;
  cloneServerActivated: boolean;
  backupServerUrl: string;
  failoverTriggeredAtRequestCount: number | null;
  totalUsersAtFailure: number;
  realUserRatio: number;
  dummyUserRatio: number;
  realUsersKeptOnPrimary: number;
  realUsersShiftedToBackup: number;
  dummyUsersShiftedToBackup: number;
  droppedDummyUsers: number;
  primaryTrafficShare: number;
  backupTrafficShare: number;
  availabilityBeforeFix: number;
  availabilityAfterFix: number;
  timeline: SimulationStep[];
}

export interface AppResilienceSimulationReport {
  simulatedAt: string;
  target: {
    host: string;
    frontendUrl: string;
    backendUrl: string;
    cloneBackendUrl: string;
  };
  baseline: {
    frontend: ProbeSnapshot;
    backend: ProbeSnapshot;
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
  scenarios: ScenarioSimulation[];
}
