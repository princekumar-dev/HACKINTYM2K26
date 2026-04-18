import { Injectable } from '@nestjs/common';

interface ServerMetrics {
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

@Injectable()
export class ServerHealthService {
  // Thresholds for different alert levels
  private readonly THRESHOLDS = {
    cpu: { warning: 70, critical: 85, crash: 95 },
    memory: { warning: 75, critical: 85, crash: 95 },
    disk: { warning: 80, critical: 90, crash: 95 },
    errorRate: { warning: 2, critical: 5, crash: 10 },
    responseTime: { warning: 500, critical: 1000, crash: 3000 },
  };

  async analyzeServerHealth(metrics: ServerMetrics) {
    try {
      // Calculate individual health scores
      const cpuScore = this.calculateMetricScore(
        metrics.cpuUsage,
        this.THRESHOLDS.cpu,
      );
      const memoryScore = this.calculateMetricScore(
        metrics.memoryUsage,
        this.THRESHOLDS.memory,
      );
      const diskScore = this.calculateMetricScore(
        metrics.diskUsage,
        this.THRESHOLDS.disk,
      );
      const errorScore = this.calculateMetricScore(
        metrics.errorRate,
        this.THRESHOLDS.errorRate,
      );
      const responseScore = this.calculateMetricScore(
        metrics.averageResponseTime,
        this.THRESHOLDS.responseTime,
      );

      // Calculate overall health score (0-100)
      const healthScore =
        (cpuScore + memoryScore + diskScore + errorScore + responseScore) / 5;

      // Predict crash risk
      const crashRisk = this.predictCrashRisk(metrics, healthScore);

      // Determine status
      const status = this.determineStatus(healthScore, crashRisk);

      // Generate suggestions
      const suggestions = this.generateHealthSuggestions(
        metrics,
        healthScore,
        crashRisk,
      );

      return {
        serverId: metrics.serverId,
        healthScore: Math.round(healthScore),
        status,
        crashRisk: Math.round(crashRisk),
        metrics: {
          cpu: metrics.cpuUsage,
          memory: metrics.memoryUsage,
          disk: metrics.diskUsage,
          requests: metrics.requestsPerSecond,
          errors: metrics.errorRate,
        },
        suggestions,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        serverId: metrics.serverId,
        healthScore: 0,
        status: 'offline',
        crashRisk: 100,
        metrics: {
          cpu: 0,
          memory: 0,
          disk: 0,
          requests: 0,
          errors: 100,
        },
        suggestions: [
          'Server is offline or unreachable',
          'Check server connectivity',
          'Restart server if necessary',
          error.message,
        ],
        timestamp: new Date(),
      };
    }
  }

  private calculateMetricScore(value: number, thresholds: any): number {
    if (value <= (thresholds.warning || thresholds.warning)) return 100;
    if (value <= (thresholds.critical || thresholds.critical)) return 75;
    if (value >= (thresholds.crash || thresholds.crash)) return 0;
    return Math.max(0, 100 - (value / 100) * 100);
  }

  private predictCrashRisk(metrics: ServerMetrics, healthScore: number): number {
    let riskScore = 0;

    // CPU risk calculation
    if (metrics.cpuUsage > 85) riskScore += 30;
    else if (metrics.cpuUsage > 70) riskScore += 15;

    // Memory risk calculation
    if (metrics.memoryUsage > 85) riskScore += 30;
    else if (metrics.memoryUsage > 75) riskScore += 15;

    // Disk space risk
    if (metrics.diskUsage > 90) riskScore += 20;
    else if (metrics.diskUsage > 80) riskScore += 10;

    // Error rate risk
    if (metrics.errorRate > 5) riskScore += 20;
    else if (metrics.errorRate > 2) riskScore += 10;

    // Response time risk
    if (metrics.averageResponseTime > 1000) riskScore += 15;
    else if (metrics.averageResponseTime > 500) riskScore += 8;

    // Connection overload risk
    if (metrics.activeConnections > 10000) riskScore += 25;
    else if (metrics.activeConnections > 5000) riskScore += 12;

    return Math.min(100, riskScore);
  }

  private determineStatus(
    healthScore: number,
    crashRisk: number,
  ): 'healthy' | 'degraded' | 'critical' | 'offline' {
    if (healthScore < 30 || crashRisk > 80) return 'critical';
    if (healthScore < 50 || crashRisk > 50) return 'degraded';
    if (healthScore < 0) return 'offline';
    return 'healthy';
  }

