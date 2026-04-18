import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FeatureLoadTest extends Document {
  @Prop({ required: true })
  featureName: string;

  @Prop()
  releaseDate: Date;

  @Prop()
  baselineMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    throughput: number;
  };

  @Prop()
  featureMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    throughput: number;
  };

  @Prop()
  loadTestResults: {
    normalLoad: object;
    mediumLoad: object;
    highLoad: object;
    peakLoad: object;
  };

  @Prop()
  crashRiskScore: number; // 0-100

  @Prop()
  performanceDegradation: number; // percentage

  @Prop([String])
  detectedIssues: string[];

  @Prop([String])
  recommendations: string[];

  @Prop()
  status: 'passed' | 'warning' | 'failed';

  @Prop()
  readyForProduction: boolean;

  @Prop()
  timestamp: Date;
}

export const FeatureLoadTestSchema = SchemaFactory.createForClass(
  FeatureLoadTest,
);
