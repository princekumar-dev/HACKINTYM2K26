import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UrlAnalysis extends Document {
  @Prop({ required: true })
  url: string;

  @Prop()
  statusCode: number;

  @Prop()
  latency: number; // milliseconds

  @Prop()
  healthScore: number; // 0-100

  @Prop()
  performanceScore: number; // 0-100

  @Prop()
  responseTime: number;

  @Prop()
  uptime: number; // percentage

  @Prop()
  errorRate: number; // percentage

  @Prop()
  suggestions: string[];

  @Prop({ type: Object })
  metrics: {
    dns?: number;
    tcp?: number;
    tls?: number;
    firstByte?: number;
    pageLoad?: number;
    resourceSize?: number;
  };

  @Prop()
  timestamp: Date;
}

export const UrlAnalysisSchema = SchemaFactory.createForClass(UrlAnalysis);
