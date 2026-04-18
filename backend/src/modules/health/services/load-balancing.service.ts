import { Injectable } from '@nestjs/common';

@Injectable()
export class LoadBalancingService {
  async generateLoadBalancingSuggestions(
    servers: Array<{
      serverId: string;
      cpuUsage: number;
      memoryUsage: number;
      requestsPerSecond: number;
      healthScore: number;
      crashRisk: number;
      activeConnections: number;
    }>,
  ) {
    // Identify stressed servers
    const stressedServers = servers.filter(
      (s) => s.healthScore < 50 || s.crashRisk > 50,
    );
    const healthyServers = servers.filter(
      (s) => s.healthScore >= 50 && s.crashRisk <= 50,
    );

    const suggestions = await Promise.all(
      stressedServers.map((server) =>
        this.generateServerSuggestions(server, healthyServers, servers),
      ),
    );

    return {
      summary: {
        totalServers: servers.length,
        stressedServers: stressedServers.length,
        healthyServers: healthyServers.length,
        action: this.determineAction(stressedServers, healthyServers),
      },
      serverSuggestions: suggestions,
      globalRecommendations: this.getGlobalRecommendations(
        servers,
        stressedServers,
      ),
      timestamp: new Date(),
    };
  }

  private async generateServerSuggestions(
    stressedServer: any,
    healthyServers: any[],
    allServers: any[],
  ) {
    let targetServers: string[] = [];
    let recommendedAction = '';
    let expectedLoadReduction = 0;

    // Determine if we should move traffic to other servers
    if (healthyServers.length > 0) {
      // Sort healthy servers by available capacity
      const sortedHealthy = healthyServers.sort(
        (a, b) => b.healthScore - a.healthScore,
      );

      // Select best target servers
      targetServers = sortedHealthy
        .slice(0, Math.ceil(healthyServers.length / 2))
        .map((s) => s.serverId);

      recommendedAction = `Redirect traffic to healthier servers: ${targetServers.join(', ')}`;
      expectedLoadReduction = Math.round(stressedServer.requestsPerSecond * 0.4); // 40% reduction

      if (stressedServer.crashRisk > 80) {
        recommendedAction = `URGENT: Move 50% traffic to ${targetServers.join(', ')}`;
        expectedLoadReduction = Math.round(
          stressedServer.requestsPerSecond * 0.5,
        );
      }
    } else {
      recommendedAction = 'Add new servers to cluster';
      expectedLoadReduction = stressedServer.requestsPerSecond * 0.5;
    }

    // Generate priority
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (stressedServer.crashRisk > 80) priority = 'critical';
    else if (stressedServer.crashRisk > 60) priority = 'high';
    else if (stressedServer.crashRisk > 40) priority = 'medium';

    return {
      serverId: stressedServer.serverId,
      currentLoad: Math.round(stressedServer.cpuUsage),
      recommendedAction,
      priority,
      estimatedImpact: `Reduce crash risk from ${stressedServer.crashRisk}% to ~30%`,
      suggestions: this.getLoadBalancingSuggestions(stressedServer, targetServers),
      targetServers,
      expectedLoadReduction,
      implementationTime: this.estimateImplementationTime(targetServers.length),
      riskLevel: stressedServer.crashRisk > 70 ? 'high' : 'medium',
    };
  }

  private getLoadBalancingSuggestions(
    stressedServer: any,
    targetServers: string[],
  ): string[] {
    const suggestions: string[] = [];

    if (stressedServer.cpuUsage > 85) {
      suggestions.push('🔴 CPU Critical: Immediate load shedding required');
      if (targetServers.length > 0) {
        suggestions.push(
          `→ Move requests to: ${targetServers.join(', ')}`,
        );
      } else {
        suggestions.push('→ Scale up immediately (add new servers)');
      }
    }

    if (stressedServer.memoryUsage > 85) {
      suggestions.push('🟠 Memory Pressure: Activate memory optimization');
      suggestions.push('→ Clear cache and temporary data');
      suggestions.push('→ Reduce in-flight request count');
    }

    if (stressedServer.activeConnections > 5000) {
      suggestions.push('🟡 Connection Limit: Reduce active connections');
      suggestions.push('→ Close idle connections');
      suggestions.push('→ Implement connection pooling');
    }

    if (stressedServer.requestsPerSecond > 500) {
      suggestions.push(`📈 High RPS (${stressedServer.requestsPerSecond}): Load balance aggressively`);
      suggestions.push('→ Split traffic across available servers');
      suggestions.push('→ Implement rate limiting if needed');
    }

    // Recovery strategy
    if (targetServers.length > 0) {
      suggestions.push(
        `🔧 Recommended: Failover to ${targetServers.slice(0, 2).join(' and ')}`,
      );
      suggestions.push(
        `   Expected time: ${this.estimateImplementationTime(targetServers.length)} minutes`,
      );
    }

    return suggestions;
  }

