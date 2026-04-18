export class ServerMetricsDto {
  serverId: string;
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
  diskUsage: number;
  networkLatency: number;
}

export class ServerHealthResponseDto {
  serverId: string;
  healthScore: number;
  status: 'healthy' | 'degraded' | 'critical' | 'offline';
  crashRisk: number;
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    requests: number;
    errors: number;
  };
  suggestions: string[];
  timestamp: Date;
}

export class CrashPredictionDto {
  serverId: string;
  crashRiskScore: number; // 0-100
  timeToFailure: number; // minutes
  criticalMetrics: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export class LoadSimulationDto {
  serverId: string;
  currentLoad: number;
  simulatedLoad: number; // percentage
  estimatedResponseTime: number;
  estimatedErrorRate: number;
  willCrash: boolean;
  timeUntilCrash: number; // minutes or null
}
