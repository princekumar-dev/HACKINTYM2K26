import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitoringController } from './controllers/monitoring.controller';
import { UrlMonitoringService } from './services/url-monitoring.service';
import {
  UrlAnalysis,
  UrlAnalysisSchema,
} from '../../database/schemas/url-analysis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UrlAnalysis.name, schema: UrlAnalysisSchema },
    ]),
  ],
  controllers: [MonitoringController],
  providers: [UrlMonitoringService],
  exports: [UrlMonitoringService],
})
export class MonitoringModule {}
