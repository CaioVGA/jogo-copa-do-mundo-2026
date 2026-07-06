import {
  IsArray,
  IsString,
  IsNotEmpty,
  ValidateNested,
  IsOptional,
  IsBoolean,
  Matches,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const ENTITY_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;
const TEAM_REFERENCE_REGEX = /^[\p{L}\p{N}\s|.'-]{2,80}$/u;

export class GroupPredictionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  groupName: string;

  @IsArray()
  @IsString({ each: true })
  teamOrder: string[];
}

export class KnockoutPredictionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(ENTITY_ID_REGEX)
  matchId: string;

  @IsString()
  @IsNotEmpty()
  @Matches(TEAM_REFERENCE_REGEX)
  @MaxLength(80)
  predictedWinner: string;
}

export class SaveOracleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupPredictionDto)
  groupPredictions: GroupPredictionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KnockoutPredictionDto)
  knockoutPredictions?: KnockoutPredictionDto[];

  @IsOptional()
  @IsBoolean()
  resetKnockout?: boolean;
}
