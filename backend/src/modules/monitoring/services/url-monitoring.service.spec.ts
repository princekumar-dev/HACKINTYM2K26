import { Test, TestingModule } from '@nestjs/testing';
import { UrlMonitoringService } from '../services/url-monitoring.service';

describe('UrlMonitoringService', () => {
  let service: UrlMonitoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UrlMonitoringService],
    }).compile();

    service = module.get<UrlMonitoringService>(UrlMonitoringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should analyze a valid URL', async () => {
    const result = await service.analyzeUrl('https://example.com');
    expect(result).toBeDefined();
    expect(result.url).toBe('https://example.com');
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.performanceScore).toBeGreaterThanOrEqual(0);
  });

  it('should handle invalid URLs gracefully', async () => {
    const result = await service.analyzeUrl('invalid-url');
    expect(result.statusCode).toBe(0);
    expect(result.errorRate).toBe(100);
    expect(result.suggestions).toContain('URL is unreachable');
  });

  it('should score severe simulated conditions with higher crash probability', () => {
    const probability = (service as any).predictCrashProbability({
      cpu: 97,
      latency: 2100,
      errorRate: 58,
      concurrency: 26,
      overloadFactor: 1.3,
      stressLevel: 100,
      targetNode: { role: 'api' },
      scenario: { injectionType: 'kill' },
    });

    expect(probability).toBeGreaterThan(0.8);
  });

  it('should score mild simulated conditions as more recoverable', () => {
    const probability = (service as any).predictCrashProbability({
      cpu: 42,
      latency: 180,
      errorRate: 4,
      concurrency: 5,
      overloadFactor: 0.25,
      stressLevel: 25,
      targetNode: { role: 'frontend' },
      scenario: { injectionType: 'slow' },
    });

    expect(probability).toBeLessThan(0.5);
  });
});
