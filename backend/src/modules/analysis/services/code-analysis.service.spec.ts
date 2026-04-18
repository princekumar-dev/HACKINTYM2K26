import { Test, TestingModule } from '@nestjs/testing';
import { CodeAnalysisService } from '../services/code-analysis.service';

describe('CodeAnalysisService', () => {
  let service: CodeAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodeAnalysisService],
    }).compile();

    service = module.get<CodeAnalysisService>(CodeAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should analyze simple code', async () => {
    const code = 'function test() { return 42; }';
    const result = await service.analyzeCode(code, 'javascript');

    expect(result).toBeDefined();
    expect(result.lineCount).toBeGreaterThan(0);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.performanceScore).toBeGreaterThanOrEqual(0);
    expect(result.maintainabilityScore).toBeGreaterThanOrEqual(0);
  });

  it('should handle code with issues', async () => {
    const code = `
      function test() {
        console.log('test');
        eval('something');
        return 42;
      }
    `;
    const result = await service.analyzeCode(code, 'javascript');

    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
