import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './controllers/health.controller';
import { ServerHealthService } from './services/server-health.service';
import { LoadBalancingService } from './services/load-balancing.service';
import { FeatureLoadTestService } from './services/feature-load-test.service';
import { ServerHealth, ServerHealthSchema } from '../../database/schemas/server-health.schema';
import {
  LoadBalancingSuggestion,
  LoadBalancingSuggestionSchema,
} from '../../database/schemas/load-balancing.schema';
import {
  FeatureLoadTest,
  FeatureLoadTestSchema,
} from '../../database/schemas/feature-load-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServerHealth.name, schema: ServerHealthSchema },
      { name: LoadBalancingSuggestion.name, schema: LoadBalancingSuggestionSchema },
      { name: FeatureLoadTest.name, schema: FeatureLoadTestSchema },
    ]),
  ],
  controllers: [HealthController],
  providers: [ServerHealthService, LoadBalancingService, FeatureLoadTestService],
  exports: [ServerHealthService, LoadBalancingService, FeatureLoadTestService],
})
export class HealthModule {}
