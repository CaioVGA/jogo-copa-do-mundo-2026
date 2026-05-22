import { IsString, MinLength, MaxLength, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres' })
  @MaxLength(50, { message: 'O nome deve ter no máximo 50 caracteres' })
  name: string;

  @IsString()
  @IsOptional()
  pixKey?: string;

  @IsNumber({}, { message: 'O valor do bolão deve ser um número válido' })
  @Min(0, { message: 'O valor do bolão não pode ser negativo' })
  @IsOptional()
  entryFee?: number;
}
