import { IsArray, IsString, IsNotEmpty, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class GroupPredictionDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsArray()
  @IsString({ each: true })
  teamOrder: string[];
}

export class KnockoutPredictionDto {
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
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
