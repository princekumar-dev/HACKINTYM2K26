import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { FeaturesModule } from './modules/features/features.module';
import { HealthModule } from './modules/health/health.module';
import { ConfigService } from './common/config/config.service';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackintym2k26'),
    MonitoringModule,
    AnalysisModule,
    FeaturesModule,
    HealthModule,
  ],
  controllers: [],
  providers: [ConfigService],
})
export class AppModule {}
