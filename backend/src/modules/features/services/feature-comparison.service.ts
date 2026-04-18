import { Injectable } from '@nestjs/common';
import { CodeAnalysisService } from '../../analysis/services/code-analysis.service';

@Injectable()
export class FeatureComparisonService {
  constructor(private codeAnalysisService: CodeAnalysisService) {}

  async compareFeature(
    featureName: string,
    currentCode: string,
    proposedCode: string,
    affectedComponents: string[] = [],
  ) {
    // Analyze both versions
    const currentAnalysis = await this.codeAnalysisService.analyzeCode(currentCode);
    const proposedAnalysis = await this.codeAnalysisService.analyzeCode(proposedCode);

    // Extract metrics
    const currentMetrics = {
      performance: currentAnalysis.performanceScore,
      health: currentAnalysis.healthScore,
      latency: 100 - currentAnalysis.performanceScore, // Simulated
      memory: this.estimateMemoryUsage(currentCode),
      cpu: this.estimateCpuUsage(currentCode),
      complexity: currentAnalysis.complexity,
    };

    const proposedMetrics = {
      performance: proposedAnalysis.performanceScore,
      health: proposedAnalysis.healthScore,
      latency: 100 - proposedAnalysis.performanceScore, // Simulated
      memory: this.estimateMemoryUsage(proposedCode),
      cpu: this.estimateCpuUsage(proposedCode),
      complexity: proposedAnalysis.complexity,
    };

    // Calculate improvements
    const improvements = {
      performance: proposedMetrics.performance - currentMetrics.performance,
      health: proposedMetrics.health - currentMetrics.health,
      latency: currentMetrics.latency - proposedMetrics.latency,
      memory: currentMetrics.memory - proposedMetrics.memory,
      cpu: currentMetrics.cpu - proposedMetrics.cpu,
    };

    // Determine impact level
    const totalImprovement =
      Object.values(improvements).reduce((a, b) => a + b, 0) / 5;
    const impactLevel = this.determineImpactLevel(totalImprovement);

    // Assess risk
    const riskLevel = this.assessRiskLevel(
      proposedAnalysis.issues,
      improvements,
    );
    const potentialIssues = this.identifyPotentialIssues(
      currentAnalysis,
      proposedAnalysis,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      improvements,
      proposedAnalysis,
      riskLevel,
    );

    // Estimate implementation time
    const estimatedImplementationTime = this.estimateImplementationTime(
      currentCode,
      proposedCode,
      affectedComponents.length,
    );

    return {
      featureName,
      currentMetrics,
      proposedMetrics,
      improvements,
      impactLevel,
      recommendations,
      riskLevel,
      potentialIssues,
      injectionMetadata: {
        affectedComponents,
        requiredChanges: this.identifyRequiredChanges(
          currentCode,
          proposedCode,
        ),
        estimatedImplementationTime,
      },
      timestamp: new Date(),
    };
  }

  private estimateMemoryUsage(code: string): number {
    let score = 50;

    // Count array/object literals
    const arrays = (code.match(/\[/g) || []).length;
    const objects = (code.match(/\{/g) || []).length;

    score += (arrays + objects) / 10;

    // Penalize large data structures
    if (code.includes('const data = [') && code.split('[').length > 5) {
      score += 20;
    }

    return Math.min(100, score);
  }

  private estimateCpuUsage(code: string): number {
    let score = 50;

    // Count loops and recursion
    const loops = (code.match(/for|while|forEach|map|filter|reduce/g) || [])
      .length;
    score += loops * 5;

    // Penalize recursion without optimization
    if (code.includes('recursive') && !code.includes('memoize')) {
      score += 20;
    }

    // Penalize nested loops
    if (code.split('for').length > 3) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private determineImpactLevel(
    improvement: number,
  ): 'low' | 'medium' | 'high' {
    if (improvement > 20) return 'high';
    if (improvement > 10) return 'medium';
    return 'low';
  }

  private assessRiskLevel(issues: string[], improvements: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Risk from code issues
    riskScore += issues.length * 10;

    // Risk from negative impacts
    Object.values(improvements).forEach((val: any) => {
      if (val < -10) riskScore += 20;
    });

    if (riskScore > 50) return 'high';
    if (riskScore > 25) return 'medium';
    return 'low';
  }

  private identifyPotentialIssues(current: any, proposed: any): string[] {
    const issues: string[] = [];

    // Check for performance regressions
    if (proposed.performanceScore < current.performanceScore - 5) {
      issues.push('Performance may degrade with this change');
    }

    // Check for health issues
    if (proposed.healthScore < current.healthScore - 10) {
      issues.push('Code health risks detected');
    }

    // Check for complexity increase
    if (proposed.complexity > current.complexity + 5) {
      issues.push('Code complexity increases significantly');
    }

    // Check for new issues
    if (proposed.issues.length > current.issues.length) {
      issues.push('New code quality issues introduced');
    }

    if (issues.length === 0) {
      issues.push('No major risks identified');
    }

    return issues;
  }

  private generateRecommendations(
    improvements: any,
    proposedAnalysis: any,
    riskLevel: string,
  ): string[] {
    const recommendations: string[] = [];

    if (improvements.performance > 10) {
      recommendations.push('✅ Significant performance improvement expected');
    }

    if (improvements.memory > 15) {
      recommendations.push('✅ Memory usage optimized');
    }

    if (riskLevel === 'high') {
      recommendations.push(
        '⚠️ High risk: Thoroughly test before deployment',
      );
    }

    if (proposedAnalysis.complexity > 15) {
      recommendations.push(
        '💡 Consider breaking down into smaller, more manageable functions',
      );
    }

    if (proposedAnalysis.issues.length > 0) {
      recommendations.push('📋 Resolve detected code issues before deployment');
    }

    if (improvements.latency > 20) {
      recommendations.push('🚀 Significant latency reduction achieved');
    }

    if (recommendations.length === 0) {
      recommendations.push('✓ Ready for testing and deployment');
    }

    return recommendations;
  }

  private identifyRequiredChanges(
    currentCode: string,
    proposedCode: string,
  ): string[] {
    const changes: string[] = [];

    // Detect imports/exports changes
    const currentImports = (currentCode.match(/import|require/g) || []).length;
    const proposedImports = (proposedCode.match(/import|require/g) || [])
      .length;
    if (proposedImports !== currentImports) {
      changes.push('Update or add new dependencies');
    }

    // Detect structure changes
    if (currentCode.includes('class') !== proposedCode.includes('class')) {
      changes.push('Refactor class structure');
    }

    // Detect API changes
    if (currentCode.includes('export') !== proposedCode.includes('export')) {
      changes.push('Update module exports');
    }

    // Detect test updates needed
    changes.push('Update unit tests');

    if (changes.length === 0) {
      changes.push('Code replacement with compatibility checks');
    }

    return changes;
  }

  private estimateImplementationTime(
    currentCode: string,
    proposedCode: string,
    componentCount: number,
  ): number {
    const codeDiff = Math.abs(proposedCode.length - currentCode.length);
    const baseTime = Math.ceil(codeDiff / 100); // 1 minute per 100 chars
    const componentTime = componentCount * 15; // 15 minutes per component
    return baseTime + componentTime + 30; // Add 30 minutes for testing
  }
}
