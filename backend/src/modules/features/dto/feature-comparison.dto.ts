export class CompareFeatureDto {
  featureName: string;
  currentCode: string;
  proposedCode: string;
  affectedComponents?: string[];
}

export class FeatureComparisonResponseDto {
  featureName: string;
  currentMetrics: {
    performance: number;
    health: number;
    latency: number;
    memory: number;
    cpu: number;
    complexity: number;
  };
  proposedMetrics: {
    performance: number;
    health: number;
    latency: number;
    memory: number;
    cpu: number;
    complexity: number;
  };
  improvements: {
    performance: number;
    health: number;
    latency: number;
    memory: number;
    cpu: number;
  };
  impactLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  potentialIssues: string[];
  injectionMetadata: {
    affectedComponents: string[];
    requiredChanges: string[];
    estimatedImplementationTime: number;
  };
  timestamp: Date;
}