  private generateHealthSuggestions(
    metrics: ServerMetrics,
    healthScore: number,
    crashRisk: number,
  ): string[] {
    const suggestions: string[] = [];

    if (crashRisk > 80) {
      suggestions.push('🚨 CRITICAL: Server crash imminent. Immediate action needed.');
      suggestions.push('→ Divert traffic to load balancer immediately');
      suggestions.push('→ Scale up to additional servers');
      suggestions.push('→ Implement emergency throttling');
    }

    if (metrics.cpuUsage > 85) {
      suggestions.push('⚠️ CPU usage critically high');
      suggestions.push('→ Optimize slow queries and algorithms');
      suggestions.push('→ Cache frequently accessed data');
      suggestions.push('→ Scale horizontally (add more servers)');
    }

    if (metrics.memoryUsage > 85) {
      suggestions.push('⚠️ Memory pressure is high');
      suggestions.push('→ Increase server RAM or add more instances');
      suggestions.push('→ Review memory leaks in application');
      suggestions.push('→ Implement garbage collection optimization');
    }

    if (metrics.diskUsage > 90) {
      suggestions.push('⚠️ Disk space is running out');
      suggestions.push('→ Clean up old logs and temporary files');
      suggestions.push('→ Archive historical data');
      suggestions.push('→ Expand disk capacity');
    }

    if (metrics.errorRate > 5) {
      suggestions.push('⚠️ High error rate detected');
      suggestions.push('→ Check application logs for errors');
      suggestions.push('→ Verify database connectivity');
      suggestions.push('→ Review recent deployments');
    }

    if (metrics.averageResponseTime > 1000) {
      suggestions.push('⚠️ Response time is slow');
      suggestions.push('→ Enable response caching');
      suggestions.push('→ Optimize database queries');
      suggestions.push('→ Add CDN for static assets');
    }

    if (metrics.requestsPerSecond > 1000) {
      suggestions.push(`📈 High request volume: ${metrics.requestsPerSecond} RPS`);
      suggestions.push('→ Consider load balancing across servers');
      suggestions.push('→ Implement request rate limiting');
      suggestions.push('→ Use request queuing strategy');
    }

    if (metrics.networkLatency > 50) {
      suggestions.push('📡 High network latency detected');
      suggestions.push('→ Check network connectivity');
      suggestions.push('→ Review ISP issues');
      suggestions.push('→ Optimize network configuration');
    }

    if (healthScore >= 80) {
      suggestions.push('✅ Server is healthy and performing well');
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ Server operating normally');
    }

    return suggestions;
  }

  async simulateHighLoad(
    metrics: ServerMetrics,
    loadMultiplier: number, // e.g., 1.5 = 50% more load, 2 = 100% more load
  ) {
    // Simulate metrics under high load
    const simulatedMetrics = {
      cpuUsage: Math.min(100, metrics.cpuUsage * loadMultiplier),
      memoryUsage: Math.min(100, metrics.memoryUsage * loadMultiplier),
      requestsPerSecond: metrics.requestsPerSecond * loadMultiplier,
      averageResponseTime: metrics.averageResponseTime * loadMultiplier,
      errorRate: Math.min(50, metrics.errorRate * (loadMultiplier * 0.5)),
      activeConnections: Math.round(metrics.activeConnections * loadMultiplier),
      diskUsage: metrics.diskUsage,
      networkLatency: metrics.networkLatency * (loadMultiplier * 0.3),
    };

    const crashRisk = this.predictCrashRisk(
      { ...metrics, ...simulatedMetrics },
      50,
    );
    const timeUntilCrash = this.estimateTimeUntilCrash(crashRisk);

    return {
      serverId: metrics.serverId,
      currentLoad: 100,
      simulatedLoad: Math.round(loadMultiplier * 100),
      simulatedMetrics,
      estimatedResponseTime: Math.round(simulatedMetrics.averageResponseTime),
      estimatedErrorRate: Math.round(simulatedMetrics.errorRate * 10) / 10,
      willCrash: crashRisk > 80,
      timeUntilCrash,
      crashRiskScore: Math.round(crashRisk),
      recommendations: this.getLoadHandlingRecommendations(
        crashRisk,
        loadMultiplier,
      ),
      timestamp: new Date(),
    };
  }

