export class AnalyzeCodeDto {
  code: string;
  language?: string; // 'javascript', 'typescript', 'python', etc
}

export class CodeAnalysisResponseDto {
  code: string;
  language: string;
  complexity: number;
  healthScore: number;
  performanceScore: number;
  maintainabilityScore: number;
  issues: string[];
  suggestions: string[];
  lineCount: number;
  functionCount: number;
  dependencies: string[];
  metrics: {
    cyclomaticComplexity?: number;
    halsteadComplexity?: number;
    maintainabilityIndex?: number;
    linesOfCode?: number;
    commentRatio?: number;
  };
  timestamp: Date;
}
