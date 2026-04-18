import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class AnalyzeAppTopologyDto {
  @IsOptional()
  @IsString()
  host?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  frontendPort!: number;

  @IsInt()
  @Min(1)
  @Max(65535)
  backendPort!: number;
}

export class SimulateAppResilienceDto extends AnalyzeAppTopologyDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  stressLevel?: number;

  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(20)
  sampleSize?: number;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(1000)
  maxRequests?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(100)
  requestStep?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  clonePortOffset?: number;
}
