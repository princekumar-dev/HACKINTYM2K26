import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureLoadTestService {
  async testFeatureUnderLoad(
    featureName: string,
    baselineMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      responseTime: number;
      throughput: number;
    },
    featureMetrics: {
      cpuUsage: number;
      memoryUsage: number;
      responseTime: number;
      throughput: number;
    },
  ) {
    const testResults = {
      featureName,
      baselineMetrics,
      featureMetrics,
      loadTestResults: {
        normalLoad: this.simulateLoadLevel(baselineMetrics, 1.0, featureMetrics),
        mediumLoad: this.simulateLoadLevel(baselineMetrics, 1.5, featureMetrics),
        highLoad: this.simulateLoadLevel(baselineMetrics, 2.0, featureMetrics),
        peakLoad: this.simulateLoadLevel(baselineMetrics, 3.0, featureMetrics),
      },
      crashRiskScore: this.calculateCrashRiskScore(featureMetrics),
      performanceDegradation: this.calculatePerformanceDegradation(
        baselineMetrics,
        featureMetrics,
      ),
      detectedIssues: this.detectLoadTestIssues(
        baselineMetrics,
        featureMetrics,
      ),
      recommendations: this.getLoadTestRecommendations(
        baselineMetrics,
        featureMetrics,
      ),
      status: this.determineTestStatus(
        baselineMetrics,
        featureMetrics,
      ),
      readyForProduction: this.isReadyForProduction(
        baselineMetrics,
        featureMetrics,
      ),
      timestamp: new Date(),
    };

    return testResults;
  }

  private simulateLoadLevel(
    baselineMetrics: any,
    loadMultiplier: number,
    featureMetrics: any,
  ) {
    return {
      loadMultiplier: `${loadMultiplier}x`,
      baseline: {
        cpuUsage: Math.round(baselineMetrics.cpuUsage * loadMultiplier),
        memoryUsage: Math.round(baselineMetrics.memoryUsage * loadMultiplier),
        responseTime: Math.round(baselineMetrics.responseTime * loadMultiplier),
        throughput: Math.round(baselineMetrics.throughput),
      },
      withFeature: {
        cpuUsage: Math.min(100, Math.round(featureMetrics.cpuUsage * loadMultiplier)),
        memoryUsage: Math.min(100, Math.round(featureMetrics.memoryUsage * loadMultiplier)),
        responseTime: Math.round(featureMetrics.responseTime * loadMultiplier),
        throughput: Math.round(featureMetrics.throughput * 0.95), // Slight degradation
      },
      willCrash: featureMetrics.cpuUsage * loadMultiplier > 95,
      degradation: {
        cpuIncrease: Math.round(
          (featureMetrics.cpuUsage - baselineMetrics.cpuUsage) * loadMultiplier,
        ),
        memoryIncrease: Math.round(
          (featureMetrics.memoryUsage - baselineMetrics.memoryUsage) * loadMultiplier,
        ),
        responseTimeIncrease: Math.round(
          featureMetrics.responseTime - baselineMetrics.responseTime,
        ),
      },
    };
  }

  private calculateCrashRiskScore(featureMetrics: any): number {
    let riskScore = 0;

    if (featureMetrics.cpuUsage > 85) riskScore += 25;
    else if (featureMetrics.cpuUsage > 70) riskScore += 12;

    if (featureMetrics.memoryUsage > 85) riskScore += 25;
    else if (featureMetrics.memoryUsage > 70) riskScore += 12;

    if (featureMetrics.responseTime > 1000) riskScore += 20;
    else if (featureMetrics.responseTime > 500) riskScore += 10;

    return Math.min(100, riskScore);
  }

  private calculatePerformanceDegradation(
    baseline: any,
    featureMetrics: any,
  ): number {
    const cpuDegradation = (
      (featureMetrics.cpuUsage - baseline.cpuUsage) / baseline.cpuUsage
    ) * 100;
    const responseDegradation = (
      (featureMetrics.responseTime - baseline.responseTime) /
      baseline.responseTime
    ) * 100;

    return Math.round((cpuDegradation + responseDegradation) / 2);
  }

  private detectLoadTestIssues(
    baselineMetrics: any,
    featureMetrics: any,
  ): string[] {
    const issues: string[] = [];

    const cpuIncrease =
      ((featureMetrics.cpuUsage - baselineMetrics.cpuUsage) /
        baselineMetrics.cpuUsage) *
      100;

    if (cpuIncrease > 50) {
      issues.push('🔴 Significant CPU increase (+' + Math.round(cpuIncrease) + '%)');
      issues.push('   Cause: Inefficient algorithm or missing optimization');
    }

    if (featureMetrics.memoryUsage > 80) {
      issues.push('🟠 High memory usage (>80%)');
      issues.push('   Risk: Memory leaks or insufficient caching');
    }

    if (featureMetrics.responseTime > 2000) {
      issues.push('🟡 Slow response time (>2s)');
      issues.push('   Impact: Poor user experience, timeouts possible');
    }

    const throughputLoss =
      ((featureMetrics.throughput - baselineMetrics.throughput) /
        baselineMetrics.throughput) *
      100;

    if (throughputLoss < -20) {
      issues.push('🔵 Throughput loss (' + Math.round(throughputLoss) + '%)');
      issues.push('   Concern: Feature may block or serialize requests');
    }

    if (issues.length === 0) {
      issues.push('✅ No major issues detected in load testing');
    }

    return issues;
  }

  private getLoadTestRecommendations(
    baselineMetrics: any,
    featureMetrics: any,
  ): string[] {
    const recommendations: string[] = [];
    const crashRisk = this.calculateCrashRiskScore(featureMetrics);
    const degradation = this.calculatePerformanceDegradation(
      baselineMetrics,
      featureMetrics,
    );

    if (crashRisk > 60) {
      recommendations.push('🚫 OPTIMIZATION REQUIRED before release');
      recommendations.push('   Action: Profile and optimize hot paths');
      recommendations.push('   Timeline: 1-2 sprints');
      recommendations.push('   Target: Reduce CPU usage by 30%');
    } else if (crashRisk > 40) {
      recommendations.push('⚠️ MONITOR CLOSELY after release');
      recommendations.push('   Action: Enable detailed metrics collection');
      recommendations.push('   Plan: Feature flag for quick rollback');
      recommendations.push('   Deploy: Canary (5%) → Staged (25%) → Full');
    } else if (crashRisk < 20) {
      recommendations.push('✅ READY FOR PRODUCTION');
      recommendations.push('   Deploy: Standard rollout');
      recommendations.push('   Monitoring: Standard alerts sufficient');
    }

    if (degradation > 30) {
      recommendations.push(
        '💡 Consider feature flags for gradual rollout at ' +
          (Math.floor(degradation / 10) * 10) +
          '% degradation',
      );
    }

    // Specific optimization suggestions
    if (
      featureMetrics.cpuUsage > baselineMetrics.cpuUsage * 1.5
    ) {
      recommendations.push('🔧 CPU Optimization Suggestions:');
      recommendations.push('   - Add caching layer for repeated computations');
      recommendations.push('   - Use async operations where possible');
      recommendations.push('   - Profile with flame graphs');
      recommendations.push('   - Consider background job processing');
    }

    if (
      featureMetrics.memoryUsage > baselineMetrics.memoryUsage * 1.3
    ) {
      recommendations.push('🔧 Memory Optimization Suggestions:');
      recommendations.push('   - Review memory allocations');
      recommendations.push('   - Implement object pooling');
      recommendations.push('   - Add garbage collection tuning');
      recommendations.push('   - Use streaming for large data');
    }

    return recommendations;
  }

  private determineTestStatus(
    baselineMetrics: any,
    featureMetrics: any,
  ): 'passed' | 'warning' | 'failed' {
    const crashRisk = this.calculateCrashRiskScore(featureMetrics);

    if (crashRisk > 70 || featureMetrics.cpuUsage > 90) return 'failed';
    if (crashRisk > 40 || featureMetrics.cpuUsage > 80) return 'warning';
    return 'passed';
  }

  private isReadyForProduction(
    baselineMetrics: any,
    featureMetrics: any,
  ): boolean {
    const crashRisk = this.calculateCrashRiskScore(featureMetrics);
    const cpuIncrease =
      ((featureMetrics.cpuUsage - baselineMetrics.cpuUsage) /
        baselineMetrics.cpuUsage) *
      100;

    return (
      crashRisk <= 40 &&
      featureMetrics.cpuUsage <= 85 &&
      featureMetrics.memoryUsage <= 85 &&
      cpuIncrease <= 40
    );
  }

  async randomFeatureMonitoring(featureName: string) {
    // Simulate random testing of a feature during production
    const randomLoad = Math.floor(Math.random() * 3) + 1; // 1x, 2x, or 3x load
    const randomIssues = this.generateRandomIssues();

    return {
      featureName,
      timestamp: new Date(),
      randomLoadTest: `${randomLoad}x load simulation`,
      detectedIssues: randomIssues,
      status: randomIssues.length > 2 ? 'warning' : 'normal',
      action:
        randomIssues.length > 2
          ? 'Further monitoring recommended'
          : 'Feature performing normally',
      suggestions: this.getSuggestionsForIssues(randomIssues),
    };
  }

  private generateRandomIssues(): string[] {
    const possibleIssues = [
      'Spike in error rate detected',
      'Memory leak suspected',
      'Response time degradation',
      'High CPU usage detected',
      'Unusual traffic pattern',
      'Cache miss rate high',
    ];

    const issueCount = Math.floor(Math.random() * 3);
    const issues: string[] = [];

    for (let i = 0; i < issueCount; i++) {
      const randomIndex = Math.floor(Math.random() * possibleIssues.length);
      if (!issues.includes(possibleIssues[randomIndex])) {
        issues.push(possibleIssues[randomIndex]);
      }
    }

    return issues;
  }

  private getSuggestionsForIssues(issues: string[]): string[] {
    const suggestions: string[] = [];

    issues.forEach((issue) => {
      if (issue.includes('error'))
        suggestions.push('→ Check application logs for errors');
      if (issue.includes('Memory'))
        suggestions.push('→ Review memory heap dumps');
      if (issue.includes('Response'))
        suggestions.push('→ Check database query performance');
      if (issue.includes('CPU'))
        suggestions.push('→ Profile CPU usage with flame graph');
      if (issue.includes('traffic'))
        suggestions.push('→ Verify traffic sources');
      if (issue.includes('Cache'))
        suggestions.push('→ Increase cache size or TTL');
    });

    return suggestions.length > 0
      ? suggestions
      : ['✅ No issues found in current monitoring cycle'];
  }
}
