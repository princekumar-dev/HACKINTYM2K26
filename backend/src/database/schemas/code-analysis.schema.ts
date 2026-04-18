import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CodeAnalysis extends Document {
  @Prop({ required: true })
  code: string;

  @Prop()
  language: string;

  @Prop()
  complexity: number;

  @Prop()
  healthScore: number; // 0-100

  @Prop()
  performanceScore: number; // 0-100

  @Prop()
  maintainabilityScore: number; // 0-100

  @Prop([String])
  issues: string[];

  @Prop([String])
  suggestions: string[];

  @Prop()
  lineCount: number;

  @Prop()
  functionCount: number;

  @Prop([String])
  dependencies: string[];

  @Prop({ type: Object })
  metrics: {
    cyclomaticComplexity?: number;
    halsteadComplexity?: number;
    maintainabilityIndex?: number;
    linesOfCode?: number;
    commentRatio?: number;
  };

  @Prop()
  timestamp: Date;
}

export const CodeAnalysisSchema = SchemaFactory.createForClass(CodeAnalysis);
