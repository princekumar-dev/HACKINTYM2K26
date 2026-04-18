import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FeatureComparison extends Document {
  @Prop({ required: true })
  featureName: string;

  @Prop({ type: Object })
  currentMetrics: {
    performance: number;
    health: number;
    latency: number;
    memory: number;
    cpu: number;
    complexity: number;
  };

  @Prop({ type: Object })
  proposedMetrics: {
    performance: number;
    health: number;
    latency: number;
    memory: number;
    cpu: number;
    complexity: number;
  };

  @Prop({ type: Object })
  improvements: {
    performance: number;
    health: number;
    latency: number;
    memory: number;
    cpu: number;
  };

  @Prop()
  impactLevel: 'low' | 'medium' | 'high';

  @Prop([String])
  recommendations: string[];

  @Prop()
  riskLevel: 'low' | 'medium' | 'high';

  @Prop([String])
  potentialIssues: string[];

  @Prop({ type: Object })
  injectionMetadata: {
    affectedComponents?: string[];
    requiredChanges?: string[];
    estimatedImplementationTime?: number;
  };

  @Prop()
  timestamp: Date;
}

export const FeatureComparisonSchema = SchemaFactory.createForClass(
  FeatureComparison,
);
