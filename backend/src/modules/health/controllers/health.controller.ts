import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ServerHealthService } from '../services/server-health.service';
import { LoadBalancingService } from '../services/load-balancing.service';
import { FeatureLoadTestService } from '../services/feature-load-test.service';

@Controller('api/health')
export class HealthController {
  constructor(
    private readonly healthService: ServerHealthService,
    private readonly loadBalancingService: LoadBalancingService,
    private readonly featureLoadTestService: FeatureLoadTestService,
  ) {}

  // Server Health Monitoring
  @Post('analyze-server')
  async analyzeServer(@Body() metrics: any) {
    return await this.healthService.analyzeServerHealth(metrics);
  }

  @Post('simulate-high-load')
  async simulateHighLoad(@Body() data: any) {
    return await this.healthService.simulateHighLoad(data.metrics, data.loadMultiplier);
  }

  @Post('predict-crash')
  async predictCrash(@Body() metrics: any) {
    const analysis = await this.healthService.analyzeServerHealth(metrics);
    return {
      serverId: metrics.serverId,
      crashRiskScore: analysis.crashRisk,
      status: analysis.status,
      willCrash: analysis.crashRisk > 80,
      recommendations: analysis.suggestions,
      timestamp: new Date(),
    };
  }

  // Load Balancing
  @Post('load-balancing-suggestions')
  async getLoadBalancingSuggestions(@Body() servers: any[]) {
    return await this.loadBalancingService.generateLoadBalancingSuggestions(servers);
  }

  @Post('suggest-scaling')
  async suggestScaling(@Body() metrics: any) {
    return await this.loadBalancingService.suggestScaling(metrics);
  }

  // Feature Load Testing
  @Post('test-feature-load')
  async testFeatureLoad(@Body() data: any) {
    return await this.featureLoadTestService.testFeatureUnderLoad(
      data.featureName,
      data.baselineMetrics,
      data.featureMetrics,
    );
  }

  @Post('feature-random-monitoring')
  async randomFeatureMonitoring(@Body() data: any) {
    return await this.featureLoadTestService.randomFeatureMonitoring(
      data.featureName,
    );
  }

  // Feature vs Baseline Comparison
  @Post('compare-with-feature')
  async compareWithFeature(@Body() data: any) {
    return await this.healthService.compareWithFeature(
      data.baselineMetrics,
      data.newFeatureImpact,
    );
  }

  @Get('health-check')
  getHealthCheck() {
    return {
      status: 'ok',
      service: 'Server Health Monitoring',
      timestamp: new Date(),
    };
  }
}