  private estimateTimeUntilCrash(crashRisk: number): number | null {
    if (crashRisk < 80) return null;
    
    // Estimate minutes until crash based on risk score
    if (crashRisk > 95) return 5; // 5 minutes
    if (crashRisk > 90) return 15; // 15 minutes
    if (crashRisk > 85) return 30; // 30 minutes
    return 60; // 60 minutes
  }

  private getLoadHandlingRecommendations(
    crashRisk: number,
    loadMultiplier: number,
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(`Current load multiplier: ${loadMultiplier}x`);

    if (crashRisk > 80) {
      recommendations.push('🚨 This load level would cause crash');
      recommendations.push('SOLUTION: Implement load balancing to 2-3 servers');
      recommendations.push('ACTION: Add auto-scaling rules');
      recommendations.push('TIMELINE: Activate immediately when load >= 1.5x');
    } else if (crashRisk > 50) {
      recommendations.push('⚠️ Server under stress at this load');
      recommendations.push('SOLUTION: Prepare additional servers');
      recommendations.push('ACTION: Scale up at 1.2x load');
      recommendations.push('OPTIMIZATION: Enable aggressive caching');
    } else {
      recommendations.push('✅ Server can handle this load');
      recommendations.push('BUFFER: Can scale to 2x load with proper handling');
    }

    // Size recommendation
    if (loadMultiplier > 1.5) {
      const serversNeeded = Math.ceil(loadMultiplier);
      recommendations.push(
        `CAPACITY: Use ${serversNeeded} servers for this traffic level`,
      );
    }

    return recommendations;
  }

  async compareWithFeature(
    baselineMetrics: ServerMetrics,
    newFeatureImpact: {
      cpuIncrease: number; // percentage
      memoryIncrease: number; // percentage
      responseTimeIncrease: number; // percentage
    },
  ) {
    const featureMetrics = {
      ...baselineMetrics,
      cpuUsage: Math.min(100, baselineMetrics.cpuUsage + newFeatureImpact.cpuIncrease),
      memoryUsage: Math.min(100, baselineMetrics.memoryUsage + newFeatureImpact.memoryIncrease),
      averageResponseTime: baselineMetrics.averageResponseTime * (1 + newFeatureImpact.responseTimeIncrease / 100),
    };

    const baselineHealth = await this.analyzeServerHealth(baselineMetrics);
    const featureHealth = await this.analyzeServerHealth(featureMetrics);

    const healthImpact = baselineHealth.healthScore - featureHealth.healthScore;
    const crashRiskIncrease = featureHealth.crashRisk - baselineHealth.crashRisk;

    return {
      baseline: baselineHealth,
      withFeature: featureHealth,
      impact: {
        healthScoreDifference: healthImpact,
        crashRiskIncrease,
        safeToRelease: crashRiskIncrease < 20 && healthImpact < 30,
        recommendations: this.getFeatureReleaseRecommendations(
          crashRiskIncrease,
          healthImpact,
        ),
      },
      timestamp: new Date(),
    };
  }

  private getFeatureReleaseRecommendations(
    crashRiskIncrease: number,
    healthImpact: number,
  ): string[] {
    const recommendations: string[] = [];

    if (crashRiskIncrease > 30 || healthImpact > 40) {
      recommendations.push('🚫 NOT SAFE TO RELEASE to all servers');
      recommendations.push(
        'ACTION: Optimize feature performance before release',
      );
      recommendations.push('OPTION: Canary deployment to 5% of users');
      recommendations.push('MONITOR: Watch crash rate closely');
    } else if (crashRiskIncrease > 15 || healthImpact > 20) {
      recommendations.push('⚠️ CONDITIONAL RELEASE - requires caution');
      recommendations.push('ACTION: Scale up infrastructure before release');
      recommendations.push('TIMING: Release during low-traffic hours');
      recommendations.push('MONITOR: Implement real-time alerts');
    } else {
      recommendations.push('✅ SAFE TO RELEASE');
      recommendations.push('DEPLOYMENT: Can proceed normally');
      recommendations.push('MONITORING: Standard monitoring sufficient');
    }

    return recommendations;
  }
}
