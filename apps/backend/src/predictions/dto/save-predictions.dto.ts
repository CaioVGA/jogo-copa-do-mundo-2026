import {
  IsString,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

const MATCH_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export class SinglePredictionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(MATCH_ID_REGEX)
  matchId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  homeScore: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  awayScore: number;
}

export class SavePredictionsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(MATCH_ID_REGEX)
  groupId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SinglePredictionDto)
  predictions: SinglePredictionDto[];
}

export class UpdateMatchScoreDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  homeScore: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  awayScore: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  homePenalties?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(30)
  awayPenalties?: number;
}