  private getGlobalRecommendations(
    allServers: any[],
    stressedServers: any[],
  ): string[] {
    const recommendations: string[] = [];
    const averageHealthScore =
      allServers.reduce((sum, s) => sum + s.healthScore, 0) / allServers.length;
    const averageCrashRisk =
      allServers.reduce((sum, s) => sum + s.crashRisk, 0) / allServers.length;

    recommendations.push(`📊 Cluster Status:`);
    recommendations.push(
      `   Average Health: ${Math.round(averageHealthScore)}% (${averageHealthScore >= 70 ? 'Good' : averageHealthScore >= 50 ? 'Fair' : 'Poor'})`,
    );
    recommendations.push(
      `   Average Crash Risk: ${Math.round(averageCrashRisk)}%`,
    );

    if (stressedServers.length > 0) {
      recommendations.push(`⚠️ Action Required: ${stressedServers.length} server(s) under stress`);
      recommendations.push(`   Priority: ${this.getOverallPriority(stressedServers)}`);
    } else {
      recommendations.push(`✅ All servers healthy`);
    }

    if (stressedServers.length > allServers.length / 2) {
      recommendations.push(`🚨 CLUSTER OVERLOADED: Scale up required`);
      const additionalServersNeeded = Math.ceil(allServers.length * 0.5);
      recommendations.push(
        `   Recommended: Add ${additionalServersNeeded} new servers`,
      );
    }

    if (stressedServers.some((s) => s.crashRisk > 80)) {
      recommendations.push(`🔴 CRITICAL: Immediate action required`);
      recommendations.push(`   → Activate emergency load balancing`);
      recommendations.push(`   → Consider traffic throttling`);
      recommendations.push(`   → Notify operations team`);
    }

    return recommendations;
  }

  private getOverallPriority(
    stressedServers: any[],
  ): 'low' | 'medium' | 'high' | 'critical' {
    const maxCrashRisk = Math.max(...stressedServers.map((s) => s.crashRisk));
    if (maxCrashRisk > 80) return 'critical';
    if (maxCrashRisk > 60) return 'high';
    if (maxCrashRisk > 40) return 'medium';
    return 'low';
  }

  private determineAction(
    stressedServers: any[],
    healthyServers: any[],
  ): string {
    if (stressedServers.length === 0) return 'Monitor - No action needed';
    if (stressedServers.some((s) => s.crashRisk > 80))
      return 'URGENT - Immediate load balancing required';
    if (stressedServers.length > 1 && healthyServers.length === 0)
      return 'CRITICAL - Scale up infrastructure immediately';
    return 'Redistribute load to healthier servers';
  }

  private estimateImplementationTime(targetServerCount: number): number {
    // Estimate minutes based on number of target servers
    const baseTime = 1; // 1 minute base
    return baseTime + targetServerCount * 0.5; // +0.5 min per target server
  }

  async suggestScaling(
    currentMetrics: {
      totalServers: number;
      averageLoad: number;
      peakLoad: number;
      trafficGrowthRate: number; // percentage per hour
    },
  ) {
    const scalingPlan = {
      currentState: {
        servers: currentMetrics.totalServers,
        averageLoad: Math.round(currentMetrics.averageLoad),
        peakLoad: Math.round(currentMetrics.peakLoad),
      },
      recommendations: this.getScalingRecommendations(currentMetrics),
      scalingActions: this.generateScalingActions(currentMetrics),
      timeline: this.generateScalingTimeline(currentMetrics),
      estimatedCost:
        this.estimateScalingCost(currentMetrics) + ' additional server hours',
    };

    return scalingPlan;
  }

  private getScalingRecommendations(
    metrics: any,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.peakLoad > 85 && metrics.totalServers < 5) {
      recommendations.push('🟢 Scale up to 5-7 servers');
      recommendations.push('   Expected: Handle 2x traffic');
    } else if (metrics.peakLoad > 75 && metrics.totalServers < 3) {
      recommendations.push('🟡 Scale up to 3-4 servers');
      recommendations.push('   Expected: Handle 1.5x traffic');
    } else if (metrics.peakLoad < 50 && metrics.totalServers > 3) {
      recommendations.push('🔵 Scale down to 2-3 servers');
      recommendations.push('   Cost savings: 40-50%');
    }

    if (metrics.trafficGrowthRate > 10) {
      recommendations.push(
        `⚡ High growth rate (${metrics.trafficGrowthRate}%/hour): Auto-scaling recommended`,
      );
    }

    return recommendations;
  }

  private generateScalingActions(metrics: any): string[] {
    const actions: string[] = [];

    if (metrics.peakLoad > 85) {
      const newServers = Math.max(
        1,
        Math.ceil(metrics.totalServers * 0.5),
      );
      actions.push(`Immediately provision ${newServers} new server(s)`);
      actions.push('Enable auto-scaling rules');
      actions.push(`Set threshold at ${metrics.peakLoad - 10}% load`);
    }

    return actions;
  }

  private generateScalingTimeline(metrics: any): object {
    return {
      '0-15 min': 'Provision new instances',
      '15-30 min': 'Configure & deploy to new instances',
      '30-45 min': 'Run health checks',
      '45-60 min': 'Begin gradual traffic shift',
    };
  }

  private estimateScalingCost(metrics: any): number {
    const newServers = Math.max(1, Math.ceil(metrics.totalServers * 0.5));
    return newServers * 2; // Rough estimate
  }
}
