import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalysisController } from './controllers/analysis.controller';
import { CodeAnalysisService } from './services/code-analysis.service';
import {
  CodeAnalysis,
  CodeAnalysisSchema,
} from '../../database/schemas/code-analysis.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CodeAnalysis.name, schema: CodeAnalysisSchema },
    ]),
  ],
  controllers: [AnalysisController],
  providers: [CodeAnalysisService],
  exports: [CodeAnalysisService],
})
export class AnalysisModule {}
