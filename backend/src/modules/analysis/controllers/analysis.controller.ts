import { Controller, Post, Body } from '@nestjs/common';
import { CodeAnalysisService } from '../services/code-analysis.service';
import { AnalyzeCodeDto } from '../dto/code-analysis.dto';

@Controller('api/analysis')
export class AnalysisController {
  constructor(private readonly analysisService: CodeAnalysisService) {}

  @Post('analyze-code')
  async analyzeCode(@Body() dto: AnalyzeCodeDto) {
    return await this.analysisService.analyzeCode(
      dto.code,
      dto.language || 'javascript',
    );
  }

  @Post('batch-analyze')
  async batchAnalyzeCode(@Body() dtos: AnalyzeCodeDto[]) {
    const results = await Promise.all(
      dtos.map((dto) =>
        this.analysisService.analyzeCode(dto.code, dto.language || 'javascript'),
      ),
    );
    return results;
  }
}
