import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeaturesController } from './controllers/features.controller';
import { FeatureComparisonService } from './services/feature-comparison.service';
import {
  FeatureComparison,
  FeatureComparisonSchema,
} from '../../database/schemas/feature-comparison.schema';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FeatureComparison.name, schema: FeatureComparisonSchema },
    ]),
    AnalysisModule,
  ],
  controllers: [FeaturesController],
  providers: [FeatureComparisonService],
  exports: [FeatureComparisonService],
})
export class FeaturesModule {}
