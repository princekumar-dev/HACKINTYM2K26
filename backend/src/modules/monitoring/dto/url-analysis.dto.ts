export class AnalyzeUrlDto {
  url: string;
}

export class UrlAnalysisResponseDto {
  url: string;
  statusCode: number;
  latency: number;
  healthScore: number;
  performanceScore: number;
  responseTime: number;
  uptime: number;
  errorRate: number;
  suggestions: string[];
  metrics: {
    dns?: number;
    tcp?: number;
    tls?: number;
    firstByte?: number;
    pageLoad?: number;
    resourceSize?: number;
  };
  timestamp: Date;
}
