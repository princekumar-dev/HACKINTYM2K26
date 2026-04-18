import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  AnalyzeAppTopologyDto,
  SimulateAppResilienceDto,
} from '../dto/app-topology.dto';
import {
  AppResilienceSimulationReport,
  AppTopologyAnalysis,
  FailureScenario,
  HealingDecision,
  ProbeSnapshot,
  ScenarioSimulation,
  SimulationStep,
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
    const frontendReachable = frontend.statusCode > 0;
    const backendReachable = backend.statusCode > 0;
    const anyServiceOffline = !frontendReachable || !backendReachable;

    const frontendStatus = this.toNodeStatus(frontend.healthScore, frontend.latency);
    const backendStatus = this.toNodeStatus(backend.healthScore, backend.latency);
    const projectedApiCpu = this.estimateCpu(backend.latency, backend.healthScore, 62);
    const projectedUiCpu = this.estimateCpu(frontend.latency, frontend.healthScore, 48);
    const aiScore = anyServiceOffline
      ? 18
      : Math.round(
          backend.performanceScore * 0.65 + frontend.performanceScore * 0.35,
        );
    const aiStatus = anyServiceOffline
      ? 'warning'
      : this.toNodeStatus(aiScore, backend.latency * 0.85);
    const databaseLatency = backendReachable ? Math.max(25, backend.latency * 0.45) : 420;
    const databaseStatus = !backendReachable
      ? 'warning'
      : projectedApiCpu > 82
      ? 'warning'
      : 'healthy';

    const nodes: TopologyNode[] = [
      {
        id: 'gateway',
        label: 'Ingress Gateway',
        role: 'gateway',
        status: anyServiceOffline ? 'warning' : frontendStatus === 'critical' ? 'warning' : 'healthy',
        cpu: anyServiceOffline ? 52 : 34,
        latency: anyServiceOffline ? 180 : Math.max(8, frontend.latency * 0.2),
        load: anyServiceOffline ? 26 : 52,
        errors: anyServiceOffline ? 3 : frontend.statusCode && frontend.statusCode >= 500 ? 3 : 0,
        capacity: 5200,
      },
      {
        id: 'frontend',
        label: `Frontend:${dto.frontendPort}`,
        role: 'frontend',
        status: frontendStatus,
        cpu: frontendReachable ? projectedUiCpu : 100,
        latency: frontendReachable ? Math.max(30, frontend.latency) : 999,
        load: frontendReachable ? this.estimateLoad(frontend.performanceScore, 58) : 0,
        errors: frontend.statusCode === 200 ? 0 : frontendReachable ? 6 : 18,
        capacity: 3800,
      },
      {
        id: 'api',
        label: `Backend:${dto.backendPort}`,
        role: 'api',
        status: backendStatus,
        cpu: backendReachable ? projectedApiCpu : 100,
        latency: backendReachable ? Math.max(35, backend.latency) : 999,
        load: backendReachable ? this.estimateLoad(backend.performanceScore, 64) : 0,
        errors: backend.statusCode === 200 ? 0 : backendReachable ? 8 : 22,
        capacity: 3200,
      },
      {
        id: 'ai-engine',
        label: 'Healing AI',
        role: 'ai',
        status: aiStatus,
        cpu: anyServiceOffline ? 72 : this.estimateCpu(backend.latency * 0.8, aiScore, 54),
        latency: anyServiceOffline ? 260 : Math.max(20, backend.latency * 0.6),
        load: anyServiceOffline ? 33 : this.estimateLoad(aiScore, 44),
        errors: anyServiceOffline ? 4 : aiScore < 55 ? 4 : 0,
        capacity: 2600,
      },
      {
        id: 'cache',
        label: 'Priority Cache',
        role: 'cache',
        status: anyServiceOffline ? 'warning' : frontend.performanceScore < 45 ? 'warning' : 'healthy',
        cpu: anyServiceOffline ? 44 : 30,
        latency: anyServiceOffline ? 110 : 12,
        load: anyServiceOffline ? 24 : 40,
        errors: anyServiceOffline ? 1 : 0,
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
      {
        from: 'gateway',
        to: 'frontend',
        active: frontendReachable,
        flowRate: frontendReachable ? 0.92 : 0,
      },
      {
        from: 'frontend',
        to: 'api',
        active: frontendReachable && backendReachable && frontendStatus !== 'critical',
        flowRate: frontendReachable && backendReachable ? 0.78 : 0,
      },
      {
        from: 'api',
        to: 'ai-engine',
        active: backendReachable && backendStatus !== 'critical',
        flowRate: backendReachable ? 0.62 : 0,
      },
      {
        from: 'api',
        to: 'database',
        active: backendReachable && backendStatus !== 'critical',
        flowRate: backendReachable ? 0.66 : 0,
      },
      {
        from: 'frontend',
        to: 'cache',
        active: frontendReachable,
        flowRate: frontendReachable ? 0.41 : 0,
      },
      {
        from: 'cache',
        to: 'api',
        active: backendReachable,
        flowRate: backendReachable ? 0.36 : 0,
      },
    ];

    const predictedFailureNode = [...nodes]
      .sort((left, right) => this.failureRisk(right) - this.failureRisk(left))[0];

    const health = {
      overallScore: anyServiceOffline
        ? Math.round(
            (frontend.healthScore + backend.healthScore + Math.min(aiScore, 30)) / 3,
          )
        : Math.round((frontend.healthScore + backend.healthScore + aiScore) / 3),
      frontendScore: frontend.healthScore,
      backendScore: backend.healthScore,
      frontendReachable,
      backendReachable,
      predictedFailureNodeId: predictedFailureNode?.id ?? null,
      predictedFailureWindow: anyServiceOffline
        ? 'Unavailable while requested ports are offline'
        : this.failureRisk(predictedFailureNode) > 80
        ? '2-4 minutes'
        : '5-10 minutes',
      summary: this.buildSummary(
        frontendStatus,
        backendStatus,
        predictedFailureNode?.label,
        frontendReachable,
        backendReachable,
      ),
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
          anyServiceOffline
            ? 'Requested ports are offline. Keep traffic blocked, surface the failure, and wait for a successful re-scan before enabling healing.'
            : backendStatus === 'critical'
            ? 'Shift read-heavy traffic through cache while AI engine restarts the API path.'
            : 'Keep primary path active and pre-warm cache for fast failover.',
      },
      healingDecisions,
      failureScenarios,
    };
  }

  async simulateAppResilience(
    dto: SimulateAppResilienceDto,
  ): Promise<AppResilienceSimulationReport> {
    const host = dto.host?.trim() || 'localhost';
    const frontendUrl = this.buildUrl(host, dto.frontendPort);
    const backendUrl = this.buildUrl(host, dto.backendPort);
    const cloneBackendUrl = this.buildUrl(
      host,
      dto.backendPort + (dto.clonePortOffset ?? 100),
    );
    const sampleSize = dto.sampleSize ?? 4;
    const maxRequests = dto.maxRequests ?? 240;
    const requestStep = dto.requestStep ?? 20;
    const stressLevel = dto.stressLevel ?? 50;

    const [baselineTopology, frontendBaseline, backendBaseline] =
      await Promise.all([
        this.analyzeApplicationTopology(dto),
        this.collectProbeSnapshot(frontendUrl, sampleSize),
        this.collectProbeSnapshot(backendUrl, sampleSize),
      ]);

    const scenarios = baselineTopology.failureScenarios.map((scenario) =>
      this.simulateScenario(
        scenario,
        baselineTopology.topology.nodes,
        {
          frontend: frontendBaseline,
          backend: backendBaseline,
        },
        maxRequests,
        requestStep,
        cloneBackendUrl,
        stressLevel,
      ),
    );

    const crashedScenarios = scenarios.filter(
      (scenario) => scenario.predictedFailureRequestCount !== null,
    );
    const earliestFailureStressLevel =
      crashedScenarios.length > 0
        ? Math.min(
            ...crashedScenarios
              .map((scenario) => scenario.predictedFailureStressLevel)
              .filter((level): level is number => level !== null),
          )
        : null;
    const earliestFailureRequestCount =
      crashedScenarios.length > 0
        ? Math.min(
            ...crashedScenarios
              .map((scenario) => scenario.predictedFailureRequestCount)
              .filter((count): count is number => count !== null),
          )
        : null;

    const crashCounts = new Map<string, number>();
    for (const scenario of crashedScenarios) {
      if (!scenario.crashNodeId) continue;
      crashCounts.set(
        scenario.crashNodeId,
        (crashCounts.get(scenario.crashNodeId) ?? 0) + 1,
      );
    }

    const likelyCrashNodeId =
      [...crashCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
      baselineTopology.health.predictedFailureNodeId;

    return {
      simulatedAt: new Date().toISOString(),
      target: {
        host,
        frontendUrl,
        backendUrl,
        cloneBackendUrl,
      },
      baseline: {
        frontend: frontendBaseline,
        backend: backendBaseline,
      },
      summary: {
        totalScenarios: scenarios.length,
        crashedScenarios: crashedScenarios.length,
        earliestFailureStressLevel,
        earliestFailureRequestCount,
        likelyCrashNodeId,
        stressLevel,
        recommendation:
          earliestFailureRequestCount !== null && earliestFailureRequestCount <= 80
            ? `Stress ${stressLevel}% pushes the localhost app close to failure. Keep real users on primary, shift dummy users to the clone, and scale the backend path.`
            : `Stress ${stressLevel}% is manageable. Keep real users on primary and send synthetic or dummy load to the clone when pressure rises.`,
      },
      scenarios,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
          errorMessage,
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
    frontendReachable = true,
    backendReachable = true,
  ): string {
    if (!frontendReachable && !backendReachable) {
      return `Frontend and backend ports are not running. Auto-healing is paused until both services respond again.`;
    }

    if (!frontendReachable) {
      return `Frontend port is not running. Keep the UI node down and wait for the frontend service to come back before healing.`;
    }

    if (!backendReachable) {
      return `Backend port is not running. Keep the API node down and do not auto-heal until the backend service responds again.`;
    }

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
    const frontend = nodes.find((node) => node.id === 'frontend');
    const anyServiceOffline =
      frontend?.status === 'critical' || backend?.status === 'critical';

    if (anyServiceOffline) {
      return [
        {
          action: 'Reachability gate',
          reason:
            'One or more requested ports did not answer the scan, so the topology is locked in failure mode.',
          impact: 'Nodes remain red or yellow instead of shifting into healing or healthy states.',
        },
        {
          action: 'Healing paused',
          reason:
            'Auto-healing only makes sense after the frontend and backend processes are reachable again.',
          impact: 'The UI reflects the live outage instead of simulating recovery.',
        },
        {
          action: 'Re-scan required',
          reason:
            'A successful probe is needed before traffic routing and predictive healing can resume.',
          impact: 'Once the services are running, the next scan will rebuild the live topology.',
        },
      ];
    }

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
    const cache = nodes.find((node) => node.id === 'cache');
    const aiEngine = nodes.find((node) => node.id === 'ai-engine');

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
      {
        id: 'cache-saturation',
        title: 'Cache saturation',
        targetNodeId: cache?.id ?? 'cache',
        injectionType: 'overload',
        failureProbability: Math.min(96, this.failureRisk(cache) + 10),
        outcome:
          'Gateway falls back to direct API reads, increasing backend pressure but preserving availability.',
      },
      {
        id: 'ai-control-lag',
        title: 'AI control lag',
        targetNodeId: aiEngine?.id ?? 'ai-engine',
        injectionType: 'slow',
        failureProbability: Math.min(96, this.failureRisk(aiEngine) + 5),
        outcome:
          'Rules-based safeguards take over until the healing engine regains stable response time.',
      },
    ];
  }

  private async collectProbeSnapshot(
    url: string,
    sampleSize: number,
  ): Promise<ProbeSnapshot> {
    const results = await Promise.all(
      Array.from({ length: sampleSize }, () => this.analyzeUrl(url)),
    );

    const successful = results.filter((result) => result.statusCode > 0);
    const avgLatency =
      results.reduce((sum, result) => sum + result.latency, 0) /
      Math.max(1, results.length);
    const peakLatency = Math.max(...results.map((result) => result.latency), 0);
    const unhealthyResponses = results.filter(
      (result) => result.statusCode === 0 || result.statusCode >= 500,
    ).length;

    return {
      url,
      samples: sampleSize,
      successRate: Math.round((successful.length / Math.max(1, sampleSize)) * 100),
      avgLatency: Math.round(avgLatency),
      peakLatency: Math.round(peakLatency),
      unhealthyResponses,
    };
  }

  private simulateScenario(
    scenario: FailureScenario,
    nodes: TopologyNode[],
    baseline: { frontend: ProbeSnapshot; backend: ProbeSnapshot },
    maxRequests: number,
    requestStep: number,
    cloneBackendUrl: string,
    stressLevel: number,
  ): ScenarioSimulation {
    const targetNode = nodes.find((node) => node.id === scenario.targetNodeId);
    const fallbackCloneCapacity = 0.72;
    const timeline: SimulationStep[] = [];
    let predictedFailureRequestCount: number | null = null;
    let predictedFailureStressLevel: number | null = null;
    let crashNodeId: string | null = null;
    let maxCrashProbability = 0;
    const realUserRatio = Math.max(0.35, 0.8 - stressLevel / 250);
    const dummyUserRatio = 1 - realUserRatio;
    const evaluateAtStress = (evaluatedStressLevel: number) => {
      const liveStressMultiplier = 0.65 + evaluatedStressLevel / 100;

      for (
        let requestCount = requestStep;
        requestCount <= maxRequests;
        requestCount += requestStep
      ) {
        const effectiveRequests = Math.round(requestCount * liveStressMultiplier);
        const concurrency = Math.max(1, Math.round(effectiveRequests / 10));
        const baselineLatency =
          scenario.targetNodeId === 'frontend'
            ? baseline.frontend.avgLatency
            : baseline.backend.avgLatency;
        const overloadFactor =
          effectiveRequests / Math.max(25, targetNode?.capacity ?? 100);
        const scenarioBoost =
          scenario.injectionType === 'kill'
            ? 1.8
            : scenario.injectionType === 'slow'
            ? 1.25
            : 1.45;
        const latency = Math.round(
          baselineLatency * (1 + overloadFactor * scenarioBoost),
        );
        const cpu = Math.min(
          100,
          Math.round(
            (targetNode?.cpu ?? 40) + overloadFactor * 42 + scenarioBoost * 9,
          ),
        );
        const errorRate = Math.min(
          100,
          Math.round(
            overloadFactor * 24 +
              (scenario.injectionType === 'kill'
                ? 38
                : scenario.injectionType === 'slow'
                ? 18
                : 24),
          ),
        );
        const crashProbability = this.predictCrashProbability({
          cpu,
          latency,
          errorRate,
          concurrency,
          overloadFactor,
          stressLevel: evaluatedStressLevel,
          targetNode,
          scenario,
        });
        maxCrashProbability = Math.max(maxCrashProbability, crashProbability);

        const status: SimulationStep['status'] =
          crashProbability >= 0.9 || errorRate >= 60 || cpu >= 99 || latency >= 2400
            ? 'crashed'
            : crashProbability >= 0.72 || errorRate >= 34 || cpu >= 90 || latency >= 1350
            ? 'critical'
            : crashProbability >= 0.45 || errorRate >= 16 || cpu >= 74 || latency >= 760
            ? 'degraded'
            : 'stable';

        timeline.push({
          requestCount: effectiveRequests,
          concurrency,
          latency,
          cpu,
          errorRate,
          status,
        });

        if (
          predictedFailureRequestCount === null &&
          (status === 'crashed' || crashProbability >= 0.82)
        ) {
          predictedFailureRequestCount = effectiveRequests;
          predictedFailureStressLevel = evaluatedStressLevel;
          crashNodeId =
            targetNode?.role === 'cache'
              ? 'api'
              : targetNode?.role === 'ai'
              ? 'api'
              : targetNode?.id ?? null;
          break;
        }
      }
    };

    evaluateAtStress(stressLevel);

    if (predictedFailureRequestCount === null && stressLevel >= 100) {
      for (
        let overdriveStressLevel = 110;
        overdriveStressLevel <= 220 && predictedFailureRequestCount === null;
        overdriveStressLevel += 10
      ) {
        evaluateAtStress(overdriveStressLevel);
      }
    }

    const availabilityBeforeFix =
      predictedFailureRequestCount === null
        ? 99
        : Math.max(28, 100 - Math.round((predictedFailureRequestCount / maxRequests) * 62));
    const availabilityAfterFix = Math.min(
      99,
      availabilityBeforeFix + Math.round(fallbackCloneCapacity * 34),
    );
    const recoverable =
      predictedFailureRequestCount === null &&
      maxCrashProbability < 0.58 &&
      availabilityAfterFix >= 72;
    const failoverTriggeredAtRequestCount =
      predictedFailureRequestCount !== null
        ? Math.max(requestStep, predictedFailureRequestCount - requestStep)
        : null;
    const totalUsersAtFailure = predictedFailureRequestCount ?? maxRequests;
    const realUsersKeptOnPrimary = Math.round(totalUsersAtFailure * realUserRatio);
    const dummyUsers = Math.max(0, totalUsersAtFailure - realUsersKeptOnPrimary);
    const dummyUsersShiftedToBackup = predictedFailureRequestCount
      ? Math.round(dummyUsers * Math.min(0.95, 0.45 + stressLevel / 100))
      : Math.round(dummyUsers * Math.min(0.75, 0.2 + stressLevel / 200));
    const droppedDummyUsers = Math.max(0, dummyUsers - dummyUsersShiftedToBackup);
    const realUsersShiftedToBackup =
      predictedFailureRequestCount !== null && stressLevel > 88
        ? Math.round(realUsersKeptOnPrimary * 0.08)
        : 0;
    const primaryTrafficShare = Math.max(
      0.2,
      Math.min(
        1,
        (realUsersKeptOnPrimary - realUsersShiftedToBackup) / Math.max(1, totalUsersAtFailure),
      ),
    );
    const backupTrafficShare = Math.min(
      0.8,
      (dummyUsersShiftedToBackup + realUsersShiftedToBackup) /
        Math.max(1, totalUsersAtFailure),
    );

    return {
      id: scenario.id,
      title: scenario.title,
      targetNodeId: scenario.targetNodeId,
      failureMode: scenario.injectionType,
      stressLevel,
      crashProbability: Number(maxCrashProbability.toFixed(2)),
      recoverable,
      predictedFailureStressLevel,
      predictedFailureRequestCount,
      crashNodeId,
      failureReason: this.describeFailureReason(
        targetNode,
        scenario,
        predictedFailureRequestCount,
        predictedFailureStressLevel,
        maxCrashProbability,
        recoverable,
      ),
      rerouteFix: this.describeRerouteFix(targetNode, scenario),
      cloneServerActivated: predictedFailureRequestCount !== null,
      backupServerUrl: cloneBackendUrl,
      failoverTriggeredAtRequestCount,
      totalUsersAtFailure,
      realUserRatio,
      dummyUserRatio,
      realUsersKeptOnPrimary,
      realUsersShiftedToBackup,
      dummyUsersShiftedToBackup,
      droppedDummyUsers,
      primaryTrafficShare,
      backupTrafficShare,
      availabilityBeforeFix,
      availabilityAfterFix,
      timeline,
    };
  }

  private describeFailureReason(
    targetNode: TopologyNode | undefined,
    scenario: FailureScenario,
    predictedFailureRequestCount: number | null,
    predictedFailureStressLevel: number | null,
    crashProbability: number,
    recoverable: boolean,
  ): string {
    if (predictedFailureRequestCount === null) {
      return recoverable
        ? `${targetNode?.label ?? 'Target node'} stays recoverable in this window. ML crash probability peaked near ${Math.round(
            crashProbability * 100,
          )}% even after internal overdrive search.`
        : `${targetNode?.label ?? 'Target node'} avoids a hard crash here, but the model still sees ${Math.round(
            crashProbability * 100,
          )}% crash pressure under this load.`;
    }

    if (scenario.injectionType === 'kill') {
      return `${targetNode?.label ?? 'Target node'} hard-fails near ${predictedFailureRequestCount} requests at ${predictedFailureStressLevel ?? 100}% simulated stress, with ML crash confidence at ${Math.round(
        crashProbability * 100,
      )}%.`;
    }

    if (scenario.injectionType === 'slow') {
      return `${targetNode?.label ?? 'Target node'} accumulates latency until queueing and timeout errors crash the service near ${predictedFailureRequestCount} requests at ${predictedFailureStressLevel ?? 100}% simulated stress. ML crash confidence reached ${Math.round(
        crashProbability * 100,
      )}%.`;
    }

    return `${targetNode?.label ?? 'Target node'} overloads CPU and error budget near ${predictedFailureRequestCount} requests at ${predictedFailureStressLevel ?? 100}% simulated stress, dragging the request chain into failure. ML crash confidence reached ${Math.round(
      crashProbability * 100,
    )}%.`;
  }

  private describeRerouteFix(
    targetNode: TopologyNode | undefined,
    scenario: FailureScenario,
  ): string {
    const label = targetNode?.label ?? 'Target node';
    if (targetNode?.role === 'frontend') {
      return `Move traffic through the gateway to a cloned frontend/backend pair, keep cached assets hot, and offload API reads until ${label} recovers.`;
    }

    if (targetNode?.role === 'database') {
      return `Clone-backed rerouting keeps reads on cache and directs writes to the standby server, preventing full downtime while ${label} heals.`;
    }

    if (scenario.injectionType === 'kill') {
      return `Gateway isolates ${label} and reroutes requests to a cloned backend server so the app remains reachable during restart.`;
    }

    return `Traffic is diverted from ${label} to a cloned backend server with lower load, while low-priority requests are shed to stabilize latency.`;
  }

  private predictCrashProbability(input: {
    cpu: number;
    latency: number;
    errorRate: number;
    concurrency: number;
    overloadFactor: number;
    stressLevel: number;
    targetNode?: TopologyNode;
    scenario: FailureScenario;
  }): number {
    const cpuSignal = input.cpu / 100;
    const latencySignal = Math.min(1.6, input.latency / 1800);
    const errorSignal = input.errorRate / 100;
    const concurrencySignal = Math.min(1.3, input.concurrency / 28);
    const overloadSignal = Math.min(1.5, input.overloadFactor);
    const stressSignal = input.stressLevel / 100;
    const roleWeight =
      input.targetNode?.role === 'api'
        ? 0.2
        : input.targetNode?.role === 'database'
        ? 0.18
        : input.targetNode?.role === 'frontend'
        ? 0.12
        : 0.08;
    const scenarioWeight =
      input.scenario.injectionType === 'kill'
        ? 0.26
        : input.scenario.injectionType === 'overload'
        ? 0.18
        : 0.14;

    const linearScore =
      -3.1 +
      cpuSignal * 1.45 +
      latencySignal * 1.2 +
      errorSignal * 1.65 +
      concurrencySignal * 0.55 +
      overloadSignal * 1.1 +
      stressSignal * 0.9 +
      roleWeight +
      scenarioWeight;

    return 1 / (1 + Math.exp(-linearScore));
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
