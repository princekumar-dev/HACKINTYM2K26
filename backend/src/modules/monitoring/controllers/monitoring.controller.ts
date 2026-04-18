import { Controller, Post, Body } from '@nestjs/common';
import { UrlMonitoringService } from '../services/url-monitoring.service';
import { AnalyzeUrlDto } from '../dto/url-analysis.dto';
import {
  AnalyzeAppTopologyDto,
  SimulateAppResilienceDto,
} from '../dto/app-topology.dto';

@Controller('api/monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: UrlMonitoringService) {}

  @Post('analyze-url')
  async analyzeUrl(@Body() dto: AnalyzeUrlDto) {
    return await this.monitoringService.analyzeUrl(dto.url);
  }

  @Post('bulk-analyze')
  async bulkAnalyzeUrls(@Body() dtos: AnalyzeUrlDto[]) {
    const results = await Promise.all(
      dtos.map((dto) => this.monitoringService.analyzeUrl(dto.url)),
    );
    return results;
  }

  @Post('analyze-app-topology')
  async analyzeAppTopology(@Body() dto: AnalyzeAppTopologyDto) {
    return await this.monitoringService.analyzeApplicationTopology(dto);
  }

  @Post('simulate-app-resilience')
  async simulateAppResilience(@Body() dto: SimulateAppResilienceDto) {
    return await this.monitoringService.simulateAppResilience(dto);
  }
}
