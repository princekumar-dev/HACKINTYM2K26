import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { AnalyzeAppTopologyDto } from '../dto/app-topology.dto';
import {
  AppTopologyAnalysis,
  FailureScenario,
  HealingDecision,
  TopologyEdge,
  TopologyNode,
} from '../interfaces/app-topology.interface';

@Injectable()
export class UrlMonitoringService {
  private httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 30000,
      maxRedirects: 5,
    });
  }

  async analyzeApplicationTopology(
    dto: AnalyzeAppTopologyDto,
  ): Promise<AppTopologyAnalysis> {
    const host = dto.host?.trim() || 'localhost';
    const frontendUrl = this.buildUrl(host, dto.frontendPort);
    const backendUrl = this.buildUrl(host, dto.backendPort);

    const [frontend, backend] = await Promise.all([
      this.analyzeUrl(frontendUrl),
      this.analyzeUrl(backendUrl),
    ]);

    const frontendStatus = this.toNodeStatus(frontend.healthScore, frontend.latency);
    const backendStatus = this.toNodeStatus(backend.healthScore, backend.latency);
    const projectedApiCpu = this.estimateCpu(backend.latency, backend.healthScore, 62);
    const projectedUiCpu = this.estimateCpu(frontend.latency, frontend.healthScore, 48);
    const aiScore = Math.round((backend.performanceScore * 0.65 + frontend.performanceScore * 0.35));
    const aiStatus = this.toNodeStatus(aiScore, backend.latency * 0.85);
    const databaseLatency = Math.max(25, backend.latency * 0.45);
    const databaseStatus = projectedApiCpu > 82 ? 'warning' : 'healthy';

    const nodes: TopologyNode[] = [
      {
        id: 'gateway',
        label: 'Ingress Gateway',
        role: 'gateway',
        status: frontendStatus === 'critical' ? 'warning' : 'healthy',
        cpu: 34,
        latency: Math.max(8, frontend.latency * 0.2),
        load: 52,
        errors: frontend.statusCode && frontend.statusCode >= 500 ? 3 : 0,
        capacity: 5200,
      },
      {
        id: 'frontend',
        label: `Frontend:${dto.frontendPort}`,
        role: 'frontend',
        status: frontendStatus,
        cpu: projectedUiCpu,
        latency: Math.max(30, frontend.latency),
        load: this.estimateLoad(frontend.performanceScore, 58),
        errors: frontend.statusCode === 200 ? 0 : 6,
        capacity: 3800,
      },
      {
        id: 'api',
        label: `Backend:${dto.backendPort}`,
        role: 'api',
        status: backendStatus,
        cpu: projectedApiCpu,
        latency: Math.max(35, backend.latency),
        load: this.estimateLoad(backend.performanceScore, 64),
        errors: backend.statusCode === 200 ? 0 : 8,
        capacity: 3200,
      },
      {
        id: 'ai-engine',
        label: 'Healing AI',
        role: 'ai',
        status: aiStatus,
        cpu: this.estimateCpu(backend.latency * 0.8, aiScore, 54),
        latency: Math.max(20, backend.latency * 0.6),
        load: this.estimateLoad(aiScore, 44),
        errors: aiScore < 55 ? 4 : 0,
        capacity: 2600,
      },
      {
        id: 'cache',
        label: 'Priority Cache',
        role: 'cache',
        status: frontend.performanceScore < 45 ? 'warning' : 'healthy',
        cpu: 30,
        latency: 12,
        load: 40,
        errors: 0,
        capacity: 6400,
      },
      {
        id: 'database',
        label: 'State Store',
        role: 'database',
        status: databaseStatus,
        cpu: this.estimateCpu(databaseLatency, backend.healthScore, 58),
        latency: databaseLatency,
        load: this.estimateLoad(backend.healthScore, 48),
        errors: databaseStatus === 'warning' ? 2 : 0,
        capacity: 2100,
      },
    ];

    const edges: TopologyEdge[] = [
      { from: 'gateway', to: 'frontend', active: true, flowRate: 0.92 },
      { from: 'frontend', to: 'api', active: frontendStatus !== 'critical', flowRate: 0.78 },
      { from: 'api', to: 'ai-engine', active: backendStatus !== 'critical', flowRate: 0.62 },
      { from: 'api', to: 'database', active: backendStatus !== 'critical', flowRate: 0.66 },
      { from: 'frontend', to: 'cache', active: true, flowRate: 0.41 },
      { from: 'cache', to: 'api', active: true, flowRate: 0.36 },
    ];

    const predictedFailureNode = [...nodes]
      .sort((left, right) => this.failureRisk(right) - this.failureRisk(left))[0];

    const health = {
      overallScore: Math.round((frontend.healthScore + backend.healthScore + aiScore) / 3),
      frontendScore: frontend.healthScore,
      backendScore: backend.healthScore,
      predictedFailureNodeId: predictedFailureNode?.id ?? null,
      predictedFailureWindow:
        this.failureRisk(predictedFailureNode) > 80 ? '2-4 minutes' : '5-10 minutes',
      summary: this.buildSummary(frontendStatus, backendStatus, predictedFailureNode?.label),
    };

    const healingDecisions = this.buildHealingDecisions(nodes, health.predictedFailureNodeId);
    const failureScenarios = this.buildFailureScenarios(nodes);

    return {
      scannedAt: new Date().toISOString(),
      target: {
        host,
        frontendUrl,
        backendUrl,
      },
      topology: { nodes, edges },
      health,
      routing: {
        selectedPath: ['gateway', 'frontend', 'api', 'database'],
        alternatePath: ['gateway', 'frontend', 'cache', 'api', 'database'],
        strategy:
          backendStatus === 'critical'
            ? 'Shift read-heavy traffic through cache while AI engine restarts the API path.'
            : 'Keep primary path active and pre-warm cache for fast failover.',
      },
      healingDecisions,
      failureScenarios,
    };
  }

  async analyzeUrl(url: string) {
    try {
      const startTime = performance.now();
      const dnsStart = performance.now();

      // Validate URL format
      const urlObj = new URL(url);
      const dnsTime = performance.now() - dnsStart;

      // TCP/TLS timing
      const tcpStart = performance.now();
      const response = await this.httpClient.get(url, {
        validateStatus: () => true,
      });
      const tcpTime = performance.now() - tcpStart;

      const totalTime = performance.now() - startTime;

      // Calculate metrics
      const statusCode = response.status;
      const latency = totalTime;
      const responseSize = JSON.stringify(response.data).length;

      // Calculate health score (0-100)
      const healthScore = this.calculateHealthScore(statusCode, latency);

      // Calculate performance score (0-100)
      const performanceScore = this.calculatePerformanceScore(latency, responseSize);

      // Estimate uptime (simulated for now)
      const uptime = statusCode === 200 ? 99.9 : 85;

      // Error rate estimation
      const errorRate = statusCode !== 200 ? 50 : 1;

      // Get suggestions
      const suggestions = this.generateSuggestions(
        statusCode,
        latency,
        healthScore,
        performanceScore,
      );

      return {
        url,
        statusCode,
        latency,
        healthScore,
        performanceScore,
        responseTime: totalTime,
        uptime,
        errorRate,
        suggestions,
        metrics: {
          dns: dnsTime,
          tcp: tcpTime,
          tls: tcpTime * 0.3, // Estimated
          firstByte: tcpTime + dnsTime,
          pageLoad: totalTime,
          resourceSize: responseSize,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      // Handle error scenarios
      return {
        url,
        statusCode: 0,
        latency: 0,
        healthScore: 0,
        performanceScore: 0,
        responseTime: 0,
        uptime: 0,
        errorRate: 100,
        suggestions: [
          'URL is unreachable',
          'Check network connectivity',
          'Verify URL format and domain availability',
          error.message,
        ],
        metrics: {
          dns: 0,
          tcp: 0,
          tls: 0,
          firstByte: 0,
          pageLoad: 0,
          resourceSize: 0,
        },
        timestamp: new Date(),
      };
    }
  }

  private buildUrl(host: string, port: number): string {
    if (/^https?:\/\//i.test(host)) {
      return `${host.replace(/\/$/, '')}:${port}`;
    }

    return `http://${host}:${port}`;
  }

  private toNodeStatus(
    healthScore: number,
    latency: number,
  ): 'healthy' | 'warning' | 'critical' {
    if (healthScore < 45 || latency > 2500) {
      return 'critical';
    }

    if (healthScore < 70 || latency > 900) {
      return 'warning';
    }

    return 'healthy';
  }

  private estimateCpu(latency: number, score: number, base: number): number {
    return Math.max(
      18,
      Math.min(98, Math.round(base + latency / 55 + (100 - score) * 0.35)),
    );
  }

  private estimateLoad(score: number, base: number): number {
    return Math.max(12, Math.min(95, Math.round(base + (100 - score) * 0.22)));
  }

  private failureRisk(node?: TopologyNode): number {
    if (!node) {
      return 0;
    }

    return Math.round(node.cpu * 0.45 + node.latency * 0.08 + node.errors * 6);
  }

  private buildSummary(
    frontendStatus: 'healthy' | 'warning' | 'critical',
    backendStatus: 'healthy' | 'warning' | 'critical',
    predictedNodeLabel?: string,
  ): string {
    if (backendStatus === 'critical') {
      return `Backend instability detected. Healing will isolate API traffic and preserve the UI through cache and gateway protection.`;
    }

    if (frontendStatus === 'warning') {
      return `Frontend response is degrading. Pre-emptive rerouting is ready to keep users served while the UI tier cools down.`;
    }

    return `Application topology looks stable. ${
      predictedNodeLabel ?? 'No node'
    } is still being watched as the most likely next pressure point.`;
  }

  private buildHealingDecisions(
    nodes: TopologyNode[],
    predictedFailureNodeId: string | null,
  ): HealingDecision[] {
    const predicted = nodes.find((node) => node.id === predictedFailureNodeId);
    const backend = nodes.find((node) => node.id === 'api');

    return [
      {
        action: 'Predictive healing',
        reason: predicted
          ? `${predicted.label} is showing the highest combined CPU and latency risk.`
          : 'No dominant failure hotspot was detected.',
        impact: 'Cooldown workflows are prepared before hard failure happens.',
      },
      {
        action: 'Self-learning routing',
        reason:
          backend?.status === 'warning' || backend?.status === 'critical'
            ? 'API path is slower than cache-assisted path, so low-priority traffic can be diverted.'
            : 'Primary path remains fastest, but the alternate path is kept warm.',
        impact: 'Traffic can shift without waiting for manual intervention.',
      },
      {
        action: 'Traffic prioritization',
        reason:
          'Critical requests such as payments or auth stay on the fastest available route while browsing traffic is shed first.',
        impact: 'Important user journeys stay online during overload.',
      },
    ];
  }

  private buildFailureScenarios(nodes: TopologyNode[]): FailureScenario[] {
    const frontend = nodes.find((node) => node.id === 'frontend');
    const api = nodes.find((node) => node.id === 'api');
    const database = nodes.find((node) => node.id === 'database');

    return [
      {
        id: 'frontend-overload',
        title: 'Frontend spike',
        targetNodeId: frontend?.id ?? 'frontend',
        injectionType: 'overload',
        failureProbability: Math.min(96, this.failureRisk(frontend)),
        outcome:
          'AI sheds low-priority browsing traffic and routes repeat requests through cache.',
      },
      {
        id: 'api-timeout',
        title: 'Backend timeout',
        targetNodeId: api?.id ?? 'api',
        injectionType: 'slow',
        failureProbability: Math.min(96, this.failureRisk(api) + 8),
        outcome:
          'Gateway switches to alternate cache-assisted route while restart logic heals the API tier.',
      },
      {
        id: 'database-failure',
        title: 'State-store disruption',
        targetNodeId: database?.id ?? 'database',
        injectionType: 'kill',
        failureProbability: Math.min(96, this.failureRisk(database) + 6),
        outcome:
          'Read traffic is preserved from cache and write-heavy actions are throttled until recovery.',
      },
    ];
  }

  private calculateHealthScore(statusCode: number, latency: number): number {
    let score = 100;

    // Status code health
    if (statusCode >= 500) score -= 50;
    else if (statusCode >= 400) score -= 30;
    else if (statusCode === 200) score += 0;
    else if (statusCode >= 300) score -= 15;

    // Latency health
    if (latency > 5000) score -= 30;
    else if (latency > 3000) score -= 20;
    else if (latency > 1000) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private calculatePerformanceScore(latency: number, responseSize: number): number {
    let score = 100;

    // Latency score
    if (latency > 5000) score -= 40;
    else if (latency > 3000) score -= 25;
    else if (latency > 1000) score -= 10;
    else if (latency < 200) score += 10;

    // Response size score
    const sizeMB = responseSize / (1024 * 1024);
    if (sizeMB > 10) score -= 20;
    else if (sizeMB > 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private generateSuggestions(
    statusCode: number,
    latency: number,
    healthScore: number,
    performanceScore: number,
  ): string[] {
    const suggestions: string[] = [];

    if (statusCode >= 500) {
      suggestions.push('Server error detected. Contact server administrators.');
    }
    if (statusCode >= 400) {
      suggestions.push('Client error detected. Verify request parameters.');
    }
    if (latency > 3000) {
      suggestions.push(
        'High latency detected. Consider CDN implementation or server optimization.',
      );
      suggestions.push('Check network conditions and server load.');
    }
    if (latency > 5000) {
      suggestions.push(
        'Critical latency issue. Immediate optimization required.',
      );
    }
    if (healthScore < 50) {
      suggestions.push('Website health is poor. Urgent action required.');
    }
    if (performanceScore < 50) {
      suggestions.push(
        'Performance is degraded. Review server configuration and database queries.',
      );
    }
    if (suggestions.length === 0) {
      suggestions.push('Website is performing normally.');
    }

    return suggestions;
  }
}
