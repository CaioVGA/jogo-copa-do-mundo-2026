import { IsArray, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GroupPredictionDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsArray()
  @IsString({ each: true })
  teamOrder: string[];
}

export class SaveOracleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupPredictionDto)
  groupPredictions: GroupPredictionDto[];
}
