import { Controller, Post, Body } from '@nestjs/common';
import { FeatureComparisonService } from '../services/feature-comparison.service';
import { CompareFeatureDto } from '../dto/feature-comparison.dto';

@Controller('api/features')
export class FeaturesController {
  constructor(private readonly featureService: FeatureComparisonService) {}

  @Post('compare')
  async compareFeature(@Body() dto: CompareFeatureDto) {
    return await this.featureService.compareFeature(
      dto.featureName,
      dto.currentCode,
      dto.proposedCode,
      dto.affectedComponents,
    );
  }

  @Post('simulate-injection')
  async simulateInjection(@Body() dto: CompareFeatureDto) {
    return await this.featureService.compareFeature(
      dto.featureName,
      dto.currentCode,
      dto.proposedCode,
      dto.affectedComponents,
    );
  }
}
