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
