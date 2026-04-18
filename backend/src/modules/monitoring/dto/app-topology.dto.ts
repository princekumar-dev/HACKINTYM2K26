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
