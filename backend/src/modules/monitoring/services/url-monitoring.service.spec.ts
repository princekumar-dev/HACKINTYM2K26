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
});
