import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ServerHealth extends Document {
  @Prop({ required: true })
  serverId: string;

  @Prop()
  cpuUsage: number; // percentage

  @Prop()
  memoryUsage: number; // percentage

  @Prop()
  requestsPerSecond: number;

  @Prop()
  averageResponseTime: number; // milliseconds

  @Prop()
  errorRate: number; // percentage

  @Prop()
  activeConnections: number;

  @Prop()
  diskUsage: number; // percentage

  @Prop()
  networkLatency: number; // milliseconds

  @Prop()
  healthScore: number; // 0-100

  @Prop()
  status: 'healthy' | 'degraded' | 'critical' | 'offline';

  @Prop()
  crashRisk: number; // 0-100 probability

  @Prop()
  timestamp: Date;
}

export const ServerHealthSchema = SchemaFactory.createForClass(ServerHealth);
