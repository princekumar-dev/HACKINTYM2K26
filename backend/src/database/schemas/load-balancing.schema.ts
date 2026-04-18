import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class LoadBalancingSuggestion extends Document {
  @Prop({ required: true })
  serverId: string;

  @Prop()
  currentLoad: number; // percentage

  @Prop()
  recommendedAction: string;

  @Prop()
  priority: 'low' | 'medium' | 'high' | 'critical';

  @Prop()
  estimatedImpact: string; // Expected improvement

  @Prop([String])
  suggestions: string[];

  @Prop([String])
  targetServers: string[]; // Other servers to balance load to

  @Prop()
  expectedLoadReduction: number; // percentage

  @Prop()
  implementationTime: number; // minutes

  @Prop()
  riskLevel: 'low' | 'medium' | 'high';

  @Prop()
  timestamp: Date;
}

export const LoadBalancingSuggestionSchema = SchemaFactory.createForClass(
  LoadBalancingSuggestion,
);
