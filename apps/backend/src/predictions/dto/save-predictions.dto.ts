import { IsString, IsInt, Min, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SinglePredictionDto {
  @IsString()
  matchId: string;

  @IsInt()
  @Min(0)
  homeScore: number;

  @IsInt()
  @Min(0)
  awayScore: number;
}

export class SavePredictionsDto {
  @IsString()
  groupId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SinglePredictionDto)
  predictions: SinglePredictionDto[];
}

export class UpdateMatchScoreDto {
  @IsInt()
  @Min(0)
  homeScore: number;

  @IsInt()
  @Min(0)
  awayScore: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  homePenalties?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  awayPenalties?: number;
}
